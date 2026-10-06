import { requireSupabase } from './supabase'

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function backendApi(path, options = {}) {
  const client = requireSupabase()
  const { data: { session }, error } = await client.auth.getSession()
  if (error || !session?.access_token) throw new Error('Phiên đăng nhập đã hết hạn.')

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${session.access_token}`,
  }
  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response
  try {
    response = await fetch(`${apiBase}/api/${path}`, { ...options, headers })
  } catch {
    throw new Error('Không kết nối được máy chủ. Hãy kiểm tra backend ở cổng 8000.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const requestError = new Error(
      data.error?.message || `Yêu cầu thất bại (${response.status}).`,
    )
    requestError.status = response.status
    requestError.code = data.error?.code
    throw requestError
  }
  return data
}
