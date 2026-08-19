# How to Run This Project

This repository is the **Medusa framework monorepo** (the open-source commerce platform source code), not a standalone store app. Here’s how to work with it.

---

## Prerequisites

- **Node.js** ≥ 20
- **Yarn** 3.2.1 (recommended; the repo uses it)
- **PostgreSQL** (only needed if you run a full Medusa app)

---

## Option A: Build and Develop the Framework (this repo)

Use this when you want to build the framework, run tests, or contribute.

### 1. Install dependencies

```bash
yarn install
```

### 2. Build all packages

```bash
yarn build
```

This compiles the whole monorepo. First run can take a few minutes.

### 3. (Optional) Watch mode for active development

In the package you’re changing:

```bash
cd packages/medusa
yarn watch
```

### 4. Run tests

```bash
# Unit tests
yarn test

# Integration tests (packages)
yarn test:integration:packages

# HTTP integration tests
yarn test:integration:http
```

**Note:** This repo does **not** start a full Medusa server by itself. The `packages/medusa` package is a library; a runnable app is created with `create-medusa-app` (see Option B).

### 5. Run migrations / Medusa CLI from this repo (e.g. with Neon)

If you use a remote Postgres (e.g. Neon) and have set `.env` and `medusa-config.js` at the repo root (see [env.example](env.example)):

```bash
# From repo root after yarn install
yarn medusa db:migrate
yarn medusa develop
```

Use `node node_modules/@medusajs/cli/cli.js <command>` if `yarn medusa` does not resolve.

**If migrations fail (database in partial state)**  
Errors like `relation "product_option_value" does not exist`, `column "deleted_at" does not exist`, or `invalid input value for enum ... "shipped"` usually mean the database was partially migrated or has an older schema. Use a **fresh database**:

- **Option 1 – New Neon branch (recommended):** In the [Neon dashboard](https://console.neon.tech), create a new branch (e.g. `main-fresh`). Use that branch’s connection string in `.env` as `DATABASE_URL`, then run `yarn medusa db:migrate` again.
- **Option 2 – Reset current Neon database:** In Neon’s SQL Editor, run (replace `neondb_owner` with your DB user if different):

  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO neondb_owner;
  GRANT ALL ON SCHEMA public TO public;
  ```

  Then run `yarn medusa db:migrate` again. All data in that database will be lost.

---

## Option B: Run a Medusa Store (separate app)

To run an actual store (API + Admin), you need a **Medusa application** created by the CLI. That app can use this repo for local framework development.

### 1. Create a new Medusa app (outside this repo)

```bash
npx create-medusa-app@latest
```

Follow the prompts (project name, database, etc.). That creates a new folder with a runnable app.

### 2. Run the store

In the **new app’s** directory:

```bash
cd your-medusa-app
yarn dev
```

This starts the Medusa backend and admin (often at `http://localhost:9000` for API and a separate port for the admin).

### 3. (Optional) Use this repo as the framework (for contributing)

See [CONTRIBUTING.md](./CONTRIBUTING.md): create a test project with `create-medusa-app`, then point its `package.json` dependencies to the local packages in this repo (e.g. `"@medusajs/medusa": "file:../Peprika-Shopify/packages/medusa"`). After changing this repo, run `yarn build` here, then in the test project reinstall and run `yarn dev`.

---

## Quick reference

| Goal                         | Command / location        |
|-----------------------------|---------------------------|
| Install deps (this repo)    | `yarn install`            |
| Build this repo             | `yarn build`              |
| Watch one package           | `cd packages/<name> && yarn watch` |
| Unit tests                  | `yarn test`               |
| DB migrate (from repo root) | `yarn medusa db:migrate`  |
| Run a real store            | Create app with `npx create-medusa-app@latest`, then `yarn dev` in that app |

For more on Medusa: [Documentation](https://docs.medusajs.com) · [Installation](https://docs.medusajs.com/learn/installation).
