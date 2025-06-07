import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import KlaviyoModuleService from "../modules/klaviyo/service"
import { KLAVIYO_MODULE } from "../modules/klaviyo"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function orderFulfillmentHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const klaviyoService: KlaviyoModuleService = container.resolve(KLAVIYO_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderService = container.resolve(Modules.ORDER)

  const fulfillment_id = data.id;

  console.log(`Processing Klaviyo fulfillment event: ${name} for fulfillment ID: ${fulfillment_id}`)

  try {
    const fulfillment = await query.graph({
      entity: "order_fulfillment",
      fields: ["*"],
      filters: {
        fulfillment_id: fulfillment_id,
      },
    }) as unknown as { data: { order_id: string, fulfillment_id: string }[] };

    const order_id = fulfillment.data?.[0]?.order_id;
    
    if (!order_id) {
      console.error(`No order ID found for fulfillment ${fulfillment_id}`)
      return
    }

    const order = await orderService.retrieveOrder(order_id, {
      relations: [
        '*',
        'items.*',
        'shipping_address.*',
        'billing_address.*',
        'fulfillments.*',
        'payment_collections.*',
        'total',
        'subtotal',
        'summary.*',
      ],
    });

    switch (name) {
      case "shipment.created":
        await klaviyoService.trackOrderFulfilled(order)
        break
    }
  } catch (error) {
    console.error(`Failed to track Klaviyo fulfillment event for ${name}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: ["shipment.created"],
}