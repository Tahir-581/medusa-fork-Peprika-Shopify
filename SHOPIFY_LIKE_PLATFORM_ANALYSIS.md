# Shopify-like Platform Architectural & Feature Analysis (Medusa v2 Codebase)

This document is a deep architectural and feature analysis of the provided repository and a comparison against Shopify platform capabilities.

Scope:
- Phase 1 — Codebase feature discovery (what exists)
- Phase 2 — Shopify feature map (what Shopify provides)
- Phase 3 — Feature gap analysis (Shopify vs codebase)
- Phase 4 — Architectural gap analysis
- Phase 5 — Implementation roadmap for missing capabilities (schema + APIs + services/workflows)
- Phase 6 — Target Shopify-like platform architecture (ASCII)
- Phase 7 — Phased development strategy

Notes:
- The repository is a Medusa v2 monorepo containing the commerce engine, modules, and admin/dashboard source. It is not a turnkey Shopify-like SaaS platform.
- Many route handlers invoke workflows from external Medusa packages (e.g., `@medusajs/core-flows`). This analysis focuses on what is present in this repo and the architectural patterns it uses.

Related in-repo references:
- Existing inventory/comparison notes: [CODEBASE_FEATURES_AND_SHOPIFY_COMPARISON.md](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/CODEBASE_FEATURES_AND_SHOPIFY_COMPARISON.md)
- Run instructions: [RUN.md](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/RUN.md)

---

## Phase 1 — Codebase Feature Discovery (What Exists)

### 1.1 Architectural primitives (cross-cutting)

#### Module system (Medusa Modules SDK)
- Purpose: modular commerce domain packaging (services + persistence + APIs) with dependency injection.
- Bootstrapping/loader:
  - [medusa-app-loader.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/core/framework/src/medusa-app-loader.ts)
  - [medusa-app.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/core/modules-sdk/src/medusa-app.ts)
  - [medusa-module.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/core/modules-sdk/src/medusa-module.ts)
- Module registry defaults (what modules exist / optional modules like index/analytics/workflows):
  - [definition.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/core/utils/src/modules-sdk/definition.ts)

#### Plugin system
- Purpose: extend backend and (optionally) admin/dashboard via configured plugins.
- Config surface:
  - [config-module.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/core/types/src/common/config-module.ts#L1010-L1145)
- Plugin resolution and admin-extension detection:
  - [get-resolved-plugins.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/core/utils/src/common/get-resolved-plugins.ts)

#### Event system
- Purpose: async internal domain events used by workflows/subscribers.
- Event bus modules:
  - [event-bus-local](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/event-bus-local/src/index.ts)
  - [event-bus-redis](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/event-bus-redis/src/index.ts)
- Workflow step to emit events:
  - [emit-event.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/core/core-flows/src/common/steps/emit-event.ts#L43-L134)

#### Workflow engine + workflow execution inspection
- Purpose: run workflow-driven mutations and track workflow execution.
- Engines:
  - [workflow-engine-inmemory](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/workflow-engine-inmemory/src/index.ts)
  - [workflow-engine-redis](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/workflow-engine-redis/src/index.ts)
- Admin API to inspect and run workflow executions:
  - [workflows-executions route](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/workflows-executions/route.ts)

#### Feature flags
- Admin API:
  - [feature-flags route](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/feature-flags/route.ts)

#### API server route/middleware wiring
- API loader:
  - [api.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/loaders/api.ts)
- Middleware definitions:
  - [middlewares.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/middlewares.ts)

---

### 1.2 Core commerce features (by domain)

Each feature lists:
- Feature name
- Module location
- Relevant API routes (Admin + Store)
- Entities/models
- Related services/workflows (where discoverable)

#### Products
- Module: [product/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/product/src/index.ts)
- Admin API (examples):
  - `/admin/products`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/products/route.ts)
  - `/admin/product-variants`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/product-variants/route.ts)
