import { Modules } from "@medusajs/framework/utils"
import { ShopifyLikeTopics } from "../platform/events/topics"
import { SubscriberArgs, SubscriberConfig } from "../types/subscribers"

export default async function webhookDispatcher({
  event,
  container,
}: SubscriberArgs<any>) {
  const webhookService: any = container.resolve(Modules.WEBHOOK)

  const tenantId = (event.metadata as any)?.tenant_id || process.env.DEFAULT_TENANT_ID || "default"

  const subscriptions = await webhookService.listSubscriptions({
    tenant_id: tenantId,
    topic: event.name,
    status: "active",
  })

  if (!subscriptions?.length) {
    return
  }

  await webhookService.createDeliveries(
    subscriptions.map((s: any) => ({
      tenant_id: tenantId,
      subscription_id: s.id,
      topic: event.name,
      payload: event.data || {},
      event_id: (event.metadata as any)?.event_id,
      idempotency_key: (event.metadata as any)?.event_id
        ? `${s.id}:${(event.metadata as any).event_id}`
        : undefined,
      max_attempts: 10,
      next_attempt_at: new Date(),
    }))
  )
}

export const config: SubscriberConfig = {
  event: Object.values(ShopifyLikeTopics),
  context: {
    subscriberId: "webhook-dispatcher",
  },
}

