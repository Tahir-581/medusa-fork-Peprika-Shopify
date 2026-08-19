# Peprika-Shopify Codebase: Features Guide & Shopify Comparison

This document explains **every major feature** in this codebase, **how to access each feature** (API and Admin UI), and **how this codebase relates to Shopify**.

---

## Table of Contents

1. [Project Identity & What This Repo Is](#1-project-identity--what-this-repo-is)
2. [How to Run and Access the System](#2-how-to-run-and-access-the-system)
3. [Feature Reference: Admin API & UI](#3-feature-reference-admin-api--ui)
4. [Feature Reference: Store API](#4-feature-reference-store-api)
5. [Auth, Hooks & Other APIs](#5-auth-hooks--other-apis)
6. [Shopify Comparison: Is This a Clone?](#6-shopify-comparison-is-this-a-clone)

---

## 1. Project Identity & What This Repo Is

### What This Repository Is

- **Name**: The folder/repo is named **Peprika-Shopify**; the root package is `"root"`.
- **Technology**: This is the **Medusa v2** open-source commerce platform **monorepo** (source code of the framework itself), not a pre-built "Peprika store" or a standalone Shopify clone app.
- **Config**:
  - **package.json** (root): Yarn 3.2.1 workspaces; scripts include `yarn build`, `yarn test`, `yarn medusa`.
  - **medusa-config.js**: Uses `DATABASE_URL` from `.env`, Postgres, with SSL (e.g. for Neon). No custom Shopify or Peprika modules.
  - **env.example / .env**: Only `DATABASE_URL` is documented/used for database connection.

### Peprika & Shopify in This Codebase

- **Peprika**: The word "Peprika" does not appear in code or config; it exists only in the **repository/directory name** (e.g. "Peprika-Shopify").
- **Shopify**: The only references in the repo are in **CHANGELOGs** (e.g. "medusa-source-shopify loader"). There is **no** `medusa-source-shopify` package, no Shopify API keys, and **no documentation in this codebase** that describes this project as a "Shopify clone" or "Shopify API alternative."

**Conclusion**: This is the **Medusa framework monorepo** with a repo name that suggests a Peprika/Shopify-related use case. The **features** are Medusa's commerce features; the "Shopify clone" aspect is about **feature parity and conceptual similarity** (see [Section 6](#6-shopify-comparison-is-this-a-clone)), not about implementing Shopify's API or branding.

---

## 2. How to Run and Access the System

### Prerequisites

- **Node.js** ≥ 20
- **Yarn** 3.2.1
- **PostgreSQL** (e.g. Neon); connection string in `.env` as `DATABASE_URL`

### Running From This Repo

From the **repo root** after `yarn install`:

```bash
# Apply migrations (required once / after schema changes)
yarn medusa db:migrate

# Start backend + admin (API and dashboard)
yarn medusa develop
```

- **API base URL**: Typically `http://localhost:9000` (no path prefix in code; routes are `/admin/*`, `/store/*`, `/auth/*`, `/hooks/*`).
- **Admin dashboard**: Usually served on a separate port (e.g. by the Medusa dev process); check terminal output for the exact URL.

### Running a Full Store (Recommended for Storefront)

To run an actual store (API + Admin + optional storefront), create a **separate Medusa app** and run it there:

```bash
npx create-medusa-app@latest
cd your-medusa-app
yarn dev
```

You can later point that app's dependencies to this repo for local framework development (see `RUN.md`).

### Access Patterns Summary

| Audience    | Base path   | Auth                          | Where to use                |
|------------|-------------|-------------------------------|-----------------------------|
| **Admin**  | `/admin/*`  | User: session / bearer / API key | Dashboard, scripts, integrations |
| **Store**  | `/store/*`  | Optional (customer); publishable key | Storefront, headless clients     |
| **Auth**   | `/auth/*`   | Session / token               | Login, register, refresh     |
| **Hooks**  | `/hooks/*`  | Provider-specific (e.g. Stripe signature) | Webhooks only (e.g. payment)     |

---

## 3. Feature Reference: Admin API & UI

Each subsection below describes **what** the feature is, **where** it's implemented, **Admin API** endpoints, and **Admin UI** routes.

---

### 3.1 Products

**What it is**: Catalog of products with variants, options, pricing, media, and organization (categories, collections).

**Where**: Module `@medusajs/product`; API under `packages/medusa/src/api/admin/products/` and related; workflows in `packages/core/core-flows/src/product/`.

**Admin API**:

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/admin/products` | List products (filters, pagination, fields) |
| POST   | `/admin/products` | Create product |
| GET    | `/admin/products/:id` | Get one product |
| POST   | `/admin/products/:id` | Update product |
| DELETE | `/admin/products/:id` | Delete product |

Sub-routes: variants, options, inventory-items, batch operations, import, export.
**Auth**: User (session, bearer, or API key). **RBAC**: e.g. `product`, `product_variant`, `product_option`, `inventory_item`.

**Admin UI**:

- **List / create / import / export**: `/products`, `/products/create`, `/products/import`, `/products/export`
- **Detail**: `/products/:id` with sub-routes:
  - Edit: `/products/:id/edit`
  - Variants: create/edit, `/products/:id/variants/create`, `/products/:id/edit-variant`, `/products/:id/variants/:variant_id/edit`, `prices`, `manage-items`, `media`, `metadata/edit`
  - Organization: `organization`, `sales-channels`, `attributes`, `shipping-profile`, `media`, `prices`, `options/create`, `options/:option_id/edit`, `stock`, `metadata/edit`

**Key files**: `packages/medusa/src/api/admin/products/route.ts`, `middlewares.ts`; product workflows in `packages/core/core-flows/src/product/`.

---

### 3.2 Product Variants

**What it is**: Variants of a product (size, color, etc.) with their own prices and inventory links.

**Where**: Same product module; API `packages/medusa/src/api/admin/products/[id]/variants/` and `admin/product-variants/`.

**Admin API**: Full CRUD and batch on variants; link to inventory items and images. See product routes above and `/admin/product-variants`.

**Admin UI**: Under product detail: variant create/edit, prices, manage-items, media, metadata (paths above).

---

### 3.3 Collections

**What it is**: Grouping of products (e.g. "Summer collection"). Products can have `collection_id`.

**Where**: `@medusajs/product`; API `packages/medusa/src/api/admin/collections/`.

**Admin API**:

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/admin/collections` | List / create |
| GET/POST/DELETE | `/admin/collections/:id` | Get / update / delete |
| (products) | `/admin/collections/:id/products` | Manage products in collection |

**Admin UI**: `/collections` (list), `/collections/create`, `/collections/:id` (edit, products, metadata/edit).

---

### 3.4 Product Categories

**What it is**: Hierarchical categorization of products (product-category tree).

**Where**: `@medusajs/product`; API `packages/medusa/src/api/admin/product-categories/`.

**Admin API**: CRUD on product-categories and their products.

**Admin UI**: `/categories` (list, create, organize), `/categories/:id` (edit, products, organize, metadata/edit).

---

### 3.5 Orders

**What it is**: Customer orders with line items, fulfillments, returns, refunds, and edits.

**Where**: Module `@medusajs/order`; API `packages/medusa/src/api/admin/orders/`.

**Admin API**:

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/admin/orders` | List / create |
| GET/POST/DELETE | `/admin/orders/:id` | Get / update / delete |

Sub-routes: fulfillments, shipments, cancel, complete, transfer, line-items, shipping-options, changes, export, archive, credit-lines, returns, claims, edits, refund, email, addresses, metadata.

**Admin UI**: `/orders` (list, export), `/orders/:id` with sub-routes: fulfillment, returns, allocate-items, create-shipment, returns, claims, exchanges, edits, refund, transfer, email, shipping-address, billing-address, metadata/edit.

**Key files**: `packages/medusa/src/api/admin/orders/route.ts`, `[id]/route.ts`; order workflows in `packages/core/core-flows/src/order/`.

---

### 3.6 Draft Orders

**What it is**: Orders created in the admin (e.g. by staff) before payment; similar to Shopify's draft orders.

**Where**: Module `@medusajs/draft-order`; API `packages/medusa/src/api/admin/draft-orders/`.

**Admin API**: GET/POST `/admin/draft-orders`, GET/POST/DELETE `/admin/draft-orders/:id`; edit sub-routes for items, shipping-methods, promotions, request/confirm/cancel edit.

**Admin UI**: **Not enabled** in this codebase. The draft orders nav item is commented out in `main-layout.tsx`; there is no `/draft-orders` route in the admin. **Access**: API only.

---

### 3.7 Customers

**What it is**: Customer records with addresses and optional customer groups.

**Where**: Module `@medusajs/customer`; API `packages/medusa/src/api/admin/customers/`.

**Admin API**: GET/POST `/admin/customers`, GET/POST/DELETE `/admin/customers/:id`; addresses, customer-groups.

**Admin UI**: `/customers` (list, create), `/customers/:id` (edit, create-address, add-customer-groups, transfer, metadata/edit).

---

### 3.8 Customer Groups

**What it is**: Segments of customers (e.g. for pricing or promotions).

**Where**: Customer module; API `packages/medusa/src/api/admin/customer-groups/`.

**Admin API**: CRUD customer-groups; link customers via `/admin/customers/:id/customer-groups`.

**Admin UI**: `/customer-groups` (list, create), `/customer-groups/:id` (edit, add-customers, metadata/edit).

---

### 3.9 Promotions

**What it is**: Discounts and promotion rules (e.g. buy X get Y, percentage off).

**Where**: Module `@medusajs/promotion`; API `packages/medusa/src/api/admin/promotions/`.

**Admin API**: CRUD promotions, rules (target/buy), rule-attribute-options, rule-value-options.

**Admin UI**: `/promotions` (list), `/promotions/create`, `/promotions/:id` (edit, add-to-campaign, `:ruleType/edit`).

---

### 3.10 Campaigns

**What it is**: Grouping of promotions with optional budget (e.g. "Black Friday").

**Where**: Same promotion module; API `packages/medusa/src/api/admin/campaigns/`.

**Admin API**: CRUD campaigns, budget, add-promotions.

**Admin UI**: `/campaigns` (list, create), `/campaigns/:id` (edit, configuration, edit-budget, add-promotions).

---

### 3.11 Price Lists

**What it is**: Override or segment-specific pricing (e.g. B2B prices).

**Where**: Pricing module; API `packages/medusa/src/api/admin/price-lists/`.

**Admin API**: CRUD price-lists, prices, products on price-list.

**Admin UI**: `/price-lists` (list, create), `/price-lists/:id` (edit, configuration, products/add, products/edit).

---

### 3.12 Inventory & Reservations

**What it is**: Inventory items (SKU-level stock) and reservations (e.g. cart hold).

**Where**: Module `@medusajs/inventory`; API `packages/medusa/src/api/admin/inventory-items/`, `admin/reservations/`.

**Admin API**: GET/POST `/admin/inventory-items`, GET/POST/DELETE `/admin/inventory-items/:id`; GET/POST `/admin/reservations`, GET/POST/DELETE `/admin/reservations/:id`.

**Admin UI**: `/inventory` (list, create, stock), `/inventory/:id` (edit, attributes, metadata, locations, adjust); `/reservations` (list, create), `/reservations/:id` (edit, metadata/edit).

---

### 3.13 Regions, Store & Currencies

**What it is**: Regions (countries/currencies/tax), store settings, and supported currencies.

**Where**: Modules `@medusajs/region`, `@medusajs/currency`, `@medusajs/store`; API `admin/regions/`, `admin/currencies/`, `admin/stores/`.

**Admin API**: CRUD `/admin/regions`, GET `/admin/currencies`, GET/POST `/admin/stores/:id`.

**Admin UI**: Settings → `/settings/regions` (list, create, edit, countries, metadata); `/settings/store` (edit, currencies, locales, metadata/edit).

---

### 3.14 Shipping (Locations, Profiles, Options)

**What it is**: Stock locations, fulfillment sets, service zones, shipping option types and options (rates).

**Where**: Modules `@medusajs/fulfillment`, `@medusajs/stock-location`; API `admin/shipping-options/`, `admin/shipping-profiles/`, `admin/fulfillment-sets/`, `admin/fulfillment-providers/`, `admin/stock-locations/`.

**Admin API**: Full CRUD on shipping-profiles, shipping-options, shipping-option-types; fulfillment-sets, service-zones; fulfillment-providers; stock-locations and their fulfillment/sales-channel links.

**Admin UI**: Settings → **Locations** (`/settings/locations`): list, create; per-location edit, sales-channels, fulfillment-providers, fulfillment-set → service-zones → shipping-option (create/edit/pricing). Also **Shipping profiles** (`/settings/locations/shipping-profiles`), **Shipping option types** (`/settings/locations/shipping-option-types`).

---

### 3.15 Tax

**What it is**: Tax regions, rates, overrides, and tax providers.

**Where**: Module `@medusajs/tax`; API `packages/medusa/src/api/admin/tax-regions/`, `tax-rates/`, `tax-providers/`.

**Admin API**: CRUD tax-regions, tax-rates (and rules), provinces, overrides; GET tax-providers.

**Admin UI**: Settings → `/settings/tax-regions` (list, create), `/settings/tax-regions/:id` (edit, provinces, tax-rates, overrides).

---

### 3.16 Payment (Admin)

**What it is**: Payment collections and payments (e.g. mark as paid, capture, refund).

**Where**: Module `@medusajs/payment`; API `packages/medusa/src/api/admin/payment-collections/`, `admin/payments/`.

**Admin API**: GET/POST `/admin/payment-collections`, GET/POST `/admin/payment-collections/:id` (e.g. mark-as-paid); GET `/admin/payments`, GET/POST `/admin/payments/:id` (capture, refund); GET payment-providers.

---

### 3.17 Fulfillments & Shipments

**What it is**: Fulfillment of order items and shipment tracking.

**Where**: Module `@medusajs/fulfillment`; API under `admin/fulfillments/` and order sub-routes.

**Admin API**: GET/POST `/admin/fulfillments`; cancel, shipment; order-level fulfillment/shipment under `/admin/orders/:id`.

**Admin UI**: From order detail: fulfillment, create shipment, mark as delivered.

---

### 3.18 Returns, Claims, Exchanges & Reasons

**What it is**: Return requests, order claims, exchanges, and configurable return/refund reasons.

**Where**: Order-related flows; API `admin/returns/`, `admin/claims/`, `admin/exchanges/`, `admin/return-reasons/`, `admin/refund-reasons/`.

**Admin API**: Full lifecycle for returns, claims, exchanges; CRUD return-reasons and refund-reasons.

**Admin UI**: From order detail: returns, claims, exchanges. Settings → `/settings/return-reasons`, `/settings/refund-reasons`.

---

### 3.19 Order Edits

**What it is**: Request and confirm changes to an order after creation (e.g. add/remove items, change shipping).

**Where**: Order workflows; API `admin/order-edits/`, `admin/order-changes/`.

**Admin API**: Request, confirm, items, shipping-method for order-edits; order-changes by id.

**Admin UI**: Order detail → edits (`/orders/:id/edits`).

---

### 3.20 Users & Invites

**What it is**: Admin users and invite flow.

**Where**: Modules `@medusajs/user`, `@medusajs/invite`; API `packages/medusa/src/api/admin/users/`, `admin/invites/`.

**Admin API**: GET `/admin/users`, GET/POST/DELETE `/admin/users/:id`, roles; GET/POST/DELETE `/admin/invites` (accept, resend).

**Admin UI**: Settings → `/settings/users` (list, invite), `/settings/users/:id` (edit, metadata/edit). Login: `/login`; `/reset-password`, `/invite`.

---

### 3.21 API Keys (Publishable & Secret)

**What it is**: Publishable keys (e.g. for storefront) and secret keys (for server-to-server admin API).

**Where**: Module `@medusajs/api-key`; API `packages/medusa/src/api/admin/api-keys/`.

**Admin API**: GET/POST `/admin/api-keys`, GET/POST/DELETE `/admin/api-keys/:id` (revoke, sales-channels).

**Admin UI**: Settings → `/settings/publishable-api-keys`, `/settings/secret-api-keys` (list, create, edit, sales-channels for publishable).

---

### 3.22 Sales Channels

**What it is**: Channels (e.g. web, mobile) to which products can be assigned; publishable keys can be scoped to a sales channel.

**Where**: Module `@medusajs/sales-channel`; API `admin/sales-channels/`, `admin/stock-locations/:id/sales-channels`.

**Admin UI**: Settings → `/settings/sales-channels` (list, create), `/settings/sales-channels/:id` (edit, add-products, metadata/edit).

---

### 3.23 File Uploads

**What it is**: File uploads (e.g. product images) via local or S3 provider.

**Where**: Module `@medusajs/file` (providers file-local, file-s3); API `packages/medusa/src/api/admin/uploads/`.

**Admin API**: POST `/admin/uploads`, POST `/admin/uploads/presigned-urls`; GET/DELETE `/admin/uploads/:id`.

**Admin UI**: Used inside product/variant media and other flows (no standalone "Uploads" page).

---

### 3.24 Notifications

**What it is**: Outbound notifications (e.g. email via SendGrid).

**Where**: Module `@medusajs/notification` (e.g. notification-sendgrid); API `admin/notifications/`.

**Admin API**: GET `/admin/notifications`, GET/POST/DELETE `/admin/notifications/:id`.

---

### 3.25 Translations & Locales

**What it is**: Translating content and managing locales.

**Where**: Module `@medusajs/translation`; API `admin/translations/`, `admin/translations/settings`, batch, entities, statistics.

**Admin UI**: Settings → `/settings/translations` (list, settings, edit, add-locales). Store locales: GET `/store/locales`.

---

### 3.26 Workflow Executions

**What it is**: View and inspect workflow run history (for debugging/monitoring).

**Where**: Workflow engine; API `admin/workflows-executions/`.

**Admin API**: GET/POST run, subscribe, steps success/failure, get by id/transaction/step.

**Admin UI**: Settings → `/settings/workflows` (list), `/settings/workflows/:id` (detail).

---

### 3.27 Product Tags & Product Types

**What it is**: Tags and types for organizing products (e.g. "Accessories", "Shirt").

**Where**: Product module; API `admin/product-tags/`, product-types in product model; Admin has dedicated routes.

**Admin UI**: Settings → `/settings/product-tags` (list, create), `/settings/product-tags/:id` (edit, metadata/edit); `/settings/product-types` (list, create), `/settings/product-types/:id` (edit, metadata/edit).

---

### 3.28 Profile (Current User)

**What it is**: Logged-in admin user's profile.

**Admin UI**: `/settings/profile`, `/settings/profile/edit`.

---

### 3.29 Metadata (All Entities)

**What it is**: Arbitrary JSON key-value storage on entities (similar in spirit to Shopify metafields; single `metadata` object per entity, no separate namespace API).

**Where**: Entities expose `metadata`; many admin routes have a `metadata/edit` sub-route.

**Admin UI**: "Metadata" / "Edit metadata" on product, variant, category, collection, order, customer, customer-group, reservation, inventory, region, store, sales-channel, shipping-profile, product-tag, product-type, user.

---

### 3.30 Feature Flags & Index (Search)

**What it is**: Feature flags for toggling capabilities; optional search index (admin index/sync).

**Admin API**: GET `admin/feature-flags/`; `admin/index/details`, `admin/index/sync` (may 404 if index module/flag not enabled).

---

## 4. Feature Reference: Store API

The **Store API** is used by a **storefront** (not included in this repo; use a separate Next.js or other front-end). All routes are under `/store/*` and typically use the **publishable API key**; customer auth is optional (`allowUnauthenticated: true`).

| Feature | Methods | Path | Description |
|---------|--------|------|-------------|
| **Products** | GET | `/store/products`, `/store/products/:id` | List and get products |
| **Product variants** | GET | `/store/product-variants`, `/store/product-variants/:id` | List and get variants |
| **Product types/tags/categories** | GET | `/store/product-types`, `/store/product-tags`, `/store/product-categories` (and `:id`) | Read-only |
| **Collections** | GET | `/store/collections`, `/store/collections/:id` | List and get collections |
| **Carts** | POST | `/store/carts` | Create cart |
| | GET/POST | `/store/carts/:id` | Get/update cart |
| | POST/DELETE | `/store/carts/:id/line-items` | Add/remove line items |
| | POST | `/store/carts/:id/shipping-methods`, `customer`, `promotions`, `taxes` | Shipping, customer, promotions, taxes |
| | POST | `/store/carts/:id/complete` | Complete cart (checkout) |
| **Payment** | POST | `/store/payment-collections`, `/store/payment-collections/:id/payment-sessions` | Create payment collection and sessions |
| | GET | `/store/payment-providers` | List payment providers |
| **Shipping** | GET | `/store/shipping-options` | List shipping options |
| | POST | `/store/shipping-options/:id/calculate` | Calculate shipping |
| **Orders** | GET | `/store/orders`, `/store/orders/:id` | List and get customer's orders |
| | POST | Transfer request/accept/decline/cancel (under orders) | Order transfer |
| **Customers** | POST | `/store/customers` | Register |
| | GET/POST | `/store/customers/me` | Current customer |
| | GET/POST/DELETE | `/store/customers/me/addresses`, `addresses/:address_id` | Addresses |
| **Returns** | POST | `/store/returns` | Create return |
| | GET | `/store/return-reasons`, `/store/return-reasons/:id` | Return reasons |
| **Regions & currencies** | GET | `/store/regions`, `/store/regions/:id`; `/store/currencies`, `/store/currencies/:code` | Read-only |
| **Locales** | GET | `/store/locales` | Available locales |

**Key implementation**: `packages/medusa/src/api/store/` (carts, products, orders, customers, payment-collections, shipping-options, etc.); workflows in `packages/core/core-flows/src/cart/`, `order/`, etc.

---

## 5. Auth, Hooks & Other APIs

### Auth (`/auth/*`)

- **Session**: POST/DELETE `/auth/session`; POST `/auth/token/refresh`.
- **Provider login**: GET/POST `/auth/:actor_type/:auth_provider` (e.g. `user`/`emailpass`, `user`/`google`); register, reset-password, update as applicable.
- **Actor types**: `user` (admin), `customer` (store). Admin routes require user auth (session, bearer, or API key); store allows unauthenticated with optional customer auth.

### Payment Webhooks (`/hooks/*`)

- **Path**: POST `/hooks/payment/:provider` (e.g. Stripe).
- **Auth**: No Medusa auth; provider validates payload (e.g. Stripe signature).
- **Purpose**: Receive payment provider events (e.g. payment intent succeeded).

---

## 6. Shopify Comparison: Is This a Clone?

### What "Shopify Clone" Means Here

This codebase is **not**:

- A reimplementation of **Shopify's HTTP/GraphQL API** or **Shopify Admin** UI.
- A product that uses **Shopify's** infrastructure or branding.

It **is**:

- The **Medusa** open-source commerce platform, which provides **similar high-level capabilities** to Shopify: products, variants, collections, categories, cart, checkout, orders, customers, discounts, draft orders, multi-currency/regions, shipping, tax, fulfillment, returns, and so on.

So "clone" in the repo name is best understood as **"a platform that can be used to build a Shopify-like store"** (feature-parity style), not "drop-in Shopify API replacement."

### Feature-by-Feature Comparison (Conceptual)

| Shopify concept | In this codebase | How to access |
|-----------------|------------------|----------------|
| **Products & variants** | Products, variants, options | Admin: `/products`, `/products/:id`; API: `/admin/products`, `/store/products` |
| **Collections** | Collections | Admin: `/collections`; API: `/admin/collections`, `/store/collections` |
| **Product categories** | Product categories (tree) | Admin: `/categories`; API: `/admin/product-categories`, `/store/product-categories` |
| **Draft orders** | Draft orders | **API only**: `/admin/draft-orders` (no admin UI in this repo) |
| **Gift cards** | Product flag `is_giftcard`; no dedicated gift-card module or admin | Product with `is_giftcard`; i18n/tax support present |
| **Metafields** | Single `metadata` (JSONB) per entity | "Metadata" / "Edit metadata" in admin for many entities; no namespace/key API like Shopify |
| **Discounts** | Promotions + campaigns | Admin: `/promotions`, `/campaigns`; API: `/admin/promotions`, `/admin/campaigns`; store: `/store/carts/:id/promotions` |
| **Price lists** | Price lists + price preferences | Admin: `/price-lists`; API: `/admin/price-lists` |
| **Customers & groups** | Customers, customer groups | Admin: `/customers`, `/customer-groups`; API: `/admin/customers`, `/store/customers` |
| **Regions & currencies** | Regions, store, currencies | Admin: `/settings/regions`, `/settings/store`; API: `/admin/regions`, `/store/regions` |
| **Shipping** | Locations, fulfillment sets, service zones, shipping options | Admin: Settings → Locations; API: `/admin/shipping-*`, `/store/shipping-options` |
| **Tax** | Tax regions, rates, overrides | Admin: `/settings/tax-regions`; API: `/admin/tax-regions` |
| **Checkout** | Cart + complete cart + payment collection | Store API: `/store/carts`, `/store/carts/:id/complete`, `/store/payment-collections` |
| **Orders, fulfillments, returns** | Orders, fulfillments, returns, claims, exchanges | Admin: `/orders`, order detail sub-routes; API: `/admin/orders`, `/store/orders` |
| **Order edits** | Order edits / order changes | Admin: order detail → edits; API: `/admin/order-edits` |
| **Sales channels** | Sales channels | Admin: `/settings/sales-channels`; API: `/admin/sales-channels`; store filtered by publishable key |
| **API keys** | Publishable + secret API keys | Admin: `/settings/publishable-api-keys`, `/settings/secret-api-keys`; API: `/admin/api-keys` |
| **Webhooks** | Payment provider webhooks only | POST `/hooks/payment/:provider`; no generic "webhook" resource in this repo |
| **Multi-tenant** | Single store per backend in default setup | Core-flows mention multi-tenant; no dedicated multi-tenant APIs in this codebase |

### Summary

- **Every major feature** in this codebase is documented above with **where it lives**, **Admin API path**, and **Admin UI path** (or "API only" where applicable).
- **Access**: Admin features require **user auth** on `/admin/*`; store features use **/store/** with optional customer auth and publishable key.
- **Shopify**: This repo is the **Medusa** monorepo with a **Peprika-Shopify** folder name. It provides **Shopify-like** commerce features and can be used to build a "Shopify clone" store, but it is **not** the Shopify product or API.

For run instructions and database setup (including Neon), see `RUN.md` and `env.example`.
