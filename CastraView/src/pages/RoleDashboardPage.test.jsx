import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import RoleDashboardPage from './RoleDashboardPage'

describe('RoleDashboardPage', () => {
  it('shows the manager entry point and supported workflow links', () => {
    render(
      <RoleDashboardPage
        role="manager"
        profile={{ business_name: 'Cafe Ông Bụt', industry: 'F&B', business_size: 'Small' }}
        imports={[]}
        strategy={null}
        setPage={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Dashboard hiệu suất' })).toBeVisible()
    expect(screen.getByRole('button', { name: /Nhập dữ liệu chiến dịch/ })).toBeVisible()
    expect(screen.getByText(/Không có dữ liệu hiệu suất trực tiếp/)).toBeVisible()
  })
})
