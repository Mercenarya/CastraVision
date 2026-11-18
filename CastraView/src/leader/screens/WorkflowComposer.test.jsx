import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import WorkflowComposer from './WorkflowComposer'
import { workflow } from '../../services/leaderWorkflow'

vi.mock('../../services/leaderWorkflow', () => ({ workflow: vi.fn() }))

describe('live content composer', () => {
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
    render(<WorkflowComposer kind="content" onCreated={onCreated} />)
    await screen.findByRole('option', { name: 'Assigned A (USD)' })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Chiến dịch' }), 'campaign-a')
    await user.type(screen.getByRole('textbox', { name: 'Tên đề xuất' }), 'Persist my draft')
    await user.type(screen.getByRole('textbox', { name: /Hook/ }), 'A valid hook for the campaign')
    await user.type(screen.getByRole('textbox', { name: /Headline/ }), 'Headline')
    await user.type(screen.getByRole('textbox', { name: /Body Copy/ }), 'Actual body copy')
    await user.type(screen.getByRole('textbox', { name: /CTA/ }), 'Learn more')
    await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable')
    expect(onCreated).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: /Headline/ })).toHaveValue('Headline')
    await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('saved-proposal'))
    expect(attempts[0].requestId).toBe(attempts[1].requestId)
    expect(attempts[1]).toMatchObject({ campaignId: 'campaign-a', kind: 'ad_content', submit: false, payload: { source: 'manual' } })
    expect(attempts[1]).not.toHaveProperty('role')
    expect(attempts[1]).not.toHaveProperty('actorId')
  })
})
