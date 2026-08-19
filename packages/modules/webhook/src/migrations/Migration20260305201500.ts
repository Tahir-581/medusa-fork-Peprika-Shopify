import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260305201500 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "webhook_delivery" add column if not exists "locked_at" timestamptz null;'
    )
    this.addSql(
      'alter table if exists "webhook_delivery" add column if not exists "locked_by" text null;'
    )

    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_locked_at" ON "webhook_delivery" (locked_at) WHERE deleted_at IS NULL;'
    )
  }
}

