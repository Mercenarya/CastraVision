import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import MarketingManagerLayout from './MarketingManagerLayout'
import { LanguageProvider } from '../contexts/LanguageContext'

vi.mock('../services/marketingManager', () => ({
  managerSummary: vi.fn(async () => ({ admins: 1, leaders: 0, employees: 0, pending: 1, recent: { total: 0, items: [] } })),
  searchManager: vi.fn(async search => search.includes('none') ? [] : [{ id: 'actual-proposal', label: 'Saved proposal', type: 'proposal' }]),
}))
vi.mock('../pages/membership/MembershipNotifications', () => ({ default: () => null }))
vi.mock('../leader/WorkflowInbox', () => ({ default: ({ initialId }) => <h2>Review {initialId}</h2> }))

it('keeps search usable after opening a result and hides the underlying dashboard', async () => {
  const user = userEvent.setup()
  render(<LanguageProvider><MarketingManagerLayout user={{ id: 'fixture', full_name: 'Manager' }} membership={{ workspaceId: '11111111-1111-4111-8111-111111111111', workspaceName: 'Actual company', role: 'admin' }} page="overview" setPage={vi.fn()} /></LanguageProvider>)
  const search = screen.getByRole('searchbox', { name: 'Global search' })
  await user.type(search, 'proposal')
  await user.click(await screen.findByRole('button', { name: 'Đề xuất: Saved proposal' }))
  expect(await screen.findByRole('heading', { name: 'Review actual-proposal' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Marketing Manager Dashboard' })).not.toBeInTheDocument()
  await user.type(search, 'none')
  expect(await screen.findByText('Không tìm thấy kết quả.')).toBeInTheDocument()
})
