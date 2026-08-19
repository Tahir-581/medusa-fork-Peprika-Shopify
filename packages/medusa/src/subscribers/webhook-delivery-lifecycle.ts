import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, SubscriberConfig } from "../types/subscribers"

const getMaxConsecutiveFailures = () => {
  const parsed = Number(process.env.WEBHOOK_MAX_CONSECUTIVE_FAILURES ?? 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10
}

const shouldDisableOnFailures = () => {
  return String(process.env.WEBHOOK_DISABLE_ON_CONSECUTIVE_FAILURES ?? "true") !== "false"
}

export default async function webhookDeliveryLifecycle({
  event,
  container,
}: SubscriberArgs<any>) {
  const data = (event as any)?.data || {}
  const subscriptionId = data.subscription_id
  if (!subscriptionId) {
    return
  }

  const tenantId =
    data.tenant_id ||
    (event.metadata as any)?.tenant_id ||
    process.env.DEFAULT_TENANT_ID ||
    "default"

  const webhookService: any = container.resolve(Modules.WEBHOOK)
  const lockingService: any = container.resolve(Modules.LOCKING)

  const lockKey = `webhook:subscription:${tenantId}:${subscriptionId}`
  const now = new Date()

  await lockingService.execute(
    lockKey,
    async () => {
      const matches = await webhookService.listSubscriptions(
        {
          id: subscriptionId,
          tenant_id: tenantId,
        },
        { take: 1 }
      )

      const subscription = matches?.[0]
      if (!subscription) {
        return
      }

      if (event.name === "webhook.delivery.succeeded") {
        await webhookService.updateSubscriptionHealth({
          tenant_id: tenantId,
          subscription_id: subscriptionId,
          failure_count: 0,
          last_success_at: now,
          last_failure_at: null,
        })
        return
      }

      if (event.name === "webhook.delivery.failed") {
        const current = Number(subscription.failure_count ?? 0)
        const next = Number.isFinite(current) && current >= 0 ? current + 1 : 1
        const max = getMaxConsecutiveFailures()
        const disable = shouldDisableOnFailures() && next >= max

        await webhookService.updateSubscriptionHealth({
          tenant_id: tenantId,
          subscription_id: subscriptionId,
          failure_count: next,
          last_failure_at: now,
          ...(disable
            ? {
                status: "disabled",
                disabled_at: now,
                disabled_reason: "consecutive_failures",
              }
            : {}),
        })
      }
    },
    { timeout: 10 }
  )
}

export const config: SubscriberConfig = {
  event: ["webhook.delivery.succeeded", "webhook.delivery.failed"],
  context: {
    subscriberId: "webhook-delivery-lifecycle",
  },
}

