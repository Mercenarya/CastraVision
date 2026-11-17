import { useCallback, useEffect, useRef, useState } from 'react'

export function useMembershipWorkspace({ workspaceId, userId, service, query, enabled = true }) {
  const [state, setState] = useState({ key: '', data: null, error: '', loading: true })
  const request = useRef(null)
  const identity = `${userId}:${workspaceId}:${JSON.stringify(query)}`
  const refresh = useCallback(async () => {
    if (!enabled) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    try {
      const options = { signal: controller.signal }
      const [personnel, teams, recruitment] = await Promise.all([
        service.listWorkspacePersonnel(query, options), service.listTeams(options), service.getRecruitmentSettings(options),
      ])
      if (!controller.signal.aborted && request.current === controller) {
        setState({ key: identity, data: { personnel, teams: teams.items, recruitment }, error: '', loading: false })
      }
    } catch (error) {
      if (error.name !== 'AbortError' && request.current === controller && !controller.signal.aborted) {
        setState({ key: identity, data: null, error: error.message, loading: false })
      }
    }
  }, [enabled, identity, query, service])
  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) void refresh() })
    return () => { active = false; request.current?.abort() }
  }, [refresh])
  useEffect(() => {
    const update = () => { if (document.visibilityState === 'visible') void refresh() }
    const timer = setInterval(update, 30000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => { clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update) }
  }, [refresh])
  return { ...(state.key === identity ? state : { data: null, loading: true, error: '' }), refresh }
}
