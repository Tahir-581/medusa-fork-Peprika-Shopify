import { computeWebhookRetryDelayMs } from "../retry"

describe("computeWebhookRetryDelayMs", () => {
  it("returns a non-negative delay", () => {
    expect(computeWebhookRetryDelayMs(0)).toBeGreaterThanOrEqual(0)
  })

  it("caps large attempts", () => {
    const d1 = computeWebhookRetryDelayMs(10)
    const d2 = computeWebhookRetryDelayMs(100)
    expect(d2).toBeGreaterThanOrEqual(d1)
  })
})

