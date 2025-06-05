import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { KLAVIYO_MODULE } from "../../../modules/klaviyo"

const updateConfigSchema = z.object({
  public_key: z.string().nullable().optional(),
  server_prefix: z.string().url().optional(),
  is_enabled: z.boolean().optional(),
  track_order_events: z.boolean().optional(),
  track_customer_events: z.boolean().optional(),
  track_product_events: z.boolean().optional()
})

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const klaviyoService = req.scope.resolve(KLAVIYO_MODULE)

  try {
    const config = await klaviyoService.getConfig()
    const isEnabled = await klaviyoService.isEnabled()

    res.json({
      id: config?.id || null,
      config: config || {
        public_key: null,
        server_prefix: "https://a.klaviyo.com",
        is_enabled: false,
        track_order_events: true,
        track_customer_events: true,
        track_product_events: false
      },
      has_api_key: !!klaviyoService.getApiKey(),
      is_enabled: isEnabled
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Klaviyo configuration",
      details: error.message
    })
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const klaviyoService = req.scope.resolve(KLAVIYO_MODULE)

  console.log(req.body)

  try {
    const validatedData = updateConfigSchema.parse(req.body)

    const updatedConfig = await klaviyoService.updateConfig(validatedData)
    const isEnabledStatus = await klaviyoService.isEnabled()

    res.json({
      config: updatedConfig,
      has_api_key: !!klaviyoService.getApiKey(),
      is_enabled: isEnabledStatus
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request data",
        details: error.errors
      })
    }

    res.status(500).json({
      error: "Failed to update Klaviyo configuration",
      details: error.message
    })
  }
}
