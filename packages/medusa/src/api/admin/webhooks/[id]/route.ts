import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import * as QueryConfig from "../query-config"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const webhookService: any = req.scope.resolve(Modules.WEBHOOK)
  const tenantId = (req.context as any)?.tenant_id || "default"

  const matches = await webhookService.listSubscriptions(
    {
      id: req.params.id,
      tenant_id: tenantId,
    },
    {
      select: req.queryConfig?.fields || QueryConfig.retrieveTransformQueryConfig.defaults,
      take: 1,
    }
  )

  const subscription = matches?.[0]

  if (!subscription) {
    res.status(404).json({ message: "Not found" })
    return
  }

  res.json({ webhook_subscription: subscription })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const webhookService: any = req.scope.resolve(Modules.WEBHOOK)
  const tenantId = (req.context as any)?.tenant_id || "default"
  const body: any = req.validatedBody || {}

  const existing = await webhookService.listSubscriptions(
    {
      id: req.params.id,
      tenant_id: tenantId,
    },
    { select: ["id"], take: 1 }
  )

  if (!existing?.[0]) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const updated = await webhookService.updateSubscriptions({
    id: req.params.id,
    ...(body.topic !== undefined ? { topic: body.topic } : {}),
    ...(body.url !== undefined ? { url: body.url } : {}),
    ...(body.secret !== undefined ? { secret: body.secret } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.headers !== undefined ? { headers: body.headers } : {}),
    ...(body.max_in_flight !== undefined ? { max_in_flight: body.max_in_flight } : {}),
    ...(body.min_interval_ms !== undefined ? { min_interval_ms: body.min_interval_ms } : {}),
  })

  res.json({ webhook_subscription: updated })
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const webhookService: any = req.scope.resolve(Modules.WEBHOOK)
  const tenantId = (req.context as any)?.tenant_id || "default"

  const existing = await webhookService.listSubscriptions(
    {
      id: req.params.id,
      tenant_id: tenantId,
    },
    { select: ["id"], take: 1 }
  )

  if (!existing?.[0]) {
    res.status(404).json({ message: "Not found" })
    return
  }

  await webhookService.deleteSubscriptions(req.params.id)
  res.status(200).json({ id: req.params.id, object: "webhook_subscription", deleted: true })
}

