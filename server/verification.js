import crypto from 'node:crypto'

export const CODE_TTL_MS = 15 * 60 * 1000
export const RESEND_COOLDOWN_MS = 60 * 1000
export const MAX_ATTEMPTS = 5
export const MAX_RESENDS_PER_HOUR = 3

export const normalizeEmail = (value) => value.trim().toLowerCase()
export const normalizeUsername = (value) => value.trim().toLowerCase()
export const newCode = () => String(crypto.randomInt(100000, 1000000))
export const newSessionToken = () => crypto.randomBytes(32).toString('base64url')
export const hashSecret = (value) => crypto.createHmac('sha256', process.env.VERIFICATION_CODE_PEPPER).update(value).digest('hex')
export const safeEqual = (left, right) => crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right))

export function verificationState(account, code, now = new Date()) {
  if (!account || account.status !== 'pending_email_verification') return 'invalid'
  if (new Date(account.code_expires_at) <= now) return 'expired'
  if (account.verification_attempts >= MAX_ATTEMPTS) return 'locked'
  if (!safeEqual(account.verification_code_hash, hashSecret(code))) return 'wrong'
  return 'valid'
}

export function resendState(account, now = new Date()) {
  if (!account || account.status !== 'pending_email_verification') return { state: 'invalid', cooldownSeconds: 0 }
  const elapsed = now - new Date(account.code_sent_at)
  if (elapsed < RESEND_COOLDOWN_MS) return { state: 'cooldown', cooldownSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) }
  if (account.resend_window_started_at && now - new Date(account.resend_window_started_at) < 60 * 60 * 1000 && account.resend_count >= MAX_RESENDS_PER_HOUR) return { state: 'limit', cooldownSeconds: 0 }
  return { state: 'valid', cooldownSeconds: 0 }
}

export function registrationConflict(rows, email, username) {
  const matchingEmail = rows.find((row) => row.normalized_email === email)
  const matchingUsername = rows.find((row) => row.normalized_username === username)
  return rows.some((row) => row.status === 'verified_waiting_launch') || (matchingEmail && matchingUsername && matchingEmail.id !== matchingUsername.id)
}
