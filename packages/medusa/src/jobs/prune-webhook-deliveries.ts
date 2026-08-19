import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

export default async function handler(container: MedusaContainer) {
  const webhookService: any = container.resolve(Modules.WEBHOOK)

  const daysRaw = Number(process.env.WEBHOOK_DELIVERY_RETENTION_DAYS ?? 30)
  const retentionDays = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 30

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

  while (true) {
    const result = await webhookService.pruneDeliveries({
      before: cutoff,
      take: 500,
      statuses: ["success", "failed", "skipped"],
    })

    if (!result?.deleted) {
      break
    }
  }
}

export const config = {
  name: "prune-webhook-deliveries",
  schedule: "0 0 4 * * *",
}

