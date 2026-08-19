import { z } from "@medusajs/framework/zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "../../utils/validators"
import { applyAndAndOrOperators } from "../../utils/common-validators"

export const AdminGetWebhookSubscriptionParams = createSelectParams()

export const AdminGetWebhookSubscriptionsParamsFields = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  topic: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export const AdminGetWebhookSubscriptionsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminGetWebhookSubscriptionsParamsFields)
  .merge(applyAndAndOrOperators(AdminGetWebhookSubscriptionsParamsFields))

export const AdminCreateWebhookSubscription = z.object({
  topic: z.string().min(1),
  url: z.string().url(),
  secret: z.string().min(16).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  headers: z.record(z.unknown()).optional(),
  max_in_flight: z.number().int().min(0).optional(),
  min_interval_ms: z.number().int().min(0).optional(),
})

export const AdminUpdateWebhookSubscription = z.object({
  topic: z.string().min(1).optional(),
  url: z.string().url().optional(),
  secret: z.string().min(16).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  headers: z.record(z.unknown()).nullable().optional(),
  max_in_flight: z.number().int().min(0).nullable().optional(),
  min_interval_ms: z.number().int().min(0).nullable().optional(),
})

export const AdminTestWebhookSubscription = z.object({
  topic: z.string().min(1).optional(),
  payload: z.record(z.unknown()).optional(),
})

export const AdminRotateWebhookSubscriptionSecret = z.object({
  secret: z.string().min(16).optional(),
})

export const AdminRedeliverWebhookDelivery = z.object({}).strict()

export const AdminEnableWebhookSubscription = z.object({}).strict()

export const AdminRedeliverFailedWebhookDeliveries = z.object({
  limit: z.number().int().min(1).max(500).optional(),
})

export const AdminGetWebhookDeliveriesParamsFields = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  topic: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export const AdminGetWebhookDeliveriesParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminGetWebhookDeliveriesParamsFields)
  .merge(applyAndAndOrOperators(AdminGetWebhookDeliveriesParamsFields))

