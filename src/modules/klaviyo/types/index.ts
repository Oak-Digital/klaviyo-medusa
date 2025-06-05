import { InferTypeOf } from "@medusajs/framework/types"
import { KlaviyoConfig } from "../models"

export interface KlaviyoEventData {
  event: string
  customer_properties: KlaviyoProfileAttributes
  properties?: Record<string, any>
  time?: string
  value?: number
  value_currency?: string
  unique_id?: string
}

export interface KlaviyoLocation {
  address1?: string
  address2?: string
  city?: string
  country?: string
  latitude?: string
  longitude?: string
  region?: string
  zip?: string
  timezone?: string
  ip?: string
}

export interface KlaviyoProfileAttributes {
  email?: string
  phone_number?: string
  external_id?: string
  anonymous_id?: string
  _kx?: string
  first_name?: string
  last_name?: string
  organization?: string
  locale?: string
  title?: string
  image?: string
  location?: KlaviyoLocation
  properties?: Record<string, any>
  meta?: {
    patch_properties?: {
      append?: Record<string, any>
      unappend?: Record<string, any>
      unset?: string
    }
  }
}

export interface KlaviyoProfile {
  type: "profile"
  attributes: KlaviyoProfileAttributes
  id?: string
}

export interface KlaviyoMetric {
  type: "metric"
  attributes: {
    name: string
    service?: string
  }
}

export interface KlaviyoEvent {
  type: "event"
  attributes: {
    properties: Record<string, any>
    metric: {
      data: KlaviyoMetric
    }
    profile: {
      data: KlaviyoProfile
    }
    time?: string
    value?: number
    value_currency?: string
    unique_id?: string
  }
}

export interface KlaviyoApiResponse {
  data?: any
  errors?: Array<{
    id: string
    status: string
    code: string
    title: string
    detail: string
  }>
}

export type KlaviyoConfig = InferTypeOf<typeof KlaviyoConfig>
