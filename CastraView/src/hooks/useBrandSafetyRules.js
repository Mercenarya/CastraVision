import { useEffect, useState } from 'react'
import { getBrandRules } from '../services/brandSafety'

export function useBrandSafetyRules(scopeKey) {
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState({ loading: true, data: null, error: null })
  const key = `${scopeKey}:${revision}`
  useEffect(() => {
    if (!scopeKey) return undefined
    let active = true
    const controller = new AbortController()
    const timer = setTimeout(() => { if (active) { controller.abort(); setState({ key, loading: false, data: null, error: new Error('timeout') }) } }, 30000)
    queueMicrotask(() => {
      if (!active) return
      setState({ key, loading: true, data: null, error: null })
      getBrandRules(controller.signal).then(data => { if (active && !controller.signal.aborted) setState({ key, loading: false, data, error: null }) }).catch(error => { if (active && !controller.signal.aborted) setState({ key, loading: false, data: null, error }) }).finally(() => clearTimeout(timer))
    })
    return () => { active = false; controller.abort(); clearTimeout(timer) }
  }, [key, scopeKey])
  return { ...(scopeKey && state.key === key ? state : { loading: Boolean(scopeKey), data: null, error: null }), reload: () => setRevision(value => value + 1) }
}
