import { useCallback, useEffect, useRef, useState } from 'react'

export function useMembershipNotifications({ userId, service }) {
  const [state, setState] = useState({ userId: null, items: [], unreadCount: 0, error: '' })
  const latest = useRef(null)
  const refresh = useCallback(async () => {
    latest.current?.abort()
    const controller = new AbortController(); latest.current = controller
    try {
      const result = await service.listNotifications({}, { signal: controller.signal })
      if (!controller.signal.aborted) setState({ userId, items: result.items, unreadCount: result.unreadCount || 0, error: '' })
    } catch (cause) {
      if (!controller.signal.aborted && cause.name !== 'AbortError') setState(current => ({ ...current, userId, error: cause.message }))
    }
  }, [service, userId])
  useEffect(() => {
    let active = true
    const update = () => { if (active && document.visibilityState === 'visible') void refresh() }
    queueMicrotask(update)
    const timer = setInterval(update, 30000)
    window.addEventListener('focus', update); document.addEventListener('visibilitychange', update)
    return () => { active = false; clearInterval(timer); latest.current?.abort(); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update) }
  }, [refresh])
  async function markRead(id) { await service.markNotificationRead(id); await refresh() }
  return { ...(state.userId === userId ? state : { items: [], unreadCount: 0, error: '' }), refresh, markRead }
}
