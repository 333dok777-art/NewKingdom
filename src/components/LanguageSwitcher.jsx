import { useLanguage } from '../i18n/LanguageContext.jsx'

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <label className="language-switcher">
      <span className="visually-hidden">{t.language.label}</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t.language.label}>
        <option value="uk">{t.language.uk}</option>
        <option value="en">{t.language.en}</option>
      </select>
    </label>
  )
}
