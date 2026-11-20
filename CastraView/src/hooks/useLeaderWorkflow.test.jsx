import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkflowQuery } from './useLeaderWorkflow'
import { workflow } from '../services/leaderWorkflow'

vi.mock('../services/leaderWorkflow', () => ({ workflow: vi.fn() }))

afterEach(() => { vi.useRealTimers(); vi.resetAllMocks() })
beforeEach(() => localStorage.setItem('castravision_language', 'vi'))

describe('workflow loading lifecycle', () => {
  it('does not send the abandoned StrictMode request', async () => {
    workflow.mockResolvedValue({ items: [{ id: 'campaign' }] })
    const { result } = renderHook(() => useWorkflowQuery('campaigns'), { wrapper: StrictMode })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(workflow).toHaveBeenCalledTimes(1)
    expect(result.current.data.items).toHaveLength(1)
  })

  it('aborts a stale request and ignores its late response', async () => {
    let finishOld
    workflow.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve }))
      .mockResolvedValueOnce({ items: [{ id: 'new' }] })
    const { result, rerender } = renderHook(({ search }) => useWorkflowQuery('campaigns', { search }), { initialProps: { search: 'old' } })
    await waitFor(() => expect(workflow).toHaveBeenCalledTimes(1))
    const signal = workflow.mock.calls[0][2]?.signal
    rerender({ search: 'new' })
    await waitFor(() => expect(result.current.data?.items[0].id).toBe('new'))
    expect(signal?.aborted).toBe(true)
    await act(async () => { finishOld({ items: [{ id: 'old' }] }) })
    expect(result.current.data.items[0].id).toBe('new')
  })

  it('stops loading on a hung request and allows retry', async () => {
    vi.useFakeTimers()
    workflow.mockImplementationOnce(() => new Promise(() => {})).mockResolvedValueOnce({ items: [] })
    const { result } = renderHook(() => useWorkflowQuery('campaigns'))
    await act(async () => { await Promise.resolve() })
    await act(async () => { vi.advanceTimersByTime(30_000) })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toMatch(/quá lâu/)
    expect(workflow.mock.calls[0][2].signal.aborted).toBe(true)
    await act(async () => { result.current.reload() })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('')
    expect(result.current.data).toEqual({ items: [] })
  })
})
