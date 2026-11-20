import { requireSupabase } from '../lib/supabase'

export async function changeAccountPassword(expectedUserId, currentPassword, newPassword) {
  const client = requireSupabase()
  const identity = await client.auth.getUser()
  if (identity.error || !identity.data.user || identity.data.user.id !== expectedUserId) {
    throw Object.assign(new Error('Không thể xác minh tài khoản đang đăng nhập. Vui lòng đăng nhập lại.'), {code: 'AUTH_IDENTITY'})
  }
  const confirmation = await client.auth.signInWithPassword({ email: identity.data.user.email, password: currentPassword })
  if (confirmation.error) throw Object.assign(new Error(confirmation.error.code === 'invalid_credentials'
    ? 'Mật khẩu hiện tại không chính xác.'
    : 'Không thể xác minh mật khẩu hiện tại. Vui lòng thử lại.'), {code: confirmation.error.code === 'invalid_credentials' ? 'CURRENT_PASSWORD_WRONG' : 'CURRENT_PASSWORD_UNAVAILABLE'})
  if (confirmation.data.user?.id !== expectedUserId) throw Object.assign(new Error('Phiên xác nhận không khớp tài khoản.'), {code: 'SESSION_MISMATCH'})
  const result = await client.auth.updateUser({ password: newPassword })
  if (result.error) throw result.error
}
