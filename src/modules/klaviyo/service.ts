import { MedusaService } from "@medusajs/framework/utils"
import { KlaviyoConfig as KlaviyoConfType } from "./types"
import { KlaviyoConfig } from "./models"

class KlaviyoModuleService extends MedusaService({
  KlaviyoConfig,
}) {
  private apiKey: string | undefined

  constructor(container: any, options?: { api_key?: string }) {
    super(...arguments)
    this.apiKey = options?.api_key || process.env.KLAVIYO_API_KEY
  }

  async getConfig(): Promise<KlaviyoConfType | null> {
    const configs = await this.listKlaviyoConfigs()
    return configs.length > 0 ? configs[0] : null
  }

  async updateConfig(data: Partial<KlaviyoConfType>): Promise<KlaviyoConfType> {
    const config = await this.getConfig()

    if (config) {
      return await this.updateKlaviyoConfigs(config.id, data)
    } else {
      return await this.createKlaviyoConfigs(data)
    }
  }

  getApiKey(): string | undefined {
    return this.apiKey
  }

  async isEnabled(): Promise<boolean | undefined> {
    const config = await this.getConfig()
    return config?.is_enabled && !!this.apiKey
  }
}

export default KlaviyoModuleService
