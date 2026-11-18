import { useCallback, useEffect, useRef, useState } from 'react'
import { workflow } from '../services/leaderWorkflow'

export function useWorkflowQuery(command, params = {}, revision = 0) {
  const key = JSON.stringify(params)
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    let settled = false
    let timeout
    const controller = new AbortController()
    Promise.resolve().then(() => {
      if (!active) return undefined
      setState(current => ({ ...current, loading: true, error: '' }))
      timeout = setTimeout(() => {
        if (!active || settled) return
        settled = true
        controller.abort()
        setState(current => ({ ...current, loading: false, error: 'Yêu cầu mất quá lâu. Vui lòng thử lại.' }))
      }, 30_000)
      return workflow(command, JSON.parse(key), { signal: controller.signal })
    }).then(data => {
      if (active && !settled) {
        settled = true
        setState({ data, loading: false, error: '' })
      }
    }).catch(cause => {
      if (active && !settled) {
        settled = true
        setState({ data: null, loading: false, error: cause.message })
      }
    }).finally(() => {
      clearTimeout(timeout)
    })
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [command, key, revision, retry])
  return { ...state, reload: () => setRetry(n => n + 1) }
}

export function useWorkflowAction(onSuccess) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const running = useRef(false)
  const run = useCallback(async task => {
    if (running.current) return null
    running.current = true
    setBusy(true)
    setError('')
    try {
      const result = await task()
      await onSuccess?.(result)
      return result
    } catch (cause) {
      setError(cause.message)
      return null
    } finally {
      running.current = false
      setBusy(false)
    }
  }, [onSuccess])
  return { busy, error, run, clearError: () => setError('') }
}