- Store API:
  - `/store/products`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/products/route.ts)
  - `/store/product-variants`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/product-variants/route.ts)
- Entities: `Product`, `ProductVariant`, `ProductOption`, `ProductOptionValue`, `ProductImage`, `ProductTag`, `ProductType`, `ProductCollection`, `ProductCategory`
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/product/src/models/index.ts)
- Service:
  - [product-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/product/src/services/product-module-service.ts)

#### Collections
- Module: product
- Admin API: `/admin/collections`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/collections/route.ts)
- Store API: `/store/collections`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/collections/route.ts)
- Entity: `ProductCollection` ([product models](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/product/src/models/index.ts))

#### Categories
- Module: product
- Admin API: `/admin/product-categories`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/product-categories/route.ts)
- Store API: `/store/product-categories`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/product-categories/route.ts)
- Entity: `ProductCategory` ([product models](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/product/src/models/index.ts))

#### Product tags
- Module: product
- Admin API: `/admin/product-tags`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/product-tags/route.ts)
- Store API: `/store/product-tags`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/product-tags/route.ts)
- Entity: `ProductTag` ([product models](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/product/src/models/index.ts))

#### Product types
- Module: product
- Admin API: `/admin/product-types`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/product-types/route.ts)
- Store API: `/store/product-types`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/product-types/route.ts)
- Entity: `ProductType` ([product models](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/product/src/models/index.ts))

#### Pricing (price sets, price lists, preferences)
- Module: [pricing/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/pricing/src/index.ts)
- Admin API:
  - `/admin/price-lists`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/price-lists/route.ts)
  - `/admin/price-preferences`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/price-preferences/route.ts)
- Entities: `PriceSet`, `Price`, `PriceRule`, `PriceList`, `PriceListRule`, `PricePreference`
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/pricing/src/models/index.ts)
- Service: [pricing-module.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/pricing/src/services/pricing-module.ts)

#### Promotions + campaigns
- Module: [promotion/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/promotion/src/index.ts)
- Admin API:
  - `/admin/promotions`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/promotions/route.ts)
  - `/admin/campaigns`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/campaigns/route.ts)
- Entities: `Promotion`, `PromotionRule`, `PromotionRuleValue`, `Campaign`, `CampaignBudget`, `CampaignBudgetUsage`, `ApplicationMethod`
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/promotion/src/models/index.ts)
- Service: [promotion-module.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/promotion/src/services/promotion-module.ts)

#### Cart / checkout primitives
- Module: [cart/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/cart/src/index.ts)
- Store API:
  - `/store/carts`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/carts/route.ts)
  - `/store/shipping-options`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/shipping-options/route.ts)
- Entities: `Cart`, `LineItem`, `ShippingMethod`, `Address`, plus tax/adjustment tables
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/cart/src/models/index.ts)
- Service: [cart-module.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/cart/src/services/cart-module.ts)

#### Orders
- Module: [order/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/order/src/index.ts)
- Admin API:
  - `/admin/orders`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/orders/route.ts)
  - `/admin/order-edits`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/order-edits/route.ts)
  - `/admin/order-changes`: (validators are present) [validators.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/order-changes/validators.ts)
- Store API:
  - `/store/orders`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/orders/route.ts)
- Entities: `Order`, `OrderChange`, `OrderChangeAction`, `Transaction`, plus line/shipping/tax/credit-line models and post-purchase constructs
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/order/src/models/index.ts)
- Service: [order-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/order/src/services/order-module-service.ts)

#### Draft orders
- Admin API: `/admin/draft-orders`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/draft-orders/route.ts)
- Note: API exists; admin UI exposure depends on the dashboard build/config (see repo docs: [CODEBASE_FEATURES_AND_SHOPIFY_COMPARISON.md](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/CODEBASE_FEATURES_AND_SHOPIFY_COMPARISON.md)).

