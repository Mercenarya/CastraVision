import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AccountEntryPage({ mode, setMode, onLogin, busy, error, notice }) {
  const signup = mode === 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  return <main className="grid min-h-screen place-items-center bg-background p-5 text-foreground"><section className="w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card p-7 shadow-xl md:p-10"><div className="flex items-center gap-3 text-2xl font-bold"><Sparkles className="size-8 text-info" />CastraVision</div><header><p className="mb-3 text-xs font-semibold tracking-widest text-violet">TRỢ LÝ MARKETING AI CHO DOANH NGHIỆP</p><h1 className="text-3xl font-bold">{signup ? 'Bắt đầu với email của bạn' : 'Chào mừng trở lại'}</h1><p className="mt-3 text-sm text-muted-foreground">{signup ? 'Nhận liên kết xác thực, tự đặt mật khẩu rồi chọn công ty bạn muốn gia nhập.' : 'Đăng nhập bằng tài khoản đã xác thực. Bạn không cần đăng ký lại khi phiên hết hạn.'}</p></header>
    <form className="grid gap-5" onSubmit={event => { event.preventDefault(); void onLogin(email.trim(), password, signup) }}><label className="grid gap-2 text-sm font-medium">Email<Input type="email" required autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="tenban@gmail.com" disabled={busy} /></label>
      {!signup && <label className="grid gap-2 text-sm font-medium">Mật khẩu<div className="flex gap-2"><Input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /><Button variant="outline" type="button" onClick={() => setShowPassword(x => !x)}>{showPassword ? 'Ẩn' : 'Hiện'}</Button></div></label>}
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-info">{notice}</p>}
      <Button disabled={busy} type="submit">{busy ? 'Đang xử lý…' : signup ? 'Nhận liên kết xác thực qua email' : 'Đăng nhập'}</Button>
    </form><p className="text-xs text-muted-foreground">{signup ? 'Xác thực email chưa cấp quyền vào công ty. Marketing Manager sẽ xét duyệt yêu cầu của bạn.' : 'Tài khoản chưa được cấp membership sẽ tiếp tục tại trang chọn công ty hoặc chờ duyệt.'}</p><Button className="w-full" variant="outline" onClick={() => setMode(signup ? 'login' : 'signup')}>{signup ? 'Đã có tài khoản? Đăng nhập' : 'Đăng ký hoặc nhận liên kết xác thực'}</Button>{import.meta.env.DEV && <a href="/dashboard-preview" className="block text-center text-xs text-muted-foreground underline">Xem trước giao diện phát triển</a>}
  </section></main>
}
