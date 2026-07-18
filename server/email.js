import { Resend } from 'resend'

const requiredVariables = ['RESEND_API_KEY', 'EMAIL_FROM', 'APP_ORIGIN']

function recipientDomain(email) { return email.split('@')[1] || 'unknown' }

export function emailConfiguration() {
  const missing = requiredVariables.filter((name) => !process.env[name]?.trim())
  if (missing.length) return { enabled: false, missing }
  try {
    const origin = new URL(process.env.APP_ORIGIN)
    if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('unsupported protocol')
    return { enabled: true, origin: origin.origin, from: process.env.EMAIL_FROM }
  } catch {
    return { enabled: false, missing: ['APP_ORIGIN (must be an http(s) URL)'] }
  }
}

export function buildVerificationEmail({ code, language, expiresAt, origin }) {
  const ukrainian = language === 'uk'
  const locale = ukrainian ? 'uk-UA' : 'en-US'
  const expiry = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(expiresAt)
  const copy = ukrainian
    ? { subject: 'NewKingdom — код підтвердження', eyebrow: 'ВАШЕ КОРОЛІВСТВО ЧЕКАЄ', heading: 'Підтвердьте свою пошту', intro: 'Введіть цей код, щоб підтвердити свій акаунт NewKingdom.', expiry: `Код дійсний до ${expiry} UTC (15 хвилин).`, safe: 'Нікому не повідомляйте цей код.', action: 'Відкрити NewKingdom' }
    : { subject: 'NewKingdom — verification code', eyebrow: 'YOUR KINGDOM AWAITS', heading: 'Verify your email', intro: 'Enter this code to confirm your NewKingdom account.', expiry: `This code expires at ${expiry} UTC (15 minutes).`, safe: 'Never share this code with anyone.', action: 'Open NewKingdom' }
  return {
    subject: copy.subject,
    html: `<!doctype html><html lang="${ukrainian ? 'uk' : 'en'}"><body style="margin:0;background:#090b0c;color:#fff6e4;font-family:Georgia,'Times New Roman',serif"><main style="max-width:560px;margin:0 auto;padding:48px 28px;background:linear-gradient(145deg,#1d1e1b,#0c0e0e);border:1px solid #5a482b"><p style="margin:0 0 16px;color:#efc36f;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:2px">${copy.eyebrow}</p><h1 style="margin:0;color:#fff6e4;font-size:36px;line-height:1.1">NewKingdom</h1><h2 style="margin:28px 0 12px;color:#f4d48a;font-size:25px">${copy.heading}</h2><p style="margin:0;color:#d9ccb4;font-family:Arial,sans-serif;font-size:16px;line-height:1.6">${copy.intro}</p><div style="margin:30px 0;padding:20px;border:1px solid #c98b32;background:#0a0b0b;color:#ffe2a1;font-family:Arial,sans-serif;font-size:32px;font-weight:bold;letter-spacing:10px;text-align:center">${code}</div><p style="margin:0 0 8px;color:#d9ccb4;font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${copy.expiry}</p><p style="margin:0;color:#b9a98e;font-family:Arial,sans-serif;font-size:13px;line-height:1.6">${copy.safe}</p><p style="margin:30px 0 0"><a href="${origin}/verify-email" style="color:#efc36f;font-family:Arial,sans-serif;font-weight:bold">${copy.action}</a></p></main></body></html>`,
    text: `${copy.heading}\n\n${copy.intro}\n\n${code}\n\n${copy.expiry}\n${copy.safe}\n\n${origin}/verify-email`,
  }
}

export async function sendVerificationEmail({ email, code, language, expiresAt }) {
  const configuration = emailConfiguration()
  if (!configuration.enabled) {
    const error = new Error('Email delivery is not configured')
    error.code = 'EMAIL_NOT_CONFIGURED'
    throw error
  }
  try {
    const content = buildVerificationEmail({ code, language, expiresAt, origin: configuration.origin })
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({ from: configuration.from, to: [email], subject: content.subject, html: content.html, text: content.text })
    if (error) throw new Error('provider rejected email')
    console.info('Verification email sent', { event: 'verification_email_sent', recipientDomain: recipientDomain(email), providerMessageId: data?.id || 'unknown' })
    return data
  } catch (cause) {
    console.warn('Verification email failed', { event: 'verification_email_failed', recipientDomain: recipientDomain(email), reason: cause.message })
    const error = new Error('Email delivery failed')
    error.code = 'EMAIL_DELIVERY_FAILED'
    throw error
  }
}
