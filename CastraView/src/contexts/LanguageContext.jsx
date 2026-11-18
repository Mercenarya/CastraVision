import { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { LanguageContext } from './languageContextValue'
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  LANGUAGES,
  getStoredLanguage,
  setStoredLanguage,
  translate,
} from '../i18n'

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => getStoredLanguage())

  const setLanguage = useCallback((nextLang) => {
    if (!SUPPORTED_LANGUAGES.includes(nextLang)) {
      console.warn(`[LanguageProvider] Unsupported language: "${nextLang}"`)
      return
    }
    setLanguageState(nextLang)
    setStoredLanguage(nextLang)
  }, [])

  const t = useCallback(
    (key, params) => {
      return translate(language, key, params, DEFAULT_LANGUAGE)
    },
    [language]
  )

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: LANGUAGES,
      isVietnamese: language === 'vi',
      isEnglish: language === 'en',
    }),
    [language, setLanguage, t]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

LanguageProvider.propTypes = {
  children: PropTypes.node,
}

export default LanguageProvider
