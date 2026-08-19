import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260305211000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "webhook_subscription" add column if not exists "failure_count" int not null default 0;'
    )
    this.addSql(
      'alter table if exists "webhook_subscription" add column if not exists "last_failure_at" timestamptz null;'
    )
    this.addSql(
      'alter table if exists "webhook_subscription" add column if not exists "last_success_at" timestamptz null;'
    )
    this.addSql(
      'alter table if exists "webhook_subscription" add column if not exists "disabled_at" timestamptz null;'
    )
    this.addSql(
      'alter table if exists "webhook_subscription" add column if not exists "disabled_reason" text null;'
    )

    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_webhook_subscription_tenant_id_status" ON "webhook_subscription" (tenant_id, status) WHERE deleted_at IS NULL;'
    )
  }
}

