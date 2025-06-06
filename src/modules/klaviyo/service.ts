import { MedusaService } from "@medusajs/framework/utils"
import { 
  KlaviyoConfig as KlaviyoConfType, 
  KlaviyoEvent, 
  KlaviyoProfile, 
  KlaviyoEventData, 
  KlaviyoProfileAttributes, 
  KlaviyoNewsletterSubscription, 
  KlaviyoSMSSubscription, 
  KlaviyoSubscriptionResponse
} from "./types"
import { KlaviyoConfig } from "./models"
import { OrderDTO } from "@medusajs/framework/types"

// Define a specific type for the Klaviyo API revision header
const KLAVIYO_API_REVISION = "2024-07-15" as const;

class KlaviyoModuleService extends MedusaService({
  KlaviyoConfig,
}) {
  protected options_: { apiKey?: string }

  constructor(container: any, options?: { apiKey?: string }) {
    super(...arguments)
    this.options_ = options || { apiKey: "" }
  }

  async getConfig(): Promise<KlaviyoConfType | null> {
    const configs = await this.listKlaviyoConfigs()
    return configs.length > 0 ? configs[0] : null
  }

  async updateConfig(data: Partial<KlaviyoConfType>): Promise<KlaviyoConfType> {
    const config = await this.getConfig()

    if (config) {
      return await this.updateKlaviyoConfigs([{
        id: config.id,
        ...data
      }])
    } else {
      return await this.createKlaviyoConfigs(data)
    }
  }

  getApiKey(): string | undefined {
    return this.options_.apiKey || process.env.KLAVIYO_API_KEY
  }

  async isEnabled(): Promise<boolean | undefined> {
    const config = await this.getConfig()
    return config?.is_enabled && !!this.getApiKey()
  }

  async trackEvent(eventData: KlaviyoEventData): Promise<any> {
    if (!await this.isEnabled()) {
      throw new Error("Klaviyo is not enabled or API key is missing")
    }

    const event: KlaviyoEvent = {
      type: "event",
      attributes: {
        properties: eventData.properties || {},
        metric: {
          data: {
            type: "metric",
            attributes: {
              name: eventData.event,
              service: "medusa"
            }
          }
        },
        profile: {
          data: {
            type: "profile",
            attributes: eventData.customer_properties,
          }
        },
        time: eventData.time || new Date().toISOString(),
        value: eventData.value,
        value_currency: eventData.value_currency,
        unique_id: eventData.unique_id
      }
    }


    return this.sendToKlaviyo(event)
  }

  async trackOrderPlaced(orderData: OrderDTO): Promise<any> {
    const config = await this.getConfig()
    if (!config?.track_order_events) return

    return this.trackEvent({
      event: "Placed Order",
      customer_properties: {
        email: orderData.email,
        first_name: orderData.shipping_address?.first_name,
        last_name: orderData.shipping_address?.last_name,
        phone_number: "+45" + orderData.shipping_address?.phone,
      },
      properties: {
        $event_id: orderData.id,
        $value: orderData.summary?.total, // Convert from cents
        order_id: orderData.display_id,
        external_id: orderData.customer_id,
        order_status: orderData.status,
        order_created_at: orderData.created_at,
        subtotal: orderData?.subtotal, // Convert from cents
        total: orderData?.total, // Convert from cents
        currency: orderData.currency_code,
        products: orderData.items?.map((item) => ({
          variant_sku: item.variant_sku,
          title: item.product_title,
          value: item.unit_price,
          quantity: item.quantity,
          thumbnail: item.thumbnail,
        }),
        ),
        country: orderData.shipping_address?.country_code,
        shipping: orderData.shipping_methods?.[0],
        payment: orderData.transactions,

      }
    })
  }

  async trackOrderFulfilled(orderData: OrderDTO): Promise<any> {
    const config = await this.getConfig()
    if (!config?.track_order_events) return


    return this.trackEvent({
      event: "Fulfilled Order",
      customer_properties: {
        email: orderData.email,
        first_name: orderData.shipping_address?.first_name,
        last_name: orderData.shipping_address?.last_name,
        phone_number: "+45" + orderData.shipping_address?.phone,
      },
      properties: {
        $event_id: orderData.id,
        $value: orderData.summary?.total, // Convert from cents
        order_id: orderData.display_id,
        external_id: orderData.customer_id,
        order_status: orderData.status,
        order_created_at: orderData.created_at,
        subtotal: orderData?.subtotal, // Convert from cents
        total: orderData?.total, // Convert from cents
        currency: orderData.currency_code,
        products: orderData.items?.map((item) => ({
          variant_sku: item.variant_sku,
          title: item.product_title,
          value: item.unit_price,
          quantity: item.quantity,
          thumbnail: item.thumbnail,
        }),
        ),
        country: orderData.shipping_address?.country_code,
        shipping: orderData.shipping_methods?.[0],
        payment: orderData.transactions,
      }
    })
  }

  async subscribeToNewsletter(data: KlaviyoNewsletterSubscription): Promise<KlaviyoSubscriptionResponse> {
    if (!await this.isEnabled()) {
      throw new Error("Klaviyo is not enabled or API key is missing")
    }

    const config = await this.getConfig()
    const newsletterListId = config?.newsletter_list_id

    const profile: KlaviyoProfile = {
      type: "profile",
      attributes: {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        external_id: data.external_id,
        properties: {
          ...data.properties,
          email_marketing: {
            can_receive_email_marketing: true,
            consent: "subscribed",
            consent_timestamp: new Date().toISOString()
          }
        }
      }
    }

    const profileResponse = await this.sendProfileToKlaviyo(profile)

    if (profileResponse.success && profileResponse.profile_id && newsletterListId) {
      try {
        await this._addProfileToList(profileResponse.profile_id, newsletterListId)
      } catch (listError) {
        console.error(`Failed to add profile ${profileResponse.profile_id} to list ${newsletterListId}:`, listError)
        return { 
          ...profileResponse, 
          message: (profileResponse.message || "") + ` Profile created/updated, but failed to add to list ${newsletterListId}.` 
        }
      }
    }

    return profileResponse
  }

  async subscribeToSMS(data: KlaviyoSMSSubscription): Promise<KlaviyoSubscriptionResponse> {
    if (!await this.isEnabled()) {
      throw new Error("Klaviyo is not enabled or API key is missing")
    }

    const profile: KlaviyoProfile = {
      type: "profile",
      attributes: {
        phone_number: data.phone_number,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        external_id: data.external_id,
        properties: {
          ...data.properties,
          sms_marketing: {
            can_receive_sms_marketing: true,
            consent: "subscribed",
            consent_timestamp: new Date().toISOString()
          }
        }
      }
    }

    return this.sendProfileToKlaviyo(profile)
  }

  async updateSubscription(email: string, updates: Partial<KlaviyoProfileAttributes>): Promise<KlaviyoSubscriptionResponse> {
    if (!await this.isEnabled()) {
      throw new Error("Klaviyo is not enabled or API key is missing")
    }

    const profile: KlaviyoProfile = {
      type: "profile",
      attributes: {
        email,
        ...updates
      }
    }

    return this.sendProfileToKlaviyo(profile)
  }

  async unsubscribeFromNewsletter(email: string): Promise<KlaviyoSubscriptionResponse> {
    if (!await this.isEnabled()) {
      throw new Error("Klaviyo is not enabled or API key is missing")
    }

    const profile: KlaviyoProfile = {
      type: "profile",
      attributes: {
        email,
        meta: {
          patch_properties: {
            unset: "email_marketing.can_receive_email_marketing"
          }
        }
      }
    }

    return this.sendProfileToKlaviyo(profile)
  }

  async unsubscribeFromSMS(phoneNumber: string): Promise<KlaviyoSubscriptionResponse> {
    if (!await this.isEnabled()) {
      throw new Error("Klaviyo is not enabled or API key is missing")
    }

    const profile: KlaviyoProfile = {
      type: "profile",
      attributes: {
        phone_number: phoneNumber,
        meta: {
          patch_properties: {
            unset: "sms_marketing.can_receive_sms_marketing"
          }
        }
      }
    }

    return this.sendProfileToKlaviyo(profile)
  }

  private async _addProfileToList(profileId: string, listId: string): Promise<void> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      // This case should ideally be prevented by isEnabled checks earlier,
      // but as a safeguard:
      console.warn("Klaviyo API key is missing when trying to add profile to list.")
      return
    }

    const payload = {
      data: [
        {
          type: "profile",
          id: profileId,
        },
      ],
    }

    const config = await this.getConfig()
    const serverPrefix = config?.server_prefix || "https://a.klaviyo.com"
    
    const response = await fetch(`${serverPrefix}/api/lists/${listId}/relationships/profiles/`, {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        "revision": KLAVIYO_API_REVISION,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      // Log detailed error for server-side inspection
      console.error(`Klaviyo API error adding profile ${profileId} to list ${listId}: ${response.status} ${errorText}`, {
        responseStatus: response.status,
        responseText: errorText,
      })
      // Throw a more generic error or handle as per application's error strategy
      throw new Error(`Klaviyo API error (${response.status}) adding profile to list.`)
    }
    // Success (202 Accepted or 204 No Content are common for this type of request)
    // Consume body if any, to prevent resource leaks, though often there isn't one for 204.
    if (response.body) {
      await response.text();
    }
  }

  private async sendProfileToKlaviyo(profile: KlaviyoProfile): Promise<KlaviyoSubscriptionResponse> {
    const config = await this.getConfig()
    const serverPrefix = config?.server_prefix || "https://a.klaviyo.com"

    // First try to create the profile
    let response = await fetch(`${serverPrefix}/api/profiles/`, {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${this.getApiKey()}`,
        "Content-Type": "application/json",
        "revision": KLAVIYO_API_REVISION
      },
      body: JSON.stringify({ data: profile })
    })

    // If profile exists (409), try to update it instead
    if (response.status === 409) {
      const errorData = await response.json()
      const existingProfileId = errorData?.errors?.[0]?.meta?.duplicate_profile_id
      
      if (existingProfileId) {
        // Update existing profile using PATCH
        response = await fetch(`${serverPrefix}/api/profiles/${existingProfileId}/`, {
          method: "PATCH",
          headers: {
            "Authorization": `Klaviyo-API-Key ${this.getApiKey()}`,
            "Content-Type": "application/json",
            "revision": KLAVIYO_API_REVISION
          },
          body: JSON.stringify({ data: { type: "profile", id: existingProfileId, attributes: profile.attributes } })
        })
      }
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Klaviyo API error: ${response.status} ${error}`)
    }

    // Handle empty response (204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true, message: await response.text() }
    }

    const responseText = await response.text()
    if (!responseText) {
      return { success: true }
    }

    try {
      const data = JSON.parse(responseText)
      return { 
        success: true, 
        profile_id: data?.data?.id,
        raw: data 
      }
    } catch (e) {
      console.error('Failed to parse Klaviyo response:', responseText)
      return { success: true, raw: responseText }
    }
  }

  private async sendToKlaviyo(event: KlaviyoEvent): Promise<any> {
    const config = await this.getConfig()
    const serverPrefix = config?.server_prefix || "https://a.klaviyo.com"

    const response = await fetch(`${serverPrefix}/api/events/`, {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${this.getApiKey()}`,
        "Content-Type": "application/json",
        "revision": KLAVIYO_API_REVISION
      },
      body: JSON.stringify({ data: event })
    })

    console.log(response)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Klaviyo API error: ${response.status} ${error}`)
    }

    // Handle empty response (204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true, message: response?.text }
    }

    const responseText = await response.text()
    if (!responseText) {
      return { success: true }
    }

    try {
      return JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse Klaviyo response:', responseText)
      return { success: true, raw: responseText }
    }
  }
}

export default KlaviyoModuleService
