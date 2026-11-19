import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import BusinessProfileTab from './BusinessProfileTab'
import { getBusinessProfile } from '../../services/businessProfileService'

vi.mock('../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: key => key }) }))
vi.mock('../../services/businessProfileService', () => ({ getBusinessProfile: vi.fn(), saveBusinessProfile: vi.fn() }))
const profile = { business_name: 'Test business', industry: 'Retail', business_size: 'Small', target_customers: 'Adults', preferred_channels: [] }
const membership = { workspaceId: 'a', workspaceName: 'Test business', role: 'admin' }

describe('business profile lifecycle', () => {
  beforeEach(() => vi.clearAllMocks())
  it('does not refetch or discard edits when parent receives a new profile object', async () => {
    getBusinessProfile.mockResolvedValue({ profile, exists: true })
    const updated = vi.fn()
    const view = render(<BusinessProfileTab membership={membership} actorRole="manager" profile={profile} onProfileUpdated={updated} />)
    await waitFor(() => expect(updated).toHaveBeenCalledOnce())
    const input = screen.getByLabelText(/Tên doanh nghiệp \/ Workspace/)
    await userEvent.type(input, ' edited')
    view.rerender(<BusinessProfileTab membership={membership} actorRole="manager" profile={{ ...profile }} onProfileUpdated={vi.fn()} />)
    await waitFor(() => expect(getBusinessProfile).toHaveBeenCalledTimes(1))
    expect(input).toHaveValue('Test business edited')
  })

  it('ignores a previous workspace response after switching workspace', async () => {
    let finishA
    getBusinessProfile.mockImplementation(id => id === 'a' ? new Promise(resolve => { finishA = resolve }) : Promise.resolve({ profile: { ...profile, business_name: 'Business B' }, exists: true }))
    const updated = vi.fn()
    const view = render(<BusinessProfileTab membership={membership} actorRole="manager" onProfileUpdated={updated} />)
    await waitFor(() => expect(getBusinessProfile).toHaveBeenCalledOnce())
    view.rerender(<BusinessProfileTab membership={{ ...membership, workspaceId: 'b' }} actorRole="manager" onProfileUpdated={updated} />)
    await screen.findByDisplayValue('Business B')
    finishA({ profile: { ...profile, business_name: 'Business A' }, exists: true })
    await waitFor(() => expect(screen.queryByDisplayValue('Business A')).not.toBeInTheDocument())
    expect(updated).toHaveBeenCalledTimes(1)
  })

  it('shows load errors instead of presenting stale initial data as a successful load', async () => {
    getBusinessProfile.mockRejectedValue(new Error('Load denied'))
    render(<BusinessProfileTab membership={membership} actorRole="manager" profile={profile} />)
    expect(await screen.findByText('Load denied')).toBeInTheDocument()
  })

  it('retains edits and does not notify success when the parent save rejects', async () => {
    getBusinessProfile.mockResolvedValue({ profile, exists: true })
    const save = vi.fn().mockRejectedValue(new Error('Save denied'))
    const notify = vi.fn()
    render(<BusinessProfileTab membership={membership} actorRole="manager" saveProfile={save} notify={notify} />)
    const input = await screen.findByLabelText('Sản phẩm / dịch vụ chính')
    await userEvent.type(input, 'Keep this unsaved edit')
    await userEvent.click(screen.getByRole('button', { name: 'common.save' }))
    expect(await screen.findByText('Save denied')).toBeInTheDocument()
    expect(input).toHaveValue('Keep this unsaved edit')
    expect(notify).not.toHaveBeenCalled()
    expect(screen.queryByText('Đã lưu hồ sơ doanh nghiệp vào Supabase thành công.')).not.toBeInTheDocument()
  })
})
