import { expect, test, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useEmployeeTasks } from './useEmployeeTasks'
import { employeeTasks } from '../services/employeeTasks'

vi.mock('../services/employeeTasks', () => ({ employeeTasks: vi.fn() }))
test('changing candidate campaign hides previous Team candidates immediately', async () => {
  employeeTasks.mockResolvedValueOnce({ items: [{ id: 'old-assignee' }] }).mockImplementationOnce(() => new Promise(() => {}))
  const { result, rerender } = renderHook(({ campaignId }) => useEmployeeTasks('candidates', { campaignId }), { initialProps: { campaignId: 'old-campaign' } })
  await waitFor(() => expect(result.current.data?.items[0].id).toBe('old-assignee'))
  rerender({ campaignId: 'new-campaign' })
  expect(result.current.data).toBeNull()
})
