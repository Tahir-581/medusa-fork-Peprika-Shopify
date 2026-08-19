const { defineConfig } = require("@medusajs/utils")

const databaseUrl = process.env.DATABASE_URL
const shouldUseSsl =
  String(process.env.DATABASE_SSL ?? "").toLowerCase() === "true" ||
  (typeof databaseUrl === "string" && databaseUrl.includes("sslmode=require"))

/**
 * Medusa config for running from this repo (e.g. db:migrate, dev).
 * Uses DATABASE_URL from .env. For Neon or any remote Postgres, SSL is enabled
 * via databaseDriverOptions so the connection succeeds.
 */
module.exports = defineConfig({
  projectConfig: {
    databaseUrl,
    databaseType: "postgres",
    ...(shouldUseSsl
      ? {
          databaseDriverOptions: {
            connection: {
              ssl: { rejectUnauthorized: false },
            },
          },
        }
      : {}),
    http: {
      jwtSecret: process.env.JWT_SECRET ?? "supersecret",
    },
    workerMode: process.env.WORKER_MODE ?? "shared",
    ...(process.env.REDIS_URL ? { redisUrl: process.env.REDIS_URL } : {}),
  },
})
