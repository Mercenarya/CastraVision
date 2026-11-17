const roles = new Set(['admin', 'manager', 'member'])
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function readAuthorization(payload, expectedUserId, storedWorkspaceId = null) {
  if (payload?.version !== 1 || payload.user?.id !== expectedUserId || !uuid.test(expectedUserId)) {
    throw new Error('Không thể xác minh phiên và phân quyền. Vui lòng đăng nhập lại.')
  }
  if (![null, 'system_admin'].includes(payload.platform_role) || !Array.isArray(payload.memberships)) {
    throw new Error('Phản hồi phân quyền không hợp lệ.')
  }
  const memberships = payload.memberships.map(row => {
    if (!roles.has(row.role) || !uuid.test(row.workspace_id)) throw new Error('Membership không hợp lệ.')
    return { workspaceId: row.workspace_id, workspaceName: row.workspace_name || 'Workspace', role: row.role }
  })
  if (new Set(memberships.map(x => x.workspaceId)).size !== memberships.length ||
      (payload.platform_role && memberships.length)) throw new Error('Phân quyền xung đột.')
  const selected = memberships.find(x => x.workspaceId === storedWorkspaceId) ||
    (memberships.length === 1 ? memberships[0] : null)
  return {
    user: { id: payload.user.id, email: payload.user.email || '', full_name: payload.user.full_name || '' },
    platformRole: payload.platform_role, memberships, workspaceId: selected?.workspaceId || null,
    passwordSetupRequired: payload.onboarding?.passwordSetupRequired === true,
  }
}
