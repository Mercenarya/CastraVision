import { useContext } from 'react'
import { LanguageContext } from '../contexts/languageContextValue'
import { getStoredLanguage, translate } from '../i18n'

export function useWorkflowError() {
  const language = useContext(LanguageContext)?.language || getStoredLanguage()
  return error => {
    if (!error) return ''
    const codes = ['TIMEOUT', 'NETWORK_ERROR', 'AUTH_REQUIRED', 'PERMISSION_DENIED', 'WORKSPACE_INACTIVE', 'VALIDATION_ERROR', 'STALE_VERSION', 'NOT_FOUND', 'REQUEST_CONFLICT', 'AUTH_UNAVAILABLE', 'AUTH_IDENTITY', 'CURRENT_PASSWORD_WRONG', 'CURRENT_PASSWORD_UNAVAILABLE', 'SESSION_MISMATCH']
    return codes.includes(error.code) ? translate(language, 'employeeErrors.' + error.code) : error.message || String(error)
  }
}
