import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import argon2 from 'argon2'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transaction } from './db.js'
import { runMigrations } from './migrations.js'
import { CODE_TTL_MS, MAX_ATTEMPTS, hashSecret, newCode, newSessionToken, normalizeEmail, normalizeUsername, registrationConflict, resendState, verificationState } from './verification.js'
import { emailConfiguration, sendVerificationEmail } from './email.js'

const app = express()
const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || process.env.API_PORT || 3001)
const cookieName = 'nk_verify'
const allowedOrigin = process.env.APP_ORIGIN
const cookieOptions = { httpOnly: true, sameSite: isProduction ? 'none' : 'lax', secure: isProduction, path: '/api/registration', maxAge: CODE_TTL_MS }
const genericError = { error: 'Unable to complete this request. Please try again.' }
const startupEmailConfiguration = emailConfiguration()

if (!startupEmailConfiguration.enabled) console.warn(`Email delivery disabled. Missing or invalid: ${startupEmailConfiguration.missing.join(', ')}`)
else console.info('Email delivery enabled.', { provider: 'resend', sender: startupEmailConfiguration.from, origin: startupEmailConfiguration.origin })

app.set('trust proxy', 1)
app.use((request, response, next) => {
  const origin = request.get('Origin')
  if (origin && origin === allowedOrigin) {
    response.set('Access-Control-Allow-Origin', origin)
    response.set('Access-Control-Allow-Credentials', 'true')
    response.set('Vary', 'Origin')
  }
  if (request.method === 'OPTIONS' && request.path.startsWith('/api/')) {
    if (!origin || origin !== allowedOrigin) return response.sendStatus(403)
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.set('Access-Control-Allow-Headers', 'Content-Type')
    return response.sendStatus(204)
  }
  return next()
})
app.use(helmet())
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

const startLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false, message: genericError })
const verifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: genericError })

function validRegistration(body) {
  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const language = body.preferredLanguage === 'en' ? 'en' : 'uk'
  if (!/^[\p{L}\p{N}_-]{3,32}$/u.test(username) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || body.password !== body.confirmPassword || body.termsAccepted !== true) return null
  return { username, normalizedUsername: normalizeUsername(username), email, password, language }
}

function setVerificationCookie(response, token) { response.cookie(cookieName, token, cookieOptions) }
function clearVerificationCookie(response) { response.clearCookie(cookieName, cookieOptions) }

app.post('/api/registration/start', startLimiter, async (request, response) => {
  const registration = validRegistration(request.body || {})
  if (!registration) return response.status(400).json(genericError)
  try {
    const result = await transaction(async (client) => {
      const existing = await client.query('SELECT * FROM accounts WHERE normalized_email = $1 OR normalized_username = $2 FOR UPDATE', [registration.email, registration.normalizedUsername])
      const emailAccount = existing.rows.find((row) => row.normalized_email === registration.email)
      const usernameAccount = existing.rows.find((row) => row.normalized_username === registration.normalizedUsername)
      if (registrationConflict(existing.rows, registration.email, registration.normalizedUsername) || (usernameAccount && usernameAccount.normalized_email !== registration.email)) return { state: 'blocked' }
      const code = newCode(); const token = newSessionToken(); const now = new Date(); const expires = new Date(now.getTime() + CODE_TTL_MS)
      const passwordHash = await argon2.hash(registration.password, { type: argon2.argon2id })
      const account = emailAccount || usernameAccount
      if (account) {
        await client.query(`UPDATE accounts SET username=$1, normalized_username=$2, email=$3, normalized_email=$4, password_hash=$5, preferred_language=$6, terms_version=$7, registration_ip=$8, verification_code_hash=$9, verification_session_hash=$10, code_expires_at=$11, code_sent_at=NULL, verification_attempts=0, resend_count=0, resend_window_started_at=$12 WHERE id=$13`, [registration.username, registration.normalizedUsername, registration.email, registration.email, passwordHash, registration.language, '2026-07', request.ip, hashSecret(code), hashSecret(token), expires, now, account.id])
      } else {
        await client.query(`INSERT INTO accounts (username, normalized_username, email, normalized_email, password_hash, preferred_language, status, terms_version, registration_ip, verification_code_hash, verification_session_hash, code_expires_at, resend_window_started_at) VALUES ($1,$2,$3,$4,$5,$6,'pending_email_verification',$7,$8,$9,$10,$11,$12)`, [registration.username, registration.normalizedUsername, registration.email, registration.email, passwordHash, registration.language, '2026-07', request.ip, hashSecret(code), hashSecret(token), expires, now])
      }
      return { state: 'ready', email: registration.email, language: registration.language, code, token, expiresAt: expires }
    })
    if (result.state !== 'ready') return response.status(409).json(genericError)
    await sendVerificationEmail(result)
    await transaction((client) => client.query('UPDATE accounts SET code_sent_at = now() WHERE verification_session_hash = $1', [hashSecret(result.token)]))
    setVerificationCookie(response, result.token)
    return response.status(201).json({ ok: true, cooldownSeconds: 60 })
  } catch (error) {
    if (error.code === 'EMAIL_NOT_CONFIGURED') { console.error('Registration email is not configured.'); return response.status(503).json({ error: 'Email delivery is not configured on this server.' }) }
    console.error('Registration start failed:', error.code || error.name)
    return response.status(500).json(genericError)
  }
})

