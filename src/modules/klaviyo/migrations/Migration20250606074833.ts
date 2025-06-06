import { Migration } from '@mikro-orm/migrations';

export class Migration20250606074833 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "klaviyo_config" add column if not exists "newsletter_list_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "klaviyo_config" drop column if exists "newsletter_list_id";`);
  }

}