#### Returns
- Admin API: `/admin/returns`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/returns/route.ts)
- Store API: `/store/returns`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/returns/route.ts)
- Return reasons:
  - Admin: `/admin/return-reasons`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/return-reasons/route.ts)
  - Store: `/store/return-reasons`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/return-reasons/route.ts)
- Entities: `Return`, `ReturnItem`, `ReturnReason` ([order models](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/order/src/models/index.ts))

#### Claims
- Admin API: `/admin/claims`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/claims/route.ts)
- Entities: `Claim`, `ClaimItem`, `ClaimItemImage` ([order models](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/order/src/models/index.ts))

#### Exchanges
- Admin API: `/admin/exchanges`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/exchanges/route.ts)
- Entities: `Exchange`, `ExchangeItem` ([order models](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/order/src/models/index.ts))

#### Payments
- Module: [payment/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/payment/src/index.ts)
- Admin API:
  - `/admin/payments`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/payments/route.ts)
  - `/admin/payment-collections`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/payment-collections/route.ts)
  - `/admin/refund-reasons`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/refund-reasons/route.ts)
- Store API:
  - `/store/payment-providers`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/payment-providers/route.ts)
  - `/store/payment-collections`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/payment-collections/route.ts)
- Entities: `PaymentCollection`, `PaymentSession`, `Payment`, `PaymentProvider`, `Capture`, `Refund`, `RefundReason`, `AccountHolder`
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/payment/src/models/index.ts)
- Service: [payment-module.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/payment/src/services/payment-module.ts)
- Provider: Stripe payment provider module exists: [payment-stripe](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/providers/payment-stripe/src/index.ts)

#### Fulfillment & shipping setup
- Module: [fulfillment/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/fulfillment/src/index.ts)
- Admin API:
  - `/admin/shipping-profiles`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/shipping-profiles/route.ts)
  - `/admin/shipping-options`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/shipping-options/route.ts)
  - `/admin/shipping-option-types`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/shipping-option-types/route.ts)
  - `/admin/fulfillment-sets`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/fulfillment-sets/route.ts)
  - `/admin/fulfillment-providers`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/fulfillment-providers/route.ts)
  - `/admin/fulfillments`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/fulfillments/route.ts)
- Store API:
  - `/store/shipping-options`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/shipping-options/route.ts)
- Entities: `ShippingProfile`, `ShippingOption`, `ShippingOptionType`, `ShippingOptionRule`, `FulfillmentSet`, `ServiceZone`, `GeoZone`, `Fulfillment`, `FulfillmentProvider`, `FulfillmentItem`, `FulfillmentLabel`
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/fulfillment/src/models/index.ts)
- Service: [fulfillment-module-service.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/fulfillment/src/services/fulfillment-module-service.ts)
- Provider: manual fulfillment provider exists: [fulfillment-manual](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/providers/fulfillment-manual/src/index.ts)

#### Inventory & reservations
- Module: [inventory/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/inventory/src/index.ts)
- Admin API:
  - `/admin/inventory-items`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/inventory-items/route.ts)
  - `/admin/reservations`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/reservations/route.ts)
- Entities: `InventoryItem`, `InventoryLevel`, `ReservationItem`
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/inventory/src/models/index.ts)

#### Stock locations
- Module: [stock-location/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/stock-location/src/index.ts)
- Admin API: `/admin/stock-locations`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/stock-locations/route.ts)
- Entities: `StockLocation`, `StockLocationAddress`
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/stock-location/src/models/index.ts)

#### Regions & currencies
- Region module: [region/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/region/src/index.ts)
  - Admin: `/admin/regions`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/regions/route.ts)
  - Store: `/store/regions`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/regions/route.ts)
  - Entities: `Region`, `Country`: [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/region/src/models/index.ts)
- Currency module: [currency/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/currency/src/index.ts)
  - Admin: `/admin/currencies`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/currencies/route.ts)
  - Store: `/store/currencies`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/currencies/route.ts)
  - Entity: `Currency`: [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/currency/src/models/index.ts)

