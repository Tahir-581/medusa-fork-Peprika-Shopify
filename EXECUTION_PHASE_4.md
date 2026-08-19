# Execution Plan — Phase 4 (Throughput + Safety: Per-Delivery Claiming)

Phase 4 objective:
- Improve webhook delivery throughput and multi-worker correctness by moving from a single global lock to **per-delivery claiming**.

---

## Delivered in Phase 4

### 1) Per-delivery claiming (multi-worker safe)

- The delivery job no longer uses a single global lock.
- Instead, it attempts to acquire a lock per delivery using `Modules.LOCKING` with a TTL, so multiple workers can process different deliveries concurrently.
- Implementation: [process-webhook-deliveries.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/jobs/process-webhook-deliveries.ts)

### 2) Stale processing recovery

- Deliveries stuck in `processing` past the configured TTL are eligible for reprocessing.
- Logic lives in the same scheduled job: [process-webhook-deliveries.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/jobs/process-webhook-deliveries.ts)

### 3) Delivery lock persistence

- Deliveries now store `locked_at` and `locked_by`.
- They are set when a worker starts processing and cleared when an attempt is finalized.
- Model + service:
  - [webhook-delivery.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/models/webhook-delivery.ts)
  - [webhook-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/services/webhook-module-service.ts)

### 4) Migration

- Adds `locked_at` + `locked_by` columns and an index.
- Migration: [Migration20260305201500.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/migrations/Migration20260305201500.ts)

