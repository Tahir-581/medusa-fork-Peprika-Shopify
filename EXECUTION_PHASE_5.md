# Execution Plan — Phase 5 (Operations + Observability)

Phase 5 objective:
- Add operational admin actions for webhooks.
- Add observability signals for delivery outcomes.

---

## Delivered in Phase 5

### 1) Admin actions

Endpoints (tenant-scoped):
- `POST /admin/webhooks/:id/test` — enqueue a one-off test delivery.
- `POST /admin/webhooks/:id/rotate-secret` — rotate and return subscription secret.
- `POST /admin/webhooks/:id/deliveries/:delivery_id/redeliver` — reset a delivery and schedule it for immediate retry.

Routes:
- [test/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/%5Bid%5D/test/route.ts)
- [rotate-secret/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/%5Bid%5D/rotate-secret/route.ts)
- [redeliver/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/%5Bid%5D/deliveries/%5Bdelivery_id%5D/redeliver/route.ts)

Validators/middlewares:
- [validators.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/validators.ts)
- [middlewares.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/middlewares.ts)

Webhook module helpers:
- [webhook-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/services/webhook-module-service.ts)

### 2) Delivery observability events

The delivery job now emits event-bus events after each attempt:
- `webhook.delivery.succeeded`
- `webhook.delivery.retry_scheduled`
- `webhook.delivery.failed`
- `webhook.delivery.skipped`

Emitted from:
- [process-webhook-deliveries.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/jobs/process-webhook-deliveries.ts)

