import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readAuthorization } from './sessionContext.js'
const user = '11111111-1111-1111-1111-111111111111'
const ws = '22222222-2222-2222-2222-222222222222'
const another = '33333333-3333-3333-3333-333333333333'
const payload = { version: 1, user: { id: user }, platform_role: null, memberships: [{ workspace_id: ws, role: 'member' }] }

test('authorization is bound to current Supabase identity and contract', () => {
  assert.throws(() => readAuthorization(payload, another))
  assert.throws(() => readAuthorization({ ...payload, version: 0 }, user))
  assert.equal(readAuthorization(payload, user).workspaceId, ws)
})
test('multiple workspaces never silently choose the first; cache is only a selection', () => {
  const multi = { ...payload, memberships: [...payload.memberships, { workspace_id: another, role: 'admin' }] }
  assert.equal(readAuthorization(multi, user).workspaceId, null)
  assert.equal(readAuthorization(multi, user, 'foreign').workspaceId, null)
  assert.equal(readAuthorization(multi, user, another).workspaceId, another)
})
test('signup without membership confers no workspace access', () => {
  const value = readAuthorization({ ...payload, memberships: [] }, user)
  assert.equal(value.workspaceId, null)
  assert.equal(value.memberships.length, 0)
})
test('platform role cannot coexist with business scope; user hints are stripped', () => {
  assert.throws(() => readAuthorization({ ...payload, platform_role: 'system_admin' }, user))
  const value = readAuthorization({ ...payload, user: { id: user, role: 'system_admin', user_metadata: { role: 'system_admin' } } }, user)
  assert.equal(value.user.role, undefined)
  assert.equal(value.user.user_metadata, undefined)
})
