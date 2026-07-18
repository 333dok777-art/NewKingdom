import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext.jsx'
import { verificationTranslations } from '../i18n/translations.js'
import { resendRegistrationCode, verifyRegistration } from '../lib/api.js'

function VerifyEmailContent() {
  const { t, language } = useLanguage(); const copy = verificationTranslations[language]; const navigate = useNavigate()
  const [code, setCode] = useState(''); const [cooldown, setCooldown] = useState(60); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { if (!cooldown) return undefined; const id = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(id) }, [cooldown])
  const verify = async (event) => { event.preventDefault(); if (code.length !== 6) { setError(copy.invalidCode); return }; setBusy(true); setError(''); try { await verifyRegistration(code); navigate('/coming-soon') } catch { setError(copy.genericError) } finally { setBusy(false) } }
  const resend = async () => { setBusy(true); setError(''); try { const result = await resendRegistrationCode(); setCooldown(result.cooldownSeconds || 60) } catch (requestError) { if (requestError.cooldownSeconds) setCooldown(requestError.cooldownSeconds); setError(copy.genericError) } finally { setBusy(false) } }
  return <div className="registration-page"><header className="registration-header"><Link className="brand" to="/" aria-label={t.navigation.home}><span className="brand__crest" aria-hidden="true">N</span><span>NewKingdom</span></Link><LanguageSwitcher /></header><main className="registration-main"><section className="registration-card" aria-labelledby="verify-title"><div className="registration-card__heading"><p className="registration-card__eyebrow">{copy.eyebrow}</p><h1 id="verify-title">{copy.title}</h1><p>{copy.subtitle}</p></div><form className="registration-form" onSubmit={verify} noValidate><div className="form-field"><label htmlFor="verification-code">{copy.label}</label><input className="verification-code" id="verification-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" aria-describedby="verification-help" aria-invalid={Boolean(error)} required autoFocus /><p id="verification-help" className="form-hint">{copy.hint}</p></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="registration-submit" disabled={busy} type="submit">{copy.verify}</button></form><div className="verify-resend"><p>{copy.noCode}</p><button type="button" onClick={resend} disabled={busy || cooldown > 0}>{cooldown > 0 ? `${copy.resend} (${cooldown}s)` : copy.resend}</button></div></section></main></div>
}
export default function VerifyEmail() { return <LanguageProvider><VerifyEmailContent /></LanguageProvider> }
