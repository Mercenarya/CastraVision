import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  ApprovalQueuePage,
  AdminDashboardPage,
  MembersPage,
  PerformanceDashboardPage,
} from './ActorPages'

describe('role-specific actor pages', () => {
  it('renders the complete Admin console and routes governance actions', async () => {
    const user = userEvent.setup()
    const setPage = vi.fn()
    render(<AdminDashboardPage profile={{ business_name: 'SneakerVN', industry: 'Thời trang', business_size: 'SME' }} imports={[]} setPage={setPage} notify={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Admin Console' })).toBeVisible()
    expect(screen.getByText('48 sự kiện')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Mở hàng chờ/ }))
    expect(setPage).toHaveBeenCalledWith('approvals')
  })

  it('lets Admin open the invitation workflow and select a role', async () => {
    const user = userEvent.setup()
    const notify = vi.fn()
    render(<MembersPage profile={{ business_name: 'SneakerVN' }} notify={notify} />)

    await user.click(screen.getByRole('button', { name: /Mời thành viên/ }))
    expect(screen.getByRole('dialog', { name: 'Mời thành viên mới' })).toBeVisible()
    await user.type(screen.getByRole('textbox', { name: 'Email thành viên' }), 'new@castravision.vn')
    await user.click(screen.getByRole('radio', { name: /Member/ }))
    await user.click(screen.getByRole('button', { name: 'Gửi lời mời' }))

    expect(screen.getByText('new@castravision.vn')).toBeVisible()
    expect(notify).toHaveBeenCalledWith('Đã tạo lời mời cho new@castravision.vn.')
  })

  it('lets authorized actors review and approve a proposal', async () => {
    const user = userEvent.setup()
    const notify = vi.fn()
    render(<ApprovalQueuePage notify={notify} />)

    await user.click(screen.getAllByRole('button', { name: 'Xem xét' })[0])
    expect(screen.getByRole('heading', { name: 'Đánh giá PRP-8402' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Phê duyệt/ }))

    expect(notify).toHaveBeenCalledWith('PRP-8402 đã được phê duyệt.')
    expect(screen.getAllByText('approved').length).toBeGreaterThan(0)
  })

  it('renders the Manager performance dashboard instead of the Admin console', () => {
    render(<PerformanceDashboardPage setPage={vi.fn()} imports={[]} />)

    expect(screen.getByRole('heading', { name: 'Dashboard hiệu suất chiến dịch' })).toBeVisible()
    expect(screen.getByText('4,82M')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Mở trình tối ưu ngân sách' })).toBeVisible()
  })
})
