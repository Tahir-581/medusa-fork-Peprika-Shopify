import { signWebhookPayload } from "../signing"

describe("signWebhookPayload", () => {
  it("includes timestamp in signature", () => {
    const secret = "test_secret"
    const payload = JSON.stringify({ hello: "world" })
    const s1 = signWebhookPayload({ secret, payload, timestamp: "1" })
    const s2 = signWebhookPayload({ secret, payload, timestamp: "2" })
    expect(s1).not.toEqual(s2)
  })
})

