import { requireSupabase } from './supabase'

const SIZE_TO_DATABASE = {
  Micro: 'micro',
  Small: 'sme',
  Medium: 'sme',
  Large: 'enterprise',
}
const SIZE_FROM_DATABASE = { micro: 'Micro', sme: 'Small', enterprise: 'Large' }
const CHANNEL_FROM_DATABASE = {
  facebook: 'Meta',
  google: 'Google Ads',
  tiktok: 'TikTok',
}

export function explainWorkspaceError(action, error) {
  const code = error?.code || ''
  const detail = (error?.message || '').toLowerCase()
  if (code === 'PGRST204' || code === '42703' || detail.includes('schema cache')) {
    return `${action} Cấu trúc dữ liệu Supabase chưa được đồng bộ.`
  }
  if (code === '42P10' || detail.includes('unique or exclusion constraint')) {
    return `${action} Database chưa có ràng buộc duy nhất cho Workspace.`
  }
  if (code === '42501' || detail.includes('row-level security')) {
    return `${action} Tài khoản không có quyền thực hiện thao tác này.`
  }
  return `${action}${code ? ` (mã lỗi ${code})` : ''}`
}

function mapBusinessProfile(workspace, row) {
  if (!row) return null
  return {
    business_name: workspace.name,
    industry: row.industry || '',
    business_size: SIZE_FROM_DATABASE[row.company_size] || '',
    target_customers: row.target_customer || '',
    primary_goal: row.primary_goal || '',
    product_service: row.product_service || '',
    preferred_channels: Array.isArray(row.preferred_channels) ? row.preferred_channels : [],
    monthly_budget: Number(row.monthly_budget || 0),
    currency: row.currency || 'VND',
  }
}

function mapCampaignRow(row) {
  const spend = Number(row.spend || 0)
  const impressions = Number(row.impressions || 0)
  const ctr = Number(row.ctr || 0)
  const cpa = Number(row.cpa || 0)
  const roas = Number(row.roas || 0)
  return {
    id: row.id,
    channel: CHANNEL_FROM_DATABASE[row.channel] || 'Other',
    period: row.record_date,
    spend,
    impressions,
    clicks: Math.round(impressions * ctr / 100),
    conversions: cpa > 0 ? Math.round(spend / cpa) : 0,
    revenue: spend * roas,
    created_at: row.created_at,
  }
}

export async function loadWorkspaceData(workspaceId) {
  const client = requireSupabase()
  const [workspaceResult, profileResult, campaignResult] = await Promise.all([
    client.from('workspaces').select('id,name').eq('id', workspaceId).single(),
    client.from('business_profiles').select('*').eq('workspace_id', workspaceId).maybeSingle(),
    client.from('campaign_performance').select('*').eq('workspace_id', workspaceId)
      .order('record_date', { ascending: false }).limit(30),
  ])
  const error = workspaceResult.error || profileResult.error || campaignResult.error
  if (error) throw new Error(explainWorkspaceError('Không thể tải dữ liệu không gian làm việc.', error))
  const rows = (campaignResult.data || []).map(mapCampaignRow)
  const imports = rows.length ? [{
    id: 'supabase-campaign-data',
    filename: 'Dữ liệu chiến dịch Supabase',
    row_count: rows.length,
    created_at: rows[0].created_at,
  }] : []
  return {
    profile: mapBusinessProfile(workspaceResult.data, profileResult.data),
    imports,
    latestRows: rows,
  }
}

export async function createWorkspaceAndProfile(draft) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('create_workspace_with_admin', {
    workspace_name: draft.business_name.trim(),
  })
  if (error || !data?.[0]?.workspace_id) {
    throw new Error(explainWorkspaceError('Không thể tạo không gian làm việc.', error))
  }
  await saveBusinessProfile(data[0].workspace_id, draft, false)
  return data[0].workspace_id
}

export async function saveBusinessProfile(workspaceId, draft, updateWorkspace = true) {
  const client = requireSupabase()
  if (updateWorkspace) {
    const { error: workspaceError } = await client.from('workspaces')
      .update({ name: draft.business_name.trim() }).eq('id', workspaceId)
    if (workspaceError) throw new Error(explainWorkspaceError('Không thể cập nhật tên không gian làm việc.', workspaceError))
  }
  const payload = {
    workspace_id: workspaceId,
    industry: draft.industry.trim(),
    company_size: SIZE_TO_DATABASE[draft.business_size],
    target_customer: draft.target_customers.trim(),
    product_service: draft.product_service.trim(),
    primary_goal: draft.primary_goal.trim(),
    preferred_channels: draft.preferred_channels,
    monthly_budget: Number(draft.monthly_budget || 0),
    currency: draft.currency,
    updated_at: new Date().toISOString(),
  }
  const { error } = await client.from('business_profiles').upsert(
    payload,
    { onConflict: 'workspace_id' },
  )
  if (error) throw new Error(explainWorkspaceError('Không thể lưu hồ sơ doanh nghiệp.', error))
}
