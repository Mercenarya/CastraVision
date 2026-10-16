import { useCallback, useEffect, useMemo, useState } from 'react'

import { AuthContext } from './AuthContext'
import { getActiveWorkspaceId, setActiveWorkspaceId } from '../lib/activeWorkspace'
import { requireSupabase, supabaseConfigurationError } from '../lib/supabase'

async function fetchMemberships(client, userId) {
  const { data, error } = await client
    .from('workspace_members')
    .select('workspace_id,role,joined_at,workspaces(id,name)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
  if (error) throw new Error('Không thể tải phân quyền không gian làm việc.')
  return (data || []).map((item) => {
    if (!['admin', 'manager', 'member'].includes(item.role)) {
      throw new Error('Vai trò không gian làm việc không hợp lệ.')
    }
    return {
      workspaceId: item.workspace_id,
      workspaceName: item.workspaces?.name || 'CastraVision Workspace',
      role: item.role,
    }
  })
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [membership, setMembership] = useState(null)
  const [ready, setReady] = useState(Boolean(supabaseConfigurationError))
  const [error, setError] = useState(supabaseConfigurationError)

  const loadMembership = useCallback(async (activeSession, preferredWorkspaceId = null) => {
    if (!activeSession?.user) {
      setMemberships([])
      setMembership(null)
      return null
    }
    const values = await fetchMemberships(requireSupabase(), activeSession.user.id)
    const requestedId = preferredWorkspaceId || getActiveWorkspaceId(activeSession.user.id)
    const value = values.find((item) => item.workspaceId === requestedId)
      || values.find((item) => item.role === 'admin')
      || values[0]
      || null
    setMemberships(values)
    setMembership(value)
    setActiveWorkspaceId(activeSession.user.id, value?.workspaceId || null)
    return value
  }, [])

  const refreshMembership = useCallback(
    (preferredWorkspaceId = null) => loadMembership(session, preferredWorkspaceId),
    [loadMembership, session],
  )

  const selectWorkspace = useCallback((workspaceId) => {
    const next = memberships.find((item) => item.workspaceId === workspaceId)
    if (!next || !session?.user) throw new Error('Không gian làm việc không hợp lệ.')
    setMembership(next)
    setActiveWorkspaceId(session.user.id, next.workspaceId)
  }, [memberships, session])

  useEffect(() => {
    if (supabaseConfigurationError) return undefined
    const client = requireSupabase()
    let active = true
    async function boot() {
      try {
        const { data, error: sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        if (!active) return
        setSession(data.session)
        if (data.session) await loadMembership(data.session)
      } catch {
        if (active) setError('Không thể khôi phục phiên Supabase.')
      } finally {
        if (active) setReady(true)
      }
    }
    boot()
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setError('')
      Promise.resolve(loadMembership(nextSession)).catch(() => {
        setError('Không thể tải phân quyền không gian làm việc.')
      })
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadMembership])

  const value = useMemo(() => ({
    ready,
    error,
    session,
    user: session?.user || null,
    memberships,
    membership,
    role: membership?.role || null,
    workspaceId: membership?.workspaceId || null,
    needsOnboarding: Boolean(session?.user && memberships.length === 0),
    refreshMembership,
    selectWorkspace,
    async signIn(email, password) {
      const normalizedEmail = email.trim().toLowerCase()
      const { error: authError } = await requireSupabase().auth.signInWithPassword({ email: normalizedEmail, password })
      if (authError) throw new Error('Email hoặc mật khẩu không đúng.')
    },
    async signUp(email, password, fullName = '') {
      const normalizedEmail = email.trim().toLowerCase()
      const { data, error: authError } = await requireSupabase().auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { full_name: fullName.trim() } },
      })
      if (authError) throw new Error(authError.message)
      return data
    },
    async signOut() {
      const { error: authError } = await requireSupabase().auth.signOut()
      if (authError) throw new Error('Không thể đăng xuất an toàn.')
    },
  }), [error, membership, memberships, ready, refreshMembership, selectWorkspace, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
