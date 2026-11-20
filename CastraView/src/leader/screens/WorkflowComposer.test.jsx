import { LanguageProvider } from '../../contexts/LanguageContext'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import WorkflowComposer from './WorkflowComposer'
import { workflow } from '../../services/leaderWorkflow'

vi.mock('../../services/leaderWorkflow', () => ({ workflow: vi.fn() }))

describe('live content composer', () => {
  it('reports rejected clipboard permission without claiming persistence', async () => {
    workflow.mockClear()
    workflow.mockResolvedValue({ items: [], total: 0 })
    const user = userEvent.setup()
    const clipboard = vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new DOMException('Clipboard permission denied', 'NotAllowedError'))
    const onCreated = vi.fn()
    try {
      localStorage.setItem('castravision_language', 'vi')
      render(<LanguageProvider><WorkflowComposer kind="content" onCreated={onCreated} /></LanguageProvider>)
      await user.click(screen.getByRole('button', { name: 'Sao chép nội dung' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Clipboard permission denied')
      expect(onCreated).not.toHaveBeenCalled()
      expect(workflow.mock.calls.some(([command]) => command === 'submit')).toBe(false)
    } finally { clipboard.mockRestore() }
  })
  it('does not claim a save or navigate when the server rejects persistence; retries preserve the request ID', async () => {
    const attempts = []
    workflow.mockImplementation(async (command, data) => {
      if (command === 'campaigns') return { items: [{ id: 'campaign-a', name: 'Assigned A', currency: 'USD' }], total: 1 }
      if (command === 'proposals') return { items: [], total: 0 }
      attempts.push(data)
      if (attempts.length === 1) throw new Error('Database unavailable')
      return { id: 'saved-proposal' }
    })
    const onCreated = vi.fn()
    const user = userEvent.setup()
    localStorage.setItem('castravision_language', 'vi')
      render(<LanguageProvider><WorkflowComposer kind="content" onCreated={onCreated} /></LanguageProvider>)
    await screen.findByRole('option', { name: 'Assigned A (USD)' })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Chiến dịch' }), 'campaign-a')
    await user.type(screen.getByRole('textbox', { name: 'Tên đề xuất' }), 'Persist my draft')
    await user.type(screen.getByRole('textbox', { name: /Hook/ }), 'A valid hook for the campaign')
    await user.type(screen.getByRole('textbox', { name: /Tiêu đề quảng cáo/ }), 'Headline')
    await user.type(screen.getByRole('textbox', { name: /Nội dung quảng cáo/ }), 'Actual body copy')
    await user.type(screen.getByRole('textbox', { name: /Lời kêu gọi hành động/ }), 'Learn more')
    await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable')
    expect(onCreated).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: /Tiêu đề quảng cáo/ })).toHaveValue('Headline')
    await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('saved-proposal'))
    expect(attempts[0].requestId).toBe(attempts[1].requestId)
    expect(attempts[1]).toMatchObject({ campaignId: 'campaign-a', kind: 'ad_content', submit: false, payload: { source: 'manual' } })
    expect(attempts[1]).not.toHaveProperty('role')
    expect(attempts[1]).not.toHaveProperty('actorId')
  })
})
