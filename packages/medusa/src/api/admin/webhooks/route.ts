import { randomBytes } from "crypto"

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import * as QueryConfig from "./query-config"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const webhookService: any = req.scope.resolve(Modules.WEBHOOK)
  const tenantId = (req.context as any)?.tenant_id || "default"

  const subscriptions = await webhookService.listSubscriptions(
    {
      ...(req.filterableFields || {}),
      tenant_id: tenantId,
    },
    {
      ...(req.listConfig || {}),
      select: req.queryConfig?.fields || QueryConfig.listTransformQueryConfig.defaults,
    }
  )

  res.json({
    webhook_subscriptions: subscriptions,
    count: subscriptions.length,
    offset: (req as any).queryConfig?.pagination?.skip ?? 0,
    limit: (req as any).queryConfig?.pagination?.take ?? subscriptions.length,
  })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const webhookService: any = req.scope.resolve(Modules.WEBHOOK)
  const tenantId = (req.context as any)?.tenant_id || "default"
  const body: any = req.validatedBody || {}

  const secret = body.secret || randomBytes(32).toString("hex")

  const created = await webhookService.createSubscriptions({
    tenant_id: tenantId,
    topic: body.topic,
    url: body.url,
    secret,
    status: body.status,
    headers: body.headers,
    max_in_flight: body.max_in_flight,
    min_interval_ms: body.min_interval_ms,
  })

  res.status(201).json({ webhook_subscription: created })
}

