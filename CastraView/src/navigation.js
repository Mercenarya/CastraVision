import { can, defaultPage } from './auth/permissions'

const FEATURE_NAV = [
  ['strategy', '◈', 'Chiến lược & phân tích', 'strategy:read'],
  ['content', '✦', 'Content Studio', 'content:write'],
  ['import', '⇥', 'Nhập dữ liệu chiến dịch', 'campaign:import'],
  ['profile', '☷', 'Hồ sơ doanh nghiệp', 'business:write'],
  ['members', '♙', 'Thành viên & vai trò', 'members:manage'],
  ['approvals', '✓', 'Phê duyệt', 'approval:write'],
]

export function navigationFor(role, onboarding = false) {
  if (onboarding) {
    return [['onboarding', '◈', 'Hoàn tất thiết lập', 'business:write']]
  }

  const dashboardLabels = {
    admin: 'Quản trị Workspace',
    manager: 'Điều hành chiến dịch',
    member: 'Không gian nội dung',
  }

  return [
    [defaultPage(role), '▦', dashboardLabels[role] || 'Tổng quan', 'overview'],
    ...FEATURE_NAV.filter((item) => can(role, item[3])),
  ]
}
