import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveActorRole, resolveWorkspaceRole } from './permissions.js'

test('editable metadata and email never grant platform authority', () => {
  for (const user of [
    { id: 'u', email: 'system.audit@example.test' },
    { id: 'u', role: 'system_admin' },
    { id: 'u', user_metadata: { role: 'system_admin' } },
    { id: 'u', app_metadata: { role: 'system_admin' } },
  ]) assert.equal(resolveActorRole(user), null)
})

test('verified workspace membership takes precedence over all user hints', () => {
  const user = { id: 'u', role: 'system_admin', user_metadata: { role: 'system_admin' } }
  assert.equal(resolveActorRole(user, { role: 'member' }), 'member')
  assert.equal(resolveActorRole(user, { role: 'manager' }), 'leader')
  assert.equal(resolveActorRole(user, { role: 'admin' }), 'manager')
})

test('platform authority requires explicit verified authorization context', () => {
  assert.equal(resolveActorRole({ id: 'u' }, null, { platformRole: 'system_admin' }), 'system_admin')
  assert.equal(resolveActorRole(null, null, { platformRole: 'system_admin' }), null)
})

test('workspace permission does not fall back to user role or fabricate membership', () => {
  assert.equal(resolveWorkspaceRole({ role: 'admin' }), null)
  assert.equal(resolveWorkspaceRole({ workspaceRole: 'admin' }), null)
  assert.equal(resolveWorkspaceRole({ id: 'u' }, { role: 'member' }), 'member')
})
