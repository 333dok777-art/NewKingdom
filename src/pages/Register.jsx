import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext.jsx'
import { registrationTranslations } from '../i18n/translations.js'
import { startRegistration } from '../lib/api.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getStrength(password) {
  if (!password) return 0
  return Math.min(4, (password.length >= 8 ? 1 : 0) + (/[a-z]/.test(password) && /[A-Z]/.test(password) ? 1 : 0) + (/\d/.test(password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0))
}

function RegisterContent() {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const copy = registrationTranslations[language]
  const [values, setValues] = useState({ username: '', email: '', password: '', confirmPassword: '', terms: false })
  const [touched, setTouched] = useState({})
  const [shown, setShown] = useState({ password: false, confirmPassword: false })
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const errors = useMemo(() => ({
    username: values.username.trim() ? '' : copy.errors.username,
    email: !values.email ? copy.errors.emailRequired : (emailPattern.test(values.email) ? '' : copy.errors.emailInvalid),
    password: values.password.length >= 8 ? '' : copy.errors.password,
    confirmPassword: values.confirmPassword && values.confirmPassword === values.password ? '' : copy.errors.confirmPassword,
    terms: values.terms ? '' : copy.errors.terms,
  }), [values, copy.errors])
  const valid = !Object.values(errors).some(Boolean)
  const strength = getStrength(values.password)
  const fieldError = (name) => (touched[name] || submitted) && errors[name]
  const update = ({ target }) => { setValues((current) => ({ ...current, [target.name]: target.type === 'checkbox' ? target.checked : target.value })); setSubmitted(false); setServerError('') }
  const blur = (name) => () => setTouched((current) => ({ ...current, [name]: true }))
  const toggle = (name) => () => setShown((current) => ({ ...current, [name]: !current[name] }))
  const submit = async (event) => { event.preventDefault(); setTouched({ username: true, email: true, password: true, confirmPassword: true, terms: true }); if (!valid) return; setIsSubmitting(true); setServerError(''); try { await startRegistration({ ...values, termsAccepted: values.terms, preferredLanguage: language }); navigate('/verify-email') } catch (error) { setServerError(error.message) } finally { setIsSubmitting(false) } }
  const passwordField = (name, label) => <div className="form-field"><label htmlFor={name}>{label}</label><div className="password-input"><input id={name} name={name} type={shown[name] ? 'text' : 'password'} value={values[name]} onChange={update} onBlur={blur(name)} autoComplete="new-password" required aria-invalid={Boolean(fieldError(name))} aria-describedby={fieldError(name) ? `${name}-error` : undefined} /><button type="button" onClick={toggle(name)} aria-label={shown[name] ? copy.hidePassword : copy.showPassword}>{shown[name] ? copy.hide : copy.show}</button></div>{name === 'password' && <div className="password-strength" aria-live="polite"><div className="password-strength__bars" aria-hidden="true">{[1, 2, 3, 4].map((bar) => <span className={bar <= strength ? `is-active is-level-${strength}` : ''} key={bar} />)}</div><span>{copy.strength.label}: {copy.strength.levels[strength]}</span></div>}{fieldError(name) && <p id={`${name}-error`} className="form-error" role="alert">{errors[name]}</p>}</div>
  return <div className="registration-page"><header className="registration-header"><Link className="brand" to="/" aria-label={t.navigation.home}><span className="brand__crest" aria-hidden="true">N</span><span>NewKingdom</span></Link><LanguageSwitcher /></header><main className="registration-main"><section className="registration-card" aria-labelledby="register-title"><div className="registration-card__heading"><p className="registration-card__eyebrow">{copy.eyebrow}</p><h1 id="register-title">{copy.title}</h1><p>{copy.subtitle}</p></div><form className="registration-form" onSubmit={submit} noValidate><div className="form-field"><label htmlFor="username">{copy.username}</label><input id="username" name="username" value={values.username} onChange={update} onBlur={blur('username')} autoComplete="username" required aria-invalid={Boolean(fieldError('username'))} aria-describedby={fieldError('username') ? 'username-error' : undefined} />{fieldError('username') && <p id="username-error" className="form-error" role="alert">{errors.username}</p>}</div><div className="form-field"><label htmlFor="email">{copy.email}</label><input id="email" name="email" type="email" value={values.email} onChange={update} onBlur={blur('email')} autoComplete="email" required aria-invalid={Boolean(fieldError('email'))} aria-describedby={fieldError('email') ? 'email-error' : undefined} />{fieldError('email') && <p id="email-error" className="form-error" role="alert">{errors.email}</p>}</div>{passwordField('password', copy.password)}{passwordField('confirmPassword', copy.confirmPassword)}<div className="terms-field"><input id="terms" name="terms" type="checkbox" checked={values.terms} onChange={update} onBlur={blur('terms')} required aria-invalid={Boolean(fieldError('terms'))} aria-describedby={fieldError('terms') ? 'terms-error' : undefined} /><label htmlFor="terms">{copy.termsPrefix} <a href="#terms">{copy.termsLink}</a> {copy.termsAnd} <a href="#privacy">{copy.privacyLink}</a>.</label></div>{fieldError('terms') && <p id="terms-error" className="form-error form-error--terms" role="alert">{errors.terms}</p>}{serverError && <p className="form-error" role="alert">{serverError}</p>}<button className="registration-submit" type="submit" disabled={!valid || isSubmitting}>{isSubmitting ? copy.submitting : copy.submit}</button></form><p className="registration-signin">{copy.hasAccount} <Link to="/login">{copy.signIn}</Link></p></section></main></div>
}

export default function Register() { return <LanguageProvider><RegisterContent /></LanguageProvider> }
