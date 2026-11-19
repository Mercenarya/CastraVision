import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSupabase } from '../lib/supabase'
import { changeAccountPassword } from './accountSecurityService'
vi.mock('../lib/supabase', () => ({ requireSupabase: vi.fn() }))
describe('password update with a server-normalized user DTO', () => {
  let auth
  beforeEach(() => {
    auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'real-user', email: 'fixture@example.test' } } }), signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'real-user' } } }), updateUser: vi.fn().mockResolvedValue({ data: {} }) }
    requireSupabase.mockReturnValue({ auth })
  })
  it('uses verified Auth identity; no aud property is needed in the Django DTO', async () => {
    await changeAccountPassword('real-user', 'fixture-current', 'fixture-new')
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'fixture@example.test', password: 'fixture-current' })
    expect(auth.updateUser).toHaveBeenCalledOnce()
  })
  it('does not change a different session user or accept an incorrect current password', async () => {
    await expect(changeAccountPassword('other-user', 'fixture-current', 'fixture-new')).rejects.toThrow('xác minh')
    expect(auth.updateUser).not.toHaveBeenCalled()
    auth.signInWithPassword.mockResolvedValue({ error: new Error('invalid') })
    await expect(changeAccountPassword('real-user', 'wrong', 'fixture-new')).rejects.toThrow('hiện tại')
    expect(auth.updateUser).not.toHaveBeenCalled()
  })
  it('propagates a provider reauthentication requirement without reporting success', async () => {
    auth.updateUser.mockResolvedValue({ error: new Error('Reauthentication required') })
    await expect(changeAccountPassword('real-user', 'fixture-current', 'fixture-new')).rejects.toThrow('Reauthentication required')
  })
})