#### Sales channels
- Module: [sales-channel/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/sales-channel/src/index.ts)
- Admin API: `/admin/sales-channels`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/sales-channels/route.ts)
- Entities: sales-channel models: [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/sales-channel/src/models/index.ts)

#### Customers & groups
- Module: [customer/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/customer/src/index.ts)
- Admin API:
  - `/admin/customers`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/customers/route.ts)
  - `/admin/customer-groups`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/customer-groups/route.ts)
- Store API:
  - `/store/customers`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/customers/route.ts)
- Entities: `Customer`, `Address`, `CustomerGroup` (+ join entity)
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/customer/src/models/index.ts)

#### Users, invites, RBAC, API keys
- User module: [user/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/user/src/index.ts)
  - Admin: `/admin/users`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/users/route.ts)
  - Admin: `/admin/invites`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/invites/route.ts)
- RBAC module: [rbac/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/rbac/src/index.ts)
  - Admin roles route: [roles/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/rbac/roles/route.ts)
- API key module: [api-key/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/api-key/src/index.ts)
  - Admin: `/admin/api-keys`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/api-keys/route.ts)

#### Store configuration & localization
- Store module: [store/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/store/src/index.ts)
  - Admin: `/admin/stores`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/stores/route.ts)
  - Admin/Store locales: [admin locales](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/locales/route.ts), [store locales](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/store/locales/route.ts)

#### Tax configuration
- Module: [tax/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/tax/src/index.ts)
- Admin APIs:
  - `/admin/tax-regions`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/tax-regions/route.ts)
  - `/admin/tax-rates`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/tax-rates/route.ts)
  - `/admin/tax-providers`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/tax-providers/route.ts)
- Entities: `TaxRegion`, `TaxRate`, `TaxRateRule`, `TaxProvider`
  - [models/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/tax/src/models/index.ts)

#### Uploads & file storage
- Admin API: `/admin/uploads`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/uploads/route.ts)
- File module: [file/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/file/src/index.ts)
- Providers: [file-local](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/providers/file-local/src/index.ts), [file-s3](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/providers/file-s3/src/index.ts)

#### Notifications
- Module: [notification/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/notification/src/index.ts)
- Admin API: `/admin/notifications`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/notifications/route.ts)
- Providers: [notification-local](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/providers/notification-local/src/index.ts), [notification-sendgrid](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/providers/notification-sendgrid/src/index.ts)

#### Translations
- Module: [translation/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/translation/src/index.ts)
- Admin API: `/admin/translations`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/translations/route.ts)

#### Indexing / search plumbing
- Module: [index/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/index/src/index.ts)
- Admin API: `/admin/index/details`: [route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/admin/index/details/route.ts)

