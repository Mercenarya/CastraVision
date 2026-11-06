import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const shell = readFileSync(new URL('./ui/MemberShell.jsx', import.meta.url), 'utf8')

test('Member header exposes an avatar-triggered account menu with existing destinations', () => {
  assert.match(shell, /aria-haspopup="menu"/)
  assert.match(shell, /aria-expanded=\{accountMenuOpen\}/)
  assert.match(shell, /Account Settings/)
  assert.match(shell, /onClick=\{logout\}/)
  assert.match(shell, /window\.addEventListener\('mousedown'/)
  assert.match(shell, /event\.key === 'Escape'/)
  assert.doesNotMatch(shell, /member-shell__signout/)
})

test('Member header bell navigates to the existing notifications destination without a count', () => {
  assert.match(shell, /onClick=\{\(\) => navigate\('notifications'\)\}/)
  assert.doesNotMatch(shell, /notificationCount/)
})
