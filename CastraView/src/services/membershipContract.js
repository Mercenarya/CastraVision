export const MEMBER_ROLES = ['member', 'manager']
export const ROLE_NAMES = { admin: 'Marketing Manager', manager: 'Leader', member: 'Employee' }
export const STATUS_NAMES = {
  pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Đã từ chối', cancelled: 'Đã hủy',
  accepted: 'Đã chấp nhận', revoked: 'Đã thu hồi', expired: 'Đã hết hạn',
}
export function validation(message) {
  return Object.assign(new Error(message), { code: 'VALIDATION_ERROR', status: 400 })
}
export function normalizedEmail(value) {
  const email = String(value || '').trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw validation('Email không hợp lệ.')
  return email
}
export function memberRole(role) {
  if (!MEMBER_ROLES.includes(role)) throw validation('Không được cấp vai trò này.')
  return role
}
export function page(value) {
  if (!value || !Array.isArray(value.items)) throw new Error('Dữ liệu nhân sự không hợp lệ.')
  return { items: value.items, total: value.total ?? value.items.length, limit: value.limit ?? 20,
    offset: value.offset ?? 0, ...(value.unreadCount !== undefined ? { unreadCount: value.unreadCount } : {}) }
}
