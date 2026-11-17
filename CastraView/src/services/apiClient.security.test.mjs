import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createApiClient } from './apiClient.js'

test('JWT and active Workspace are sent; cookies and caller header overrides are excluded', async () => {
  const calls = []
  let token = 'first'
  const api = createApiClient({
    getSession: async () => ({ data: { session: { access_token: token, user: { id: 'u' } } } }),
    getWorkspaceId: () => 'workspace-a',
    fetchImpl: async (...args) => { calls.push(args); return { ok: true, json: async () => ({ ok: true }) } },
  })
  await api('business-profile/', { headers: { Authorization: 'forged', 'X-Workspace-ID': 'foreign' }, credentials: 'include' })
  token = 'refreshed'
  await api('campaign-imports/')
  assert.equal(calls[0][1].headers.Authorization, 'Bearer first')
  assert.equal(calls[0][1].headers['X-Workspace-ID'], 'workspace-a')
  assert.equal(calls[0][1].credentials, 'omit')
  assert.equal(calls[1][1].headers.Authorization, 'Bearer refreshed')
})

test('no Supabase session never falls back to a Django cookie', async () => {
  let called = false
  const api = createApiClient({
    getSession: async () => ({ data: { session: null } }),
    getWorkspaceId: () => null,
    fetchImpl: async () => { called = true },
  })
  await assert.rejects(api('business-profile/'), error => error.code === 'AUTH_REQUIRED')
  assert.equal(called, false)
})

test('expired JWT is surfaced to the auth owner once and not retried as a session request', async () => {
  let invalidated = 0
  let requests = 0
  const api = createApiClient({
    getSession: async () => ({ data: { session: { access_token: 'expired', user: { id: 'u' } } } }),
    getWorkspaceId: () => null,
    onUnauthorized: () => { invalidated += 1 },
    fetchImpl: async () => { requests += 1; return { ok: false, status: 401, json: async () => ({ error: { code: 'INVALID_TOKEN', message: 'Expired' } }) } },
  })
  await assert.rejects(api('auth/session/'), error => error.status === 401)
  assert.equal(requests, 1)
  assert.equal(invalidated, 1)
})
