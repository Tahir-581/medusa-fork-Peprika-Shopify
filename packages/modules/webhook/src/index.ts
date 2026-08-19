import { WebhookModuleService } from "@services"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.WEBHOOK, {
  service: WebhookModuleService,
})

