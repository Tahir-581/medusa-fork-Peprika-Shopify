import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260305193000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "webhook_delivery" add column if not exists "idempotency_key" text null;'
    )

    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webhook_delivery_idempotency_key" ON "webhook_delivery" (idempotency_key) WHERE deleted_at IS NULL AND idempotency_key IS NOT NULL;'
    )

    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webhook_delivery_subscription_id_event_id" ON "webhook_delivery" (subscription_id, event_id) WHERE deleted_at IS NULL AND event_id IS NOT NULL;'
    )
  }
}

