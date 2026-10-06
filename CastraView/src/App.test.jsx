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

describe('ContentScreen', () => {
  it('allows users to edit and save a channel card', async () => {
    const user = userEvent.setup()
    render(<ContentScreen result={strategy} profile={profile} setPage={vi.fn()} notify={vi.fn()} />)

    await user.click(screen.getAllByRole('button', { name: '✎ Sửa' })[0])
    const title = screen.getByRole('textbox', { name: 'TIÊU ĐỀ / HOOK' })
    await user.clear(title)
    await user.type(title, 'Cà phê ngon cho ngày mới')
    await user.click(screen.getByRole('button', { name: '✓ Lưu' }))

    expect(screen.getByRole('heading', { name: 'Cà phê ngon cho ngày mới' })).toBeVisible()
  })

  it('regenerates only the selected channel', async () => {
    const notify = vi.fn()
    const user = userEvent.setup()
    render(<ContentScreen result={strategy} profile={profile} setPage={vi.fn()} notify={notify} />)

    expect(screen.getByRole('heading', { name: /Khám phá điều khác biệt/ })).toBeVisible()
    await user.click(screen.getAllByRole('button', { name: '↻ Tạo lại' })[0])

    expect(screen.getByRole('heading', { name: /Ưu đãi dành riêng cho bạn/ })).toBeVisible()
    expect(notify).toHaveBeenCalledWith('Đã tạo lại nội dung cho kênh Meta.')
  })
})

describe('ImportScreen', () => {
  it('synchronizes Sandbox data and displays the import report', async () => {
    const response = {
      source: 'sandbox', import_id: 12, filename: 'sandbox.json', row_count: 9,
      success_count: 9, failed_count: 0, errors: [], preview: [],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
    }))
    const onImported = vi.fn().mockResolvedValue(undefined)
    const notify = vi.fn()
    const user = userEvent.setup()
    render(<ImportScreen imports={[]} onImported={onImported} notify={notify} />)

    await user.click(screen.getByRole('button', { name: /Đồng bộ từ Sandbox/ }))

    expect(await screen.findByRole('heading', { name: 'Đồng bộ Sandbox hoàn tất' })).toBeVisible()
    expect(screen.getByText('9')).toBeVisible()
    expect(screen.getByText('Dòng thành công')).toBeVisible()
    expect(onImported).toHaveBeenCalledOnce()
    expect(notify).toHaveBeenCalledWith('Đã đồng bộ 9 dòng từ Sandbox.')
  })
})