#### Analytics plumbing
- Module: [analytics/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/analytics/src/index.ts)
- Provider example: [posthog analytics service](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/providers/analytics-posthog/src/services/posthog-analytics.ts#L1-L89)

---

### 1.3 Auth systems

#### Auth module + providers
- Auth module: [auth/src/index.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/auth/src/index.ts)
- Providers:
  - [auth-emailpass](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/providers/auth-emailpass/src/index.ts)
  - [auth-github](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/providers/auth-github/src/index.ts)
  - [auth-google](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/modules/providers/auth-google/src/index.ts)
- Auth API surface: [api/auth](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/auth)

---

### 1.4 Webhooks (in-repo)

#### Payment provider webhook ingress
- HTTP endpoint: [hooks/payment/[provider]/route.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/api/hooks/payment/%5Bprovider%5D/route.ts#L1-L38)
- Processing: subscriber emits internal workflow execution: [payment-webhook.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/medusa/src/subscribers/payment-webhook.ts#L1-L61)
- Key limitation: this is not a general Shopify-style webhook subscription system; it is payment-provider callback plumbing.

---

## Phase 2 — Shopify Feature Map (Capability Taxonomy)

### Catalog
- Products
- Variants
- Collections (manual/smart)
- Categories (in Shopify often menus/collections; “category” semantics vary)
- Media (images/video)
- Product tags
- Product types
- Metafields (typed, namespaced)
- Metaobjects/custom content schemas

### Orders
- Orders
- Draft orders
- Order edits
- Fulfillments + tracking
- Returns
- Refunds
- Exchanges (often app-managed)
- Fraud/risk signals

### Customers
- Customers
- Customer groups/segments
- Customer accounts UX
- Customer metafields

### Checkout
- Cart
- Checkout
- Payment methods
- Shipping methods
- Taxes/duties
- Abandoned checkout recovery
- Checkout extensibility (apps/extensions; plan-dependent)

### Pricing
- Base prices
- Compare-at prices
- Discounts (codes + automatic)
- Buy X get Y / tiered discounts
- Price lists / market pricing (plan-dependent)
- Gift cards
- Store credit

### Inventory
- Inventory items
- Locations
- Inventory levels
- Transfers, adjustments
- Reservation/holds (commonly app-managed)

### Shipping
- Shipping profiles
- Shipping rates
- Shipping zones
- Carrier calculated rates
- Labels + tracking integrations

### Payments
- Payment providers
- Payment capture/authorization
- Refunds
- Payment intents/transactions
- Disputes/chargebacks

### Platform features
- Webhook subscriptions by topic + delivery logs
- Apps (install, scopes, billing)
- Admin UI
- Storefront API + Admin API (GraphQL/REST)
- Analytics + reports
- Gift cards
- Subscriptions
- Search + merchandising
- Theme system (Liquid) + theme editor
- App marketplace + extensions
- Automation workflows (Shopify Flow)
- Multi-store support
- SaaS tenancy (merchant-per-tenant)

---

## Phase 3 — Feature Gap Analysis (Table)

Gap severity:
- Low: exists with small differences
- Medium: exists but needs alignment/extension to match Shopify expectation
- High: missing major platform capability
- Critical: blocks Shopify-like platform positioning (themes/storefront/app ecosystem/multitenancy)

| Feature | Shopify | Codebase | Gap Level |
|---|---:|---:|---|
| Products/variants/options | Yes | Yes | Low |
| Collections/categories | Yes | Yes | Low |
| Product tags/types | Yes | Yes | Low |
| Cart/checkout primitives | Yes | Yes (headless) | Medium |
| Orders | Yes | Yes | Low |
| Draft orders | Yes | Yes (API) | Medium |
| Order edits | Yes | Yes (different model) | Medium |
| Returns/refunds | Yes | Yes | Low/Medium |
| Promotions/discounts | Yes | Yes (different UX model) | Medium |
| Price lists | Yes | Yes | Low/Medium |
| Inventory + locations | Yes | Yes | Low |
| Inventory reservations | Partial | Yes | Low/Medium |
| Shipping profiles/options | Yes | Yes (manual provider baseline) | Medium |
| Carrier labels/rates marketplace | Yes | Partial | High |
| Payments (providers/capture/refunds) | Yes | Yes | Low |
| Generic webhooks (topic subscriptions) | Yes | Payment hooks only | High |
| Apps platform (install/scopes/billing/extensions) | Yes | Plugin system only | High |
| Theme system (Liquid + editor) | Yes | Missing | Critical |
| Hosted storefront runtime | Yes | Missing | Critical |
| Search (merchandising-grade) | Yes | Index module (partial) | High |
| Analytics dashboards/reports | Yes | Plumbing only | High |
| Automation workflows (Flow-like) | Yes | Internal workflow engine only | High |
| Multi-tenant SaaS (merchant isolation) | Yes | Not turnkey | High/Critical |
| Metafields (typed/namespaced/schema) | Yes | Metadata JSON-style | High |
| Gift cards/store credit | Yes | Missing | High |
| Abandoned checkout recovery | Yes | Missing | High |
| CMS pages/blogs/navigation | Yes | Missing | Medium |
| Subscriptions | Yes | Missing | Medium |
| Fraud/risk | Yes | Missing | Medium |

---

## Phase 4 — Architectural Gap Analysis

### 4.1 Platform architecture (framework vs product)
- Current codebase: a commerce framework (Medusa v2) with modules and APIs.
- Shopify: an opinionated multi-tenant SaaS product with strong constraints and merchant-centric UX.
- Implication: you must add a “platform layer” (tenancy, domains, plans, quotas, onboarding, billing, apps lifecycle).

### 4.2 Plugin system vs Shopify apps
- Current: plugins extend backend/admin at build/deploy time and are not “installed per merchant”.
- Shopify: apps install per merchant, request scopes, register webhooks, optionally bill, and can provide UI/checkout extensions.
- Gap: runtime installation, tenant-scoped enablement, permission model, app lifecycle hooks, extension registry.

### 4.3 Event system vs Shopify webhooks
- Current: internal event bus + workflow emission is present.
- Shopify: external webhook subscription system with topics, signatures, retries, delivery visibility.
- Gap: webhook subscription storage, delivery worker, retry/backoff, signing, per-tenant configuration.

### 4.4 Storefront + theme system
- Current: headless Store API is present; storefront is expected to be built separately ([RUN.md](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/RUN.md)).
- Shopify: online store runtime + theme customization (Liquid + theme editor).
- Gap: hosted storefront + merchant-editable theme system (or a headless theme alternative).

### 4.5 Search infrastructure
- Current: index module exists, but Shopify-grade search (facets, relevance, merchandising controls) is not a turnkey feature.
- Gap: external search engine integration + ingestion pipeline + admin merchandising tools.

### 4.6 Analytics pipeline
- Current: analytics providers exist (e.g., PostHog integration).
- Shopify: merchant-facing analytics suite (reports, exports, cohorts, attribution).
- Gap: normalized event model + warehouse + reporting API + dashboards.

### 4.7 Multi-tenant capability
- Current: store module supports multiple store records, but request scoping/isolation is not a fully-designed SaaS tenancy layer.
- Shopify: merchant-per-tenant isolation across all data and integrations.
- Gap: tenant context propagation + enforcement in services/repositories + tenant-scoped secrets/apps/webhooks/search/analytics.

---

## Phase 5 — Implementation Roadmap for Missing Capabilities

This section proposes concrete implementation approaches for core missing “Shopify-like platform” capabilities.

### 5.1 Generic webhooks (Shopify-style topics)

#### Goal
Allow merchants and apps to subscribe to internal domain events and receive signed HTTP deliveries with retries, logs, and controls.

#### Database schema (proposed)
- `webhook_subscriptions`
  - `id`, `tenant_id`, `topic`, `url`, `secret`, `status`, `headers_json`, `created_at`
- `webhook_deliveries`
  - `id`, `subscription_id`, `event_id`, `attempt`, `status`, `response_code`, `last_error`, `created_at`

#### APIs (proposed)
- Admin
  - `POST /admin/webhooks`
  - `GET /admin/webhooks`
  - `DELETE /admin/webhooks/:id`
  - `GET /admin/webhooks/:id/deliveries`

#### Services/workflows (proposed)
- `WebhookSubscriptionService` (CRUD, topic validation)
- `WebhookDeliveryService` (enqueue, attempt, backoff, dead-letter)
- Topic catalog + event mapping using event bus and workflow emission patterns:
  - [emit-event.ts](file:///d:/Tahir/Peprika-Shopify-Store/Peprika-Shopify/packages/core/core-flows/src/common/steps/emit-event.ts#L43-L134)

#### Dependencies
- Redis-backed event bus recommended for multi-instance delivery and retry correctness.

---

### 5.2 Metafields (typed, namespaced)

#### Goal
Provide Shopify-like customization primitives beyond a single `metadata` JSON blob, enabling apps/merchants to define typed metafields per resource type.

#### Database schema (proposed)
- `metafield_definitions`
  - `id`, `tenant_id`, `namespace`, `key`, `owner_type`, `value_type`, `validation_json`
- `metafield_values`
  - `id`, `tenant_id`, `definition_id`, `owner_id`, `value_json`, `created_at`

#### APIs (proposed)
- Admin
  - `POST /admin/metafield-definitions`
  - `GET /admin/metafield-definitions`
  - `POST /admin/products/:id/metafields` (repeat for orders/customers/etc.)
- Store
  - Option A: expand metafields on entity reads (`expand=metafields`)
  - Option B: dedicated endpoints (`GET /store/products/:id/metafields`)

---

### 5.3 Gift cards

#### Database schema (proposed)
- `gift_cards`
  - `id`, `tenant_id`, `code`, `initial_balance`, `balance`, `currency_code`, `expires_at`, `disabled_at`, `customer_id`, `created_at`
- `gift_card_transactions`
  - `id`, `gift_card_id`, `order_id`, `amount`, `type`, `created_at`

#### APIs (proposed)
- Admin
  - `POST /admin/gift-cards`
  - `GET /admin/gift-cards`
  - `POST /admin/gift-cards/:id/disable`
- Store
  - `POST /store/gift-cards/redeem`

#### Workflows (proposed)
- `create-gift-card`, `redeem-gift-card`, `apply-gift-card-to-cart`

---

### 5.4 Search infrastructure

#### Goal
Deliver Shopify-grade storefront search: relevance, facets, synonyms, and merchandising controls.

#### Approach
- Use an external engine (Meilisearch/Algolia/Elastic) and ingest events from product/price/inventory domains.
- Provide storefront search endpoint and admin reindex/merchandising APIs.

#### APIs (proposed)
- Store: `GET /store/search?q=&filters=&sort=`
- Admin: `POST /admin/search/reindex`, `POST /admin/search/rules`

---

### 5.5 Analytics & reporting

#### Goal
Merchant-facing dashboards and reports.

#### Approach
- Track raw events (already supported by analytics provider module) and also maintain normalized facts.

#### Database schema (starter, proposed)
- `fact_orders(tenant_id, order_id, created_at, total, tax, shipping, discount, currency_code, sales_channel_id, customer_id, ...)`
- `fact_refunds(tenant_id, order_id, created_at, amount, reason, ...)`

#### APIs (proposed)
- `GET /admin/reports/sales?from=&to=`
- `GET /admin/reports/products/top?from=&to=`
- `GET /admin/reports/conversion?from=&to=`

---

### 5.6 Apps platform (installable per tenant)

#### Goal
Enable Shopify-like apps: install/uninstall per merchant, scopes/permissions, webhook subscriptions, and admin UI extensions.

#### Database schema (proposed)
- `apps(id, name, publisher, manifest_json, created_at)`
- `app_installations(id, tenant_id, app_id, scopes_granted, status, installed_at, uninstalled_at)`
- `app_credentials(id, installation_id, client_id, client_secret_hash, created_at)`

#### APIs (proposed)
- `GET /admin/apps`
- `POST /admin/apps/:id/install`
- `POST /admin/apps/:id/uninstall`
- OAuth-like callback endpoints under `/apps/:id/oauth/*`

---

### 5.7 Multi-tenant SaaS foundation

#### Goal
Turn the framework into a Shopify-like multi-tenant SaaS.

#### Database schema (proposed)
- `tenants(id, name, plan, status, created_at)`
- `tenant_domains(id, tenant_id, domain, verified_at, is_primary)`

#### Core runtime requirements
- Tenant resolution middleware (Host header → tenant)
- Enforced `tenant_id` scoping across all module reads/writes
- Tenant-scoped API keys, apps, webhooks, search indices, analytics

---

### 5.8 Theme system (critical if “Shopify-like” requires themes)

#### Goal
Allow merchant-customizable storefront look and feel without code deployments.

#### High-level options
- Option A: Liquid-like theme engine + editor + asset pipeline (largest effort)
- Option B: Next.js template “themes” + schema-driven sections + visual editor (faster)

---

## Phase 6 — Final Platform Architecture Design (ASCII)

### Current (as represented by this repo)

```text
+-------------------+         +------------------------------+
| Admin Dashboard   | <-----> | Medusa Backend (Admin API)   |
| (packages/admin)  |         | /admin/*                     |
+-------------------+         +------------------------------+
                                      |
                                      | Store API /store/*
                                      v
                               +--------------+
                               | Postgres DB  |
                               +--------------+

Internal extensibility:
- Modules loaded via MedusaAppLoader
- Plugins resolved & loaded from config
- Event Bus (local by default; redis available)
```

### Target (Shopify-like SaaS with apps + webhooks + search + analytics)

```text
                        +----------------------+
                        | Merchant Admin UI    |
                        | (core + extensions)  |
                        +----------+-----------+
                                   |
                                   v
+------------------+     +-----------------------------+     +------------------+
| Storefront(s)    | --> | API Gateway / Edge Router   | --> | Commerce Backend |
| Next.js templates|     | tenant resolution, caching  |     | Medusa + platform|
+------------------+     +--------------+--------------+     +---+----------+----+
                                       |                      |   |          |
                                       |                      |Events     Webhooks
                                       v                      v   v          v
                               +----------------+     +------------------+  +------------------+
                               | Redis / Queue  |<----| Event Bus (Redis) |  | Webhook Worker   |
                               +--------+-------+     +--------+---------+  | retries/signing  |
                                        |                      |            +--------+---------+
                                        |                Search ingest               |
                                        v                      v                      v
                               +----------------+       +---------------+     External endpoints
                               | Analytics      |       | Search Engine |
                               | warehouse/API  |       | (Meili/Algo)  |
                               +----------------+       +---------------+

Data & storage:
- Postgres (tenant-scoped commerce + platform tables)
- Object storage (S3-compatible) for assets/uploads/themes
```

---

## Phase 7 — Development Strategy (Phased Roadmap)

Complexity scale: S (small), M (medium), L (large), XL (very large).

### Phase 1 — Core store (M)
- Stabilize catalog/cart/checkout/orders/payments/shipping/tax.
- Production hardening (idempotency, retries, background jobs, observability).

### Phase 2 — Storefront (M)
- Build Next.js storefront MVP consuming Store API.
- Customer accounts UX, SEO, caching strategy.

### Phase 3 — Payment & shipping (M–L)
- Expand provider ecosystem (shipping carriers/labels/rates, additional payment providers).
- Operational flows: fulfillment tracking, refunds, returns.

### Phase 4 — Search & analytics (L)
- External search engine integration + ingestion + admin tooling.
- Reporting schema + dashboards.

### Phase 5 — Apps ecosystem (L)
- App install lifecycle (per tenant), scopes/permissions, webhook registration.
- Admin UI extension registry.

### Phase 6 — SaaS multi-store (L–XL)
- Tenant routing & isolation enforcement.
- Domains, plans, quotas, billing, onboarding.

### Phase 7 — Shopify-grade UX parity (XL)
- Theme engine/editor (if required), automation workflows, advanced merchandising, fraud tooling.

---

## Practical “Cutline” Recommendation

If the goal is to reach “Shopify-like outcomes” fastest, the highest-leverage platform upgrades on top of the existing Medusa commerce core are:
1) Storefront (Next.js) + merchant onboarding
2) Generic webhooks (topic subscriptions + delivery logs)
3) Metafields (typed, namespaced)
4) Search (external engine + merchandising)
5) Analytics (reporting + dashboards)

Full Liquid themes + theme editor is the single largest scope multiplier; treat it as a separate program unless it is a non-negotiable product requirement.

