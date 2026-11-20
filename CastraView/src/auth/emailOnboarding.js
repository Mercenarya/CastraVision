import { normalizedEmail, validation } from '../services/membershipContract.js'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function createEmailOnboarding({ auth, origin }) {
  return {
    async sendLink(email, { invitationId = null } = {}) {
      if (invitationId && !uuid.test(invitationId)) throw validation('Lời mời không hợp lệ.')
      const callback = new URL('/auth/complete', origin)
      if (invitationId) callback.searchParams.set('invitationId', invitationId)
      const { data, error } = await auth.signInWithOtp({ email: normalizedEmail(email), options: { emailRedirectTo: callback.href, shouldCreateUser: true } })
      if (error) throw Object.assign(new Error(error.status === 429 ? 'Đã đạt giới hạn gửi email. Vui lòng đợi rồi thử lại.' : 'Chưa gửi được email xác thực. Kiểm tra địa chỉ hoặc thử lại sau.'), { code: error.code, status: error.status })
      return data
    },
    async setPassword(password, confirmation) {
      if (password !== confirmation) throw validation('Mật khẩu xác nhận không khớp.')
      if (typeof password !== 'string' || password.length < 12) throw validation('Mật khẩu cần ít nhất 12 ký tự.')
      const { data, error } = await auth.updateUser({ password })
      if (error) throw Object.assign(new Error('Không thể đặt mật khẩu. Kiểm tra yêu cầu mật khẩu hoặc xác thực lại email.'), { code: error.code, status: error.status })
      return data
    },
  }
}

export function getOnboardingStep({ passwordSetupRequired, memberships, platformRole = null }) {
  if (passwordSetupRequired) return 'password'
  return platformRole || memberships.length ? 'workspace' : 'company'
}

export async function consumeAuthCallback(auth, address) {
  const url = new URL(address)
  const fragment = new URLSearchParams(url.hash.slice(1))
  const invitationId = url.searchParams.get('invitationId')
  const platformInvitationId = url.searchParams.get('platformInvitationId')
  const clean = new URL('/auth/complete', url.origin)
  if (invitationId && uuid.test(invitationId)) clean.searchParams.set('invitationId', invitationId)
  if (platformInvitationId && uuid.test(platformInvitationId)) clean.searchParams.set('platformInvitationId', platformInvitationId)
  const errorCode = fragment.get('error_code') || url.searchParams.get('error_code') || (fragment.has('error') || url.searchParams.has('error') ? 'invalid_link' : null)
  if (errorCode) return { cleanPath: clean.pathname + clean.search, session: null, errorCode }
  // The singleton SDK consumes implicit/PKCE callbacks during initialize; do not exchange twice.
  const { data, error } = await auth.getSession()
  return { cleanPath: clean.pathname + clean.search, session: data?.session || null, errorCode: error?.code || (!data?.session ? 'invalid_link' : null) }
}
