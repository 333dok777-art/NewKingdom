import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations.js'

const LanguageContext = createContext(null)
const storageKey = 'newkingdom-language'

function getInitialLanguage() {
  try {
    const savedLanguage = window.localStorage.getItem(storageKey)
    return savedLanguage && translations[savedLanguage] ? savedLanguage : 'uk'
  } catch {
    return 'uk'
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage)

  useEffect(() => {
    const locale = translations[language]
    document.documentElement.lang = language
    document.title = locale.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', locale.meta.description)
    try {
      window.localStorage.setItem(storageKey, language)
    } catch {
      // The UI remains usable when storage is unavailable.
    }
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, t: translations[language] }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}
