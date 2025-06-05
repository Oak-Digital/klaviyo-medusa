import { InferTypeOf } from "@medusajs/framework/types"
import { KlaviyoConfig } from "../models"

export interface KlaviyoEventData {
  event: string
  customer_properties: Record<string, any>
  properties?: Record<string, any>
  time?: number
}

export interface KlaviyoCustomer {
  email?: string
  phone_number?: string
  external_id?: string
  first_name?: string
  last_name?: string
  [key: string]: any
}

export interface KlaviyoProfile {
  type: "profile"
  attributes: KlaviyoCustomer
}

export interface KlaviyoEvent {
  type: "event"
  attributes: {
    metric: {
      data: {
        type: "metric"
        attributes: {
          name: string
        }
      }
    }
    profile: {
      data: KlaviyoProfile
    }
    properties: Record<string, any>
    time?: string
    value?: number
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
