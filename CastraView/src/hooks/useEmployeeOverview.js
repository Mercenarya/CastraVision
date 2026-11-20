import { useCallback, useEffect, useState } from 'react'
import { employeeOverview } from '../services/employee'

export function useEmployeeOverview(identity) {
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState({ identity, loading: true, data: null, error: '' })
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setState({ identity, loading: true, data: null, error: '' })
      employeeOverview(controller.signal).then(data => {
        if (active) setState({ identity, loading: false, data, error: '' })
      }).catch(cause => { if (active) setState({ identity, loading: false, data: null, error: cause.message }) })
    })
    window.addEventListener('castra:workflow-changed', refresh)
    window.addEventListener('castra:tasks-changed', refresh)
    return () => { active = false; controller.abort(); window.removeEventListener('castra:workflow-changed', refresh); window.removeEventListener('castra:tasks-changed', refresh) }
  }, [identity, revision, refresh])
  return { ...(state.identity === identity ? state : { loading: true, data: null, error: '' }), refresh }
}
