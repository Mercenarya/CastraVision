import { api } from './api'

export const getBrandRules = signal => api('employee/brand-safety-rules/', { signal })
export const saveBrandRules = (rules, expectedVersion, signal) => api('employee/brand-safety-rules/', { method: 'PATCH', body: JSON.stringify({ rules, expectedVersion }), signal })
export const checkBrandContent = (fields, expectedVersion, signal) => api('employee/brand-safety/', { method: 'POST', body: JSON.stringify({ fields, expectedVersion }), signal })

export function brandSafetyError(error, t) {
  if (error?.code === 'TIMEOUT') return t('employeeErrors.TIMEOUT')
  const code = ['VALIDATION_ERROR', 'STALE_VERSION', 'PERMISSION_DENIED', 'AUTH_REQUIRED', 'BUSINESS_PROFILE_REQUIRED', 'WORKSPACE_INACTIVE'].includes(error?.code) ? error.code : 'UNAVAILABLE'
  return t('brandSafety.errors.' + code)
}
