import { requireSupabase } from '../lib/supabase'
import { getActiveWorkspaceId } from '../auth/activeWorkspace'
import { createApiClient } from './apiClient'

let unauthorizedHandler
export function onApiUnauthorized(handler) {
  unauthorizedHandler = handler
  return () => { if (unauthorizedHandler === handler) unauthorizedHandler = undefined }
}
export const api = createApiClient({
  getSession: () => requireSupabase().auth.getSession(),
  getWorkspaceId: getActiveWorkspaceId,
  baseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '',
  onUnauthorized: () => unauthorizedHandler?.(),
})
