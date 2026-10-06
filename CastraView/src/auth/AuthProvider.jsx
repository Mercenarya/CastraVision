import { useCallback, useEffect, useMemo, useState } from 'react'

import { AuthContext } from './AuthContext'
import { requireSupabase, supabaseConfigurationError } from '../lib/supabase'

async function fetchMembership(client, userId) {
  const { data, error } = await client
    .from('workspace_members')
    .select('workspace_id,role,workspaces(id,name)')
    .eq('user_id', userId)
    .limit(2)
  if (error) throw new Error('Không thể tải phân quyền không gian làm việc.')
  if (!data?.length) return null
  if (data.length !== 1) {
    throw new Error('Sprint 1 yêu cầu mỗi tài khoản chỉ có một không gian đang hoạt động.')
  }
  const item = data[0]
  if (!['admin', 'manager', 'member'].includes(item.role)) {
    throw new Error('Vai trò không gian làm việc không hợp lệ.')
  }
  return {
    workspaceId: item.workspace_id,
    workspaceName: item.workspaces?.name || 'CastraVision Workspace',
    role: item.role,
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [membership, setMembership] = useState(null)
  const [ready, setReady] = useState(Boolean(supabaseConfigurationError))
  const [error, setError] = useState(supabaseConfigurationError)

  const loadMembership = useCallback(async (activeSession) => {
    if (!activeSession?.user) {
      setMembership(null)
      return null
    }
    const value = await fetchMembership(requireSupabase(), activeSession.user.id)
    setMembership(value)
    return value
  }, [])

  const refreshMembership = useCallback(
    () => loadMembership(session),
    [loadMembership, session],
  )

  useEffect(() => {
    if (supabaseConfigurationError) {
      return undefined
    }
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
    membership,
    role: membership?.role || null,
    workspaceId: membership?.workspaceId || null,
    needsOnboarding: Boolean(session?.user && !membership),
    refreshMembership,
    async signIn(email, password) {
      const { error: authError } = await requireSupabase().auth.signInWithPassword({ email, password })
      if (authError) throw new Error('Email hoặc mật khẩu không đúng.')
    },
    async signUp(email, password, fullName = '') {
      const { data, error: authError } = await requireSupabase().auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (authError) throw new Error(authError.message)
      return data
    },
    async signOut() {
      const { error: authError } = await requireSupabase().auth.signOut()
      if (authError) throw new Error('Không thể đăng xuất an toàn.')
    },
  }), [error, membership, ready, refreshMembership, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
