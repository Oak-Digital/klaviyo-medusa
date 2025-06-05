import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import KlaviyoModuleService from "../modules/klaviyo/service"
import { KLAVIYO_MODULE } from "../modules/klaviyo"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { OrderDTO } from "@medusajs/framework/types"

export default async function orderEventsHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const klaviyoService: KlaviyoModuleService = container.resolve(KLAVIYO_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const order_id = data.id;

  const { data: order } = await query.graph({
    entity: 'order',
    fields: [
      '*',
      'items.*',
      'shipping_address.*',
      'billing_address.*',
      'fulfillments.*',
      'fulfillments.created_at',
      'fulfillments.packed_at',
      'fulfillments.delivered_at',
      'fulfillments.updated_at',
      'fulfillments.provider_id',
      'payment_collections',
      'payment_collections.id',
      'payment_collections.amount',
      'payment_collections.status',
    ],
    filters: {
      id: order_id,
    },
  }) as unknown as { data: OrderDTO }

  try {
    switch (name) {
      case "order.placed":
        await klaviyoService.trackOrderPlaced(order)
        break
      case "order.completed":
      case "shipment.created":
      case "order.canceled":
        await klaviyoService.trackOrderFulfilled(order)
        break
    }
  } catch (error) {
    console.error(`Failed to track Klaviyo event for ${name}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.completed", "order.canceled", "shipment.created"],
}
