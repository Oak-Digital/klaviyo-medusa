import { Migration } from '@mikro-orm/migrations';

export class Migration20250605084745 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "klaviyo_config" ("id" text not null, "public_key" text null, "server_prefix" text not null default 'https://a.klaviyo.com', "is_enabled" boolean not null default false, "track_order_events" boolean not null default true, "track_customer_events" boolean not null default true, "track_product_events" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "klaviyo_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_klaviyo_config_deleted_at" ON "klaviyo_config" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "klaviyo_config" cascade;`);
  }

}
