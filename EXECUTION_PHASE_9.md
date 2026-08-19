# Execution Plan — Phase 9 (Bulk Redelivery)

Phase 9 objective:
- Improve operator ergonomics by allowing bulk requeue of failed deliveries.

---

## Delivered in Phase 9

### Admin endpoint

- `POST /admin/webhooks/:id/redeliver-failed` resets up to `limit` failed deliveries for the subscription and schedules them immediately.

Route:
- [redeliver-failed/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/%5Bid%5D/redeliver-failed/route.ts)

Wiring:
- [middlewares.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/middlewares.ts)
- [validators.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/webhooks/validators.ts)

Module implementation:
- `resetFailedDeliveriesForRedelivery(...)`:
  - [webhook-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/webhook/src/services/webhook-module-service.ts)

