# Execution Plan — Phase 2 (Generic Webhooks)

Phase 2 objective:
- Implement a Shopify-like webhook subsystem: subscriptions (by topic), delivery records, retries, and admin APIs.

This phase is designed to be tenant-aware using the Phase 1 request context (`req.context.tenant_id`).

---

## Delivered in Phase 2

### 1) Webhook module (persistence + service)

New Medusa module: `@medusajs/webhook`
- Package: [packages/modules/webhook](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook)
- Models:
  - [WebhookSubscription](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/models/webhook-subscription.ts)
  - [WebhookDelivery](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/models/webhook-delivery.ts)
- Service:
  - [webhook-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/services/webhook-module-service.ts)
- Migration:
  - [InitialSetupMigration20260305160000.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/migrations/InitialSetupMigration20260305160000.ts)

Module registration:
- Added `Modules.WEBHOOK` mapping: [definition.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/core/utils/src/modules-sdk/definition.ts)
- Added Medusa wrapper export: [webhook.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/modules/webhook.ts)

### 2) Admin APIs

Endpoints:
- `GET /admin/webhooks` list subscriptions (tenant-scoped)
- `POST /admin/webhooks` create subscription (tenant-scoped, secret auto-generated if omitted)
- `GET /admin/webhooks/:id` retrieve
- `POST /admin/webhooks/:id` update
- `DELETE /admin/webhooks/:id` delete
- `GET /admin/webhooks/:id/deliveries` list delivery attempts for subscription

Routes:
- [webhooks/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/route.ts)
- [webhooks/[id]/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/%5Bid%5D/route.ts)
- [webhooks/[id]/deliveries/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/%5Bid%5D/deliveries/route.ts)
- Middlewares/validators:
  - [middlewares.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/middlewares.ts)
  - [validators.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/validators.ts)

### 3) Event subscriber (enqueue deliveries)

- Subscriber: [webhook-dispatcher.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/subscribers/webhook-dispatcher.ts)
- Subscribes to: [ShopifyLikeTopics](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/events/topics.ts)
- Behavior:
  - For each incoming event, finds active subscriptions where `topic == event.name` and creates `webhook_delivery` rows.
  - Tenant resolution uses `event.metadata.tenant_id` if present, otherwise falls back to `DEFAULT_TENANT_ID`.

### 4) Delivery job (retries + signing)

- Scheduled job: [process-webhook-deliveries.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/jobs/process-webhook-deliveries.ts)
- Schedule: every 10 seconds
- Delivery:
  - POST JSON payload to subscription URL
  - Adds signature header `x-peprika-webhook-signature` (HMAC SHA-256 over request body)
  - Retries with exponential backoff + jitter

Helpers:
- [retry.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/webhooks/retry.ts)
- [signing.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/webhooks/signing.ts)

---

## Verification

- Unit test added for retry delay helper:
  - [retry.spec.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/webhooks/__tests__/retry.spec.ts)

---

## Known limitations (intentional for Phase 2)

- No strict tenant enforcement at DB layer yet (Phase 1 only sets request context).
- Delivery processing is not yet concurrency-safe across multiple worker instances (needs a claim/lock step in Phase 3+).
- No webhook delivery signing timestamp / replay protection yet.
- No UI added to admin dashboard yet (APIs only).

