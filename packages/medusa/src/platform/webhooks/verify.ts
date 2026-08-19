import { timingSafeEqual } from "crypto"
import { signWebhookPayload } from "./signing"

export function verifyWebhookSignature({
  secret,
  payload,
  timestamp,
  signature,
}: {
  secret: string
  payload: string
  timestamp: string
  signature: string
}) {
  const expected = signWebhookPayload({ secret, payload, timestamp })
  const a = Buffer.from(expected, "hex")
  const b = Buffer.from(signature || "", "hex")
  if (a.length !== b.length) {
    return false
  }
  return timingSafeEqual(a, b)
}

export function isWebhookTimestampValid({
  timestamp,
  toleranceSeconds = 300,
  nowMs = Date.now(),
}: {
  timestamp: string
  toleranceSeconds?: number
  nowMs?: number
}) {
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || ts <= 0) {
    return false
  }

  const ageSeconds = Math.abs(nowMs / 1000 - ts)
  return ageSeconds <= toleranceSeconds
}

