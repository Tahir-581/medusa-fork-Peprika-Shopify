import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import * as QueryConfig from "../../query-config"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
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

  const deliveries = await webhookService.listDeliveries(
    {
      ...(req.filterableFields || {}),
      tenant_id: tenantId,
      subscription_id: req.params.id,
    },
    {
      ...(req.listConfig || {}),
      select:
        req.queryConfig?.fields || QueryConfig.listDeliveriesTransformQueryConfig.defaults,
    }
  )

  res.json({
    webhook_deliveries: deliveries,
    count: deliveries.length,
    offset: (req as any).queryConfig?.pagination?.skip ?? 0,
    limit: (req as any).queryConfig?.pagination?.take ?? deliveries.length,
  })
}

