import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useEmployeeOverview } from './useEmployeeOverview'
import { employeeOverview } from '../services/employee'

vi.mock('../services/employee', () => ({ employeeOverview: vi.fn() }))

test('late data from the previous identity never appears for the next user', async () => {
  let finishOld
  employeeOverview.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve }))
    .mockResolvedValueOnce({ context: { actor: { fullName: 'New user' } } })
  const { result, rerender } = renderHook(({ identity }) => useEmployeeOverview(identity), { initialProps: { identity: 'old:workspace' } })
  await waitFor(() => expect(finishOld).toBeTypeOf('function'))
  rerender({ identity: 'new:workspace' })
  expect(result.current.data).toBeNull()
  await waitFor(() => expect(result.current.data?.context.actor.fullName).toBe('New user'))
  await act(async () => finishOld({ context: { actor: { fullName: 'Old user' } } }))
  expect(result.current.data.context.actor.fullName).toBe('New user')
})

test('refresh failure clears stale dashboard data and remains retryable', async () => {
  employeeOverview.mockReset().mockResolvedValueOnce({ counts: { pending: 8 } }).mockRejectedValueOnce(new Error('Transport unavailable')).mockResolvedValueOnce({ counts: { pending: 2 } })
  const { result } = renderHook(() => useEmployeeOverview('identity'))
  await waitFor(() => expect(result.current.data?.counts.pending).toBe(8))
  act(() => result.current.refresh())
  await waitFor(() => expect(result.current.error).toBe('Transport unavailable'))
  expect(result.current.data).toBeNull()
  act(() => result.current.refresh())
  await waitFor(() => expect(result.current.data?.counts.pending).toBe(2))
})
