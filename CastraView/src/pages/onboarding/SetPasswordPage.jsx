import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KeyRound } from 'lucide-react'

export default function SetPasswordPage({ auth }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try { await auth.setPassword(password, confirmation); setPassword(''); setConfirmation(''); await auth.refreshMembership() }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <main className="grid min-h-screen place-items-center bg-background p-5 text-foreground"><section className="w-full max-w-lg space-y-5 rounded-2xl border border-border bg-card p-7 shadow-xl"><KeyRound className="size-9 text-info" /><h1 className="text-2xl font-bold">Tạo mật khẩu của bạn</h1><p className="text-sm text-muted-foreground">Email đã được xác thực. Mật khẩu chỉ được lưu và xử lý bởi Supabase Auth; quản lý công ty không xem được mật khẩu này.</p><form onSubmit={submit} className="grid gap-4"><label className="grid gap-2 text-sm">Mật khẩu mới<Input type="password" required minLength={12} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label><label className="grid gap-2 text-sm">Nhập lại mật khẩu<Input type="password" required minLength={12} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu mật khẩu và tiếp tục'}</Button></form><Button variant="outline" onClick={() => auth.signOut()}>Đăng xuất</Button></section></main>
}
