import { useState } from 'react'
import PropTypes from 'prop-types'
import Brand from '@/components/Brand'
import Field from '@/components/Field'
import Notice from '@/components/Notice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/services/api'

export default function AuthPage({ mode, setMode, onAuth, backendError }) {
  const signup = mode === 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (signup && password !== confirm) return setError('Mật khẩu xác nhận không khớp.')
    setBusy(true)
    try {
      const data = await api(`auth/${signup ? 'register' : 'login'}/`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      onAuth(data.user)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  const passwordType = showPassword ? 'text' : 'password'
  return (
    <div className="flex min-h-screen flex-col bg-[#10182b]">
      <header className="flex min-h-[61px] items-center border-b border-[#33405a] px-[clamp(24px,6vw,90px)] sm:min-h-[76px]">
        <Brand />
      </header>
      <main className="grid flex-1 place-items-center px-5 py-12">
        <div className="w-full max-w-[600px] rounded-[17px] border border-[#293651] bg-card p-5 shadow-2xl shadow-black/40 sm:p-10">
          <div className="border-b border-[#33415a] pb-7">
            <Brand size="lg" />
            <span className="mt-4 mb-7 inline-block rounded-full border border-[#603aaa] bg-[#292042] px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.11em] text-[#ae7cff]">
              ● AI MARKETING ASSISTANT FOR SMBS
            </span>
            <h1 className="mb-2 text-[31px] font-extrabold tracking-tight">{signup ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h1>
            <p className="leading-normal text-muted-foreground">
              {signup ? 'Bắt đầu xây dựng chiến lược marketing trong vài phút.' : 'Đăng nhập để quản lý chiến lược marketing của bạn.'}
            </p>
          </div>
          <form className="grid gap-[18px] pt-6" onSubmit={submit}>
            <Field label="Email công việc">
              <Input type="email" autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Mật khẩu">
              <div className="relative">
                <Input
                  type={passwordType}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  minLength={8}
                  placeholder="Nhập mật khẩu"
                  className="pr-16"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-[#aab8d5]"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </Field>
            {signup && (
              <Field label="Xác nhận mật khẩu">
                <Input type={passwordType} autoComplete="new-password" minLength={8} placeholder="Nhập lại mật khẩu" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </Field>
            )}
            {(error || backendError) && <Notice>{error || backendError}</Notice>}
            <Button type="submit" size="lg" className="w-full bg-[#6267ed] text-white shadow-lg shadow-[#6267ed]/20 hover:bg-[#6267ed]/90" disabled={busy}>
              {busy ? 'Đang xử lý…' : signup ? 'Tạo tài khoản →' : 'Đăng nhập →'}
            </Button>
          </form>
          {signup && <p className="mt-4 text-center text-xs text-muted-foreground">Tài khoản được bảo vệ bằng mật khẩu mã hóa và phiên đăng nhập an toàn.</p>}
          <div className="mt-7 border-t border-[#33415a] pt-6 text-center text-muted-foreground">
            {signup ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <button
              type="button"
              className="font-bold text-[#a7a6ff] underline"
              onClick={() => {
                setError('')
                setMode(signup ? 'login' : 'signup')
              }}
            >
              {signup ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </div>
        </div>
      </main>
      <footer className="flex flex-col justify-between gap-3 border-t border-[#33405a] px-[clamp(24px,6vw,90px)] py-5 text-xs text-[#7786a4] sm:flex-row">
        <span>© 2026 CastraVision · Sprint 1</span>
        <span>AI marketing workspace for SMBs</span>
      </footer>
    </div>
  )
}

AuthPage.propTypes = {
  mode: PropTypes.oneOf(['login', 'signup']).isRequired,
  setMode: PropTypes.func.isRequired,
  onAuth: PropTypes.func.isRequired,
  backendError: PropTypes.string,
}
