import { requireSupabase } from '../lib/supabase.js'

export const SIZE_TO_DATABASE = {
  Micro: 'micro',
  Small: 'sme',
  Medium: 'sme',
  Large: 'enterprise',
  micro: 'micro',
  sme: 'sme',
  enterprise: 'enterprise',
}

export const SIZE_FROM_DATABASE = {
  micro: 'Micro',
  sme: 'Small',
  enterprise: 'Large',
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidWorkspaceId(id) {
  if (!id || typeof id !== 'string') return false
  return UUID_REGEX.test(id.trim())
}

export function isDemoWorkspaceId(id) {
  return typeof id === 'string' && (id.startsWith('ws-demo') || id === 'default-workspace')
}

export function explainProfileError(action, error) {
  if (!error) return action
  const code = error.code || ''
  const message = (error.message || '').toLowerCase()

  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return `${action} Bạn không có quyền quản trị để thực hiện thao tác này (RLS vi phạm).`
  }
  if (code === '23505' || message.includes('unique constraint') || message.includes('duplicate key')) {
    return `${action} Hồ sơ doanh nghiệp cho không gian làm việc này đã tồn tại.`
  }
  if (code === '22P02' || message.includes('invalid input syntax for type uuid')) {
    return `${action} Mã không gian làm việc (workspace_id) không đúng định dạng UUID.`
  }
  if (code === '23514' || message.includes('check constraint')) {
    return `${action} Dữ liệu không thỏa mãn ràng buộc (ngân sách từ 0 đến 1 tỷ, quy mô hợp lệ).`
  }
  if (code === 'PGRST116' || message.includes('contains 0 rows')) {
    return `${action} Không tìm thấy dữ liệu hồ sơ doanh nghiệp.`
  }

  return `${action} ${error.message || `(mã lỗi ${code || 'UNKNOWN'})`}`
}

export function mapBusinessProfileFromDb(workspace, row) {
  if (!row && !workspace) return null
  return {
    id: row?.id,
    workspace_id: row?.workspace_id || workspace?.id,
    business_name: workspace?.name || '',
    industry: row?.industry || '',
    business_size: SIZE_FROM_DATABASE[row?.company_size] || (row?.company_size ? row.company_size : ''),
    target_customers: row?.target_customer || '',
    primary_goal: row?.primary_goal || '',
    product_service: row?.product_service || '',
    preferred_channels: Array.isArray(row?.preferred_channels) ? row.preferred_channels : [],
    monthly_budget: row?.monthly_budget !== undefined && row?.monthly_budget !== null ? String(row.monthly_budget) : '',
    currency: row?.currency || 'VND',
    created_at: row?.created_at,
    updated_at: row?.updated_at,
  }
}

export function mapBusinessProfileToDb(workspaceId, draft) {
  const companySize = SIZE_TO_DATABASE[draft.business_size] || 'sme'
  const monthlyBudget = Number(draft.monthly_budget || 0)

  return {
    workspace_id: workspaceId,
    industry: (draft.industry || '').trim(),
    company_size: companySize,
    target_customer: (draft.target_customers || '').trim(),
    product_service: (draft.product_service || '').trim(),
    primary_goal: (draft.primary_goal || '').trim(),
    preferred_channels: Array.isArray(draft.preferred_channels) ? draft.preferred_channels : [],
    monthly_budget: Number.isFinite(monthlyBudget) && monthlyBudget >= 0 ? monthlyBudget : 0,
    currency: draft.currency === 'USD' ? 'USD' : 'VND',
    updated_at: new Date().toISOString(),
  }
}

/**
 * Fetch business profile and workspace metadata from Supabase
 */
