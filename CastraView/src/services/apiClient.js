// The only product API transport. No Django cookie/password fallback.
export function createApiClient({ getSession, getWorkspaceId, fetchImpl = fetch, baseUrl = '', onUnauthorized }) {
  return async function api(path, options = {}) {
    const { data, error } = await getSession()
    if (options.signal?.aborted) throw options.signal.reason || new DOMException('Request cancelled', 'AbortError')
    const session = data?.session
    if (error || !session?.access_token) {
      throw Object.assign(new Error('Phiên Supabase đã hết hạn. Vui lòng đăng nhập lại.'), { code: 'AUTH_REQUIRED', status: 401 })
    }
    const headers = { ...(options.headers || {}) }
    for (const key of Object.keys(headers)) {
      if (['authorization', 'x-workspace-id', 'x-csrftoken', 'cookie'].includes(key.toLowerCase())) delete headers[key]
    }
    headers.Authorization = `Bearer ${session.access_token}`
    const workspaceId = getWorkspaceId(session.user.id)
    if (workspaceId) headers['X-Workspace-ID'] = workspaceId
    if (!(options.body instanceof FormData) && options.body !== undefined) headers['Content-Type'] = 'application/json'
    let response
    try {
      response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/api/${path}`, { ...options, headers, credentials: 'omit' })
    } catch (cause) {
      if (cause.name === 'AbortError') throw cause
      throw new Error('Không kết nối được backend. Kiểm tra dịch vụ ở cổng 8000.')
    }
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 401) onUnauthorized?.()
      throw Object.assign(new Error(payload.error?.message || `Yêu cầu thất bại (${response.status}).`), {
        status: response.status, code: payload.error?.code,
      })
    }
    return payload
  }
}
