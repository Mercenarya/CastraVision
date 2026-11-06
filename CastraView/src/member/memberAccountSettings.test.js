import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./ui/MemberWorkspacePages.jsx', import.meta.url), 'utf8')
const accountPage = source.split('export function MemberAccountPage')[1].split('export function MemberLegacyPageNotice')[0]

test('Account Settings keeps the real member identity and existing profile-edit action', () => {
  assert.match(accountPage, /user\?\.full_name \|\| user\?\.user_metadata\?\.full_name/)
  assert.match(accountPage, /user\?\.email/)
  assert.match(accountPage, /onClick=\{onEditProfile\}/)
  assert.match(accountPage, /Assigned role/)
  assert.match(accountPage, />Member</)
  assert.doesNotMatch(accountPage, /Elena Rostova|elena\.rostova|David Kross/)
})

test('Account Settings represents Stitch sections without pretending unsupported controls work', () => {
  for (const section of ['Personal Information', 'Active Session', 'Account Security', 'Notification Alerts', 'Workspace Access &amp; Governance']) {
    assert.ok(accountPage.includes(section), `missing ${section}`)
  }
  assert.match(accountPage, /disabled/)
  assert.match(accountPage, /not available|unavailable|not connected/i)
  assert.doesNotMatch(accountPage, /onSubmit=|Save Password/)
  assert.match(accountPage, /Update Password · Unavailable/)
  assert.match(accountPage, /disabled>Update Password/)
})