app.post('/api/registration/verify', verifyLimiter, async (request, response) => {
  const code = typeof request.body?.code === 'string' ? request.body.code.replace(/\D/g, '') : ''
  const token = request.cookies[cookieName]
  if (!token || !/^\d{6}$/.test(code)) return response.status(400).json(genericError)
  try {
    const outcome = await transaction(async (client) => {
      const { rows } = await client.query('SELECT * FROM accounts WHERE verification_session_hash = $1 FOR UPDATE', [hashSecret(token)])
      const account = rows[0]; const state = verificationState(account, code)
      if (state === 'wrong') await client.query('UPDATE accounts SET verification_attempts = verification_attempts + 1 WHERE id = $1', [account.id])
      if (state !== 'valid') return state
      await client.query(`UPDATE accounts SET status='verified_waiting_launch', verified_at=now(), verification_code_hash=NULL, verification_session_hash=NULL, code_expires_at=NULL, verification_attempts=$1 WHERE id=$2`, [MAX_ATTEMPTS, account.id])
      return 'verified'
    })
    if (outcome !== 'verified') return response.status(400).json(genericError)
    clearVerificationCookie(response)
    console.info('Email verification succeeded', { event: 'verification_succeeded' })
    return response.json({ ok: true })
  } catch (error) { console.error('Registration verification failed:', error.code || error.name); return response.status(500).json(genericError) }
})

app.post('/api/registration/resend', startLimiter, async (request, response) => {
  const token = request.cookies[cookieName]
  if (!token) return response.status(400).json(genericError)
  try {
    const result = await transaction(async (client) => {
      const { rows } = await client.query('SELECT * FROM accounts WHERE verification_session_hash = $1 FOR UPDATE', [hashSecret(token)])
      const account = rows[0]; const limit = resendState(account)
      if (limit.state !== 'valid') return limit
      const code = newCode(); const now = new Date(); const sameWindow = account.resend_window_started_at && now - new Date(account.resend_window_started_at) < 60 * 60 * 1000
      await client.query('UPDATE accounts SET verification_code_hash=$1, code_expires_at=$2, verification_attempts=0, resend_count=$3, resend_window_started_at=$4, code_sent_at=now() WHERE id=$5', [hashSecret(code), new Date(now.getTime() + CODE_TTL_MS), sameWindow ? account.resend_count + 1 : 1, sameWindow ? account.resend_window_started_at : now, account.id])
      return { state: 'ready', email: account.normalized_email, language: account.preferred_language, code, expiresAt: new Date(now.getTime() + CODE_TTL_MS) }
    })
    if (result.state !== 'ready') {
      if (result.state === 'cooldown') console.info('Verification resend blocked by cooldown', { event: 'verification_resend_cooldown', cooldownSeconds: result.cooldownSeconds })
      return response.status(429).json({ error: genericError.error, cooldownSeconds: result.cooldownSeconds || 0 })
    }
    await sendVerificationEmail(result)
    return response.json({ ok: true, cooldownSeconds: 60 })
  } catch (error) {
    if (error.code === 'EMAIL_NOT_CONFIGURED') { console.error('Registration email is not configured.'); return response.status(503).json({ error: 'Email delivery is not configured on this server.' }) }
    console.error('Registration resend failed:', error.code || error.name); return response.status(500).json(genericError)
  }
})

app.get('/api/health', (request, response) => response.json({ ok: true }))
if (isProduction) {
  const distDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
  app.use(express.static(distDirectory))
  app.use((request, response, next) => {
    if (request.method === 'GET' && !request.path.startsWith('/api/')) return response.sendFile(path.join(distDirectory, 'index.html'))
    return next()
  })
}
async function startServer() {
  try {
    const applied = await runMigrations()
    console.info('Database schema ready.', { appliedMigrations: applied.length })
    app.listen(port, () => console.log(`NewKingdom API listening on ${port}`))
  } catch (error) {
    console.error('Database schema initialization failed:', error.code || error.name)
    process.exitCode = 1
  }
}

startServer()
