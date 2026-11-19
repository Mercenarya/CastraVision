import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../../contexts/LanguageContext'
import WorkflowAccount from './WorkflowAccount'
import { workflow } from '../../services/leaderWorkflow'

vi.mock('../../services/leaderWorkflow', () => ({ workflow: vi.fn() }))

describe('Leader settings after UI import', () => {
  it('keeps profile saving through the scoped RPC inside the new Settings tabs', async () => {
    workflow.mockResolvedValue({ fullName: 'Updated Leader' })
    const changed = vi.fn()
    const user = userEvent.setup()
    render(<WorkflowAccount context={{
      actor: { id: 'leader-user', email: 'leader@example.test', fullName: 'Demo Leader', avatarUrl: '' },
      workspace: { id: 'workspace-a', name: 'Demo Workspace' }, role: 'manager',
    }} onChanged={changed} />, { wrapper: LanguageProvider })
    const name = screen.getByRole('textbox', { name: 'Họ tên' })
    await user.clear(name)
    await user.type(name, 'Updated Leader')
    await user.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
    await waitFor(() => expect(changed).toHaveBeenCalledOnce())
    expect(workflow).toHaveBeenCalledWith('save_profile', { fullName: 'Updated Leader', avatarUrl: '' })
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu hồ sơ.')
  })
})
