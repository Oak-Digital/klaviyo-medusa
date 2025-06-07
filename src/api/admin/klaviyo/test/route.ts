import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { KLAVIYO_MODULE } from "../../../../modules/klaviyo";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { OrderDTO } from "@medusajs/framework/types";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // const klaviyoService = req.scope.resolve(KLAVIYO_MODULE);
  // const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  // const orderService = req.scope.resolve(Modules.ORDER)
  // const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT)
  //
  // const fulfillment_id = req.query.id as string;
  //
  //
  // const fulfillment = await query.graph({
  //   entity: "order_fulfillment",
  //   fields: ["*"],
  //   filters: {
  //     fulfillment_id: fulfillment_id,
  //   },
  // }) as unknown as { data: { order_id: string, fulfillment_id: string }[] };
  //
  // console.log(`Fulfillment retrieved}`, fulfillment);
  //
  // if (!fulfillment?.data?.[0]?.order_id) {
  //   console.error(`No order ID found for fulfillment ${fulfillment_id}`)
  //   return
  // }
  //
  // const order = await orderService.retrieveOrder(fulfillment?.data?.[0].order_id, {
  //   relations: [
  //     '*',
  //     'items.*',
  //     'shipping_address.*',
  //     'billing_address.*',
  //     'fulfillments.*',
  //     'payment_collections.*',
  //     'total',
  //     'subtotal',
  //     'summary.*',
  //   ],
  // });
  //
  //


  return res.status(200).json({
    // result: result,
    // order: order,
  });
}
