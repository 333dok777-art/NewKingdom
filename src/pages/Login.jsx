import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext.jsx'
import { loginTranslations } from '../i18n/translations.js'

function LoginContent() {
  const { t, language } = useLanguage()
  const copy = loginTranslations[language]
  const [values, setValues] = useState({ identity: '', password: '', remember: false })
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const errors = useMemo(() => ({ identity: values.identity.trim() ? '' : copy.errors.identity, password: values.password ? '' : copy.errors.password }), [values, copy.errors])
  const showError = (field) => touched[field] && errors[field]
  const update = ({ target }) => setValues((current) => ({ ...current, [target.name]: target.type === 'checkbox' ? target.checked : target.value }))
  const submit = (event) => { event.preventDefault(); setTouched({ identity: true, password: true }) }

  return <div className="registration-page"><header className="registration-header"><Link className="brand" to="/" aria-label={t.navigation.home}><span className="brand__crest" aria-hidden="true">N</span><span>NewKingdom</span></Link><LanguageSwitcher /></header><main className="registration-main"><section className="registration-card login-card" aria-labelledby="login-title"><div className="registration-card__heading"><p className="registration-card__eyebrow">{copy.eyebrow}</p><h1 id="login-title">{copy.title}</h1><p>{copy.subtitle}</p></div><form className="registration-form" onSubmit={submit} noValidate><div className="form-field"><label htmlFor="identity">{copy.identity}</label><input id="identity" name="identity" placeholder={copy.identityPlaceholder} value={values.identity} onChange={update} onBlur={() => setTouched((current) => ({ ...current, identity: true }))} autoComplete="username" required aria-invalid={Boolean(showError('identity'))} aria-describedby={showError('identity') ? 'identity-error' : undefined} />{showError('identity') && <p id="identity-error" className="form-error" role="alert">{errors.identity}</p>}</div><div className="form-field"><label htmlFor="login-password">{copy.password}</label><div className="password-input"><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} value={values.password} onChange={update} onBlur={() => setTouched((current) => ({ ...current, password: true }))} autoComplete="current-password" required aria-invalid={Boolean(showError('password'))} aria-describedby={showError('password') ? 'password-error' : undefined} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? copy.hidePassword : copy.showPassword}>{showPassword ? copy.hide : copy.show}</button></div>{showError('password') && <p id="password-error" className="form-error" role="alert">{errors.password}</p>}</div><div className="login-options"><label className="remember-field"><input name="remember" type="checkbox" checked={values.remember} onChange={update} /><span>{copy.remember}</span></label><a href="#forgot-password">{copy.forgotPassword}</a></div><button className="registration-submit" type="submit">{copy.submit}</button></form><p className="registration-signin">{copy.noAccount} <Link to="/register">{copy.createAccount}</Link></p></section></main></div>
}

export default function Login() { return <LanguageProvider><LoginContent /></LanguageProvider> }
