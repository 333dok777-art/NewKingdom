import { Resend } from 'resend'

export async function sendVerificationEmail({ email, code, language }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    const error = new Error('Email delivery is not configured')
    error.code = 'EMAIL_NOT_CONFIGURED'
    throw error
  }
  const ukrainian = language === 'uk'
  const subject = ukrainian ? 'NewKingdom — код підтвердження' : 'NewKingdom — verification code'
  const message = ukrainian ? `Ваш код підтвердження: <strong>${code}</strong>. Він дійсний 15 хвилин.` : `Your verification code: <strong>${code}</strong>. It expires in 15 minutes.`
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM, to: [email], subject, html: `<main style="background:#0a0b0b;color:#fff6e4;padding:32px;font-family:Georgia,serif"><h1 style="color:#efc36f">NewKingdom</h1><p>${message}</p><p style="color:#cdbfa4">${ukrainian ? 'Нікому не повідомляйте цей код.' : 'Do not share this code with anyone.'}</p></main>` })
  if (error) { const safeError = new Error('Email delivery failed'); safeError.code = 'EMAIL_DELIVERY_FAILED'; throw safeError }
}
