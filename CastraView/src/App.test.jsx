import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./lib/supabase', () => ({
  requireSupabase: () => ({
    auth: {
      getSession: async () => ({
        data: { session: { access_token: 'test-access-token' } },
        error: null,
      }),
    },
  }),
}))

import { ContentScreen, ImportScreen } from './App'
import RoleDashboard from './pages/RoleDashboardPage'
vi.mock('./services/api', () => ({ api: vi.fn() }))
import { api } from './services/api'

const profile = {
  business_name: 'Cafe Ông Bụt',
  industry: 'Food & Beverage',
  product_service: 'Cà phê pha máy',
  target_customers: 'nhân viên văn phòng',
}

const strategy = {
  strategy: {
    message: 'Khởi đầu ngày mới bằng một ly cà phê chất lượng.',
    segment: 'Người đi làm 22–35 tuổi',
  },
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RoleDashboard', () => {
  it('renders styled Admin actions and opens the selected feature', async () => {
    const setPage = vi.fn()
    const user = userEvent.setup()
    render(<RoleDashboard role="admin" profile={profile} imports={[]} strategy={null} setPage={setPage} />)

    const members = screen.getByRole('button', { name: /Xem hồ sơ/ })
    await user.click(members)
    expect(setPage).toHaveBeenCalledWith('profile')
  })
})

describe('ContentScreen', () => {
  it('allows users to edit and save a channel card', async () => {
    const user = userEvent.setup()
    render(<ContentScreen result={strategy} profile={profile} setPage={vi.fn()} notify={vi.fn()} />)

    await user.click(screen.getAllByRole('button', { name: '✎ Edit' })[0])
    const title = screen.getByRole('textbox')
    await user.clear(title)
    await user.type(title, 'Cà phê ngon cho ngày mới')
    await user.click(screen.getByRole('button', { name: '✓ Done' }))

    expect(screen.getByText('Cà phê ngon cho ngày mới')).toBeVisible()
  })

  it('refreshes template drafts from the current strategy', async () => {
    const notify = vi.fn()
    const user = userEvent.setup()
    render(<ContentScreen result={strategy} profile={profile} setPage={vi.fn()} notify={notify} />)

    expect(screen.getByRole('heading', { name: /Discover the Difference/ })).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Generate Drafts/ }))

    expect(screen.getByText(/A new choice tailored for you/)).toBeVisible()
    expect(notify).toHaveBeenCalledWith('Creative copy drafts refreshed.')
  })
})

describe('ImportScreen', () => {
  it('previews an upload before committing its data', async () => {
    const response = {
      source: 'sandbox', import_id: 12, filename: 'sandbox.json', row_count: 9,
      success_count: 9, failed_count: 0, errors: [], preview: [],
    }
    api.mockResolvedValue({ ...response, error_count: 0 })
    const onImported = vi.fn().mockResolvedValue(undefined)
    const notify = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<ImportScreen imports={[]} onImported={onImported} notify={notify} />)

    await user.upload(container.querySelector('input[type=file]'), new File(['channel,period\nMeta,2026-09'], 'campaign.csv', { type: 'text/csv' }))
    const commit = await screen.findByRole('button', { name: /Import Data/ })
    expect(commit).toBeEnabled()
    expect(onImported).not.toHaveBeenCalled()
    await user.click(commit)

    await screen.findByRole('heading', { name: 'Drag & drop file here' })
    expect(onImported).toHaveBeenCalledOnce()
    expect(notify).toHaveBeenCalledWith('9 records imported successfully.')
    expect(api).toHaveBeenLastCalledWith('campaign-imports/upload/', expect.objectContaining({ method: 'POST' }))
  })
})
