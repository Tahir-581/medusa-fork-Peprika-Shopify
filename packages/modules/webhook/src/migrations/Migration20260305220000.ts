import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260305220000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "webhook_delivery" add column if not exists "last_request_headers" jsonb null;'
    )
    this.addSql(
      'alter table if exists "webhook_delivery" add column if not exists "last_response_headers" jsonb null;'
    )
    this.addSql(
      'alter table if exists "webhook_delivery" add column if not exists "last_response_body" text null;'
    )
    this.addSql(
      'alter table if exists "webhook_delivery" add column if not exists "last_duration_ms" int null;'
    )
  }
}

