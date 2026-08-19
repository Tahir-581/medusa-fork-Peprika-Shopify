import { model } from "@medusajs/framework/utils"

export const WebhookSubscription = model.define("webhook_subscription", {
  id: model.id({ prefix: "whsub" }).primaryKey(),
  tenant_id: model.text().index(),
  topic: model.text().index(),
  url: model.text(),
  secret: model.text(),
  status: model.text().default("active"),
  headers: model.json().nullable(),
  failure_count: model.number().default(0),
  last_failure_at: model.dateTime().nullable(),
  last_success_at: model.dateTime().nullable(),
  disabled_at: model.dateTime().nullable(),
  disabled_reason: model.text().nullable(),
  max_in_flight: model.number().default(5),
  min_interval_ms: model.number().default(0),
  last_attempt_at: model.dateTime().nullable(),
})

