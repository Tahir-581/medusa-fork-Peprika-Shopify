# Execution Plan — Phase 1 (Foundation & Decisioning)

This file starts the phase-wise execution of transforming this Medusa v2 codebase into a Shopify-like platform.

Phase 1 goals:
- Establish the platform “spine” needed for Shopify-like features (tenancy context + topic catalog) without breaking existing behavior.
- Create concrete primitives that later phases (webhooks, apps, analytics, multi-tenant) can build on.

---

## Phase 1 deliverables implemented

### 1) Tenant context plumbing (request-scoped)

Implemented a global middleware that sets a tenant context on every request using `req.context`.

- Middleware: [set-tenant-context.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/tenant/set-tenant-context.ts)
- Wiring: [middlewares.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/middlewares.ts)

Tenant resolution order:
1. `x-medusa-tenant-id` header
2. `x-tenant-id` header
3. If `TENANT_BASE_DOMAIN` is set, derive tenant from subdomain: `<tenant>.<TENANT_BASE_DOMAIN>`
4. Fallback to `DEFAULT_TENANT_ID` (default: `default`)

The middleware currently only *sets context*; it does not enforce tenant scoping at the data layer yet.

Env vars introduced/used:
- `DEFAULT_TENANT_ID` (optional)
- `TENANT_BASE_DOMAIN` (optional)

### 2) Shopify-like event topic catalog (foundation for webhooks/apps)

Added a centralized topic catalog to standardize event naming for future:
- webhooks (topic subscriptions)
- app event subscriptions
- analytics pipelines

- Topics: [topics.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/events/topics.ts)

---

## Verification

- Unit test added for tenant resolution:
  - [set-tenant-context.spec.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/platform/tenant/__tests__/set-tenant-context.spec.ts)

---

## What Phase 2 will build on this

With tenant context and a stable topic catalog in place, Phase 2 can safely start implementing:
- Generic webhook subscriptions + delivery worker (tenant-scoped)
- Search indexing pipeline (tenant-scoped)
- Reporting/analytics event ingestion (tenant-scoped)
- App installation model (tenant-scoped)

