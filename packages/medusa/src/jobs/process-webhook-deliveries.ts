import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"
import { computeWebhookRetryDelayMs } from "../platform/webhooks/retry"
import { signWebhookPayload } from "../platform/webhooks/signing"
import { randomUUID } from "crypto"

function toRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    return {}
  }

  const obj = value as Record<string, unknown>
  return Object.entries(obj).reduce((acc, [k, v]) => {
    if (typeof v === "string") {
      acc[k] = v
    }
    return acc
  }, {} as Record<string, string>)
}

function truncateString(input: string | null | undefined, max: number) {
  if (!input) {
    return null
  }
  if (input.length <= max) {
    return input
  }
  return input.slice(0, max)
}

function sanitizeHeaders(headers: Record<string, string>) {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase()
    if (
      key === "authorization" ||
      key === "cookie" ||
      key === "set-cookie" ||
      key.includes("token") ||
      key.includes("secret") ||
      key.includes("api-key")
    ) {
      out[k] = "[REDACTED]"
    } else {
      out[k] = v
    }
  }
  return out
}

function responseHeadersToObject(headers: Headers) {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key] = value
  })
  return out
}

async function postJson({
  url,
  body,
  headers,
}: {
  url: string
  body: string
  headers: Record<string, string>
}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const startedAt = Date.now()
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    })

    const durationMs = Date.now() - startedAt
    const responseHeaders = responseHeadersToObject(res.headers)
    const responseBody = truncateString(await res.text().catch(() => ""), 10_000)

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      durationMs,
      responseHeaders,
      responseBody,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(container: MedusaContainer) {
  const lockingService: any = container.resolve(Modules.LOCKING)
  const webhookService: any = container.resolve(Modules.WEBHOOK)
  let eventBus: any = null
  try {
    eventBus = container.resolve(Modules.EVENT_BUS)
  } catch {
    eventBus = null
  }
  const now = new Date()

  const workerId = randomUUID()
  const processingTtlMs = 2 * 60_000

  const deliveries = await webhookService.listDeliveries(
    {
      status: ["pending", "retrying", "processing"],
    },
    {
      take: 50,
      order: { next_attempt_at: "ASC" },
    }
  )

  const due = (deliveries || []).filter((d: any) => {
    const next = d.next_attempt_at ? new Date(d.next_attempt_at) : now
    if (next.getTime() > now.getTime()) {
      return false
    }

    if (d.status !== "processing") {
      return true
    }

    const lockedAt = d.locked_at ? new Date(d.locked_at) : null
    if (!lockedAt) {
      return true
    }

    return now.getTime() - lockedAt.getTime() > processingTtlMs
  })

  for (const delivery of due) {
    const lockKey = `webhook:delivery:${delivery.tenant_id}:${delivery.id}`
    try {
      await lockingService.acquire(lockKey, {
        ownerId: workerId,
        expire: Math.ceil(processingTtlMs / 1000),
        awaitQueue: false,
      })
    } catch {
      continue
    }

    try {
    const subscription = await webhookService.retrieveSubscription(
      delivery.subscription_id
    )

    if (!subscription || subscription.status !== "active") {
      await webhookService.markDeliveryAttempt(delivery.id, {
        attempt: delivery.attempt,
        next_attempt_at: now,
        status: "skipped",
        response_code: null,
        last_error: "Subscription not active",
        sent_at: null,
      })

      if (eventBus) {
        await eventBus.emit({
          name: "webhook.delivery.skipped",
          data: {
            delivery_id: delivery.id,
            subscription_id: delivery.subscription_id,
            tenant_id: delivery.tenant_id,
            topic: delivery.topic,
            attempt: delivery.attempt,
            max_attempts: delivery.max_attempts,
            response_code: null,
            last_error: "Subscription not active",
          },
          metadata: {
            tenant_id: delivery.tenant_id,
          },
        })
      }
      continue
    }

      const subscriptionLimitsKey = `webhook:subscription:limits:${delivery.tenant_id}:${delivery.subscription_id}`
      const proceed = await lockingService.execute(
        subscriptionLimitsKey,
        async () => {
          const fresh = await webhookService.retrieveSubscription(
            delivery.subscription_id
          )

          const maxInFlight = Number(fresh?.max_in_flight ?? 5)
          const minIntervalMs = Number(fresh?.min_interval_ms ?? 0)

          if (Number.isFinite(maxInFlight) && maxInFlight > 0) {
            const cutoff = new Date(now.getTime() - processingTtlMs)
            const inFlight = await webhookService.listDeliveries(
              {
                tenant_id: delivery.tenant_id,
                subscription_id: delivery.subscription_id,
                status: "processing",
                locked_at: { $gt: cutoff },
              },
              { select: ["id"], take: maxInFlight + 1 }
            )

            if ((inFlight || []).length >= maxInFlight) {
              await webhookService.rescheduleDelivery({
                tenant_id: delivery.tenant_id,
                subscription_id: delivery.subscription_id,
                delivery_id: delivery.id,
                next_attempt_at: new Date(now.getTime() + 1_000),
                reason: "throttled_max_in_flight",
              })
              return false
            }
          }

          if (Number.isFinite(minIntervalMs) && minIntervalMs > 0) {
            const lastAttempt = fresh?.last_attempt_at
              ? new Date(fresh.last_attempt_at)
              : null

            if (lastAttempt) {
              const nextAllowedAt = new Date(lastAttempt.getTime() + minIntervalMs)
              if (nextAllowedAt.getTime() > now.getTime()) {
                await webhookService.rescheduleDelivery({
                  tenant_id: delivery.tenant_id,
                  subscription_id: delivery.subscription_id,
                  delivery_id: delivery.id,
                  next_attempt_at: nextAllowedAt,
                  reason: "throttled_min_interval",
                })
                return false
              }
            }
          }

          await webhookService.updateSubscriptionHealth({
            tenant_id: delivery.tenant_id,
            subscription_id: delivery.subscription_id,
            last_attempt_at: now,
          })

          return true
        },
        { timeout: 10 }
      )

      if (!proceed) {
        continue
      }

      await webhookService.markDeliveriesProcessing({
        id: delivery.id,
        locked_by: workerId,
        locked_at: now,
      })

    const payloadObj = {
      id: delivery.id,
      topic: delivery.topic,
      tenant_id: delivery.tenant_id,
      data: delivery.payload,
    }

    const body = JSON.stringify(payloadObj)
    const timestamp = String(Math.floor(now.getTime() / 1000))
    const signature = signWebhookPayload({
      secret: subscription.secret,
      payload: body,
      timestamp,
    })
    const subscriptionHeaders = toRecord(subscription.headers)

    const headers: Record<string, string> = {
      "content-type": "application/json",
      "user-agent": "Peprika-Webhooks/1.0",
      "x-peprika-webhook-topic": String(delivery.topic),
      "x-peprika-webhook-delivery-id": String(delivery.id),
      "x-peprika-tenant-id": String(delivery.tenant_id),
      "x-peprika-webhook-timestamp": timestamp,
      "x-peprika-webhook-signature": signature,
      ...subscriptionHeaders,
    }

    let status = "retrying"
    let responseCode: number | null = null
    let lastError: string | null = null
    let sentAt: Date | null = null
    let lastResponseHeaders: Record<string, unknown> | null = null
    let lastResponseBody: string | null = null
    let durationMs: number | null = null

    try {
      const res = await postJson({ url: subscription.url, body, headers })
      responseCode = res.status
      lastResponseHeaders = res.responseHeaders
      lastResponseBody = res.responseBody
      durationMs = res.durationMs

      if (res.ok) {
        status = "success"
        sentAt = now
      } else {
        lastError = `HTTP ${res.status} ${res.statusText}`
      }
    } catch (e: any) {
      lastError = e?.name === "AbortError" ? "Request timed out" : e?.message || "Request failed"
    }

    const nextAttemptNumber = Number(delivery.attempt || 0) + 1
    const maxAttempts = Number(delivery.max_attempts || 10)
    const willRetry = status !== "success" && nextAttemptNumber < maxAttempts
    const nextAttemptAt = willRetry
      ? new Date(now.getTime() + computeWebhookRetryDelayMs(nextAttemptNumber))
      : now

    await webhookService.markDeliveryAttempt(delivery.id, {
      attempt: nextAttemptNumber,
      next_attempt_at: nextAttemptAt,
      status: status === "success" ? "success" : willRetry ? "retrying" : "failed",
      response_code: responseCode,
      last_error: lastError,
      last_request_headers: sanitizeHeaders(headers),
      last_response_headers: lastResponseHeaders,
      last_response_body: lastResponseBody,
      last_duration_ms: durationMs,
      sent_at: sentAt,
    })

    if (eventBus) {
      const finalStatus = status === "success" ? "success" : willRetry ? "retrying" : "failed"
      const eventName =
        finalStatus === "success"
          ? "webhook.delivery.succeeded"
          : finalStatus === "retrying"
            ? "webhook.delivery.retry_scheduled"
            : "webhook.delivery.failed"

      await eventBus.emit({
        name: eventName,
        data: {
          delivery_id: delivery.id,
          subscription_id: delivery.subscription_id,
          tenant_id: delivery.tenant_id,
          topic: delivery.topic,
          attempt: nextAttemptNumber,
          max_attempts: maxAttempts,
          next_attempt_at: nextAttemptAt,
          response_code: responseCode,
          last_error: lastError,
        },
        metadata: {
          tenant_id: delivery.tenant_id,
        },
      })
    }
    } finally {
      await lockingService.release(lockKey, {
        ownerId: workerId,
      })
    }
  }
}

export const config = {
  name: "process-webhook-deliveries",
  schedule: "*/10 * * * * *",
}

