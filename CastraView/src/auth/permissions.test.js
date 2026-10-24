import { describe, expect, it } from 'vitest'

import { can, canAccessFR04ApprovalQueue, defaultPage } from './permissions'
import { navigationFor } from '../navigation'

describe('actor permission map', () => {
  it('gives Admin governance permissions', () => {
    expect(can('admin', 'members:manage')).toBe(true)
    expect(can('admin', 'approval:write')).toBe(true)
  })

  it('allows Manager operations and proposal governance', () => {
    expect(can('manager', 'campaign:import')).toBe(true)
    expect(can('manager', 'strategy:generate')).toBe(true)
    expect(can('manager', 'members:manage')).toBe(false)
    expect(can('manager', 'approval:write')).toBe(true)
  })

  it('limits Member to shared strategy and content work', () => {
    expect(can('member', 'strategy:read')).toBe(true)
    expect(can('member', 'content:write')).toBe(true)
    expect(can('member', 'campaign:import')).toBe(true)
    expect(can('member', 'strategy:generate')).toBe(false)
    expect(can('member', 'approval:write')).toBe(false)
  })

  it('uses valid workspace landing pages for each actor', () => {
    expect(defaultPage('manager')).toBe('emp-performance')
    expect(defaultPage('admin')).toBe('emp-dashboard')
    expect(defaultPage('member')).toBe('emp-dashboard')
  })

  it('locks navigation to onboarding until the business profile exists', () => {
    expect(navigationFor('admin', true).map(([page]) => page)).toEqual(['onboarding'])
    expect(navigationFor('admin', false).map(([page]) => page)).toContain('emp-approvals')
    expect(navigationFor('manager', false).map(([page]) => page)).toContain('emp-approvals')
    expect(navigationFor('member', false).map(([page]) => page)).not.toContain('emp-approvals')
  })

  it('denies approval access to platform roles and unknown roles', () => {
    expect(canAccessFR04ApprovalQueue({ role: 'company_admin' })).toBe(false)
    expect(canAccessFR04ApprovalQueue({ role: 'system_admin' })).toBe(false)
    expect(canAccessFR04ApprovalQueue({ role: 'unknown' })).toBe(false)
    expect(canAccessFR04ApprovalQueue(null)).toBe(false)
  })
})
