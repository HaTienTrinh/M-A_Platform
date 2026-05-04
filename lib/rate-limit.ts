// /lib/rate-limit.ts
const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const record = attempts.get(key)

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  record.count++
  return { allowed: true, retryAfterSeconds: 0 }
}
