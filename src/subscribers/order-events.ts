import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import KlaviyoModuleService from "../modules/klaviyo/service"
import { KLAVIYO_MODULE } from "../modules/klaviyo"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { OrderDTO } from "@medusajs/framework/types"

export default async function orderEventsHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const klaviyoService: KlaviyoModuleService = container.resolve(KLAVIYO_MODULE)
  const orderService = container.resolve(Modules.ORDER)

  const order_id = data.id;

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

  console.log(`Processing Klaviyo event: ${name} for order ID: ${order_id}`)

  try {
    switch (name) {
      case "order.placed":
        await klaviyoService.trackOrderPlaced(order)
        break
      case "order.completed":
      case "order.canceled":
        await klaviyoService.trackOrderFulfilled(order)
        break
    }
  } catch (error) {
    console.error(`Failed to track Klaviyo event for ${name}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.completed", "order.canceled"],
}
