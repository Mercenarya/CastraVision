import en from './locales/en.js'
import vi from './locales/vi.js'

export const STORAGE_KEY = 'castravision_language'
export const LANGUAGE_STORAGE_KEY = STORAGE_KEY
export const DEFAULT_LANGUAGE = 'en'
export const SUPPORTED_LANGUAGES = ['en', 'vi']

export const LANGUAGES = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'vi', label: 'Tiếng Việt', shortLabel: 'VI' },
]

export const translations = { en, vi }

/**
 * Get stored language from localStorage with strict fallback to default language ('en').
 * Safely guards against SSR, missing localStorage, and invalid values.
 */
export function getStoredLanguage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
        return stored
      }
    }
  } catch (err) {
    console.warn('[i18n] Failed to access localStorage:', err)
  }
  return DEFAULT_LANGUAGE
}

/**
 * Persist language to localStorage.
 */
export function setStoredLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, lang)
    }
  } catch (err) {
    console.warn('[i18n] Failed to save language to localStorage:', err)
  }
}

/**
 * Helper to traverse nested dictionary by dot path (e.g. 'settings.businessProfile.title').
 */
export function getNestedValue(obj, keyPath) {
  if (!obj || typeof obj !== 'object' || !keyPath) return undefined
  const segments = keyPath.split('.')
  let current = obj
  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in current) {
      current = current[segment]
    } else {
      return undefined
    }
  }
  return typeof current === 'string' ? current : undefined
}

/**
 * Interpolates variables formatted as {variableName} inside a translation string.
 */
export function interpolate(template, params) {
  if (!template || typeof template !== 'string' || !params || typeof params !== 'object') {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (match, paramName) => {
    return paramName in params ? String(params[paramName]) : match
  })
}

/**
 * Centralized translation function.
 *
 * @param {string} currentLang - Active language ('en' | 'vi')
 * @param {string} key - Nested dot path key (e.g. 'common.save')
 * @param {Record<string, any>} [params] - Optional interpolation params
 * @param {string} [fallbackLang='en'] - Fallback dictionary when missing
 * @returns {string} Translated string
 */
export function translate(currentLang, key, params = {}, fallbackLang = DEFAULT_LANGUAGE) {
  if (!key || typeof key !== 'string') return ''

  const dict = translations[currentLang] || translations[DEFAULT_LANGUAGE]
  let result = getNestedValue(dict, key)

  // Fallback to English if missing in Vietnamese (or active language)
  if (result === undefined && currentLang !== fallbackLang) {
    const fallbackDict = translations[fallbackLang]
    result = getNestedValue(fallbackDict, key)
    if (result !== undefined && import.meta.env?.DEV) {
      console.warn(`[i18n] Missing translation for key "${key}" in language "${currentLang}". Falling back to "${fallbackLang}".`)
    }
  }

  // If still missing in both dictionaries
  if (result === undefined) {
    if (import.meta.env?.DEV) {
      console.warn(`[i18n] Translation key not found: "${key}" (checked languages: "${currentLang}", "${fallbackLang}")`)
    }
    // Return readable fallback derived from last key segment rather than displaying undefined or full raw path to end-users
    const lastSegment = key.split('.').pop() || key
    return lastSegment
  }

  return interpolate(result, params)
}
