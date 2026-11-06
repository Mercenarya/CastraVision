import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ROLE_LABELS, resolveActorRole } from '../auth/permissions.js'
import {
  MEMBER_NAV_ITEMS,
  getMemberPageFromHash,
  getMemberPageHash,
  normalizeMemberPage,
} from './memberContract.js'

test('member terminology keeps legacy employee role identifiers intact', () => {
  assert.equal(ROLE_LABELS.member, 'Member')
  assert.equal(resolveActorRole({ role: 'employee' }), 'member')
})

test('member navigation exposes the standardized workspace pages in order', () => {
  assert.deepEqual(
    MEMBER_NAV_ITEMS.map((item) => item.key),
    ['overview', 'proposals', 'campaigns', 'strategy', 'content', 'import', 'notifications', 'account'],
  )
})

test('member navigation uses the Sidebar reference icon vocabulary', () => {
  assert.deepEqual(
    MEMBER_NAV_ITEMS.map((item) => item.icon),
    ['dashboard', 'description', 'campaign', 'explore', 'auto_awesome', 'cloud_upload', 'notifications', 'settings'],
  )
})

test('notifications are a shared sidebar destination with the existing page key', () => {
  const notifications = MEMBER_NAV_ITEMS.find((item) => item.key === 'notifications')
  assert.deepEqual(notifications, { key: 'notifications', icon: 'notifications', label: 'Notifications' })
  assert.equal(normalizeMemberPage('notifications'), 'notifications')
})

test('Member page history restores recognized pages and profile editing', () => {
  assert.equal(getMemberPageFromHash('#member/notifications'), 'notifications')
  assert.equal(getMemberPageFromHash('#member/profile'), 'profile')
  assert.equal(getMemberPageFromHash(''), 'overview')
  assert.equal(getMemberPageHash('notifications'), '#member/notifications')
  assert.equal(getMemberPageHash('profile'), '#member/profile')
})

test('member dashboard aliases resolve to the visible overview page', () => {
  assert.equal(normalizeMemberPage('member-dashboard'), 'overview')
  assert.equal(normalizeMemberPage('profile'), 'account')
  assert.equal(normalizeMemberPage('unknown-page'), 'overview')
  assert.equal(normalizeMemberPage('strategy'), 'strategy')
})
