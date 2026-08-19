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

  const payload = body.payload || {
    test: true,
    nonce: randomBytes(8).toString("hex"),
  }

  const delivery = await webhookService.createTestDelivery({
    tenant_id: tenantId,
    subscription_id: req.params.id,
    topic: body.topic || "webhook.test",
    payload,
  })

  if (!delivery) {
    res.status(404).json({ message: "Not found" })
    return
  }

  res.status(201).json({ webhook_delivery: delivery })
}

