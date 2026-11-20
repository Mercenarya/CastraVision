export function money(value, currency = 'VND', locale = 'vi-VN') {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) || !['USD', 'VND'].includes(currency)) return '—'
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value))
}

export function budgetExceedsLimit(allocations = []) {
  return allocations.some(({ current, proposed }) => Number(current) === 0
    ? Number(proposed) > 0
    : Math.abs(Number(proposed) - Number(current)) / Number(current) > 0.2)
}

export function csvText(headers, rows) {
  const cell = value => {
    let text = String(value ?? '')
    if (/^[\s]*[=+@-]/.test(text) && typeof value !== 'number') text = "'" + text
    return '"' + text.replaceAll('"', '""') + '"'
  }
  return [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n')
}

export const STATUS_LABELS = {
  draft: 'Bản nháp', pending: 'Chờ duyệt', approved: 'Đã duyệt',
  rejected: 'Từ chối', revision_requested: 'Yêu cầu chỉnh sửa', escalated: 'Đã chuyển cấp',
}
export const KIND_LABELS = {
  ad_content: 'Nội dung', strategy: 'Chiến lược', budget_proposal: 'Ngân sách', pause_variant: 'Yêu cầu tạm dừng',
}
