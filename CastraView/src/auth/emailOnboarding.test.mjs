import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createEmailOnboarding, getOnboardingStep, consumeAuthCallback } from './emailOnboarding.js'

test('email enrollment passes a fixed origin callback and never password or role', async () => {
  const flow = createEmailOnboarding({ origin: 'http://localhost:5173', auth: {
    async signInWithOtp(payload) {
      assert.deepEqual(payload, { email: 'a@example.test', options: { emailRedirectTo: 'http://localhost:5173/auth/complete', shouldCreateUser: true } })
      return { data: {}, error: null }
    },
  } })
  await flow.sendLink(' A@Example.test ', { redirectTo: 'https://attacker.test', role: 'admin', password: 'never-send' })
})

test('invitation reference must be UUID and stays on the same origin', async () => {
  let sent = false
  const flow = createEmailOnboarding({ origin: 'http://localhost:5173', auth: { async signInWithOtp() { sent = true; return { error: null } } } })
  await assert.rejects(flow.sendLink('a@example.test', { invitationId: 'https://attacker.test' }))
  assert.equal(sent, false)
})

test('password confirmation failure never calls Auth and Auth failure remains retryable', async () => {
  let called = 0
  const flow = createEmailOnboarding({ origin: 'http://localhost:5173', auth: { async updateUser() { called++; return { error: { message: 'rejected', status: 503 } } } } })
  await assert.rejects(flow.setPassword('longPassword42!', 'different'))
  assert.equal(called, 0)
  await assert.rejects(flow.setPassword('longPassword42!', 'longPassword42!'))
  assert.equal(called, 1)
})

test('existing password and memberships bypass setup but missing password never does', () => {
  assert.equal(getOnboardingStep({ passwordSetupRequired: false, memberships: [{ role: 'member' }] }), 'workspace')
  assert.equal(getOnboardingStep({ passwordSetupRequired: false, memberships: [] }), 'company')
  assert.equal(getOnboardingStep({ passwordSetupRequired: true, memberships: [{ role: 'member' }] }), 'password')
})

test('expired callback strips secrets without treating an invitation as authorization', async () => {
  const auth = { async getSession() { return { data: { session: null } } } }
  const result = await consumeAuthCallback(auth, 'http://localhost:5173/auth/complete?invitationId=11111111-1111-4111-8111-111111111111#error=access_denied&error_code=otp_expired&access_token=redacted')
  assert.equal(result.cleanPath, '/auth/complete?invitationId=11111111-1111-4111-8111-111111111111')
  assert.equal(result.session, null)
  assert.equal(result.errorCode, 'otp_expired')
})
