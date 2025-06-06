import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { KLAVIYO_MODULE } from "../../../../modules/klaviyo";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const klaviyoService = req.scope.resolve(KLAVIYO_MODULE);


  const result = await klaviyoService.subscribeToNewsletter({
    email: "tobiasheide.web@gmail.com",
    first_name: "Tobias",
    last_name: "Heide",
  })


  return res.status(200).json({
    result: result,
  });
}
