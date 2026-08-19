import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const webhookService: any = req.scope.resolve(Modules.WEBHOOK)
  const tenantId = (req.context as any)?.tenant_id || "default"

  const updated = await webhookService.resetDeliveryForRedelivery({
    tenant_id: tenantId,
    subscription_id: req.params.id,
    delivery_id: req.params.delivery_id,
    next_attempt_at: new Date(),
  })

  if (!updated) {
    res.status(404).json({ message: "Not found" })
    return
  }

  res.json({ webhook_delivery: updated })
}

