import { model } from "@medusajs/framework/utils"
import { WebhookSubscription } from "./webhook-subscription"

export const WebhookDelivery = model.define("webhook_delivery", {
  id: model.id({ prefix: "whdel" }).primaryKey(),
  tenant_id: model.text().index(),
  subscription_id: model.text().index(),
  topic: model.text().index(),
  event_id: model.text().index().nullable(),
  idempotency_key: model.text().unique().nullable(),
  payload: model.json(),
  attempt: model.number().default(0),
  max_attempts: model.number().default(10),
  next_attempt_at: model.dateTime(),
  status: model.text().default("pending"),
  locked_at: model.dateTime().nullable(),
  locked_by: model.text().nullable(),
  response_code: model.number().nullable(),
  last_error: model.text().nullable(),
  last_request_headers: model.json().nullable(),
  last_response_headers: model.json().nullable(),
  last_response_body: model.text().nullable(),
  last_duration_ms: model.number().nullable(),
  sent_at: model.dateTime().nullable(),
  subscription: model
    .belongsTo(() => WebhookSubscription, {
      mappedBy: "deliveries",
    })
    .nullable(),
})

