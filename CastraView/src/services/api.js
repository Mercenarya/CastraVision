// Mọi lời gọi API tới backend Django (session + CSRF) đi qua đây.
function csrfToken() {
  const part = document.cookie.split('; ').find((item) => item.startsWith('csrftoken='))
  return decodeURIComponent(part?.split('=')[1] || '')
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (options.method && options.method !== 'GET') headers['X-CSRFToken'] = csrfToken()

  let response
  try {
    response = await fetch(`/api/${path}`, { credentials: 'same-origin', ...options, headers })
  } catch {
    throw new Error('Không kết nối được máy chủ. Hãy kiểm tra backend ở cổng 8000.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || `Yêu cầu thất bại (${response.status}).`)
  return data
}
