# Execution Plan — Phase 7 (Delivery Observability)

Phase 7 objective:
- Make webhook delivery debugging easier by persisting basic request/response metadata for each attempt.

---

## Delivered in Phase 7

### 1) Persist last attempt metadata on deliveries

Added fields on `webhook_delivery`:
- `last_request_headers` (sanitized)
- `last_response_headers`
- `last_response_body` (truncated to 10k chars)
- `last_duration_ms`

Model:
- [webhook-delivery.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/models/webhook-delivery.ts)

Migration:
- [Migration20260305220000.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/migrations/Migration20260305220000.ts)

### 2) Capture metadata during delivery attempts

- The scheduled delivery job now captures:
  - request headers (with sensitive values redacted)
  - response status, headers, response body (truncated), and total duration
- Persisted via `markDeliveryAttempt`.

Job:
- [process-webhook-deliveries.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/jobs/process-webhook-deliveries.ts)

Module service update:
- [webhook-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/services/webhook-module-service.ts)

