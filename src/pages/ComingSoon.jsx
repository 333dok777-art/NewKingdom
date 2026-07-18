import { Link } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext.jsx'
import { verificationTranslations } from '../i18n/translations.js'

function ComingSoonContent() { const { t, language } = useLanguage(); const copy = verificationTranslations[language].comingSoon; return <div className="registration-page"><header className="registration-header"><Link className="brand" to="/" aria-label={t.navigation.home}><span className="brand__crest" aria-hidden="true">N</span><span>NewKingdom</span></Link><LanguageSwitcher /></header><main className="registration-main"><section className="registration-card coming-soon-card" aria-labelledby="coming-title"><div className="registration-card__heading"><p className="registration-card__eyebrow">{copy.eyebrow}</p><h1 id="coming-title">{copy.title}</h1><p>{copy.message}</p></div><Link className="registration-submit coming-soon-home" to="/">{copy.home}</Link></section></main></div> }
export default function ComingSoon() { return <LanguageProvider><ComingSoonContent /></LanguageProvider> }
