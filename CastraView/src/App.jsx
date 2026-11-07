import { useCallback, useEffect, useRef, useState } from 'react'

import { resolveActorRole } from './auth/permissions'
import { SystemAdminLayout } from './system-admin/SystemAdminLayout'
import MarketingManagerLayout from './company-admin/MarketingManagerLayout'
import LeaderDashboard from './leader/screens/LeaderDashboard'
import MemberDashboard from './member/screens/MemberDashboard'
import {
  ApprovalQueuePage,
  BudgetOptimizationPage,
  ReportsPage,
  CompetitorInsightsPage,
} from './actor-ui/ActorPages'
import DashboardPreviewPage from './preview/DashboardPreviewPage'
import { supabase } from './lib/supabase'
import './App.css'

const CHANNELS = ['Meta', 'Google Ads', 'TikTok']
const SIZES = { Micro: '1–10 nhân sự', Small: '11–50 nhân sự', Medium: '51–250 nhân sự', Large: 'Trên 250 nhân sự' }
const EMPTY_PROFILE = { business_name: '', industry: '', business_size: '', target_customers: '', primary_goal: '', product_service: '', preferred_channels: [], monthly_budget: '', currency: 'VND' }

const LEADER_NAV = [
  ['overview', '▦', 'Dashboard hiệu suất'],
  ['strategy', '◈', 'Chiến lược & phân tích'],
  ['content', '✦', 'Content Studio'],
  ['import', '⇥', 'Nhập dữ liệu chiến dịch'],
  ['budget', '↗', 'Tối ưu ngân sách'],
  ['approvals', '✓', 'Hàng chờ phê duyệt'],
  ['reports', '▤', 'Báo cáo chiến dịch'],
  ['insights', '◎', 'Phân tích đối thủ'],
  ['profile', '☷', 'Hồ sơ doanh nghiệp'],
]

const MEMBER_NAV = [
  ['overview', '▦', 'Tổng quan không gian'],
  ['strategy', '◈', 'Tạo chiến lược AI'],
  ['content', '✦', 'Content Studio'],
  ['import', '⇥', 'Nhập dữ liệu chiến dịch'],
  ['budget', '↗', 'Ngân sách & ROAS'],
  ['insights', '◎', 'Thông tin đối thủ'],
  ['profile', '☷', 'Hồ sơ doanh nghiệp'],
]

function csrfToken() { return decodeURIComponent(document.cookie.split('; ').find((part) => part.startsWith('csrftoken='))?.split('=')[1] || '') }
async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData) && options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.method && options.method !== 'GET') headers['X-CSRFToken'] = csrfToken()
  let response
  try { response = await fetch(`/api/${path}`, { credentials: 'same-origin', ...options, headers }) }
  catch { throw new Error('Không kết nối được máy chủ. Hãy kiểm tra backend ở cổng 8000.') }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || `Yêu cầu thất bại (${response.status}).`)
  return data
}

