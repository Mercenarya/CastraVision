import { describe, expect, it } from 'vitest'

import { can, defaultPage } from './permissions'

describe('actor permission map', () => {
  it('gives Admin governance permissions', () => {
    expect(can('admin', 'members:manage')).toBe(true)
    expect(can('admin', 'approval:write')).toBe(true)
  })

  it('allows Manager operations but not governance', () => {
    expect(can('manager', 'campaign:import')).toBe(true)
    expect(can('manager', 'strategy:generate')).toBe(true)
    expect(can('manager', 'members:manage')).toBe(false)
    expect(can('manager', 'approval:write')).toBe(false)
  })

  it('limits Member to shared strategy and content work', () => {
    expect(can('member', 'strategy:read')).toBe(true)
    expect(can('member', 'content:write')).toBe(true)
    expect(can('member', 'campaign:import')).toBe(false)
    expect(can('member', 'strategy:generate')).toBe(false)
  })

  it('uses a distinct default dashboard for each actor', () => {
    expect(new Set(['admin', 'manager', 'member'].map(defaultPage)).size).toBe(3)
  })
})
