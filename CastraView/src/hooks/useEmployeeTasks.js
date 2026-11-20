import { useEffect, useState } from 'react'
import { employeeTasks } from '../services/employeeTasks'
import { useWorkflowError } from './useWorkflowError'

export function useEmployeeTasks(command, params = {}, revision = 0, enabled = true) {
  const formatError = useWorkflowError()
  const key = JSON.stringify(params)
  const requestKey = `${command}:${key}:${revision}`
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ loading: enabled, data: null, error: '' })
  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    const controller = new AbortController()
    const timer = setTimeout(() => { if (active) { controller.abort(); setState({ requestKey, loading: false, data: null, error: { code: 'TIMEOUT' } }) } }, 30000)
    queueMicrotask(() => {
      if (!active) return
      setState({ requestKey, loading: true, data: null, error: '' })
      employeeTasks(command, JSON.parse(key), { signal: controller.signal }).then(data => { if (active && !controller.signal.aborted) setState({ requestKey, loading: false, data, error: '' }) })
        .catch(cause => { if (active && !controller.signal.aborted) setState({ requestKey, loading: false, data: null, error: cause }) }).finally(() => clearTimeout(timer))
    })
    return () => { active = false; clearTimeout(timer); controller.abort() }
  }, [command, key, requestKey, retry, enabled])
  const visible = enabled && state.requestKey === requestKey ? state : { loading: enabled, data: null, error: '' }
  return { ...visible, error: formatError(visible.error), reload: () => setRetry(value => value + 1) }
}