export async function getBusinessProfile(workspaceId, fallbackName = '') {
  if (!workspaceId) {
    throw new Error('Thiếu workspace_id hợp lệ để truy vấn hồ sơ.')
  }

  // Handle Demo accounts without live Supabase workspace
  if (isDemoWorkspaceId(workspaceId)) {
    return {
      profile: {
        workspace_id: workspaceId,
        business_name: fallbackName || 'CastraVision Demo Workspace',
        industry: 'Fashion & Retail',
        business_size: 'Medium',
        target_customers: 'Modern shoppers aged 20–35 seeking premium apparel',
        primary_goal: 'Multi-channel sales growth across Meta, Google, and TikTok',
        product_service: 'Fashion Apparel & Streetwear',
        preferred_channels: ['Meta', 'Google Ads', 'TikTok'],
        monthly_budget: '50000000',
        currency: 'VND',
      },
      exists: true,
      workspaceName: fallbackName || 'CastraVision Demo Workspace',
    }
  }

  if (!isValidWorkspaceId(workspaceId)) {
    throw new Error(`Workspace ID không hợp lệ: ${workspaceId}`)
  }

  const client = requireSupabase()

  try {
    const [workspaceResult, profileResult] = await Promise.all([
      client.from('workspaces').select('id, name').eq('id', workspaceId).maybeSingle(),
      client.from('business_profiles').select('*').eq('workspace_id', workspaceId).maybeSingle(),
    ])

    if (workspaceResult.error) {
      throw workspaceResult.error
    }
    if (profileResult.error) {
      throw profileResult.error
    }

    const workspaceData = workspaceResult.data || { id: workspaceId, name: fallbackName }
    const exists = Boolean(profileResult.data)

    const mapped = mapBusinessProfileFromDb(workspaceData, profileResult.data)

    return {
      profile: mapped || (workspaceData ? {
        business_name: workspaceData.name || fallbackName,
        industry: '',
        business_size: '',
        target_customers: '',
        primary_goal: '',
        product_service: '',
        preferred_channels: [],
        monthly_budget: '',
        currency: 'VND',
      } : null),
      exists,
      workspaceName: workspaceData.name || fallbackName,
    }
  } catch (error) {
    throw new Error(explainProfileError('Không thể tải thông tin hồ sơ doanh nghiệp.', error))
  }
}

/**
 * Save business profile to Supabase.
 * Strictly checks isManager on client; database RLS enforces admin role server-side.
 */
export async function saveBusinessProfile(workspaceId, draft, isManager = false) {
  if (!isManager) {
    throw new Error('Chỉ Marketing Manager (quản trị viên không gian làm việc) mới có quyền lưu hồ sơ doanh nghiệp.')
  }

  if (!workspaceId) {
    throw new Error('Thiếu workspace_id hợp lệ để lưu hồ sơ.')
  }

  // Validate required client fields
  if (!draft?.business_name?.trim()) {
    throw new Error('Tên doanh nghiệp là bắt buộc.')
  }
  if (!draft?.industry?.trim()) {
    throw new Error('Ngành hàng là bắt buộc.')
  }
  if (!draft?.business_size) {
    throw new Error('Vui lòng chọn quy mô doanh nghiệp.')
  }
  if (!draft?.target_customers?.trim()) {
    throw new Error('Vui lòng mô tả khách hàng mục tiêu.')
  }

  const budgetNum = Number(draft.monthly_budget || 0)
  if (budgetNum < 0 || budgetNum > 1000000000) {
    throw new Error('Ngân sách tiếp thị mỗi tháng phải từ 0 đến 1.000.000.000 (1 tỷ).')
  }

  // Handle Demo accounts without throwing database errors
  if (isDemoWorkspaceId(workspaceId)) {
    return {
      ...draft,
      workspace_id: workspaceId,
      updated_at: new Date().toISOString(),
    }
  }

  if (!isValidWorkspaceId(workspaceId)) {
    throw new Error(`Workspace ID không hợp lệ: ${workspaceId}`)
  }

  const client = requireSupabase()

  try {
    // 1. Synchronize workspace name if changed
    const trimmedName = draft.business_name.trim()
    const { error: workspaceError } = await client
      .from('workspaces')
      .update({ name: trimmedName })
      .eq('id', workspaceId)

    if (workspaceError) {
      throw workspaceError
    }

    // 2. Upsert business profile with unique conflict resolution on workspace_id
    const payload = mapBusinessProfileToDb(workspaceId, draft)
    const { data, error: profileError } = await client
      .from('business_profiles')
      .upsert(payload, { onConflict: 'workspace_id' })
      .select()
      .single()

    if (profileError) {
      throw profileError
    }

    return mapBusinessProfileFromDb({ id: workspaceId, name: trimmedName }, data)
  } catch (error) {
    throw new Error(explainProfileError('Không thể lưu hồ sơ doanh nghiệp.', error))
  }
}
