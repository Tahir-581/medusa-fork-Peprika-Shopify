# Execution Plan — Phase 10 (Receiver Verification Helpers)

Phase 10 objective:
- Make it easy for webhook consumers to verify signatures and reject replayed requests.

---

## Delivered in Phase 10

### Verification helpers

- `verifyWebhookSignature(...)` — constant-time signature comparison.
- `isWebhookTimestampValid(...)` — helper to enforce timestamp tolerance.

Implementation:
- [verify.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/webhooks/verify.ts)

Tests:
- [verify.spec.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/webhooks/__tests__/verify.spec.ts)

Reminder:
- Requests are signed as HMAC-SHA256 over `${timestamp}.${payload}` and delivered with:
  - `x-peprika-webhook-timestamp`
  - `x-peprika-webhook-signature`

