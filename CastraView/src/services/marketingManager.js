import { requireSupabase } from '../lib/supabase'
import { workflow } from './leaderWorkflow'

const auditColumns = 'id,actor_id,action,entity_type,entity_id,created_at,before_role:before_value->>role,after_role:after_value->>role,before_status:before_value->>status,after_status:after_value->>status'
function unwrap(result) {
  if (result.error) throw new Error('Không thể đọc dữ liệu doanh nghiệp. Vui lòng thử lại.')
  return result
}
export async function listAudit(workspaceId, { offset = 0, limit = 20, action = '', entity = '', from = '', to = '' } = {}, signal) {
  let query = requireSupabase().from('audit_logs').select(auditColumns, { count: 'exact' }).eq('workspace_id', workspaceId)
  if (action) query = query.eq('action', action)
  if (entity) query = query.eq('entity_type', entity)
  if (from) query = query.gte('created_at', `${from}T00:00:00Z`)
  if (to) query = query.lt('created_at', new Date(Date.parse(`${to}T00:00:00Z`) + 86400000).toISOString())
  const result = unwrap(await query.order('created_at', { ascending: false }).order('id').range(offset, offset + limit - 1).abortSignal(signal))
  return { items: result.data, total: result.count }
}
export async function managerSummary(workspaceId, signal) {
  const client = requireSupabase()
  // Membership SELECT intentionally exposes only the caller on some schema versions.
  // Reuse the manager-authorized personnel RPC rather than weakening that policy.
  const countRole = async role => unwrap(await client.rpc('membership_personnel', { p_workspace_id: workspaceId, p_tab: 'members', p_role: role, p_limit: 1 }).abortSignal(signal)).data.total
  const [admins, leaders, employees, pending, recent] = await Promise.all([
    countRole('admin'), countRole('manager'), countRole('member'),
    client.from('approvals').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'pending').abortSignal(signal),
    listAudit(workspaceId, { limit: 5, from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10) }, signal),
  ])
  return { admins, leaders, employees, pending: unwrap(pending).count, recent }
}
export async function searchManager(query, signal) {
  const [campaigns, proposals] = await Promise.all([
    workflow('campaigns', { search: query, limit: 5 }, { signal }),
    workflow('proposals', { search: query, limit: 5 }, { signal }),
  ])
  return [...campaigns.items.map(item => ({ id: item.id, label: item.name, type: 'campaign' })), ...proposals.items.map(item => ({ id: item.id, label: item.title, type: 'proposal' }))]
}
