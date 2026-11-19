import { useEffect, useState } from 'react'

// Keyed state prevents a previous workspace's data being painted during the render before cleanup.
export function useManagerQuery(key, load) {
  const [state, setState] = useState({ key: '', data: null, error: '', loading: true })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      if (!active) return
      active = false
      controller.abort()
      setState({ key, data: null, error: 'Yêu cầu mất quá lâu. Vui lòng thử lại.', loading: false })
    }, 30000)
    Promise.resolve().then(() => {
      if (!active) return
      setState({ key, data: null, error: '', loading: true })
      return load(controller.signal)
    }).then(data => { if (active) setState({ key, data, loading: false, error: '' }) })
      .catch(error => { if (active) setState({ key, data: null, loading: false, error: error.message }) })
      .finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [key, load, revision])
  return { ...(state.key === key ? state : { data: null, error: '', loading: true }), reload: () => setRevision(n => n + 1) }
}
