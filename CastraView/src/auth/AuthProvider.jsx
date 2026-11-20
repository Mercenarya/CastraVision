import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext } from './AuthContext'
import { requireSupabase, supabaseConfigurationError } from '../lib/supabase'
import { api, onApiUnauthorized } from '../services/api'
import { readAuthorization } from './sessionContext'
import { getActiveWorkspaceId, setActiveWorkspaceId } from './activeWorkspace'
import { createEmailOnboarding } from './emailOnboarding'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authorization, setAuthorization] = useState(null)
  const [ready, setReady] = useState(Boolean(supabaseConfigurationError))
  const [error, setError] = useState(supabaseConfigurationError)
  const sessionUser = useRef(null)

  useEffect(() => {
    if (supabaseConfigurationError) return undefined
    const client = requireSupabase()
    let active = true
    let eventReceived = false
    client.auth.getSession().then(({ data, error: failure }) => {
      if (!active || eventReceived) return
      if (failure) { setError('Không thể khôi phục phiên Supabase.'); setReady(true); return }
      sessionUser.current = data.session?.user.id || null
      setSession(data.session)
      if (!data.session) setReady(true)
    }).catch(() => { if (active) { setError('Không thể khôi phục phiên Supabase.'); setReady(true) } })
    // Do not await Supabase calls inside this callback: SDK auth events hold a lock.
    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      eventReceived = true
      const sameUser = Boolean(next && sessionUser.current === next.user.id)
      sessionUser.current = next?.user.id || null
      setAuthorization(current => current?.user.id === next?.user.id ? current : null)
      setSession(next)
      setError('')
      setReady(current => !next || (current && sameUser))
    })
    const removeHandler = onApiUnauthorized(() => {
      setAuthorization(null)
      setError('Phiên Supabase không còn hợp lệ. Vui lòng đăng nhập lại.')
      void client.auth.signOut({ scope: 'local' }).catch(() => {})
    })
    return () => { active = false; listener.subscription.unsubscribe(); removeHandler() }
  }, [])

  const loadContext = useCallback(async (currentSession) => {
    const payload = await api('auth/session/')
    const value = readAuthorization(payload, currentSession.user.id, getActiveWorkspaceId(currentSession.user.id))
    setActiveWorkspaceId(value.user.id, value.workspaceId)
    return value
  }, [])

  useEffect(() => {
    if (!session) return undefined
    let active = true
    loadContext(session).then(value => {
      if (active) { setAuthorization(value); setError('') }
    }).catch(cause => {
      if (active) { setAuthorization(null); setError(cause.message) }
    }).finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [session, loadContext])

  const membership = authorization?.memberships.find(x => x.workspaceId === authorization.workspaceId) || null
  const value = useMemo(() => ({
    ready, error, session,
    user: authorization ? { ...authorization.user, role: membership?.role || null } : null,
    membership,
    memberships: authorization?.memberships || [],
    suspendedWorkspaces: authorization?.suspendedWorkspaces || [],
    role: membership?.role || null,
    workspaceId: membership?.workspaceId || null,
    platformRole: authorization?.platformRole || null,
    passwordSetupRequired: authorization?.passwordSetupRequired || false,
    needsOnboarding: Boolean(authorization && !authorization.platformRole && !membership),
    async refreshMembership() {
      if (!session) return null
      const context = await loadContext(session)
      setAuthorization(context)
      return context
    },
    selectWorkspace(id) {
      if (!authorization?.memberships.some(x => x.workspaceId === id)) throw new Error('Workspace không được cấp quyền.')
      setActiveWorkspaceId(authorization.user.id, id)
      setAuthorization(current => ({ ...current, workspaceId: id }))
    },
    async signIn(email, password) {
      setError('')
      const { data, error: failure } = await requireSupabase().auth.signInWithPassword({ email, password })
      if (failure) throw new Error('Email hoặc mật khẩu không đúng, hoặc tài khoản chưa xác nhận email.')
      // onAuthStateChange owns the session transition, including ready/loading.
      return data
    },
    requestEmailLink(email, options) { return createEmailOnboarding({ auth: requireSupabase().auth, origin: window.location.origin }).sendLink(email, options) },
    signUp(email) { return createEmailOnboarding({ auth: requireSupabase().auth, origin: window.location.origin }).sendLink(email) },
    setPassword(password, confirmation) { return createEmailOnboarding({ auth: requireSupabase().auth, origin: window.location.origin }).setPassword(password, confirmation) },
    async signOut() {
      const { error: failure } = await requireSupabase().auth.signOut({ scope: 'local' })
      if (failure) throw new Error('Chưa thể đăng xuất an toàn. Vui lòng thử lại.')
      setSession(null)
      setAuthorization(null)
    },
  }), [authorization, error, loadContext, membership, ready, session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
