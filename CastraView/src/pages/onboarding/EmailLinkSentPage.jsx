import { useEffect, useState } from 'react'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EmailLinkSentPage({ email, onResend, onBack }) {
  const [seconds, setSeconds] = useState(60)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { const timer = setInterval(() => setSeconds(x => Math.max(0, x - 1)), 1000); return () => clearInterval(timer) }, [])
  async function resend() {
    setBusy(true); setError('')
    try { await onResend(); setSeconds(60) }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <main className="grid min-h-screen place-items-center bg-background p-5 text-foreground"><section className="w-full max-w-lg space-y-5 rounded-2xl border border-border bg-card p-7"><MailCheck className="size-10 text-info" /><h1 className="text-2xl font-bold">Kiểm tra hộp thư</h1><p className="text-sm text-muted-foreground">Nếu địa chỉ đủ điều kiện, liên kết xác thực sẽ được gửi tới <strong>{email}</strong>. Mở liên kết trên máy đang chạy dự án để đặt mật khẩu và chọn công ty.</p><p className="text-xs text-muted-foreground">Kiểm tra cả thư rác. Nhận email không tự cấp quyền vào doanh nghiệp.</p>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex flex-wrap gap-3"><Button disabled={busy || seconds > 0} onClick={resend}>{seconds ? `Gửi lại sau ${seconds}s` : 'Gửi lại email'}</Button><Button variant="outline" onClick={onBack}>Về đăng nhập</Button></div></section></main>
}
