// Used only by the development preview. These records never confer authorization.
export function createMembershipPreview() {
  const members = [{ userId: 'preview-mm', name: 'Nguyễn Minh Anh', email: 'manager@example.test', role: 'admin', joinedAt: '2026-11-01', teamIds: [] }, { userId: 'preview-employee', name: 'Lê Thanh Hà', email: 'employee@example.test', role: 'member', joinedAt: '2026-11-10', teamIds: [] }]
  const requests = [{ id: 'preview-request', applicantName: 'Trần Hoàng Nam', applicantEmail: 'applicant@example.test', message: 'Mong muốn tham gia nhóm nội dung của công ty.', status: 'pending', requestedAt: '2026-11-17T08:00:00Z' }]
  const invitations = [{ id: 'preview-invitation', email: 'invite@example.test', role: 'member', status: 'pending', deliveryStatus: 'failed', expiresAt: '2026-11-24T08:00:00Z' }]
  let settings = { acceptingJoinRequests: false, publicDescription: 'Doanh nghiệp demo trong giao diện xem trước.' }
  const teams = [{ id: 'preview-team', name: 'Nội dung & sáng tạo' }]
  const noDelivery = async () => { throw new Error('Đây là xem trước. Không gửi email hoặc cấp membership thật.') }
  return {
    async listWorkspacePersonnel({ tab, search = '', role = '', status = '', offset = 0, limit = 20 }) {
      const list = ({ members, requests, invitations })[tab].filter(x => (!role || x.role === role) && (!status || x.status === status) && JSON.stringify(x).toLowerCase().includes(search.toLowerCase()))
      return { items: list.slice(offset, offset + limit), total: list.length, offset, limit }
    },
    async listTeams() { return { items: [...teams] } },
    async getRecruitmentSettings() { return settings },
    async saveRecruitmentSettings(value) { settings = value; return settings },
    async createTeam({ name }) { const team = { id: crypto.randomUUID(), name }; teams.push(team); return team },
    async reviewJoinRequest(id, { decision, reason }) { const row = requests.find(x => x.id === id); row.status = decision === 'approve' ? 'approved' : 'rejected'; row.rejectionReason = reason; return row },
    createInvitation: noDelivery, resendInvitation: noDelivery, revokeInvitation: noDelivery,
    updateMember: noDelivery, removeMember: noDelivery,
    async listNotifications() { return { items: [], total: 0, limit: 20, offset: 0, unreadCount: 0 } },
    markNotificationRead: noDelivery,
  }
}
