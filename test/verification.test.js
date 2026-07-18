import test from 'node:test'
import assert from 'node:assert/strict'

process.env.VERIFICATION_CODE_PEPPER = 'test-pepper-only-not-for-production'
const { MAX_ATTEMPTS, hashSecret, registrationConflict, resendState, verificationPepperConfiguration, verificationState } = await import('../server/verification.js')
const { buildVerificationEmail } = await import('../server/email.js')

function account(overrides = {}) {
  return { id: 'a', status: 'pending_email_verification', verification_code_hash: hashSecret('123456'), code_expires_at: new Date(Date.now() + 60_000), verification_attempts: 0, code_sent_at: new Date(Date.now() - 61_000), resend_count: 0, resend_window_started_at: new Date(), ...overrides }
}

test('expired codes are rejected', () => {
  assert.equal(verificationState(account({ code_expires_at: new Date(Date.now() - 1) }), '123456'), 'expired')
})

test('verification pepper must be configured before secret hashing', () => {
  const previous = process.env.VERIFICATION_CODE_PEPPER
  delete process.env.VERIFICATION_CODE_PEPPER
  assert.equal(verificationPepperConfiguration().configured, false)
  assert.throws(() => hashSecret('123456'), { code: 'VERIFICATION_PEPPER_NOT_CONFIGURED' })
  process.env.VERIFICATION_CODE_PEPPER = previous
})

test('wrong-code attempt limit locks verification', () => {
  assert.equal(verificationState(account({ verification_attempts: MAX_ATTEMPTS - 1 }), '000000'), 'wrong')
  assert.equal(verificationState(account({ verification_attempts: MAX_ATTEMPTS }), '123456'), 'locked')
})

test('a consumed verification code cannot be used again', () => {
  assert.equal(verificationState(account({ status: 'verified_waiting_launch' }), '123456'), 'invalid')
})

test('resend has a 60-second cooldown', () => {
  const state = resendState(account({ code_sent_at: new Date(Date.now() - 1_000) }))
  assert.equal(state.state, 'cooldown')
  assert.ok(state.cooldownSeconds >= 59)
})

test('duplicate verified emails cannot be replaced by registration', () => {
  const rows = [{ id: 'verified', normalized_email: 'queen@example.com', normalized_username: 'queen', status: 'verified_waiting_launch' }]
  assert.equal(registrationConflict(rows, 'queen@example.com', 'queen'), true)
})

test('pending registrations do not block a replacement registration', () => {
  const rows = [{ id: 'pending', normalized_email: 'queen@example.com', normalized_username: 'queen', status: 'pending_email_verification' }]
  assert.equal(registrationConflict(rows, 'queen@example.com', 'queen'), false)
})

test('English verification email includes branded code, expiry, and app link', () => {
  const email = buildVerificationEmail({ code: '123456', language: 'en', expiresAt: new Date('2026-07-18T12:00:00Z'), origin: 'https://newkingdom.example' })
  assert.match(email.subject, /verification code/)
  assert.match(email.html, /123456/)
  assert.match(email.html, /15 minutes/)
  assert.match(email.html, /https:\/\/newkingdom\.example\/verify-email/)
})

test('Ukrainian verification email is localized', () => {
  const email = buildVerificationEmail({ code: '123456', language: 'uk', expiresAt: new Date('2026-07-18T12:00:00Z'), origin: 'https://newkingdom.example' })
  assert.match(email.subject, /код підтвердження/)
  assert.match(email.text, /15 хвилин/)
})
