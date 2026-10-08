import { describe, expect, it } from 'vitest'

import { explainWorkspaceError } from './workspace'

describe('workspace error messages', () => {
  it('explains a stale Supabase schema cache', () => {
    expect(explainWorkspaceError('Không thể lưu.', { code: 'PGRST204' }))
      .toContain('chưa được đồng bộ')
  })

  it('explains an RLS denial without exposing database details', () => {
    const message = explainWorkspaceError('Không thể lưu.', {
      code: '42501',
      message: 'sensitive row-level security internals',
    })
    expect(message).toContain('không có quyền')
    expect(message).not.toContain('sensitive')
  })
})
