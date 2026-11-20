const originalFetch = globalThis.fetch
globalThis.__employeeAuditRequests = []
globalThis.fetch = async (input, options) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url)
  if (url.hostname !== '127.0.0.1' || !['61321', '61480'].includes(url.port)) throw new Error('Employee audit refuses non-local transport')
  const start = Date.now()
  try {
    const response = await originalFetch(input, options)
    globalThis.__employeeAuditRequests.push({ path: url.pathname, status: response.status, milliseconds: Date.now() - start })
    return response
  } catch (error) {
    globalThis.__employeeAuditRequests.push({ path: url.pathname, error: error.cause?.code || error.name, milliseconds: Date.now() - start })
    throw error
  }
}
