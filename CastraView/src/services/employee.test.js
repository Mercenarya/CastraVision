import { expect, test, vi } from 'vitest'
import { workflow } from './leaderWorkflow'
import { employeeOverview } from './employee'
import { employeeTasks } from './employeeTasks'

vi.mock('./leaderWorkflow', () => ({ workflow: vi.fn() }))
vi.mock('./employeeTasks', () => ({ employeeTasks: vi.fn() }))
test('overview uses server totals and bounds concurrent requests on small servers', async () => {
  let active = 0
  let maximum = 0
  employeeTasks.mockImplementation(async command => command === 'summary' ? { active: 11 } : { items: [{ id: 'actual-task' }] })
  workflow.mockImplementation(async (command, data) => {
    active++
    maximum = Math.max(maximum, active)
    await new Promise(resolve => setTimeout(resolve, 1))
    active--
    if (command === 'context') return { actor: { id: 'actor' } }
    if (command === 'notifications') return { unreadCount: 4, items: [] }
    return { total: data.status ? 42 : 200, items: [] }
  })
  const result = await employeeOverview(new AbortController().signal)
  expect(maximum).toBeLessThanOrEqual(3)
  expect(result.counts).toEqual({ pending: 42, revision_requested: 42, approved: 42 })
  expect(result.proposals.items).toEqual([])
  expect(result.tasks.summary.active).toBe(11)
})
