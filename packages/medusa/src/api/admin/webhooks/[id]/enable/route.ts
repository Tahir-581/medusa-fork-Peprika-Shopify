import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const webhookService: any = req.scope.resolve(Modules.WEBHOOK)
  const tenantId = (req.context as any)?.tenant_id || "default"

  const updated = await webhookService.updateSubscriptionHealth({
    tenant_id: tenantId,
    subscription_id: req.params.id,
    status: "active",
    failure_count: 0,
    last_failure_at: null,
    disabled_at: null,
    disabled_reason: null,
  })

  if (!updated) {
    res.status(404).json({ message: "Not found" })
    return
  }

  res.json({ webhook_subscription: updated })
}

