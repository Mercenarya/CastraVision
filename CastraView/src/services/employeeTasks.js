import { api } from './api'

export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'completed']
export const TASK_LABELS = { todo: 'Chưa bắt đầu', in_progress: 'Đang làm', blocked: 'Đang vướng', completed: 'Hoàn thành', cancelled: 'Đã hủy' }
export async function employeeTasks(command, data = {}, { signal } = {}) {
  const result = await api(`employee/${command}/`, { method: 'POST', body: JSON.stringify(data), signal })
  if (['create', 'update'].includes(command)) window.dispatchEvent(new Event('castra:tasks-changed'))
  return result
}
