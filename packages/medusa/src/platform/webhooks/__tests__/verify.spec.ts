import { signWebhookPayload } from "../signing"
import { isWebhookTimestampValid, verifyWebhookSignature } from "../verify"

describe("verifyWebhookSignature", () => {
  it("returns true for valid signature", () => {
    const secret = "test_secret"
    const payload = JSON.stringify({ ok: true })
    const timestamp = "123"
    const signature = signWebhookPayload({ secret, payload, timestamp })

    expect(
      verifyWebhookSignature({ secret, payload, timestamp, signature })
    ).toEqual(true)
  })

  it("returns false for invalid signature", () => {
    const secret = "test_secret"
    const payload = JSON.stringify({ ok: true })
    const timestamp = "123"

    expect(
      verifyWebhookSignature({
        secret,
        payload,
        timestamp,
        signature: "deadbeef",
      })
    ).toEqual(false)
  })
})

describe("isWebhookTimestampValid", () => {
  it("returns true within tolerance", () => {
    expect(
      isWebhookTimestampValid({
        timestamp: "1000",
        toleranceSeconds: 10,
        nowMs: 1005 * 1000,
      })
    ).toEqual(true)
  })

  it("returns false outside tolerance", () => {
    expect(
      isWebhookTimestampValid({
        timestamp: "1000",
        toleranceSeconds: 10,
        nowMs: 2000 * 1000,
      })
    ).toEqual(false)
  })
})

