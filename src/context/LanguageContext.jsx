import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { dictionaries, translate } from '../i18n/index.js'

const STORAGE_KEY = 'salon-language'
const LanguageContext = createContext(null)

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && dictionaries[saved] ? saved : 'en'
  } catch {
    return 'en'
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readSavedLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Private browsing can block storage; the toggle still works for this session.
    }
  }, [language])

  const setLanguage = useCallback((next) => {
    if (dictionaries[next]) setLanguageState(next)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === 'en' ? 'gu' : 'en'))
  }, [])

  const t = useCallback((key, params) => translate(language, key, params), [language])

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
