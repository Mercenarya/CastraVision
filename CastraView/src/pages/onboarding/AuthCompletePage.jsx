import { useEffect, useState } from 'react'
import { requireSupabase } from '@/lib/supabase'
import { consumeAuthCallback } from '@/auth/emailOnboarding'
import { Button } from '@/components/ui/button'

export default function AuthCompletePage({ children }) {
  const [state, setState] = useState({ done: false, error: '' })
  useEffect(() => {
    let active = true
    consumeAuthCallback(requireSupabase().auth, window.location.href).then(result => {
      window.history.replaceState({}, '', result.cleanPath)
      if (active) setState({ done: true, error: result.errorCode ? 'Liên kết không còn hợp lệ hoặc đã hết hạn. Hãy yêu cầu email mới; tài khoản cũ vẫn được giữ.' : '' })
    }).catch(() => { if (active) setState({ done: true, error: 'Không thể xác thực liên kết. Vui lòng thử lại.' }) })
    return () => { active = false }
  }, [])
  if (!state.done) return <p role="status" className="p-10 text-center text-muted-foreground">Đang xác thực email…</p>
  if (state.error) return <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground"><section className="max-w-lg space-y-4 rounded-xl border border-border bg-card p-7"><h1 className="text-xl font-semibold">Cần liên kết xác thực mới</h1><p role="alert">{state.error}</p><Button onClick={() => { window.location.href = '/' }}>Gửi lại email hoặc đăng nhập</Button></section></main>
  return children
}
