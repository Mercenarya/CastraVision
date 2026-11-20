import { useCallback, useEffect, useRef, useState } from 'react'

export function usePlatformCompanies(service, identity) {
  const [state, setState] = useState({ identity, companies: [], loading: true, error: '' })
  const generation = useRef(0)
  const controller = useRef(null)
  const refresh = useCallback(async () => {
    const revision = ++generation.current
    controller.current?.abort()
    const pending = new AbortController()
    controller.current = pending
    setState(previous => ({ ...previous, identity, loading: true, error: '' }))
    try {
      const result = await service.list(pending.signal)
      if (!Array.isArray(result?.companies)) throw new Error('Danh bạ doanh nghiệp không hợp lệ.')
      if (revision === generation.current) setState({ identity, companies: result.companies, loading: false, error: '' })
      return result
    } catch (error) {
      if (revision === generation.current && !pending.signal.aborted) setState({ identity, companies: [], loading: false, error: error.message || 'Không thể tải danh bạ.' })
      throw error
    }
  }, [service, identity])
  const cancel = useCallback(() => { generation.current++; controller.current?.abort() }, [])
  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) refresh().catch(() => {}) })
    return () => { active = false; cancel() }
  }, [refresh, cancel])
  return { ...(state.identity === identity ? state : { companies: [], loading: true, error: '' }), refresh }
}
