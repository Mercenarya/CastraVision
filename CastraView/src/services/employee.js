import { workflow } from './leaderWorkflow'
import { employeeTasks } from './employeeTasks'

export async function employeeOverview(signal) {
  const call = (command, data = {}) => workflow(command, data, { signal })
  const context = await call('context')
  const [proposals, campaigns, notifications] = await Promise.all([
    call('proposals', { mine: true, limit: 5 }), call('campaigns', { limit: 5 }),
    call('notifications', { limit: 1 }),
  ])
  const totals = await Promise.all([
    ...['pending', 'revision_requested', 'approved'].map(status => call('proposals', { mine: true, status, limit: 1 })),
  ])
  let tasks = null
  let tasksError = ''
  try {
    const [summary, list] = await Promise.all([employeeTasks('summary', {}, { signal }), employeeTasks('list', { status: 'active', limit: 5 }, { signal })])
    tasks = { summary, items: list.items }
  } catch (cause) { tasksError = cause.message }
  return { context, proposals, campaigns, notifications, tasks, tasksError, counts: Object.fromEntries(['pending', 'revision_requested', 'approved'].map((key, i) => [key, totals[i].total])) }
}
