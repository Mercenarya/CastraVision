import React, { useState, useEffect, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Building2,
  Save,
  RotateCcw,
  AlertCircle,
  Info,
  DollarSign,
  Layers,
  Eye,
  Lock,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import ChannelPicker from '@/components/ChannelPicker'
import { SIZES } from '@/utils/constants'
import {
  getBusinessProfile,
  saveBusinessProfile as persistBusinessProfile,
} from '@/services/businessProfileService'

const EMPTY_PROFILE = {
  business_name: '',
  industry: '',
  business_size: '',
  target_customers: '',
  primary_goal: '',
  product_service: '',
  preferred_channels: [],
  monthly_budget: '',
  currency: 'VND',
}

/**
 * BusinessProfileTab
 * Shared Workspace Business Profile tab:
 * - Marketing Manager (workspace admin): Full read & write permissions.
 * - Leader (workspace manager): Read-only view.
 * - Employee (workspace member): Read-only view.
 * - System Admin: Denied / Hidden at page level.
 */
export function BusinessProfileTab({
  user,
  actorRole = 'member',
  membership,
  profile: initialProfile,
  saveProfile,
  busy = false,
  error = '',
  notify,
  onProfileUpdated,
}) {
  // Authoritative edit permission: strictly Marketing Manager with admin membership
  const canEdit = useMemo(() => {
    if (actorRole !== 'manager') return false
    if (membership?.role === 'admin') return true
    if (import.meta.env.DEV && user?.demoRole === 'manager') return true
    return false
  }, [actorRole, membership, user])

  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExistingProfile, setIsExistingProfile] = useState(true)
  const [draft, setDraft] = useState(initialProfile || EMPTY_PROFILE)
  const [originalData, setOriginalData] = useState(initialProfile || EMPTY_PROFILE)
  const [hasChanges, setHasChanges] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [localSuccess, setLocalSuccess] = useState('')

  const workspaceId = membership?.workspaceId
  const workspaceName = membership?.workspaceName || draft.business_name || 'CastraVision Workspace'

  // Load profile from Supabase on mount or when workspace changes
  const loadProfile = useCallback(async () => {
    if (!workspaceId) return

    setLoading(true)
    setFetchError('')
    try {
      const result = await getBusinessProfile(workspaceId, workspaceName)
      if (result?.profile) {
        setDraft(result.profile)
        setOriginalData(result.profile)
        setIsExistingProfile(result.exists)
        setHasChanges(false)
        if (onProfileUpdated) {
          onProfileUpdated(result.profile)
        }
      } else {
        setIsExistingProfile(false)
      }
    } catch (err) {
      // In demo mode or offline, fallback to initialProfile
      if (initialProfile) {
        setDraft(initialProfile)
        setOriginalData(initialProfile)
        setIsExistingProfile(true)
      } else {
        setFetchError(err.message || 'Không thể tải hồ sơ doanh nghiệp.')
      }
    } finally {
      setLoading(false)
    }
  }, [workspaceId, workspaceName, initialProfile, onProfileUpdated])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const setField = (key, value) => {
    if (!canEdit) return
    setDraft((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setValidationError('')
    setLocalSuccess('')
  }

  const toggleChannel = (channel) => {
    if (!canEdit) return
    setDraft((prev) => {
      const current = prev.preferred_channels || []
      const updated = current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel]
      return { ...prev, preferred_channels: updated }
    })
    setHasChanges(true)
    setValidationError('')
    setLocalSuccess('')
  }

  const handleReset = () => {
    setDraft(originalData)
    setHasChanges(false)
    setValidationError('')
    setLocalSuccess('')
    if (notify) notify('Đã hoàn tác thay đổi hồ sơ doanh nghiệp.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canEdit) {
      setValidationError('Tài khoản của bạn chỉ có quyền xem hồ sơ doanh nghiệp.')
      return
    }

    setValidationError('')
    setLocalSuccess('')

    // Client-side validations
    if (!draft.business_name?.trim()) {
      setValidationError('Tên doanh nghiệp là bắt buộc.')
      return
    }
    if (!draft.industry?.trim()) {
      setValidationError('Ngành hàng là bắt buộc.')
      return
    }
    if (!draft.business_size) {
      setValidationError('Vui lòng chọn quy mô doanh nghiệp.')
      return
    }
    if (!draft.target_customers?.trim()) {
      setValidationError('Vui lòng mô tả khách hàng mục tiêu.')
      return
    }

    const budgetNum = Number(draft.monthly_budget || 0)
    if (budgetNum < 0 || budgetNum > 1000000000) {
      setValidationError('Ngân sách hàng tháng phải từ 0 đến 1.000.000.000 (1 tỷ VND).')
      return
    }

    setIsSaving(true)
    try {
      let savedResult
      if (saveProfile) {
        // Parent-provided save handler
        await saveProfile(draft)
        savedResult = draft
      } else {
        // Direct Supabase service call
        savedResult = await persistBusinessProfile(workspaceId, draft, canEdit)
      }

      setOriginalData(savedResult || draft)
      setDraft(savedResult || draft)
      setHasChanges(false)
      setIsExistingProfile(true)
      setLocalSuccess('Đã lưu hồ sơ doanh nghiệp vào Supabase thành công.')
      if (notify) notify('Lưu hồ sơ doanh nghiệp thành công.')
      if (onProfileUpdated) onProfileUpdated(savedResult || draft)
    } catch (saveErr) {
      setValidationError(saveErr.message || 'Không thể lưu hồ sơ doanh nghiệp.')
    } finally {
      setIsSaving(false)
    }
  }

  const isActionBusy = busy || isSaving || loading

  return (
    <div className="bg-[#1c1f2a] rounded-xl border border-[#464554] overflow-hidden flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#464554] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171b26]/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8083ff]/15 border border-[#8083ff]/30 flex items-center justify-center text-[#8083ff]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#dfe2f1]">
                Hồ sơ doanh nghiệp (Business Profile)
              </h2>
              {canEdit ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#8083ff]/15 text-[#8083ff] border border-[#8083ff]/30">
                  MANAGER (TOÀN QUYỀN)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  CHẾ ĐỘ CHỈ XEM (READ ONLY)
                </span>
              )}
            </div>
            <p className="text-xs text-[#c7c4d7] mt-0.5">
              {canEdit
                ? 'Cấu hình thông tin nhận diện thương hiệu, khách hàng mục tiêu và ngân sách tiếp thị.'
                : 'Xem thông tin nhận diện thương hiệu và ngân sách tiếp thị của không gian làm việc.'}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        {canEdit ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges || isActionBusy}
              className="px-4 py-2 rounded-lg border border-[#464554] hover:bg-[#353944] text-[#dfe2f1] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hoàn tác</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isActionBusy}
              className="px-5 py-2 rounded-lg bg-[#28a745] hover:bg-[#218838] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Đang lưu…' : isExistingProfile ? 'Lưu hồ sơ ✓' : 'Khởi tạo hồ sơ ✓'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#262a35] border border-[#464554] text-xs text-[#c7c4d7]">
            <Lock className="w-3.5 h-3.5 text-[#ffb4ab]" />
            <span>Quyền xem: {membership?.role?.toUpperCase() || actorRole?.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Integration Notice Strip */}
      <div className="mx-6 mt-6 p-3.5 rounded-lg bg-[#262a35] border border-[#464554] text-xs text-[#dfe2f1] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#4cd7f6] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[#4cd7f6]">Dữ liệu không gian làm việc Supabase (RLS Scoped)</p>
          <p className="text-[#c7c4d7]">
            Hồ sơ doanh nghiệp được lưu trữ trong bảng <code className="text-[#8083ff] font-mono">public.business_profiles</code>,
            gắn trực tiếp với Không gian làm việc (<code className="text-[#8083ff] font-mono">{workspaceName}</code>) và bảo vệ bằng Row Level Security.
            {!canEdit && ' Tài khoản của bạn không có quyền cập nhật hồ sơ này.'}
          </p>
        </div>
      </div>

      {/* Read-Only Notice for Leader / Member */}
      {!canEdit && (
        <div className="mx-6 mt-4 p-3.5 rounded-lg bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-xs text-[#dfe2f1] flex items-start gap-2.5">
          <Eye className="w-4 h-4 text-[#4cd7f6] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#4cd7f6]">Chế độ chỉ xem: </span>
            <span className="text-[#c7c4d7]">
              Bạn đang xem hồ sơ doanh nghiệp dùng chung của toàn bộ Không gian làm việc. Chỉ tài khoản Marketing Manager (quản trị viên) mới có quyền chỉnh sửa và lưu thay đổi.
            </span>
          </div>
        </div>
      )}

      {/* Empty State Banner when no profile exists in DB */}
      {!isExistingProfile && !loading && (
        <div className="mx-6 mt-4 p-3.5 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-xs text-[#dfe2f1] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#ffb4ab] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#ffb4ab]">Hồ sơ chưa khởi tạo: </span>
            <span className="text-[#c7c4d7]">
              {canEdit
                ? 'Không gian làm việc này chưa có hồ sơ doanh nghiệp. Vui lòng điền thông tin và bấm "Khởi tạo hồ sơ" để lưu bản ghi đầu tiên.'
                : 'Không gian làm việc chưa được thiết lập hồ sơ doanh nghiệp. Vui lòng liên hệ Marketing Manager để hoàn tất thiết lập.'}
            </span>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {localSuccess && (
        <div className="mx-6 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 bg-[#28a745]/15 text-[#28a745] border border-[#28a745]/30">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{localSuccess}</span>
        </div>
      )}

      {/* Error Banners */}
      {(validationError || fetchError || error) && (
        <div className="mx-6 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError || fetchError || error}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-[#c7c4d7]">
          <Loader2 className="w-6 h-6 animate-spin text-[#8083ff]" />
          <span className="text-sm">Đang tải hồ sơ doanh nghiệp từ Supabase…</span>
        </div>
      ) : (
        /* Form Content */
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Thông tin cơ bản */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#464554]/40">
              <Building2 className="w-4 h-4 text-[#8083ff]" />
              <h3 className="text-xs font-bold text-[#dfe2f1] uppercase font-mono tracking-wider">
                1. Thông tin doanh nghiệp
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tên doanh nghiệp */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="biz-name" className="text-xs font-medium text-[#c7c4d7]">
                  Tên doanh nghiệp / Workspace <span className="text-[#ffb4ab]">*</span>
                </label>
                <input
                  id="biz-name"
                  type="text"
                  required
                  disabled={!canEdit || isSaving}
                  minLength={2}
                  maxLength={120}
                  value={draft.business_name || ''}
                  onChange={(e) => setField('business_name', e.target.value)}
                  placeholder="Ví dụ: SneakerX Việt Nam hoặc Acme Corp"
                  className="w-full h-11 px-3.5 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Ngành hàng */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="biz-industry" className="text-xs font-medium text-[#c7c4d7]">
                  Ngành hàng <span className="text-[#ffb4ab]">*</span>
                </label>
                <input
                  id="biz-industry"
                  type="text"
                  required
                  disabled={!canEdit || isSaving}
                  minLength={2}
                  maxLength={120}
                  value={draft.industry || ''}
                  onChange={(e) => setField('industry', e.target.value)}
                  placeholder="Ví dụ: Thời trang, F&B, Bán lẻ…"
                  className="w-full h-11 px-3.5 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Quy mô doanh nghiệp */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="biz-size" className="text-xs font-medium text-[#c7c4d7]">
                  Quy mô doanh nghiệp <span className="text-[#ffb4ab]">*</span>
                </label>
                <select
                  id="biz-size"
                  required
                  disabled={!canEdit || isSaving}
                  value={draft.business_size || ''}
                  onChange={(e) => setField('business_size', e.target.value)}
                  className="w-full h-11 px-3.5 bg-[#0a0e18] text-[#dfe2f1] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn quy mô nhân sự...</option>
                  {Object.entries(SIZES).map(([val, label]) => (
                    <option key={val} value={val}>
                      {val} ({label})
                    </option>
                  ))}
                </select>
              </div>

              {/* Khách hàng mục tiêu */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="biz-target" className="text-xs font-medium text-[#c7c4d7]">
                  Khách hàng mục tiêu <span className="text-[#ffb4ab]">*</span>
                </label>
                <textarea
                  id="biz-target"
                  required
                  disabled={!canEdit || isSaving}
                  minLength={3}
                  maxLength={500}
                  rows={3}
                  value={draft.target_customers || ''}
                  onChange={(e) => setField('target_customers', e.target.value)}
                  placeholder="Mô tả nhóm tuổi, hành vi, sở thích, phân khúc khách hàng..."
                  className="w-full p-3.5 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Mục tiêu & Chiến lược */}
          <div className="space-y-4 pt-4 border-t border-[#464554]/50">
            <div className="flex items-center gap-2 pb-2 border-b border-[#464554]/40">
              <DollarSign className="w-4 h-4 text-[#4cd7f6]" />
              <h3 className="text-xs font-bold text-[#dfe2f1] uppercase font-mono tracking-wider">
                2. Mục tiêu & Ngân sách tiếp thị
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sản phẩm / Dịch vụ */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="biz-product" className="text-xs font-medium text-[#c7c4d7]">
                  Sản phẩm / dịch vụ chính
                </label>
                <input
                  id="biz-product"
                  type="text"
                  disabled={!canEdit || isSaving}
                  maxLength={500}
                  value={draft.product_service || ''}
                  onChange={(e) => setField('product_service', e.target.value)}
                  placeholder="Sản phẩm hoặc dịch vụ trọng tâm sẽ quảng bá..."
                  className="w-full h-11 px-3.5 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Mục tiêu chính */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="biz-goal" className="text-xs font-medium text-[#c7c4d7]">
                  Mục tiêu tiếp thị chính
                </label>
                <input
                  id="biz-goal"
                  type="text"
                  disabled={!canEdit || isSaving}
                  maxLength={300}
                  value={draft.primary_goal || ''}
                  onChange={(e) => setField('primary_goal', e.target.value)}
                  placeholder="Ví dụ: Tăng trưởng doanh thu đa kênh, tối ưu ROAS..."
                  className="w-full h-11 px-3.5 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Ngân sách hàng tháng */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="biz-budget" className="text-xs font-medium text-[#c7c4d7]">
                  Ngân sách mỗi tháng
                </label>
                <input
                  id="biz-budget"
                  type="number"
                  disabled={!canEdit || isSaving}
                  min="0"
                  max="1000000000"
                  value={draft.monthly_budget || ''}
                  onChange={(e) => setField('monthly_budget', e.target.value)}
                  placeholder="Ví dụ: 50000000"
                  className="w-full h-11 px-3.5 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Đơn vị tiền */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="biz-currency" className="text-xs font-medium text-[#c7c4d7]">
                  Đơn vị tiền tệ
                </label>
                <select
                  id="biz-currency"
                  disabled={!canEdit || isSaving}
                  value={draft.currency || 'VND'}
                  onChange={(e) => setField('currency', e.target.value)}
                  className="w-full h-11 px-3.5 bg-[#0a0e18] text-[#dfe2f1] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="VND">VND (Việt Nam Đồng)</option>
                  <option value="USD">USD (Đô la Mỹ)</option>
                </select>
              </div>

              {/* Kênh tiếp thị ưu tiên */}
              <div className="sm:col-span-2 pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-[#8083ff]" />
                  <span className="text-xs font-medium text-[#c7c4d7]">
                    Kênh tiếp thị ưu tiên
                  </span>
                  {!canEdit && (
                    <span className="text-[10px] text-[#908fa0] italic">(Chỉ xem)</span>
                  )}
                </div>
                <div className={!canEdit ? 'pointer-events-none opacity-85' : ''}>
                  <ChannelPicker
                    channels={draft.preferred_channels || []}
                    toggle={canEdit ? toggleChannel : () => {}}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          {canEdit && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#464554]/60">
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasChanges || isActionBusy}
                className="px-4 py-2 rounded-lg border border-[#464554] hover:bg-[#262a35] text-[#dfe2f1] text-sm font-medium transition-colors disabled:opacity-50"
              >
                Hủy thay đổi
              </button>
              <button
                type="submit"
                disabled={isActionBusy}
                className="px-5 py-2 rounded-lg bg-[#28a745] hover:bg-[#218838] text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Đang lưu…' : isExistingProfile ? 'Lưu hồ sơ ✓' : 'Khởi tạo hồ sơ ✓'}</span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  )
}

BusinessProfileTab.propTypes = {
  user: PropTypes.object,
  actorRole: PropTypes.string,
  membership: PropTypes.object,
  profile: PropTypes.object,
  saveProfile: PropTypes.func,
  busy: PropTypes.bool,
  error: PropTypes.string,
  notify: PropTypes.func,
  onProfileUpdated: PropTypes.func,
}

export default BusinessProfileTab
