import { can, defaultPage } from './auth/permissions'

const ROLE_NAVIGATION = {
  admin: [
    ['members', '♙', 'Thành viên Workspace', 'members:manage'],
    ['roles', '⚙', 'Quản lý vai trò', 'members:manage'],
    ['audit', '▤', 'Nhật ký kiểm toán', 'audit:read'],
    ['approvals', '✓', 'Phê duyệt', 'approval:write'],
    ['import', '⇥', 'Nhập dữ liệu', 'campaign:import'],
    ['content', '✦', 'Content Studio', 'content:write'],
    ['profile', '☷', 'Hồ sơ doanh nghiệp', 'business:write'],
  ],
  manager: [
    ['strategy', '◈', 'Chiến lược', 'strategy:read'],
    ['budget', '↗', 'Tối ưu ngân sách', 'budget:write'],
    ['content', '✦', 'Nội dung', 'content:write'],
    ['import', '⇥', 'Dữ liệu chiến dịch', 'campaign:import'],
    ['approvals', '✓', 'Phê duyệt', 'approval:write'],
    ['reports', '▤', 'Báo cáo', 'reports:write'],
    ['insights', '◎', 'Đối thủ & thị trường', 'competitor:read'],
  ],
  member: [
    ['strategy', '◈', 'Chiến lược', 'strategy:read'],
    ['content', '✦', 'Tạo nội dung', 'content:write'],
    ['import', '⇥', 'Nhập dữ liệu', 'campaign:import'],
    ['insights', '◎', 'Đối thủ & thị trường', 'competitor:read'],
  ],
}

export function navigationFor(role, onboarding = false) {
  if (onboarding) {
    return [['onboarding', '◈', 'Hoàn tất thiết lập', 'business:write']]
  }

  const dashboardLabels = {
    admin: 'Tổng quan quản trị',
    manager: 'Dashboard hiệu suất',
    member: 'Không gian làm việc',
  }

  return [
    [defaultPage(role), '▦', dashboardLabels[role] || 'Tổng quan', 'overview'],
    ...(ROLE_NAVIGATION[role] || ROLE_NAVIGATION.member).filter((item) => can(role, item[3])),
  ]
}
