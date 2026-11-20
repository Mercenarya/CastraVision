import { api } from './api'

const write = (path, data, method = 'POST') => api(path, { method, body: JSON.stringify(data) })
export const platformService = {
  list: signal => api('platform/companies/', { signal }),
  company: (id, signal) => api(`platform/companies/${encodeURIComponent(id)}/`, { signal }),
  create: data => write('platform/companies/', data),
  update: (id, data) => write(`platform/companies/${encodeURIComponent(id)}/`, data, 'PATCH'),
  sendInvitation: id => write(`platform/invitations/${encodeURIComponent(id)}/send/`, {}),
  revokeInvitation: id => write(`platform/invitations/${encodeURIComponent(id)}/revoke/`, {}),
  issueInvitation: (id,email) => write(`platform/companies/${encodeURIComponent(id)}/invitations/`, {email}),
  notifications: () => api('platform/notifications/'),
  readNotification: id => write('platform/notifications/', { id }),
  myInvitations: () => api('onboarding/manager-invitations/'),
  acceptInvitation: id => write(`onboarding/manager-invitations/${encodeURIComponent(id)}/accept/`, {}),
}
