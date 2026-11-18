import { api } from './api'
import { csvText } from './leaderWorkflowContract'

const MESSAGES = {
  PERMISSION_DENIED: 'Bạn không có quyền trong nhóm hoặc doanh nghiệp này.',
  NOT_FOUND: 'Không tìm thấy bản ghi trong phạm vi được cấp.',
  STALE_VERSION: 'Bản ghi đã thay đổi. Tải lại trước khi tiếp tục.',
  INVALID_TRANSITION: 'Trạng thái hiện tại không cho phép thao tác này.',
  SELF_APPROVAL_FORBIDDEN: 'Bạn không được tự duyệt đề xuất của mình.',
  BUDGET_ESCALATION_REQUIRED: 'Biến động ngân sách vượt 20%. Hãy chuyển Marketing Manager.',
  BUDGET_ENVELOPE_MISMATCH: 'Tổng phân bổ phải bằng ngân sách cố định của chiến dịch.',
  REASON_REQUIRED: 'Nhập lý do từ 3 đến 2.000 ký tự.',
  REQUEST_CONFLICT: 'Mã yêu cầu đã được dùng cho dữ liệu khác. Hãy tải lại.',
  STALE_BASELINE: 'Phân bổ nền đã thay đổi. Tải lại ngân sách chiến dịch trước khi gửi.',
  VALIDATION_ERROR: 'Thông tin không hợp lệ. Kiểm tra lại các trường nhập.',
}

export async function workflow(command, data = {}, { signal } = {}) {
  try {
    return await api(`leader/${command}/`, { method: 'POST', body: JSON.stringify(data), signal })
  } catch (cause) {
    if (MESSAGES[cause.code]) cause.message = MESSAGES[cause.code]
    throw cause
  }
}

export function downloadCsv(filename, headers, rows) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', csvText(headers, rows)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function importCampaignFile(file, campaignId, mode) {
  const form = new FormData()
  form.append('file', file)
  form.append('campaign_id', campaignId)
  form.append('mode', mode)
  return api('campaign-imports/upload/', { method: 'POST', body: form })
}
