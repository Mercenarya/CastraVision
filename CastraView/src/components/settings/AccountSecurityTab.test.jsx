import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { AccountSecurityTab } from './AccountSecurityTab'
import { LanguageProvider } from '../../contexts/LanguageContext'
import { supabase } from '../../lib/supabase'

// Real installed SDK/PostgREST builder; only the network boundary is simulated.
const transport = vi.hoisted(() => ({ rows: [{ id: '11111111-1111-4111-8111-111111111111' }], calls: [] }))
vi.mock('../../lib/supabase', async () => {
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient('http://127.0.0.1:54321', 'sdk-contract-fixture', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (url, options) => {
      transport.calls.push({ url: String(url), method: options.method })
      return new Response(JSON.stringify(transport.rows), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } },
  })
  client.auth.updateUser = vi.fn(async () => ({ data: { user: { id: '11111111-1111-4111-8111-111111111111' } }, error: null }))
  return { supabase: client }
})

beforeEach(() => {
  transport.calls = []
  transport.rows = [{ id: '11111111-1111-4111-8111-111111111111' }]
  localStorage.setItem('castravision_language', 'en')
})

async function save() {
  render(<LanguageProvider><AccountSecurityTab role="system_admin" user={{ id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', email: 'fixture@example.test', full_name: 'Operator' }} /></LanguageProvider>)
  await userEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
}

it('updates public profile through the installed SDK and only reports full success after read-back', async () => {
  await save()
  expect(await screen.findByText('Personal information and public profile saved successfully.')).toBeInTheDocument()
  expect(transport.calls.some(call => call.method === 'PATCH' && call.url.includes('/rest/v1/profiles'))).toBe(true)
})

it('reports partial success when Auth saved but the profile update returned no row', async () => {
  transport.rows = []
  await save()
  expect(await screen.findByText(/Account information was saved, but public profile synchronization failed/)).toBeInTheDocument()
  expect(screen.queryByText('Personal information and public profile saved successfully.')).not.toBeInTheDocument()
})

it('does not update public profile after Auth rejects the save', async () => {
  supabase.auth.updateUser.mockResolvedValueOnce({ data: {}, error: { message: 'Session expired' } })
  await save()
  expect(await screen.findByText(/Account update failed: Session expired/)).toBeInTheDocument()
  expect(transport.calls).toEqual([])
})
