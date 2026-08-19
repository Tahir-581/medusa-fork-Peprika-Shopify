import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class InitialSetupMigration20260305160000 extends Migration {
  async up(): Promise<void> {
    this.addSql('create table if not exists "webhook_subscription" ("id" text not null, "tenant_id" text not null, "topic" text not null, "url" text not null, "secret" text not null, "status" text not null default \"active\", "headers" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "webhook_subscription_pkey" primary key ("id"));')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_webhook_subscription_tenant_id" ON "webhook_subscription" (tenant_id) WHERE deleted_at IS NULL;')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_webhook_subscription_topic" ON "webhook_subscription" (topic) WHERE deleted_at IS NULL;')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_webhook_subscription_status" ON "webhook_subscription" (status) WHERE deleted_at IS NULL;')

    this.addSql('create table if not exists "webhook_delivery" ("id" text not null, "tenant_id" text not null, "subscription_id" text not null, "topic" text not null, "event_id" text null, "payload" jsonb not null, "attempt" integer not null default 0, "max_attempts" integer not null default 10, "next_attempt_at" timestamptz not null, "status" text not null default \"pending\", "response_code" integer null, "last_error" text null, "sent_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "webhook_delivery_pkey" primary key ("id"));')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_tenant_id" ON "webhook_delivery" (tenant_id) WHERE deleted_at IS NULL;')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_subscription_id" ON "webhook_delivery" (subscription_id) WHERE deleted_at IS NULL;')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_status_next_attempt" ON "webhook_delivery" (status, next_attempt_at) WHERE deleted_at IS NULL;')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_topic" ON "webhook_delivery" (topic) WHERE deleted_at IS NULL;')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_event_id" ON "webhook_delivery" (event_id) WHERE deleted_at IS NULL;')
    this.addSql('alter table if exists "webhook_delivery" add constraint "webhook_delivery_subscription_id_foreign" foreign key ("subscription_id") references "webhook_subscription" ("id") on update cascade on delete cascade;')
  }
}

