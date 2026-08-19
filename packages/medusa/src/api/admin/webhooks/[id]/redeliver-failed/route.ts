import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const webhookService: any = req.scope.resolve(Modules.WEBHOOK)
  const tenantId = (req.context as any)?.tenant_id || "default"
  const body: any = req.validatedBody || {}

  const result = await webhookService.resetFailedDeliveriesForRedelivery({
    tenant_id: tenantId,
    subscription_id: req.params.id,
    limit: body.limit,
  })

  if (!result) {
    res.status(404).json({ message: "Not found" })
    return
  }

  res.json({ result })
}

