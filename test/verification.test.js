import test from 'node:test'
import assert from 'node:assert/strict'

process.env.VERIFICATION_CODE_PEPPER = 'test-pepper-only-not-for-production'
const { MAX_ATTEMPTS, hashSecret, registrationConflict, resendState, verificationState } = await import('../server/verification.js')

function account(overrides = {}) {
  return { id: 'a', status: 'pending_email_verification', verification_code_hash: hashSecret('123456'), code_expires_at: new Date(Date.now() + 60_000), verification_attempts: 0, code_sent_at: new Date(Date.now() - 61_000), resend_count: 0, resend_window_started_at: new Date(), ...overrides }
}

test('expired codes are rejected', () => {
  assert.equal(verificationState(account({ code_expires_at: new Date(Date.now() - 1) }), '123456'), 'expired')
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
