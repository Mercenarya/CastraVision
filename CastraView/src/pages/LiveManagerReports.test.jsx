import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import LiveManagerReports from './LiveManagerReports'
import { workflow } from '../services/leaderWorkflow'
import { createReport, downloadReport, reportHistory } from '../services/managerTools'

vi.mock('../services/leaderWorkflow', () => ({ workflow: vi.fn() }))
vi.mock('../services/managerTools', () => ({ createReport: vi.fn(), downloadReport: vi.fn(), reportHistory: vi.fn(), getReportFile: vi.fn() }))
describe('real report submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    workflow.mockResolvedValue({ items: [{ id: 'a', name: 'Actual campaign', currency: 'VND' }], total: 1 })
    reportHistory.mockResolvedValue({ items: [], hasMore: false })
  })
  it('preserves selection and request ID after server failure and never downloads fake success', async () => {
    createReport.mockRejectedValueOnce(new Error('Database unavailable')).mockResolvedValue({ id: 'persisted', format: 'csv', contentBase64: 'ZmlsZQ==', filename: 'real.csv' })
    const user = userEvent.setup()
    render(<LiveManagerReports workspaceId="w" />)
    await user.click(await screen.findByRole('checkbox', { name: 'Actual campaign (VND)' }))
    await user.click(screen.getByRole('button', { name: 'Xuất CSV' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable')
    expect(downloadReport).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox', { name: 'Actual campaign (VND)' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Xuất CSV' }))
    await waitFor(() => expect(downloadReport).toHaveBeenCalledOnce())
    expect(createReport.mock.calls[0][0].requestId).toBe(createReport.mock.calls[1][0].requestId)
    expect(createReport.mock.calls[1][0].campaignIds).toEqual(['a'])
    expect(createReport.mock.calls[1][0]).not.toHaveProperty('workspace_id')
  })
})
