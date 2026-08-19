import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import * as QueryConfig from "./query-config"
import {
  AdminCreateWebhookSubscription,
  AdminEnableWebhookSubscription,
  AdminGetWebhookDeliveriesParams,
  AdminGetWebhookSubscriptionParams,
  AdminGetWebhookSubscriptionsParams,
  AdminRedeliverWebhookDelivery,
  AdminRedeliverFailedWebhookDeliveries,
  AdminRotateWebhookSubscriptionSecret,
  AdminTestWebhookSubscription,
  AdminUpdateWebhookSubscription,
} from "./validators"

export const adminWebhookRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/webhooks",
    middlewares: [
      validateAndTransformQuery(
        AdminGetWebhookSubscriptionsParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/webhooks",
    middlewares: [validateAndTransformBody(AdminCreateWebhookSubscription)],
  },
  {
    method: ["GET"],
    matcher: "/admin/webhooks/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetWebhookSubscriptionParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/webhooks/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateWebhookSubscription),
      validateAndTransformQuery(
        AdminGetWebhookSubscriptionParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/webhooks/:id",
  },
  {
    method: ["GET"],
    matcher: "/admin/webhooks/:id/deliveries",
    middlewares: [
      validateAndTransformQuery(
        AdminGetWebhookDeliveriesParams,
        QueryConfig.listDeliveriesTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/webhooks/:id/test",
    middlewares: [validateAndTransformBody(AdminTestWebhookSubscription)],
  },
  {
    method: ["POST"],
    matcher: "/admin/webhooks/:id/rotate-secret",
    middlewares: [
      validateAndTransformBody(AdminRotateWebhookSubscriptionSecret),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/webhooks/:id/deliveries/:delivery_id/redeliver",
    middlewares: [validateAndTransformBody(AdminRedeliverWebhookDelivery)],
  },
  {
    method: ["POST"],
    matcher: "/admin/webhooks/:id/enable",
    middlewares: [validateAndTransformBody(AdminEnableWebhookSubscription)],
  },
  {
    method: ["POST"],
    matcher: "/admin/webhooks/:id/redeliver-failed",
    middlewares: [
      validateAndTransformBody(AdminRedeliverFailedWebhookDeliveries),
    ],
  },
]