function Brand() { return <div className="brand"><span className="brand-icon" aria-hidden="true">✣</span><span>CastraVision</span></div> }
function Heading({ eyebrow, title, subtitle, children }) { return <div className="page-heading"><div><div className="eyebrow"><i /> {eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{children}</div> }
function Notice({ kind = 'error', children }) { return <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div> }
function Toast({ message, clear }) { return message && <div className="toast" role="status"><b>✓</b>{message}<button onClick={clear} aria-label="Đóng thông báo">×</button></div> }

function AuthScreen({ mode, setMode, onLogin, onDemoLogin, busy, error }) {
  const signup = mode === 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setLocalError('')
    if (signup && password !== confirm) {
      setLocalError('Mật khẩu xác nhận không khớp.')
      return
    }
    await onLogin(email, password, signup)
  }

  const displayError = localError || error

  return (
    <div className="auth-page">
      <header className="auth-top"><Brand /></header>
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-heading">
            <Brand />
            <span className="auth-pill">● SUPABASE AUTH &amp; RBAC ACCESS</span>
            <h1>{signup ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h1>
            <p>
              {signup
                ? 'Đăng ký tài khoản để truy cập hệ thống phân quyền CastraVision.'
                : 'Đăng nhập với tài khoản Supabase để tự động điều hướng theo vai trò.'}
            </p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email tài khoản
              <input
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Mật khẩu
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  minLength={6}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </label>
            {signup && (
              <label>
                Xác nhận mật khẩu
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={6}
                  placeholder="Nhập lại mật khẩu"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </label>
            )}
            {displayError && <Notice>{displayError}</Notice>}
            <button className="button primary full" disabled={busy}>
              {busy ? 'Đang xác thực…' : signup ? 'Tạo tài khoản →' : 'Đăng nhập hệ thống →'}
            </button>
          </form>

          <div className="auth-switch">
            {signup ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <button
              type="button"
              onClick={() => {
                setLocalError('')
                setMode(signup ? 'login' : 'signup')
              }}
            >
              {signup ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </div>

          {/* Quick role testing access for demonstration and inspection */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: 700, letterSpacing: '.06em', marginBottom: 10 }}>
              TRUY CẬP NHANH THEO VAI TRÒ (RBAC DEMO)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <button
                type="button"
                className="button subtle"
                style={{ fontSize: 12, padding: '8px 10px', borderColor: '#38bdf8', color: '#38bdf8' }}
                onClick={() => onDemoLogin('system_admin')}
              >
                🛡 System Admin
              </button>
              <button
                type="button"
                className="button subtle"
                style={{ fontSize: 12, padding: '8px 10px', borderColor: '#818cf8', color: '#818cf8' }}
                onClick={() => onDemoLogin('manager')}
              >
                🏢 Manager (Company Admin)
              </button>
              <button
                type="button"
                className="button subtle"
                style={{ fontSize: 12, padding: '8px 10px', borderColor: '#34d399', color: '#34d399' }}
                onClick={() => onDemoLogin('leader')}
              >
                ✓ Leader
              </button>
              <button
                type="button"
                className="button subtle"
                style={{ fontSize: 12, padding: '8px 10px', borderColor: '#a78bfa', color: '#a78bfa' }}
                onClick={() => onDemoLogin('member')}
              >
                ✦ Member
              </button>
            </div>
          </div>
        </div>
      </main>
      <footer className="auth-footer">
        <span>© 2026 CastraVision</span>
        <span>Supabase RBAC Authentication</span>
      </footer>
    </div>
  )
}

function Shell({ user, role, profile, page, setPage, logout, children }) {
  const navList = role === 'leader' ? LEADER_NAV : MEMBER_NAV
  const current = navList.find(([key]) => key === page)?.[2] || 'Tổng quan'
  const roleName = role === 'leader' ? 'Leader' : 'Member'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
          <span className="sme-tag">{roleName.toUpperCase()}</span>
        </div>
        <div className="workspace-switch">
          <span className="workspace-avatar">
            {(profile?.business_name || user?.email || 'CV').slice(0, 2).toUpperCase()}
          </span>
          <span>
            <strong>{profile?.business_name || 'Không gian mới'}</strong>
            <small>{roleName} Workspace</small>
          </span>
          <span>⌄</span>
        </div>
        <div className="nav-caption">{role === 'leader' ? 'LEADER NAVIGATION' : 'MEMBER NAVIGATION'}</div>
        <nav aria-label="Điều hướng chính">
          {navList.map(([key, icon, label]) => (
            <button
              key={key}
              className={`nav-item ${page === key ? 'active' : ''}`}
              onClick={() => setPage(key)}
              aria-current={page === key ? 'page' : undefined}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div><i /> Vai trò: <strong>{roleName}</strong></div>
          <div className="quota-line"><span /></div>
          <small>Supabase RBAC · Online</small>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="app-topbar">
          <span className="mobile-brand"><Brand /></span>
          <div className="topbar-context"><i /> {current.toUpperCase()}</div>
          <div className="topbar-actions">
            <span className="sprint-label">{roleName.toUpperCase()}</span>
            <span className="user-avatar">{(user?.email || 'U')[0].toUpperCase()}</span>
            <span className="user-email">{user?.email}</span>
            <button onClick={logout} className="text-button" type="button">Đăng xuất</button>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}

function ChannelPicker({ channels, toggle }) { return <div className="channel-grid">{CHANNELS.map((channel) => <button type="button" key={channel} className={`channel-card ${channels.includes(channel) ? 'selected' : ''}`} onClick={() => toggle(channel)}><span className="channel-glyph">{channel === 'Meta' ? '∞' : channel === 'TikTok' ? '♪' : 'G'}</span><strong>{channel}</strong><span className="check-box">{channels.includes(channel) ? '✓' : ''}</span></button>)}</div> }

function ProfileScreen({ profile, onboarding, saveProfile, busy, error, cancel }) {
  const [draft, setDraft] = useState(profile || EMPTY_PROFILE)
  const [step, setStep] = useState(1)
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const toggle = (channel) => setDraft((current) => ({
    ...current,
    preferred_channels: current.preferred_channels.includes(channel)
      ? current.preferred_channels.filter((item) => item !== channel)
      : [...current.preferred_channels, channel],
  }))
  return <><Heading eyebrow={onboarding ? 'NEW ACCOUNT SETUP' : 'BUSINESS SETTINGS'} title={onboarding ? 'Thiết lập doanh nghiệp' : 'Hồ sơ doanh nghiệp'} subtitle="Cho CastraVision biết về doanh nghiệp để cá nhân hóa đề xuất." /><div className="stepper"><div className={step === 1 ? 'current' : 'done'}><b>1</b> Thông tin doanh nghiệp</div><div className={step === 2 ? 'current' : ''}><b>2</b> Mục tiêu & kênh</div><div className="step-track"><span style={{ width: step === 1 ? '50%' : '100%' }} /></div></div><form className="card profile-card" onSubmit={(event) => { event.preventDefault(); if (step === 1) setStep(2); else saveProfile(draft) }}>
    {step === 1 ? <div className="form-grid"><label className="wide">Tên doanh nghiệp *<input value={draft.business_name} onChange={(e) => set('business_name', e.target.value)} minLength={2} maxLength={120} required placeholder="Ví dụ: SneakerX Việt Nam" /></label><label>Ngành hàng *<input value={draft.industry} onChange={(e) => set('industry', e.target.value)} minLength={2} maxLength={120} required placeholder="Ví dụ: Thời trang & phụ kiện" /></label><label>Quy mô doanh nghiệp *<select value={draft.business_size} onChange={(e) => set('business_size', e.target.value)} required><option value="">Chọn quy mô</option>{Object.entries(SIZES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="wide">Khách hàng mục tiêu *<textarea value={draft.target_customers} onChange={(e) => set('target_customers', e.target.value)} minLength={3} maxLength={500} required placeholder="Nhóm tuổi, khu vực, sở thích và nhu cầu..." /></label></div> : <div className="form-grid"><label className="wide">Sản phẩm / dịch vụ chính<input value={draft.product_service} onChange={(e) => set('product_service', e.target.value)} maxLength={500} placeholder="Sản phẩm hoặc dịch vụ sẽ quảng bá" /></label><label className="wide">Mục tiêu chính<input value={draft.primary_goal} onChange={(e) => set('primary_goal', e.target.value)} maxLength={300} placeholder="Ví dụ: Tăng doanh số trực tuyến" /></label><label>Ngân sách mỗi tháng<input type="number" min="0" max="1000000000" value={draft.monthly_budget} onChange={(e) => set('monthly_budget', e.target.value)} placeholder="30000000" /></label><label>Đơn vị tiền<select value={draft.currency} onChange={(e) => set('currency', e.target.value)}><option>VND</option><option>USD</option></select></label><div className="wide"><div className="field-title">Kênh ưu tiên</div><ChannelPicker channels={draft.preferred_channels} toggle={toggle} /></div></div>}
    {error && <Notice>{error}</Notice>}<div className="form-actions"><button type="button" className="button coral" onClick={step === 2 ? () => setStep(1) : cancel}>{step === 2 ? '← Quay lại' : 'Hủy'}</button><button className="button primary" disabled={busy}>{busy ? 'Đang lưu…' : step === 1 ? 'Tiếp tục →' : 'Lưu hồ sơ ✓'}</button></div></form><div className="under-card"><span>◈ Hồ sơ có thể cập nhật sau trong phần cài đặt.</span><span>Dữ liệu gắn với tài khoản của bạn</span></div></>
}

function ImportScreen({ imports, onImported, notify }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef(null)
  async function stage(selected) {
    if (!selected) return
    setFile(selected); setPreview(null); setError(''); setBusy(true)
    try { const body = new FormData(); body.append('file', selected); setPreview(await api('campaign-imports/upload/', { method: 'POST', body })) }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  async function commit() {
    setBusy(true); setError('')
    try { const body = new FormData(); body.append('file', file); body.append('mode', 'commit'); const data = await api('campaign-imports/upload/', { method: 'POST', body }); await onImported(); notify(`${data.row_count} dòng dữ liệu đã được nhập.`); setFile(null); setPreview(null); if (input.current) input.current.value = '' }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  function downloadSample() { const csv = 'channel,period,spend,clicks,impressions,conversions,revenue\nMeta,2026-09,1500000,320,18000,25,3900000\nGoogle Ads,2026-09,1000000,240,12000,18,2800000\n'; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' })); link.download = 'castravision_sample.csv'; link.click(); URL.revokeObjectURL(link.href) }
  return <><Heading eyebrow="DATA INGESTION HUB" title="Nhập dữ liệu chiến dịch" subtitle="Tải lên dữ liệu hiệu suất để làm giàu chiến lược marketing." /><div className={`upload-zone card ${file ? 'has-file' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); stage(e.dataTransfer.files[0]) }}><div className="upload-icon">⇧</div><h2>Kéo thả tệp vào đây</h2><p>hoặc chọn tệp từ thiết bị</p><span className="upload-separator">OR</span><button className="button primary" type="button" onClick={() => input.current?.click()} disabled={busy}>⇧ Chọn tệp CSV / Excel</button><input className="sr-only" ref={input} type="file" accept=".csv,.xlsx" onChange={(e) => stage(e.target.files[0])} /><small>Tối đa 5 MB · CSV UTF-8 hoặc XLSX</small><button type="button" className="inline-link" onClick={downloadSample}>↓ Tải CSV mẫu</button></div>
    {file && <div className="file-card card"><div className="file-success">✓</div><div className="file-info"><span className="mini-label">TỆP ĐÃ CHỌN · {(file.size / 1024 / 1024).toFixed(2)} MB</span><strong>{file.name}</strong><small>{busy ? 'Đang kiểm tra…' : preview ? `${preview.row_count} dòng hợp lệ · ${preview.error_count} dòng lỗi` : 'Chưa xác thực'}</small></div><div className="file-actions"><button className="button coral" type="button" onClick={() => { setFile(null); setPreview(null); setError('') }}>Gỡ bỏ</button><button className="button primary" type="button" disabled={busy || !preview || preview.error_count > 0 || preview.row_count === 0} onClick={commit}>Nhập dữ liệu →</button></div></div>}
    {error && <Notice>{error}</Notice>}{preview?.errors?.length > 0 && <div className="card validation-card"><h3>Cần sửa {preview.error_count} dòng trước khi nhập</h3>{preview.errors.map((item) => <p key={item.row}>Dòng {item.row}: {item.message}</p>)}</div>}{preview?.preview?.length > 0 && <div className="card preview-card"><h3>Xem trước dữ liệu chuẩn hóa</h3><div className="table-wrap"><table><thead><tr>{['Kênh', 'Kỳ', 'Chi phí', 'Clicks', 'Hiển thị', 'Chuyển đổi', 'Doanh thu'].map((value) => <th key={value}>{value}</th>)}</tr></thead><tbody>{preview.preview.map((row, index) => <tr key={index}><td>{row.channel}</td><td>{row.period}</td><td>{row.spend.toLocaleString('vi-VN')}</td><td>{row.clicks}</td><td>{row.impressions}</td><td>{row.conversions}</td><td>{row.revenue.toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div></div>}
    <div className="benefit-grid"><div className="card"><b>▣</b><strong>Định dạng chuẩn</strong><p>Tự ánh xạ cột chi phí, lượt nhấp, hiển thị và chuyển đổi.</p></div><div className="card"><b>♢</b><strong>Kiểm tra tự động</strong><p>Phát hiện cột thiếu, số âm và dòng không hợp lệ trước khi lưu.</p></div><div className="card"><b>ϟ</b><strong>Dùng cho phân tích</strong><p>Chỉ số từ tệp đã nhập được đưa vào yêu cầu tạo chiến lược.</p></div></div>{imports.length > 0 && <div className="card import-history"><h3>Lần nhập gần đây</h3>{imports.map((item) => <div key={item.id}><span>{item.filename}</span><small>{item.row_count} dòng · {new Date(item.created_at).toLocaleDateString('vi-VN')}</small></div>)}</div>}</>
}

function StrategyScreen({ profile, latestRows, result, setResult, notify }) {
  const initial = () => ({ campaign_goal: profile?.primary_goal || '', target_audience: profile?.target_customers || '', budget: profile?.monthly_budget || '', preferred_channels: profile?.preferred_channels?.length ? profile.preferred_channels : CHANNELS })
  const [draft, setDraft] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toggle = (channel) => setDraft((current) => ({ ...current, preferred_channels: current.preferred_channels.includes(channel) ? current.preferred_channels.filter((item) => item !== channel) : [...current.preferred_channels, channel] }))
  async function generate(event) {
    event?.preventDefault(); setBusy(true); setError('')
    try { const historical_data = latestRows.slice(0, 30).map((row) => ({ channel: CHANNELS.includes(row.channel) ? row.channel : 'Other', period: row.period, ctr: row.impressions ? +(row.clicks / row.impressions * 100).toFixed(2) : 0, cpa: row.conversions ? +(row.spend / row.conversions).toFixed(2) : 0, roas: row.spend ? +(row.revenue / row.spend).toFixed(2) : 0 })); const payload = { business_name: profile.business_name, industry: profile.industry, business_size: profile.business_size, product_service: profile.product_service || profile.business_name, target_audience: draft.target_audience, campaign_goal: draft.campaign_goal, budget: Number(draft.budget), currency: profile.currency, preferred_channels: draft.preferred_channels, historical_data }; const data = await api('strategies/generate/', { method: 'POST', body: JSON.stringify(payload) }); setResult(data); notify('Chiến lược đã được tạo. Hãy xem lại trước khi sử dụng.') }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  const money = (percentage) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: profile?.currency || 'VND', maximumFractionDigits: 0 }).format(Number(draft.budget || 0) * percentage / 100)
  return <><Heading eyebrow="STRATEGY ENGINE" title="Tạo chiến lược" subtitle="Đặt mục tiêu và đối tượng để xây dựng đề xuất marketing dựa trên dữ liệu.">{latestRows.length > 0 && <span className="data-chip">✓ {latestRows.length} dòng lịch sử được sử dụng</span>}</Heading><div className="strategy-grid"><form className="card strategy-form" onSubmit={generate}><div className="section-head"><h2><i /> Thiết lập chiến dịch</h2><span className="step-badge">FR01 · Sprint 1</span></div><label>Mục tiêu chiến dịch<input value={draft.campaign_goal} onChange={(e) => setDraft({ ...draft, campaign_goal: e.target.value })} minLength={3} required placeholder="Ví dụ: Tăng doanh số mùa hè" /></label><label>Khách hàng mục tiêu<input value={draft.target_audience} onChange={(e) => setDraft({ ...draft, target_audience: e.target.value })} minLength={3} required placeholder="Ví dụ: Người trẻ 18–28 tuổi" /></label><label>Ngân sách tháng ({profile?.currency || 'VND'})<input type="number" min="1" value={draft.budget} onChange={(e) => setDraft({ ...draft, budget: e.target.value })} required placeholder="30000000" /></label><div className="field-title">Kênh dự kiến</div><ChannelPicker channels={draft.preferred_channels} toggle={toggle} />{error && <Notice>{error}</Notice>}<div className="form-actions"><button type="button" className="button coral" onClick={() => setDraft(initial())}>↻ Đặt lại</button><button className="button primary" disabled={busy || !draft.preferred_channels.length}>{busy ? 'Đang phân tích…' : 'ϟ Tạo chiến lược'}</button></div></form><div className="card result-card"><div className="section-head"><div><h2>Đề xuất chiến lược AI</h2><p>Dựa trên hồ sơ và dữ liệu lịch sử của bạn</p></div>{result && <span className="active-badge">{result.strategy.confidence}% tin cậy</span>}</div>{!result ? <div className="result-empty"><span>◈</span><h3>Chưa có đề xuất</h3><p>Hoàn thành biểu mẫu và nhấn “Tạo chiến lược” để xem kênh, thông điệp và phân bổ ngân sách.</p></div> : <><div className="insight-box"><span className="mini-label">TRỌNG TÂM CHIẾN LƯỢC</span><p>{result.strategy.rationale}</p></div><div className="insight-box"><div className="allocation-head"><span className="mini-label">PHÂN BỔ ĐỀ XUẤT</span><span>{money(100)} tổng</span></div><div className="stacked-bar">{result.strategy.budget_allocation.map((item, index) => <span key={index} style={{ width: `${item.percentage}%` }} />)}</div><div className="allocation-grid">{result.strategy.budget_allocation.map((item, index) => <div key={index}><i className={`legend-dot d${index}`} /><strong>{item.channel}</strong><small>{item.percentage}% · {money(item.percentage)}</small></div>)}</div></div><div className="insight-box"><span className="mini-label">THÔNG ĐIỆP & PHÂN KHÚC</span><p>“{result.strategy.message}”</p><small>{result.strategy.segment}</small></div><div className="insight-box"><span className="mini-label">HÀNH ĐỘNG TIẾP THEO</span><ol>{result.strategy.actions.map((action, index) => <li key={index}>{action}</li>)}</ol></div><div className="result-footer"><span>{result.provider === 'openai' ? 'OpenAI' : 'Bản dự phòng có quy tắc'} · {result.context_sources.length} nguồn tham chiếu</span><button className="button subtle" type="button" onClick={generate} disabled={busy}>↻ Phân tích lại</button></div>{result.warning && <Notice kind="warning">{result.warning}</Notice>}</>}</div></div></>
}

function ContentScreen({ result, profile, setPage, notify }) {
  const [channels, setChannels] = useState(CHANNELS)
  const [tone, setTone] = useState('Năng động & táo bạo')
  const [version, setVersion] = useState(0)
  const [edits, setEdits] = useState({})
  const [editing, setEditing] = useState(null)
  const message = result?.strategy.message || ''
  const businessName = profile?.business_name || 'CastraVision'
  const drafts = {
    Meta: { title: `${businessName} — Khám phá điều khác biệt`, body: version % 2 ? `Một lựa chọn mới cho bạn. ${message}` : `${message} Khám phá ngay và tìm cảm hứng cho hành trình tiếp theo.`, cta: 'Tìm hiểu thêm' },
    'Google Ads': { title: `${businessName} | ${profile?.industry || 'Dịch vụ'} phù hợp với bạn`, body: `${profile?.product_service || businessName}. Xem giải pháp cho ${profile?.target_customers || 'khách hàng'}.`, cta: 'Truy cập website' },
    TikTok: { title: `Hook 0–3s · ${businessName}`, body: version % 2 ? `Mở đầu bằng câu hỏi của ${profile?.target_customers || 'khách hàng'}. Chuyển cảnh nhanh sang giải pháp: ${profile?.product_service || businessName}.` : `Bắt đầu bằng tình huống gần gũi với ${profile?.target_customers || 'khách hàng'}. Giới thiệu lợi ích chính và kết bằng lời mời tìm hiểu thêm.`, cta: 'Xem ngay' },
  }
  const toggle = (channel) => setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel])
  async function copy(value) { try { await navigator.clipboard.writeText(value); notify('Đã sao chép nội dung.') } catch { notify('Không thể sao chép trên trình duyệt này.') } }
  return <><Heading eyebrow="CAMPAIGN ORCHESTRATION › CONTENT STUDIO" title="Tạo nội dung" subtitle="Phác thảo nội dung đa kênh từ chiến lược vừa tạo." /><div className="content-notice"><span>ⓘ</span><p>Đây là bản nháp nội dung theo mẫu, chưa phải hệ thống sinh nội dung AI chuyên biệt. Hãy biên tập và kiểm tra trước khi đăng.</p></div>{!result ? <div className="card content-empty"><span>✦</span><h2>Hãy tạo chiến lược trước</h2><p>Content Studio sử dụng phân khúc và thông điệp từ đề xuất chiến lược của bạn.</p><button className="button primary" onClick={() => setPage('strategy')}>Đến màn hình chiến lược →</button></div> : <><div className="content-steps">{['Chiến lược', 'Kênh', 'Đối tượng', 'Tạo nháp', 'Rà soát'].map((step, index) => <div key={step}><b>{index + 1}</b>{step}</div>)}</div><div className="card content-controls"><div><span className="mini-label">CHIẾN LƯỢC</span><strong>{businessName}</strong></div><div className="control-channels"><span className="mini-label">KÊNH MỤC TIÊU</span><div>{CHANNELS.map((channel) => <button type="button" key={channel} onClick={() => toggle(channel)} className={channels.includes(channel) ? 'selected' : ''}>{channel} {channels.includes(channel) && '✓'}</button>)}</div></div><div><span className="mini-label">KHÁCH HÀNG</span><strong>{result.strategy.segment}</strong></div><label>GIỌNG ĐIỆU<select value={tone} onChange={(e) => setTone(e.target.value)}><option>Năng động & táo bạo</option><option>Thân thiện & gần gũi</option><option>Chuyên nghiệp & rõ ràng</option></select></label><div className="content-control-actions"><button className="button coral" onClick={() => { setChannels(CHANNELS); setTone('Năng động & táo bạo'); setEdits({}) }}>↻ Đặt lại</button><button className="button primary" onClick={() => { setVersion(version + 1); setEdits({}); notify('Đã làm mới bản nháp nội dung.') }}>✦ Tạo bản nháp</button></div></div><div className="content-results-heading"><h2>Bản nháp theo kênh <span>{channels.length} kênh</span></h2><small>Giọng điệu: {tone}</small></div><div className="content-grid">{channels.map((channel) => { const item = drafts[channel]; const value = edits[channel] ?? item.body; return <div className="card content-card" key={channel}><div className="content-card-top"><span>{channel === 'Meta' ? 'Facebook Feed' : channel === 'Google Ads' ? 'Google Search Ads' : 'TikTok / Reels'}</span><small>{channel === 'Meta' ? '1080 × 1080' : channel === 'Google Ads' ? 'RSA' : '9:16'}</small></div><span className="mini-label">TIÊU ĐỀ / HOOK</span><h3>{item.title}</h3><span className="mini-label">NỘI DUNG CHÍNH</span>{editing === channel ? <textarea value={value} onChange={(e) => setEdits({ ...edits, [channel]: e.target.value })} rows={7} /> : <p>{value}</p>}<div className="content-preview"><span>{channel === 'TikTok' ? '0s Hook · 8s Lợi ích · 15s CTA' : item.cta}</span><strong>{channel === 'Google Ads' ? '✓ Thông điệp nhất quán' : '✦ Bản nháp sẵn để rà soát'}</strong></div><div className="content-card-actions"><button className="button subtle" onClick={() => setEditing(editing === channel ? null : channel)}>{editing === channel ? '✓ Xong' : '✎ Sửa'}</button><button className="button subtle" onClick={() => copy(`${item.title}\n\n${value}\n\n${item.cta}`)}>⧉ Sao chép</button></div></div> })}</div><div className="content-bottom card"><strong>{channels.length} / 3 kênh được chọn</strong><span>Rà soát nội dung và tuân thủ chính sách quảng cáo trước khi xuất bản.</span></div></>}</>
}

function WorkspaceApp() {
  const [ready, setReady] = useState(false)
  const [backendError, setBackendError] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [user, setUser] = useState(null)
  const [membership, setMembership] = useState(null)
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('overview')
  const [imports, setImports] = useState([])
  const [latestRows, setLatestRows] = useState([])
  const [strategy, setStrategy] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const actorRole = resolveActorRole(user, membership)

  const loadUserRoleAndData = useCallback(async (activeUser) => {
    if (!activeUser) return
    try {
      if (supabase) {
        // Query workspace membership from Supabase
        const { data: memberRows } = await supabase
          .from('workspace_members')
          .select('workspace_id, role, workspaces(id, name)')
          .eq('user_id', activeUser.id)
          .limit(2)

        if (memberRows && memberRows.length > 0) {
          const item = memberRows[0]
          setMembership({
            workspaceId: item.workspace_id,
            workspaceName: item.workspaces?.name || 'CastraVision Workspace',
            role: item.role,
          })
          setProfile((current) => current || {
            business_name: item.workspaces?.name || 'CastraVision Workspace',
            industry: 'Marketing & Bán lẻ',
            business_size: 'Medium',
            currency: 'VND',
          })
        }
      }

      // Load business profile and campaign data if available from backend API
      try {
        const [business, history] = await Promise.all([
          api('business-profile/'),
          api('campaign-imports/'),
        ])
        if (business?.profile) setProfile(business.profile)
        if (history?.imports) setImports(history.imports)
        if (history?.latest_rows) setLatestRows(history.latest_rows)
      } catch {
        // Local fallback when backend API not running
      }
    } catch (cause) {
      console.warn('Membership resolution warning:', cause)
    }
  }, [])

  const refreshData = useCallback(async () => {
    try {
      const [business, history] = await Promise.all([
        api('business-profile/'),
        api('campaign-imports/'),
      ])
      setProfile(business.profile)
      setImports(history.imports)
      setLatestRows(history.latest_rows)
      setPage(business.profile ? 'overview' : 'onboarding')
    } catch (cause) {
      setBackendError(cause.message)
    }
  }, [])

  useEffect(() => {
    async function boot() {
      try {
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            setUser(session.user)
            await loadUserRoleAndData(session.user)
            setReady(true)
            return
          }
        }

        try {
          await api('auth/csrf/')
          const session = await api('auth/session/')
          if (session.user) {
            setUser(session.user)
            await refreshData()
          }
        } catch {
          // No active Django session
        }
      } catch (cause) {
        setBackendError(cause.message)
      } finally {
        setReady(true)
      }
    }

    boot()

    if (supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (nextSession?.user) {
          setUser(nextSession.user)
          await loadUserRoleAndData(nextSession.user)
        } else if (!nextSession) {
          setUser(null)
          setMembership(null)
          setProfile(null)
          setStrategy(null)
          setPage('overview')
        }
      })
      return () => {
        listener?.subscription?.unsubscribe()
      }
    }
  }, [loadUserRoleAndData, refreshData])

  async function handleLogin(email, password, isSignup = false) {
    setBusy(true)
    setError('')
    try {
      let supabaseAuthFailed = false
      let supabaseErrorMessage = ''

      // 1. Try Supabase Auth first
      if (supabase) {
        if (isSignup) {
          const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { role: 'member' } },
          })
          if (authError) throw authError
          setUser(data.user)
          setToast('Tài khoản Supabase đã được khởi tạo.')
          return
        }

        try {
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (!authError && data?.user) {
            setUser(data.user)
            await loadUserRoleAndData(data.user)
            setToast('Đăng nhập Supabase thành công.')
            return
          }

          if (authError) {
            supabaseAuthFailed = true
            supabaseErrorMessage = authError.message
          }
        } catch (err) {
          supabaseAuthFailed = true
          supabaseErrorMessage = err.message
        }
      }

      // 2. Fallback to Django API session if Supabase is not configured or user is stored locally
      try {
        const endpoint = isSignup ? 'auth/register/' : 'auth/login/'
        const res = await api(endpoint, {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setUser(res.user)
        setBackendError('')
        await refreshData()
        return
      } catch (djangoErr) {
        if (supabaseAuthFailed && supabaseErrorMessage) {
          if (supabaseErrorMessage.toLowerCase().includes('invalid login credentials')) {
            throw new Error('Email hoặc mật khẩu không chính xác. Nếu chưa có tài khoản, hãy chuyển sang tab Đăng ký hoặc dùng nút Demo bên dưới.')
          }
          throw new Error('Đăng nhập thất bại: ' + supabaseErrorMessage)
        }
        throw djangoErr
      }
    } catch (cause) {
      setError(cause.message || 'Đăng nhập thất bại.')
    } finally {
      setBusy(false)
    }
  }

  function handleDemoLogin(roleKey) {
    const demos = {
      system_admin: {
        id: 'sa-001',
        email: 'system_admin@castravision.vn',
        full_name: 'Platform Administrator',
        role: 'system_admin',
        app_metadata: { role: 'system_admin' },
        user_metadata: { role: 'system_admin' },
      },
      manager: {
        id: 'mgr-001',
        email: 'manager@company.castravision.vn',
        full_name: 'Sarah Jenkins',
        role: 'manager',
        app_metadata: { role: 'manager' },
        user_metadata: { role: 'manager' },
        business_name: 'Acme Marketing Corp',
      },
      leader: {
        id: 'ldr-001',
        email: 'leader@company.castravision.vn',
        full_name: 'Marcus Vance',
        role: 'leader',
        app_metadata: { role: 'leader' },
        user_metadata: { role: 'leader' },
        business_name: 'Acme Marketing Corp',
      },
      member: {
        id: 'mbr-001',
        email: 'member@company.castravision.vn',
        full_name: 'Alex Mercer',
        role: 'member',
        app_metadata: { role: 'member' },
        user_metadata: { role: 'member' },
        business_name: 'Acme Marketing Corp',
      },
    }

    const demo = demos[roleKey]
    if (demo) {
      setUser(demo)
      setMembership({
        role: roleKey === 'manager' ? 'admin' : roleKey === 'leader' ? 'manager' : 'member',
        workspaceName: demo.business_name || 'CastraVision Workspace',
      })
      setProfile({
        business_name: demo.business_name || 'CastraVision Workspace',
        industry: 'Thời trang & bán lẻ',
        business_size: 'Medium',
        target_customers: 'Khách hàng 20-35 tuổi yêu thích thời trang',
        primary_goal: 'Tăng trưởng doanh số đa kênh Meta, Google, TikTok',
        monthly_budget: '50000000',
        currency: 'VND',
        preferred_channels: ['Meta', 'Google Ads', 'TikTok'],
      })
      setPage('overview')
      setToast(`Đã chuyển sang giao diện vai trò: ${roleKey.toUpperCase()}`)
    }
  }

  async function saveProfile(draft) {
    setBusy(true)
    setError('')
    try {
      const data = await api('business-profile/', { method: 'PUT', body: JSON.stringify(draft) })
      setProfile(data.profile)
      setPage('overview')
      setToast('Hồ sơ doanh nghiệp đã được lưu.')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    try {
      if (supabase) {
        await supabase.auth.signOut().catch(() => {})
      }
      await api('auth/logout/', { method: 'POST' }).catch(() => {})
    } finally {
      setUser(null)
      setMembership(null)
      setProfile(null)
      setStrategy(null)
      setPage('overview')
    }
  }

  async function onImported() {
    const data = await api('campaign-imports/')
    setImports(data.imports)
    setLatestRows(data.latest_rows)
  }

  if (!ready) {
    return (
      <div className="loading-screen">
        <Brand />
        <span>Đang kết nối không gian làm việc Supabase…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onLogin={handleLogin}
        onDemoLogin={handleDemoLogin}
        busy={busy}
        error={error || backendError}
      />
    )
  }

  // ─── 1. SYSTEM ADMIN: Vào giao diện system-admin ──────────────────────────
  if (actorRole === 'system_admin') {
    return (
      <SystemAdminLayout
        user={user}
        onLogout={logout}
        onSignOut={logout}
        notify={setToast}
      />
    )
  }

  // ─── 2. MANAGER: Vào giao diện company-admin ──────────────────────────────
  if (actorRole === 'manager') {
    return (
      <MarketingManagerLayout
        user={user}
        profile={profile}
        page={page}
        setPage={setPage}
        onSignOut={logout}
        notify={setToast}
      >
        {page === 'import' && (
          <ImportScreen imports={imports} onImported={onImported} notify={setToast} />
        )}
        {page === 'strategy' && (
          <StrategyScreen
            profile={profile}
            latestRows={latestRows}
            result={strategy}
            setResult={setStrategy}
            notify={setToast}
          />
        )}
        {page === 'content' && (
          <ContentScreen
            result={strategy}
            profile={profile}
            setPage={setPage}
            notify={setToast}
          />
        )}
        {page === 'profile' && (
          <ProfileScreen
            profile={profile}
            onboarding={!profile}
            saveProfile={saveProfile}
            busy={busy}
            error={error}
            cancel={() => setPage('overview')}
          />
        )}
      </MarketingManagerLayout>
    )
  }

  // ─── 3. LEADER: Vào giao diện leader ──────────────────────────────────────
  if (actorRole === 'leader') {
    return (
      <Shell
        user={user}
        role="leader"
        profile={profile}
        page={page}
        setPage={setPage}
        logout={logout}
      >
        {backendError && <Notice>{backendError}</Notice>}
        {page === 'overview' && (
          <LeaderDashboard imports={imports} setPage={setPage} />
        )}
        {page === 'approvals' && (
          <ApprovalQueuePage notify={setToast} role="manager" />
        )}
        {page === 'budget' && <BudgetOptimizationPage notify={setToast} />}
        {page === 'reports' && (
          <ReportsPage profile={profile || { business_name: 'CastraVision Workspace' }} notify={setToast} />
        )}
        {page === 'insights' && <CompetitorInsightsPage notify={setToast} />}
        {page === 'import' && (
          <ImportScreen imports={imports} onImported={onImported} notify={setToast} />
        )}
        {page === 'strategy' && (
          <StrategyScreen
            profile={profile}
            latestRows={latestRows}
            result={strategy}
            setResult={setStrategy}
            notify={setToast}
          />
        )}
        {page === 'content' && (
          <ContentScreen
            result={strategy}
            profile={profile}
            setPage={setPage}
            notify={setToast}
          />
        )}
        {page === 'profile' && (
          <ProfileScreen
            profile={profile}
            onboarding={!profile}
            saveProfile={saveProfile}
            busy={busy}
            error={error}
            cancel={() => setPage('overview')}
          />
        )}
        <Toast message={toast} clear={() => setToast('')} />
      </Shell>
    )
  }

  // ─── 4. MEMBER: Vào giao diện member ──────────────────────────────────────
  return (
    <Shell
      user={user}
      role="member"
      profile={profile}
      page={page}
      setPage={setPage}
      logout={logout}
    >
      {backendError && <Notice>{backendError}</Notice>}
      {page === 'overview' && (
        <MemberDashboard
          profile={profile}
          imports={imports}
          strategy={strategy}
          setPage={setPage}
        />
      )}
      {page === 'budget' && <BudgetOptimizationPage notify={setToast} />}
      {page === 'insights' && <CompetitorInsightsPage notify={setToast} />}
      {page === 'import' && (
        <ImportScreen imports={imports} onImported={onImported} notify={setToast} />
      )}
      {page === 'strategy' && (
        <StrategyScreen
          profile={profile}
          latestRows={latestRows}
          result={strategy}
          setResult={setStrategy}
          notify={setToast}
        />
      )}
      {page === 'content' && (
        <ContentScreen
          result={strategy}
          profile={profile}
          setPage={setPage}
          notify={setToast}
        />
      )}
      {page === 'profile' && (
        <ProfileScreen
          profile={profile}
          onboarding={!profile}
          saveProfile={saveProfile}
          busy={busy}
          error={error}
          cancel={() => setPage('overview')}
        />
      )}
      <Toast message={toast} clear={() => setToast('')} />
    </Shell>
  )
}

function App() {
  // ─── Development Preview Route (/dashboard-preview) ───────────────────────
  const isPreviewPath =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/dashboard-preview' ||
      window.location.pathname.startsWith('/dashboard-preview/') ||
      window.location.hash === '#/dashboard-preview')

  if (isPreviewPath) {
    if (import.meta.env.DEV) {
      return <DashboardPreviewPage onExit={() => { window.location.href = '/' }} />
    }
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#070b14', color: '#f1f5f9', fontFamily: 'sans-serif', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 440, padding: 32, background: '#0e1726', border: '1px solid #1e293b', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>404 — Not Found</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
            The requested development preview page is not accessible in production.
          </p>
          <a href="/" style={{ display: 'inline-block', padding: '10px 18px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            Return to Login
          </a>
        </div>
      </div>
    )
  }

  return <WorkspaceApp />
}

export default App
