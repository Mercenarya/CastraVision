import { memberRole, normalizedEmail, page, validation } from './membershipContract.js'

export function createMembershipService(api) {
  const read = (path, query, options = {}) => api(path + (query ? '?' + new URLSearchParams(query) : ''), options)
  const write = (path, body, method = 'POST', options = {}) => api(path, {
    ...options, method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const paging = ({ limit = 20, offset = 0 } = {}) => ({ limit, offset })
  const identifier = value => encodeURIComponent(value)
  return {
    getOnboardingState: options => read('onboarding/state/', null, options),
    async listCompanies({ search = '', ...args } = {}, options) {
      const result = page(await read('onboarding/companies/', { search, ...paging(args) }, options))
      return { ...result, items: result.items.map(({ id, name, publicDescription }) => ({ id, name, publicDescription })) }
    },
    async listMyRequests(args, options) { return page(await read('onboarding/requests/', paging(args), options)) },
    submitJoinRequest: ({ workspaceId, message = '' }, options) => write('onboarding/requests/', { workspaceId, message }, 'POST', options),
    cancelJoinRequest: (id, options) => write(`onboarding/requests/${identifier(id)}/cancel/`, {}, 'POST', options),
    async listMyInvitations(args, options) { return page(await read('onboarding/invitations/', paging(args), options)) },
    acceptInvitation: (id, options) => write(`onboarding/invitations/${identifier(id)}/accept/`, {}, 'POST', options),
    async listWorkspacePersonnel({ tab, search = '', role = '', status = '', teamId = '', sort = 'newest', ...args }, options) {
      return page(await read('workspace/personnel/', { tab, search, role, status, teamId, sort, ...paging(args) }, options))
    },
    getRecruitmentSettings: options => read('workspace/recruitment/', null, options),
    saveRecruitmentSettings: ({ acceptingJoinRequests, publicDescription }, options) => write('workspace/recruitment/', { acceptingJoinRequests, publicDescription }, 'PUT', options),
    listTeams: options => read('workspace/teams/', null, options),
    createTeam: ({ name }, options) => write('workspace/teams/', { name }, 'POST', options),
    async reviewJoinRequest(id, { decision, teamId = null, reason = '' }, options) {
      if (!['approve', 'reject'].includes(decision)) throw validation('Quyết định không hợp lệ.')
      if (decision === 'reject' && !reason.trim()) throw validation('Cần nhập lý do từ chối.')
      return write(`workspace/requests/${identifier(id)}/review/`, { decision, teamId, reason }, 'POST', options)
    },
    async createInvitation({ email, role = 'member', teamId = null }, options) {
      return write('workspace/invitations/', { email: normalizedEmail(email), role: memberRole(role), teamId }, 'POST', options)
    },
    resendInvitation: (id, options) => write(`workspace/invitations/${identifier(id)}/resend/`, {}, 'POST', options),
    revokeInvitation: (id, options) => write(`workspace/invitations/${identifier(id)}/revoke/`, {}, 'POST', options),
    async updateMember(id, { role, teamIds = [] }, options) {
      return write(`workspace/members/${identifier(id)}/`, { role: memberRole(role), teamIds }, 'PATCH', options)
    },
    removeMember: (id, options) => write(`workspace/members/${identifier(id)}/`, undefined, 'DELETE', options),
    async listNotifications({ unreadOnly = false, ...args } = {}, options) {
      return page(await read('membership-notifications/', { unreadOnly, ...paging(args) }, options))
    },
    markNotificationRead: (id, options) => write(`membership-notifications/${identifier(id)}/read/`, {}, 'POST', options),
  }
}
