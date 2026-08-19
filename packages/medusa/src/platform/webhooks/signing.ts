import { createHmac } from "crypto"

export function signWebhookPayload({
  secret,
  payload,
  timestamp,
}: {
  secret: string
  payload: string
  timestamp: string
}) {
  const signed = `${timestamp}.${payload}`
  return createHmac("sha256", secret).update(signed, "utf8").digest("hex")
}

