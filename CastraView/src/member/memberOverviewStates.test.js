import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveMemberOverviewState } from './memberOverviewState.js'

test('loading is shown while the authoritative proposal source is being fetched', () => {
  assert.equal(resolveMemberOverviewState({ status: 'loading' }), 'loading')
})

test('confirmed account proposals select the populated state', () => {
  assert.equal(resolveMemberOverviewState({ status: 'loaded', proposals: [{ id: 'p-1' }] }), 'populated')
})

test('an authoritative empty response selects the no-proposals state', () => {
  assert.equal(resolveMemberOverviewState({ status: 'loaded', proposals: [] }), 'empty')
})

test('unavailable proposal data defaults to the complete illustrative dashboard', () => {
  assert.equal(resolveMemberOverviewState({ status: 'unavailable' }), 'demo')
})

test('proposal loading errors remain distinct from an authoritative empty response', () => {
  assert.equal(resolveMemberOverviewState({ status: 'error' }), 'error')
})

test('unknown proposal status cannot imply an authoritative empty account', () => {
  assert.equal(resolveMemberOverviewState({ status: 'idle' }), 'demo')
})

test('authoritative non-empty proposal data selects the populated mode', () => {
  assert.equal(resolveMemberOverviewState({ status: 'loaded', proposals: [{ id: 'p-1' }] }), 'populated')
})
