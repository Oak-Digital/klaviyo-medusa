import { model } from "@medusajs/framework/utils"

const KlaviyoConfig = model.define("klaviyo_config", {
  id: model.id().primaryKey(),
  public_key: model.text().nullable(),
  server_prefix: model.text().default("https://a.klaviyo.com"),
  is_enabled: model.boolean().default(false),
  track_order_events: model.boolean().default(true),
  track_customer_events: model.boolean().default(true),
  track_product_events: model.boolean().default(false),
})

export default KlaviyoConfig
