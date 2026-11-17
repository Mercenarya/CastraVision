import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createMembershipService } from './membershipService.js'

test('company directory strips private fields and normalizes pagination', async () => {
  const service = createMembershipService(async path => {
    assert.equal(path, 'onboarding/companies/?search=coffee&limit=20&offset=0')
    return { items: [{ id: 'w', name: 'Coffee', publicDescription: 'Open', owner_id: 'private', email: 'private' }], total: 1, limit: 20, offset: 0 }
  })
  assert.deepEqual(await service.listCompanies({ search: 'coffee' }), {
    items: [{ id: 'w', name: 'Coffee', publicDescription: 'Open' }], total: 1, limit: 20, offset: 0,
  })
})

test('approval never forwards actor, role or a second workspace from caller', async () => {
  const service = createMembershipService(async (path, options) => {
    assert.equal(path, 'workspace/requests/request-id/review/')
    assert.equal(options.method, 'POST')
    assert.deepEqual(JSON.parse(options.body), { decision: 'approve', teamId: null, reason: '' })
    return { id: 'request-id', status: 'approved' }
  })
  assert.equal((await service.reviewJoinRequest('request-id', { decision: 'approve', actorId: 'forged', role: 'admin', workspaceId: 'other' })).status, 'approved')
})

test('invites reject privileged roles before making a request', async () => {
  let called = false
  const service = createMembershipService(async () => { called = true })
  for (const role of ['admin', 'system_admin', 'owner']) {
    await assert.rejects(service.createInvitation({ email: 'a@example.test', role }), /vai trò/i)
  }
  assert.equal(called, false)
})

test('invites normalize email, preserve delivery failure and propagate errors', async () => {
  const service = createMembershipService(async (_path, options) => {
    assert.deepEqual(JSON.parse(options.body), { email: 'a@example.test', role: 'member', teamId: null })
    return { id: 'i', deliveryStatus: 'failed' }
  })
  assert.equal((await service.createInvitation({ email: ' A@EXAMPLE.TEST ' })).deliveryStatus, 'failed')
  const broken = createMembershipService(async () => { throw Object.assign(new Error('offline'), { status: 503 }) })
  await assert.rejects(broken.createInvitation({ email: 'a@example.test' }), e => e.status === 503)
})

test('workspace lists keep signal outside JSON and safely encode query', async () => {
  const controller = new AbortController()
  const service = createMembershipService(async (path, options) => {
    assert.equal(path, 'workspace/personnel/?tab=members&search=a%26b&role=&status=&teamId=&sort=newest&limit=20&offset=0')
    assert.equal(options.signal, controller.signal)
    return { items: [], total: 0, limit: 20, offset: 0 }
  })
  assert.equal((await service.listWorkspacePersonnel({ tab: 'members', search: 'a&b' }, { signal: controller.signal })).total, 0)
})

test('rejection requires reason and duplicate requests rely on server identity', async () => {
  let called = 0
  const service = createMembershipService(async (path, options) => {
    called++
    assert.equal(path, 'onboarding/requests/')
    assert.deepEqual(JSON.parse(options.body), { workspaceId: 'w', message: 'hello' })
    return { id: 'r', status: 'pending' }
  })
  await assert.rejects(service.reviewJoinRequest('r', { decision: 'reject', reason: ' ' }), /lý do/i)
  assert.equal((await service.submitJoinRequest({ workspaceId: 'w', message: 'hello', role: 'admin', applicantId: 'forged' })).id, 'r')
  assert.equal(called, 1)
})
