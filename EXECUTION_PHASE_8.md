# Execution Plan — Phase 8 (Subscription Throttling)

Phase 8 objective:
- Prevent a single subscription endpoint from being overwhelmed by controlling concurrency and send frequency.

---

## Delivered in Phase 8

### 1) Per-subscription throttling controls

Added fields on `webhook_subscription`:
- `max_in_flight` (default `5`) — max concurrent `processing` deliveries per subscription.
- `min_interval_ms` (default `0`) — minimum spacing between attempts.
- `last_attempt_at` — used to enforce `min_interval_ms`.

Model:
- [webhook-subscription.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/models/webhook-subscription.ts)

Migration:
- [Migration20260305223500.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/migrations/Migration20260305223500.ts)

### 2) Job enforcement (reschedule instead of burning attempts)

- The delivery job enforces these limits under a subscription-scoped lock.
- When throttled, it reschedules the delivery (`status=retrying`, `next_attempt_at` moved forward) without incrementing the attempt counter.

Job:
- [process-webhook-deliveries.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/jobs/process-webhook-deliveries.ts)

Module support:
- `rescheduleDelivery(...)` and `last_attempt_at` updates in:
  - [webhook-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/services/webhook-module-service.ts)

Admin validators allow configuring `max_in_flight` and `min_interval_ms`:
- [validators.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/validators.ts)

