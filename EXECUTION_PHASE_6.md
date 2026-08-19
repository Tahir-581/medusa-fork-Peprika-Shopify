# Execution Plan — Phase 6 (Circuit Breaker + Cleanup)

Phase 6 objective:
- Prevent “runaway failures” by automatically disabling subscriptions that repeatedly fail.
- Keep webhook delivery tables from growing without bound.

---

## Delivered in Phase 6

### 1) Subscription circuit breaker

- Subscriptions now track consecutive failures and can be disabled automatically.
- Added fields on `webhook_subscription`:
  - `failure_count`, `last_failure_at`, `last_success_at`, `disabled_at`, `disabled_reason`
- Model: [webhook-subscription.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/models/webhook-subscription.ts)
- Migration: [Migration20260305211000.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/migrations/Migration20260305211000.ts)

#### Lifecycle subscriber

- New subscriber listens for:
  - `webhook.delivery.succeeded` → resets `failure_count`, sets `last_success_at`
  - `webhook.delivery.failed` → increments `failure_count`, sets `last_failure_at`, disables when threshold reached
- Uses the locking module to avoid concurrent counter updates.
- Subscriber: [webhook-delivery-lifecycle.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/subscribers/webhook-delivery-lifecycle.ts)

Environment knobs:
- `WEBHOOK_MAX_CONSECUTIVE_FAILURES` (default `10`)
- `WEBHOOK_DISABLE_ON_CONSECUTIVE_FAILURES` (default `true`)

### 2) Admin: re-enable subscription

- `POST /admin/webhooks/:id/enable` re-enables and resets breaker fields.
- Route: [enable/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/%5Bid%5D/enable/route.ts)
- Wiring: [middlewares.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/middlewares.ts), [validators.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/validators.ts)

### 3) Delivery pruning

- Added a scheduled job to delete old deliveries in terminal states (`success`, `failed`, `skipped`).
- Job: [prune-webhook-deliveries.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/jobs/prune-webhook-deliveries.ts)
- Module support: [webhook-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/services/webhook-module-service.ts)

Environment knob:
- `WEBHOOK_DELIVERY_RETENTION_DAYS` (default `30`)

