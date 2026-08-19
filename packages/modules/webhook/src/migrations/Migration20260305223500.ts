import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260305223500 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "webhook_subscription" add column if not exists "max_in_flight" int not null default 5;'
    )
    this.addSql(
      'alter table if exists "webhook_subscription" add column if not exists "min_interval_ms" int not null default 0;'
    )
    this.addSql(
      'alter table if exists "webhook_subscription" add column if not exists "last_attempt_at" timestamptz null;'
    )
  }
}

