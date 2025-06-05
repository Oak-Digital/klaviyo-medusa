import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "./config"
import { KlaviyoConfig } from "../../modules/klaviyo/types/index"



export interface KlaviyoSettingsResponse {
  id: string | null
  config: KlaviyoConfig
  has_api_key: boolean
  is_enabled: boolean
}

export interface UpdateKlaviyoConfigRequest {
  id?: string | null
  public_key?: string | null
  server_prefix?: string
  is_enabled?: boolean
  track_order_events?: boolean
  track_customer_events?: boolean
  track_product_events?: boolean
}

const KLAVIYO_QUERY_KEY = ["klaviyo", "settings"]

export const useKlaviyoSettings = () => {
  return useQuery({
    queryKey: KLAVIYO_QUERY_KEY,
    queryFn: async (): Promise<KlaviyoSettingsResponse> => {
      const response = await sdk.client.fetch<KlaviyoSettingsResponse>("/admin/klaviyo", {
        method: "GET"
      })
      return response
    }
  })
}

export const useUpdateKlaviyoSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateKlaviyoConfigRequest): Promise<KlaviyoSettingsResponse> => {
      const response = await sdk.client.fetch<KlaviyoSettingsResponse>("/admin/klaviyo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: data
      })


      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KLAVIYO_QUERY_KEY })
    }
  })
}
