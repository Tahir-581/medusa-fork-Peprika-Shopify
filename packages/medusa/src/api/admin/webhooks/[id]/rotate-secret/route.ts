import { randomBytes } from "crypto"

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const webhookService: any = req.scope.resolve(Modules.WEBHOOK)
  const tenantId = (req.context as any)?.tenant_id || "default"
  const body: any = req.validatedBody || {}

  const secret = body.secret || randomBytes(32).toString("hex")

  const updated = await webhookService.rotateSubscriptionSecret({
    tenant_id: tenantId,
    subscription_id: req.params.id,
    secret,
  })

  if (!updated) {
    res.status(404).json({ message: "Not found" })
    return
  }

  res.json({ webhook_subscription: updated })
}

