import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "./config"
import { KlaviyoConfig as KlaviyoConfigType } from "../../modules/klaviyo/types/index"


// This interface describes the expected shape of the 'config' object within KlaviyoSettingsResponse.
// It should align with the fields defined in the KlaviyoConfig model, including the new newsletter_list_id.
interface AdminViewKlaviyoConfig extends Omit<KlaviyoConfigType, "id" | "created_at" | "updated_at" | "deleted_at"> {
  // Ensure all relevant fields are here. Omit is used to exclude framework-managed fields.
  // The `KlaviyoConfigType` will infer `newsletter_list_id` from the model.
}

export interface KlaviyoSettingsResponse {
  id: string | null
  config: AdminViewKlaviyoConfig // Use the specific interface for the config object
  has_api_key: boolean
  is_enabled: boolean
}

export interface UpdateKlaviyoConfigRequest {
  id?: string | null // id is usually not sent in the body for updates of this kind
  public_key?: string | null
  server_prefix?: string
  is_enabled?: boolean
  track_order_events?: boolean
  track_customer_events?: boolean
  track_product_events?: boolean
  newsletter_list_id?: string | null
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
        // we dont stringify it because the sdk.client.fetch already does that
        body: data // Ensure the body is stringified
      })


      return response
    },
    onSuccess: (responseData) => { // Can use responseData to update cache if needed
      queryClient.invalidateQueries({ queryKey: KLAVIYO_QUERY_KEY })
      // Example: Update cache directly if desired
      // queryClient.setQueryData(KLAVIYO_QUERY_KEY, responseData)
    }
  })
}
