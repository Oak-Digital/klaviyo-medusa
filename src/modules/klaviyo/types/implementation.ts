import { KLAVIYO_MODULE } from '../';
import type KlaviyoService from '../service';

declare module '@medusajs/framework/types' {
  interface ModuleImplementations {
    [KLAVIYO_MODULE]: KlaviyoService;
  }
}
