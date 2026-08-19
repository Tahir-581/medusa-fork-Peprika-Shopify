# Execution Plan — Phase 3 (Hardening: Tenant Safety + Concurrency + Replay Protection)

Phase 3 objective:
- Make the webhook subsystem safe under multi-tenant + multi-worker operation.

---

## Delivered in Phase 3

### 1) Replay-safer signing (timestamp + payload)

- Webhook signature now signs `${timestamp}.${payload}` (HMAC SHA-256), and the delivery job sends `x-peprika-webhook-timestamp`.
- Signing helper: [signing.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/webhooks/signing.ts)
- Delivery job: [process-webhook-deliveries.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/jobs/process-webhook-deliveries.ts)

### 2) Delivery deduplication

- Deliveries now include an optional `idempotency_key`.
- The event subscriber sets `idempotency_key = ${subscription_id}:${event_id}` when `event_id` exists.
- The webhook module prevents creating deliveries if an identical `idempotency_key` already exists.
- Model/service changes:
  - [webhook-delivery.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/models/webhook-delivery.ts)
  - [webhook-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/services/webhook-module-service.ts)
  - [webhook-dispatcher.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/subscribers/webhook-dispatcher.ts)

### 3) Concurrency safety for the delivery job

- The scheduled job acquires a distributed lock (`Modules.LOCKING`) before processing deliveries.
- If another worker holds the lock, the job exits quickly.
- Locking integration: [process-webhook-deliveries.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/jobs/process-webhook-deliveries.ts)

### 4) Tenant enforcement in admin APIs

- Admin routes now ensure `:id` lookups are tenant-scoped and return 404 if not in tenant.
- Updated routes:
  - [webhooks/[id]/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/%5Bid%5D/route.ts)
  - [webhooks/[id]/deliveries/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/%5Bid%5D/deliveries/route.ts)

### 5) Database constraints for idempotency

- Added a migration to enforce uniqueness:
  - Unique `idempotency_key` where present.
  - Unique `(subscription_id, event_id)` where `event_id` is present.
- Migration: [Migration20260305193000.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/migrations/Migration20260305193000.ts)

---

## Verification

- Added unit tests:
  - [retry.spec.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/webhooks/__tests__/retry.spec.ts)
  - [signing.spec.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/webhooks/__tests__/signing.spec.ts)

