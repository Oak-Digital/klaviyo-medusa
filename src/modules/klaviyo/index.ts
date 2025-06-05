import { Module } from "@medusajs/framework/utils"
import KlaviyoModuleService from "./service"

export const KLAVIYO_MODULE = "klaviyo"

export default Module(KLAVIYO_MODULE, {
  service: KlaviyoModuleService,
})

export * from "./models"
export * from "./types"
export { default as KlaviyoModuleService } from "./service"