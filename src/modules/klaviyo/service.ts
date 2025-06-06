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

  private async getServerPrefix(): Promise<string> {
    const config = await this.getConfig()
    return config?.server_prefix || "https://a.klaviyo.com"
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": `Klaviyo-API-Key ${this.getApiKey()}`,
      "Content-Type": "application/json",
      "revision": KLAVIYO_API_REVISION
    }
  }

  private async makeKlaviyoRequest(endpoint: string, method: string, body?: any): Promise<Response> {
    const serverPrefix = await this.getServerPrefix()
    
    return fetch(`${serverPrefix}${endpoint}`, {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined
    })
  }

  private async handleKlaviyoResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Klaviyo API error: ${response.status} ${error}`)
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true }
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

  private buildEventPayload(eventData: KlaviyoEventData): KlaviyoEvent {
    return {
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
  }

  private buildOrderCustomerProperties(orderData: OrderDTO) {
    return {
      email: orderData.email,
      first_name: orderData.shipping_address?.first_name,
      last_name: orderData.shipping_address?.last_name,
      phone_number: "+45" + orderData.shipping_address?.phone,
    }
  }

  private buildOrderProperties(orderData: OrderDTO) {
    return {
      $event_id: orderData.id,
      $value: orderData.summary?.total,
      order_id: orderData.display_id,
      external_id: orderData.customer_id,
      order_status: orderData.status,
      order_created_at: orderData.created_at,
      subtotal: orderData?.subtotal,
      total: orderData?.total,
      currency: orderData.currency_code,
      products: orderData.items?.map((item) => ({
        variant_sku: item.variant_sku,
        title: item.product_title,
        value: item.unit_price,
        quantity: item.quantity,
        thumbnail: item.thumbnail,
      })),
      country: orderData.shipping_address?.country_code,
      shipping: orderData.shipping_methods?.[0],
      payment: orderData.transactions,
    }
  }

  private buildProfilePayload(data: Partial<KlaviyoProfileAttributes>, subscriptionType?: 'email' | 'sms'): KlaviyoProfile {
    const profile: KlaviyoProfile = {
      type: "profile",
      attributes: { ...data }
    }

    if (subscriptionType && profile.attributes?.properties) {
      const timestamp = new Date().toISOString()
      if (subscriptionType === 'email') {
        profile.attributes.properties.email_marketing = {
          can_receive_email_marketing: true,
          consent: "subscribed",
          consent_timestamp: timestamp
        }
      } else if (subscriptionType === 'sms') {
        profile.attributes.properties.sms_marketing = {
          can_receive_sms_marketing: true,
          consent: "subscribed",
          consent_timestamp: timestamp
        }
      }
    }

    return profile
  }

  async trackEvent(eventData: KlaviyoEventData): Promise<any> {
    if (!await this.isEnabled()) {
      throw new Error("Klaviyo is not enabled or API key is missing")
    }

    const event = this.buildEventPayload(eventData)
    return this.sendToKlaviyo(event)
  }

  async trackOrderPlaced(orderData: OrderDTO): Promise<any> {
    const config = await this.getConfig()
    if (!config?.track_order_events) return

    return this.trackEvent({
      event: "Placed Order",
      customer_properties: this.buildOrderCustomerProperties(orderData),
      properties: this.buildOrderProperties(orderData)
    })
  }

  async trackOrderFulfilled(orderData: OrderDTO): Promise<any> {
    const config = await this.getConfig()
    if (!config?.track_order_events) return

    return this.trackEvent({
      event: "Fulfilled Order",
      customer_properties: this.buildOrderCustomerProperties(orderData),
      properties: this.buildOrderProperties(orderData)
    })
  }

  async subscribeToNewsletter(data: KlaviyoNewsletterSubscription): Promise<KlaviyoSubscriptionResponse> {
    if (!await this.isEnabled()) {
      throw new Error("Klaviyo is not enabled or API key is missing")
    }

    const config = await this.getConfig()
    const newsletterListId = config?.newsletter_list_id

    const profile = this.buildProfilePayload({
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      external_id: data.external_id,
      properties: data.properties
    }, 'email')

    const profileResponse = await this.sendProfileToKlaviyo(profile)

    if (profileResponse.success && profileResponse.profile_id && newsletterListId) {
      try {
        await this._addProfileToList(profileResponse.profile_id, newsletterListId, data.email)
      } catch (listError) {
        console.error(`Failed to add profile ${profileResponse.profile_id} to list ${newsletterListId} with email ${data.email}:`, listError)
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

    const profile = this.buildProfilePayload({
      phone_number: data.phone_number,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      external_id: data.external_id,
      properties: data.properties
    }, 'sms')

    return this.sendProfileToKlaviyo(profile)
  }

  async updateSubscription(email: string, updates: Partial<KlaviyoProfileAttributes>): Promise<KlaviyoSubscriptionResponse> {
    if (!await this.isEnabled()) {
      throw new Error("Klaviyo is not enabled or API key is missing")
    }

    const profile = this.buildProfilePayload({ email, ...updates })
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

  // Updated method to subscribe profile to a list with consent
  private buildSubscriptionPayload(profileId: string, listId: string, email: string) {
    return {
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          profiles: {
            data: [
              {
                type: "profile",
                id: profileId,
                attributes: {
                  email: email,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: "SUBSCRIBED",
                      }
                    }
                  }
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: "list",
              id: listId
            }
          }
        }
      }
    }
  }

  private async _addProfileToList(profileId: string, listId: string, email: string): Promise<void> {
    if (!this.getApiKey()) {
      console.warn("Klaviyo API key is missing when trying to subscribe profile to list.")
      return
    }

    const payload = this.buildSubscriptionPayload(profileId, listId, email)

    try {
      const response = await this.makeKlaviyoRequest('/api/profile-subscription-bulk-create-jobs', 'POST', payload)
      await this.handleKlaviyoResponse(response)
    } catch (error) {
      console.error(`Klaviyo API error subscribing profile ${profileId} (email: ${email}) to list ${listId}:`, error)
      throw new Error(`Klaviyo API error subscribing profile to list.`)
    }
  }

  private async sendProfileToKlaviyo(profile: KlaviyoProfile): Promise<KlaviyoSubscriptionResponse> {
    let response = await this.makeKlaviyoRequest('/api/profiles/', 'POST', { data: profile })

    if (response.status === 409) {
      const errorData = await response.json()
      const existingProfileId = errorData?.errors?.[0]?.meta?.duplicate_profile_id

      if (existingProfileId) {
        response = await this.makeKlaviyoRequest(
          `/api/profiles/${existingProfileId}/`,
          'PATCH',
          { data: { type: "profile", id: existingProfileId, attributes: profile.attributes } }
        )
      }
    }

    const responseData = await this.handleKlaviyoResponse(response)
    
    return {
      success: true,
      profile_id: responseData?.data?.id,
      raw: responseData,
      message: responseData?.message
    }
  }

  private async sendToKlaviyo(event: KlaviyoEvent): Promise<any> {
    const response = await this.makeKlaviyoRequest('/api/events/', 'POST', { data: event })
    console.log(response)
    return this.handleKlaviyoResponse(response)
  }
}

export default KlaviyoModuleService
