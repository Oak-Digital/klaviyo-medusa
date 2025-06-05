import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { KLAVIYO_MODULE } from "../../../../modules/klaviyo";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { OrderDTO } from "@medusajs/framework/types";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const klaviyoService = req.scope.resolve(KLAVIYO_MODULE);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const orderService = req.scope.resolve(Modules.ORDER);

  const order_id = req.query.id as string;

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

  // const { data: order } = await query.graph({
  //   entity: 'order',
  //   fields: [
  //     '*',
  //     'items.*',
  //     'shipping_address.*',
  //     'billing_address.*',
  //     'fulfillments.*',
  //     'fulfillments.created_at',
  //     'fulfillments.packed_at',
  //     'fulfillments.delivered_at',
  //     'fulfillments.updated_at',
  //     'fulfillments.provider_id',
  //     'payment_collections',
  //     'payment_collections.id',
  //     'payment_collections.amount',
  //     'payment_collections.status',
  //
  //   ],
  //   filters: {
  //     id: order_id,
  //   },
  // }) as unknown as { data: OrderDTO }


  // const result = await klaviyoService.trackOrderPlaced(order);


  return res.status(200).json({
    // result: result,
    order: order,
  });
}
