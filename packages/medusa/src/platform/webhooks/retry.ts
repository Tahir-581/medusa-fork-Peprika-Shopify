export function computeWebhookRetryDelayMs(attempt: number) {
  const base = 30_000
  const cappedAttempt = Math.max(0, Math.min(attempt, 10))
  const delay = base * Math.pow(2, cappedAttempt)
  const max = 60 * 60_000
  const jitter = Math.floor(Math.random() * 0.2 * delay)
  return Math.min(delay + jitter, max)
}

