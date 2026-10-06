import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { useAuth } from './auth/AuthContext'
import { ROLE_LABELS, can, defaultPage } from './auth/permissions'
import { backendApi as api } from './lib/api'
import {
  createWorkspaceAndProfile,
  loadWorkspaceData,
  saveBusinessProfile,
} from './lib/workspace'

const CHANNELS = ['Meta', 'Google Ads', 'TikTok']
const SIZES = { Micro: '1–10 nhân sự', Small: '11–50 nhân sự', Medium: '51–250 nhân sự', Large: 'Trên 250 nhân sự' }
const EMPTY_PROFILE = { business_name: '', industry: '', business_size: '', target_customers: '', primary_goal: '', product_service: '', preferred_channels: [], monthly_budget: '', currency: 'VND' }
const FEATURE_NAV = [
  ['strategy', '◈', 'Chiến lược & phân tích', 'strategy:read'],
  ['content', '✦', 'Content Studio', 'content:write'],
  ['import', '⇥', 'Nhập dữ liệu chiến dịch', 'campaign:import'],
  ['profile', '☷', 'Hồ sơ doanh nghiệp', 'business:write'],
  ['members', '♙', 'Thành viên & vai trò', 'members:manage'],
  ['approvals', '✓', 'Phê duyệt', 'approval:write'],
]

function navigationFor(role) {
  const dashboardLabels = {
    admin: 'Quản trị Workspace',
    manager: 'Điều hành chiến dịch',
    member: 'Không gian nội dung',
  }
  return [
    [defaultPage(role), '▦', dashboardLabels[role] || 'Tổng quan', 'overview'],
    ...FEATURE_NAV.filter((item) => can(role, item[3])),
  ]
}

function Brand() { return <div className="brand"><span className="brand-icon" aria-hidden="true">✣</span><span>CastraVision</span></div> }
function Heading({ eyebrow, title, subtitle, children }) { return <div className="page-heading"><div><div className="eyebrow"><i /> {eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{children}</div> }
function Notice({ kind = 'error', children }) { return <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div> }
function Toast({ message, clear }) { return message && <div className="toast" role="status"><b>✓</b>{message}<button onClick={clear} aria-label="Đóng thông báo">×</button></div> }

function AuthScreen({ mode, setMode, signIn, signUp, backendError }) {
  const signup = mode === 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault(); setError('')
    if (signup && password !== confirm) return setError('Mật khẩu xác nhận không khớp.')
    setBusy(true)
    try { if (signup) await signUp(email, password); else await signIn(email, password) }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <div className="auth-page"><header className="auth-top"><Brand /></header><main className="auth-main"><div className="auth-card">
    <div className="auth-heading"><Brand /><span className="auth-pill">● AI MARKETING ASSISTANT FOR SMBS</span><h1>{signup ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h1><p>{signup ? 'Bắt đầu xây dựng chiến lược marketing trong vài phút.' : 'Đăng nhập để quản lý chiến lược marketing của bạn.'}</p></div>
    <form className="auth-form" onSubmit={submit}><label>Email công việc<input type="email" autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Mật khẩu<div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? 'Ẩn' : 'Hiện'}</button></div></label>{signup && <label>Xác nhận mật khẩu<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} placeholder="Nhập lại mật khẩu" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></label>}{(error || backendError) && <Notice>{error || backendError}</Notice>}<button className="button primary full" disabled={busy}>{busy ? 'Đang xử lý…' : signup ? 'Tạo tài khoản →' : 'Đăng nhập →'}</button></form>
    {signup && <p className="auth-terms">Tài khoản được bảo vệ bằng mật khẩu mã hóa và phiên đăng nhập an toàn.</p>}<div className="auth-switch">{signup ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button type="button" onClick={() => { setError(''); setMode(signup ? 'login' : 'signup') }}>{signup ? 'Đăng nhập' : 'Đăng ký'}</button></div>
  </div></main><footer className="auth-footer"><span>© 2026 CastraVision · Sprint 1</span><span>AI marketing workspace for SMBs</span></footer></div>
}

function Shell({ user, role, profile, page, setPage, logout, children }) {
  const navigation = navigationFor(role)
  const current = navigation.find(([key]) => key === page)?.[2] || 'Tổng quan'
  return <div className="shell"><aside className="sidebar"><div className="sidebar-brand"><Brand /><span className="sme-tag">SME AI</span></div><div className="workspace-switch"><span className="workspace-avatar">{(profile?.business_name || user.email).slice(0, 2).toUpperCase()}</span><span><strong>{profile?.business_name || 'Không gian mới'}</strong><small>{ROLE_LABELS[role] || 'Đang thiết lập'} · CastraVision</small></span><span>⌄</span></div><div className="nav-caption">ENGINE NAVIGATION</div><nav aria-label="Điều hướng chính">{navigation.map(([key, icon, label]) => <button key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => setPage(key)} aria-current={page === key ? 'page' : undefined}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav><div className="sidebar-bottom"><div><i /> Sprint 1 workspace <strong>Online</strong></div><div className="quota-line"><span /></div><small>FR12 · FR08 · FR01</small></div></aside><div className="main-wrap"><header className="app-topbar"><span className="mobile-brand"><Brand /></span><div className="topbar-context"><i /> {current.toUpperCase()}</div><div className="topbar-actions"><span className="sprint-label">{ROLE_LABELS[role] || 'SPRINT 1'}</span><span className="user-avatar">{user.email[0].toUpperCase()}</span><span className="user-email">{user.email}</span><button onClick={logout} className="text-button" type="button">Đăng xuất</button></div></header><main className="app-content">{children}</main></div></div>
}

function RoleDashboard({ role, profile, imports, strategy, setPage }) {
  const definitions = {
    admin: {
      eyebrow: 'ADMIN GOVERNANCE', title: 'Quản trị CastraVision',
      subtitle: 'Quản lý Workspace, phân quyền, dữ liệu chiến dịch và các quyết định cần phê duyệt.',
      cards: [['members', 'Thành viên & vai trò', 'Quản lý Admin, Manager và Member.'], ['approvals', 'Hàng chờ phê duyệt', 'Kiểm soát nội dung và đề xuất ngân sách.'], ['import', 'Dữ liệu chiến dịch', `${imports.length} nguồn dữ liệu gần đây.`]],
    },
    manager: {
      eyebrow: 'MANAGER OPERATIONS', title: 'Điều hành chiến dịch',
      subtitle: 'Đồng bộ dữ liệu, tạo chiến lược và điều phối nội dung đa kênh.',
      cards: [['import', 'Nhập dữ liệu', 'CSV, XLSX hoặc Sandbox.'], ['strategy', 'Tạo chiến lược', strategy ? 'Đã có chiến lược đang hoạt động.' : 'Sẵn sàng phân tích dữ liệu mới.'], ['content', 'Content Studio', 'Biên tập nội dung theo từng kênh.']],
    },
    member: {
      eyebrow: 'MEMBER WORKSPACE', title: 'Không gian nội dung',
      subtitle: 'Theo dõi chiến lược được chia sẻ và hoàn thiện nội dung trong phạm vi được giao.',
      cards: [['strategy', 'Chiến lược được chia sẻ', strategy ? 'Xem đề xuất mới nhất.' : 'Chưa có chiến lược được chia sẻ.'], ['content', 'Content Studio', 'Soạn và chỉnh sửa bản nháp đa kênh.']],
    },
  }
  const view = definitions[role] || definitions.member
  return <><Heading eyebrow={view.eyebrow} title={view.title} subtitle={view.subtitle} /><div className="benefit-grid">{view.cards.map(([target, title, text]) => <button type="button" className="card" key={target} onClick={() => setPage(target)}><strong>{title}</strong><p>{text}</p></button>)}</div><div className="card"><strong>{profile.business_name}</strong><p>{profile.industry} · {ROLE_LABELS[role]}</p></div></>
}

function PlaceholderPage({ title, subtitle }) {
  return <><Heading eyebrow="SPRINT 1 · ROLE CONTROL" title={title} subtitle={subtitle} /><div className="card result-empty"><span>◈</span><h3>Phân quyền đã được áp dụng</h3><p>Dữ liệu chi tiết sẽ được tải từ Supabase sau khi migration role-aware được áp dụng.</p></div></>
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

export function ImportScreen({ imports, onImported, notify }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef(null)
  async function stage(selected) {
    if (!selected) return
    setFile(selected); setPreview(null); setReport(null); setError(''); setBusy(true)
    try { const body = new FormData(); body.append('file', selected); setPreview(await api('campaign-imports/upload/', { method: 'POST', body })) }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  async function commit() {
    setBusy(true); setError('')
    try { const body = new FormData(); body.append('file', file); body.append('mode', 'commit'); const data = await api('campaign-imports/upload/', { method: 'POST', body }); await onImported(); setReport(data); notify(`${data.success_count} dòng dữ liệu đã được nhập.`); setFile(null); setPreview(null); if (input.current) input.current.value = '' }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  async function syncSandbox() {
    setBusy(true); setError(''); setFile(null); setPreview(null); setReport(null)
    if (input.current) input.current.value = ''
    try {
      const data = await api('campaign-imports/sandbox/', { method: 'POST' })
      setReport(data)
      setPreview({ row_count: data.row_count, error_count: data.failed_count, errors: data.errors, preview: data.preview })
      await onImported()
      notify(`Đã đồng bộ ${data.success_count} dòng từ Sandbox.`)
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  function downloadSample() { const csv = 'channel,period,spend,clicks,impressions,conversions,revenue\nMeta,2026-09,1500000,320,18000,25,3900000\nGoogle Ads,2026-09,1000000,240,12000,18,2800000\n'; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' })); link.download = 'castravision_sample.csv'; link.click(); URL.revokeObjectURL(link.href) }
  return <><Heading eyebrow="DATA INGESTION HUB" title="Nhập dữ liệu chiến dịch" subtitle="Tải lên dữ liệu hiệu suất hoặc đồng bộ bộ dữ liệu mẫu để làm giàu chiến lược marketing." /><div className={`upload-zone card ${file ? 'has-file' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); stage(e.dataTransfer.files[0]) }}><div className="upload-icon">⇧</div><h2>Kéo thả tệp vào đây</h2><p>hoặc chọn một nguồn dữ liệu bên dưới</p><span className="upload-separator">NGUỒN DỮ LIỆU</span><div className="upload-actions"><button className="button primary" type="button" onClick={() => input.current?.click()} disabled={busy}>⇧ Chọn tệp CSV / Excel</button><button className="button subtle sandbox-button" type="button" onClick={syncSandbox} disabled={busy}>↻ Đồng bộ từ Sandbox</button></div><input className="sr-only" ref={input} type="file" accept=".csv,.xlsx" onChange={(e) => stage(e.target.files[0])} /><small>Tối đa 5 MB · CSV UTF-8 hoặc XLSX</small><button type="button" className="inline-link" onClick={downloadSample}>↓ Tải CSV mẫu</button></div>
    {file && <div className="file-card card"><div className="file-success">✓</div><div className="file-info"><span className="mini-label">TỆP ĐÃ CHỌN · {(file.size / 1024 / 1024).toFixed(2)} MB</span><strong>{file.name}</strong><small>{busy ? 'Đang kiểm tra…' : preview ? `${preview.row_count} dòng hợp lệ · ${preview.error_count} dòng lỗi` : 'Chưa xác thực'}</small></div><div className="file-actions"><button className="button coral" type="button" onClick={() => { setFile(null); setPreview(null); setError('') }}>Gỡ bỏ</button><button className="button primary" type="button" disabled={busy || !preview || preview.error_count > 0 || preview.row_count === 0} onClick={commit}>Nhập dữ liệu →</button></div></div>}
    {error && <Notice>{error}</Notice>}{report && <section className="card import-report" role="status" aria-live="polite"><div className="report-heading"><div><span className="mini-label">BÁO CÁO NHẬP DỮ LIỆU</span><h3>{report.source === 'sandbox' ? 'Đồng bộ Sandbox hoàn tất' : 'Nhập tệp hoàn tất'}</h3></div><span className="report-badge">✓ Thành công</span></div><div className="report-stats"><div className="report-stat success"><strong>{report.success_count}</strong><span>Dòng thành công</span></div><div className="report-stat failure"><strong>{report.failed_count}</strong><span>Dòng thất bại</span></div></div><div className="report-meta"><span>Nguồn: <b>{report.source === 'sandbox' ? 'Sandbox' : report.filename}</b></span><span>Mã lần nhập: <b>#{report.import_id}</b></span></div></section>}{preview?.errors?.length > 0 && <div className="card validation-card"><h3>Cần sửa {preview.error_count} dòng trước khi nhập</h3>{preview.errors.map((item) => <p key={item.row}>Dòng {item.row}: {item.message}</p>)}</div>}{preview?.preview?.length > 0 && <div className="card preview-card"><h3>Xem trước dữ liệu chuẩn hóa</h3><div className="table-wrap"><table><thead><tr>{['Kênh', 'Kỳ', 'Chi phí', 'Clicks', 'Hiển thị', 'Chuyển đổi', 'Doanh thu'].map((value) => <th key={value}>{value}</th>)}</tr></thead><tbody>{preview.preview.map((row, index) => <tr key={index}><td>{row.channel}</td><td>{row.period}</td><td>{row.spend.toLocaleString('vi-VN')}</td><td>{row.clicks}</td><td>{row.impressions}</td><td>{row.conversions}</td><td>{row.revenue.toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div></div>}
    <div className="benefit-grid"><div className="card"><b>▣</b><strong>Định dạng chuẩn</strong><p>Tự ánh xạ cột chi phí, lượt nhấp, hiển thị và chuyển đổi.</p></div><div className="card"><b>♢</b><strong>Kiểm tra tự động</strong><p>Phát hiện cột thiếu, số âm và dòng không hợp lệ trước khi lưu.</p></div><div className="card"><b>ϟ</b><strong>Dùng cho phân tích</strong><p>Chỉ số từ tệp đã nhập được đưa vào yêu cầu tạo chiến lược.</p></div></div>{imports.length > 0 && <div className="card import-history"><h3>Lần nhập gần đây</h3>{imports.map((item) => <div key={item.id}><span>{item.filename}</span><small>{item.row_count} dòng · {new Date(item.created_at).toLocaleDateString('vi-VN')}</small></div>)}</div>}</>
}

function StrategyScreen({ profile, latestRows, result, setResult, notify }) {
  const initial = () => ({ campaign_goal: profile.primary_goal || '', target_audience: profile.target_customers || '', budget: profile.monthly_budget || '', preferred_channels: profile.preferred_channels.length ? profile.preferred_channels : CHANNELS })
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
  const money = (percentage) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: profile.currency, maximumFractionDigits: 0 }).format(Number(draft.budget) * percentage / 100)
  return <><Heading eyebrow="STRATEGY ENGINE" title="Tạo chiến lược" subtitle="Đặt mục tiêu và đối tượng để xây dựng đề xuất marketing dựa trên dữ liệu.">{latestRows.length > 0 && <span className="data-chip">✓ {latestRows.length} dòng lịch sử được sử dụng</span>}</Heading><div className="strategy-grid"><form className="card strategy-form" onSubmit={generate}><div className="section-head"><h2><i /> Thiết lập chiến dịch</h2><span className="step-badge">FR01 · Sprint 1</span></div><label>Mục tiêu chiến dịch<input value={draft.campaign_goal} onChange={(e) => setDraft({ ...draft, campaign_goal: e.target.value })} minLength={3} required placeholder="Ví dụ: Tăng doanh số mùa hè" /></label><label>Khách hàng mục tiêu<input value={draft.target_audience} onChange={(e) => setDraft({ ...draft, target_audience: e.target.value })} minLength={3} required placeholder="Ví dụ: Người trẻ 18–28 tuổi" /></label><label>Ngân sách tháng ({profile.currency})<input type="number" min="1" value={draft.budget} onChange={(e) => setDraft({ ...draft, budget: e.target.value })} required placeholder="30000000" /></label><div className="field-title">Kênh dự kiến</div><ChannelPicker channels={draft.preferred_channels} toggle={toggle} />{error && <Notice>{error}</Notice>}<div className="form-actions"><button type="button" className="button coral" onClick={() => setDraft(initial())}>↻ Đặt lại</button><button className="button primary" disabled={busy || !draft.preferred_channels.length}>{busy ? 'Đang phân tích…' : 'ϟ Tạo chiến lược'}</button></div></form><div className="card result-card"><div className="section-head"><div><h2>Đề xuất chiến lược AI</h2><p>Dựa trên hồ sơ và dữ liệu lịch sử của bạn</p></div>{result && <span className="active-badge">{result.strategy.confidence}% tin cậy</span>}</div>{!result ? <div className="result-empty"><span>◈</span><h3>Chưa có đề xuất</h3><p>Hoàn thành biểu mẫu và nhấn “Tạo chiến lược” để xem kênh, thông điệp và phân bổ ngân sách.</p></div> : <><div className="insight-box"><span className="mini-label">TRỌNG TÂM CHIẾN LƯỢC</span><p>{result.strategy.rationale}</p></div><div className="insight-box"><div className="allocation-head"><span className="mini-label">PHÂN BỔ ĐỀ XUẤT</span><span>{money(100)} tổng</span></div><div className="stacked-bar">{result.strategy.budget_allocation.map((item, index) => <span key={index} style={{ width: `${item.percentage}%` }} />)}</div><div className="allocation-grid">{result.strategy.budget_allocation.map((item, index) => <div key={index}><i className={`legend-dot d${index}`} /><strong>{item.channel}</strong><small>{item.percentage}% · {money(item.percentage)}</small></div>)}</div></div><div className="insight-box"><span className="mini-label">THÔNG ĐIỆP & PHÂN KHÚC</span><p>“{result.strategy.message}”</p><small>{result.strategy.segment}</small></div><div className="insight-box"><span className="mini-label">HÀNH ĐỘNG TIẾP THEO</span><ol>{result.strategy.actions.map((action, index) => <li key={index}>{action}</li>)}</ol></div><div className="result-footer"><span>{result.provider === 'openai' ? 'OpenAI' : 'Bản dự phòng có quy tắc'} · {result.context_sources.length} nguồn tham chiếu</span><button className="button subtle" type="button" onClick={generate} disabled={busy}>↻ Phân tích lại</button></div>{result.warning && <Notice kind="warning">{result.warning}</Notice>}</>}</div></div></>
}

export function ContentScreen({ result, profile, setPage, notify }) {
  const [channels, setChannels] = useState(CHANNELS)
  const [tone, setTone] = useState('Năng động & táo bạo')
  const [versions, setVersions] = useState({ Meta: 0, 'Google Ads': 0, TikTok: 0 })
  const [edits, setEdits] = useState({})
  const [editing, setEditing] = useState(null)
  const message = result?.strategy.message || ''
  const drafts = {
    Meta: { title: versions.Meta % 2 ? `${profile.business_name} — Ưu đãi dành riêng cho bạn` : `${profile.business_name} — Khám phá điều khác biệt`, body: versions.Meta % 2 ? `Một lựa chọn mới cho bạn. ${message}` : `${message} Khám phá ngay và tìm cảm hứng cho hành trình tiếp theo.`, cta: versions.Meta % 2 ? 'Khám phá ngay' : 'Tìm hiểu thêm' },
    'Google Ads': { title: versions['Google Ads'] % 2 ? `${profile.business_name} | Giải pháp đáng tin cậy` : `${profile.business_name} | ${profile.industry} phù hợp với bạn`, body: versions['Google Ads'] % 2 ? `${message} Tìm hiểu lựa chọn phù hợp với nhu cầu của bạn.` : `${profile.product_service || profile.business_name}. Xem giải pháp cho ${profile.target_customers}.`, cta: versions['Google Ads'] % 2 ? 'Xem giải pháp' : 'Truy cập website' },
    TikTok: { title: versions.TikTok % 2 ? `Bạn đã biết điều này về ${profile.business_name}?` : `Hook 0–3s · ${profile.business_name}`, body: versions.TikTok % 2 ? `Mở đầu bằng câu hỏi của ${profile.target_customers}. Chuyển cảnh nhanh sang giải pháp: ${profile.product_service || profile.business_name}.` : `Bắt đầu bằng tình huống gần gũi với ${profile.target_customers}. Giới thiệu lợi ích chính và kết bằng lời mời tìm hiểu thêm.`, cta: versions.TikTok % 2 ? 'Thử ngay hôm nay' : 'Xem ngay' },
  }
  const toggle = (channel) => setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel])
  const effective = (channel) => ({ ...drafts[channel], ...(edits[channel] || {}) })
  const updateField = (channel, field, value) => setEdits((current) => ({ ...current, [channel]: { ...effective(channel), ...current[channel], [field]: value } }))
  const regenerate = (channel) => {
    setVersions((current) => ({ ...current, [channel]: current[channel] + 1 }))
    setEdits((current) => { const next = { ...current }; delete next[channel]; return next })
    setEditing(null)
    notify(`Đã tạo lại nội dung cho kênh ${channel}.`)
  }
  const regenerateAll = () => {
    setVersions((current) => Object.fromEntries(CHANNELS.map((channel) => [channel, current[channel] + 1])))
    setEdits({}); setEditing(null); notify('Đã làm mới bản nháp nội dung.')
  }
  async function copy(value) { try { await navigator.clipboard.writeText(value); notify('Đã sao chép nội dung.') } catch { notify('Không thể sao chép trên trình duyệt này.') } }
  return <>
    <Heading eyebrow="CAMPAIGN ORCHESTRATION › CONTENT STUDIO" title="Tạo nội dung" subtitle="Phác thảo nội dung đa kênh từ chiến lược vừa tạo." />
    <div className="content-notice"><span>ⓘ</span><p>Đây là bản nháp nội dung theo mẫu. Hãy biên tập và kiểm tra trước khi đăng.</p></div>
    {!result ? <div className="card content-empty"><span>✦</span><h2>Hãy tạo chiến lược trước</h2><p>Content Studio sử dụng phân khúc và thông điệp từ đề xuất chiến lược của bạn.</p><button className="button primary" onClick={() => setPage('strategy')}>Đến màn hình chiến lược →</button></div> : <>
      <div className="content-steps">{['Chiến lược', 'Kênh', 'Đối tượng', 'Tạo nháp', 'Rà soát'].map((step, index) => <div key={step}><b>{index + 1}</b>{step}</div>)}</div>
      <div className="card content-controls">
        <div><span className="mini-label">CHIẾN LƯỢC</span><strong>{profile.business_name}</strong></div>
        <div className="control-channels"><span className="mini-label">KÊNH MỤC TIÊU</span><div>{CHANNELS.map((channel) => <button type="button" key={channel} onClick={() => toggle(channel)} className={channels.includes(channel) ? 'selected' : ''}>{channel} {channels.includes(channel) && '✓'}</button>)}</div></div>
        <div><span className="mini-label">KHÁCH HÀNG</span><strong>{result.strategy.segment}</strong></div>
        <label>GIỌNG ĐIỆU<select value={tone} onChange={(e) => setTone(e.target.value)}><option>Năng động & táo bạo</option><option>Thân thiện & gần gũi</option><option>Chuyên nghiệp & rõ ràng</option></select></label>
        <div className="content-control-actions"><button className="button coral" onClick={() => { setChannels(CHANNELS); setTone('Năng động & táo bạo'); setEdits({}); setEditing(null) }}>↻ Đặt lại</button><button className="button primary" onClick={regenerateAll}>✦ Tạo bản nháp</button></div>
      </div>
      <div className="content-results-heading"><h2>Bản nháp theo kênh <span>{channels.length} kênh</span></h2><small>Giọng điệu: {tone}</small></div>
      <div className="content-grid">{channels.map((channel) => {
        const item = effective(channel)
        const isEditing = editing === channel
        return <article className="card content-card" key={channel}>
          <div className="content-card-top"><span>{channel === 'Meta' ? 'Facebook Feed' : channel === 'Google Ads' ? 'Google Search Ads' : 'TikTok / Reels'}</span><small>{channel === 'Meta' ? '1080 × 1080' : channel === 'Google Ads' ? 'RSA' : '9:16'}</small></div>
          {isEditing ? <div className="inline-editor">
            <label>TIÊU ĐỀ / HOOK<input value={item.title} maxLength={120} onChange={(event) => updateField(channel, 'title', event.target.value)} /></label>
            <label>NỘI DUNG CHÍNH<textarea value={item.body} maxLength={1000} onChange={(event) => updateField(channel, 'body', event.target.value)} rows={7} /></label>
            <label>KÊU GỌI HÀNH ĐỘNG<input value={item.cta} maxLength={80} onChange={(event) => updateField(channel, 'cta', event.target.value)} /></label>
          </div> : <><span className="mini-label">TIÊU ĐỀ / HOOK</span><h3>{item.title}</h3><span className="mini-label">NỘI DUNG CHÍNH</span><p>{item.body}</p></>}
          <div className="content-preview"><span>{channel === 'TikTok' ? `0s Hook · 8s Lợi ích · CTA: ${item.cta}` : item.cta}</span><strong>{channel === 'Google Ads' ? '✓ Thông điệp nhất quán' : '✦ Bản nháp sẵn để rà soát'}</strong></div>
          <div className="content-card-actions"><button className="button subtle" onClick={() => setEditing(isEditing ? null : channel)}>{isEditing ? '✓ Lưu' : '✎ Sửa'}</button><button className="button subtle" onClick={() => regenerate(channel)}>↻ Tạo lại</button><button className="button subtle" onClick={() => copy(`${item.title}\n\n${item.body}\n\n${item.cta}`)}>⧉ Sao chép</button></div>
        </article>
      })}</div>
      <div className="content-bottom card"><strong>{channels.length} / 3 kênh được chọn</strong><span>Rà soát nội dung và tuân thủ chính sách quảng cáo trước khi xuất bản.</span></div>
    </>}
  </>
}

function App() {
  const auth = useAuth()
  const { ready, user, membership, workspaceId, needsOnboarding } = auth
  const [backendError, setBackendError] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('overview')
  const [imports, setImports] = useState([])
  const [latestRows, setLatestRows] = useState([])
  const [strategy, setStrategy] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const refreshData = useCallback(async (targetWorkspaceId = workspaceId) => { if (!targetWorkspaceId) return; const data = await loadWorkspaceData(targetWorkspaceId); setProfile(data.profile); setImports(data.imports); setLatestRows(data.latestRows); setPage(data.profile ? defaultPage(auth.role) : 'onboarding') }, [auth.role, workspaceId])
  // Loading remote workspace state is the synchronization performed by this effect.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { if (user && membership) refreshData().catch((cause) => setBackendError(cause.message)) }, [membership, refreshData, user])
  async function saveProfile(draft) { setBusy(true); setError(''); try { let targetWorkspaceId = workspaceId; if (!targetWorkspaceId) { targetWorkspaceId = await createWorkspaceAndProfile(draft); await auth.refreshMembership() } else { await saveBusinessProfile(targetWorkspaceId, draft) } await refreshData(targetWorkspaceId); setPage(defaultPage(auth.role || 'admin')); setToast('Hồ sơ doanh nghiệp đã được lưu.') } catch (cause) { setError(cause.message) } finally { setBusy(false) } }
  async function logout() { try { await auth.signOut() } finally { setProfile(null); setStrategy(null); setPage(defaultPage('member')) } }
  async function onImported() { await refreshData() }
  if (!ready) return <div className="loading-screen"><Brand /><span>Đang kết nối không gian làm việc…</span></div>
  const visibleError = backendError || auth.error
  if (!user) return <AuthScreen mode={authMode} setMode={setAuthMode} signIn={auth.signIn} signUp={auth.signUp} backendError={visibleError} />
  return <Shell user={user} role={auth.role} profile={profile} page={page} setPage={setPage} logout={logout}>{visibleError && <Notice>{visibleError}</Notice>}{(!profile || needsOnboarding || page === 'onboarding' || page === 'profile') && <ProfileScreen profile={profile} onboarding={!profile} saveProfile={saveProfile} busy={busy} error={error} cancel={profile ? () => setPage(defaultPage(auth.role)) : logout} />}{profile && page === defaultPage(auth.role) && <RoleDashboard role={auth.role} profile={profile} imports={imports} strategy={strategy} setPage={setPage} />}{profile && page === 'import' && can(auth.role, 'campaign:import') && <ImportScreen imports={imports} onImported={onImported} notify={setToast} />}{profile && page === 'strategy' && can(auth.role, 'strategy:generate') && <StrategyScreen profile={profile} latestRows={latestRows} result={strategy} setResult={setStrategy} notify={setToast} />}{profile && page === 'strategy' && !can(auth.role, 'strategy:generate') && <PlaceholderPage title="Chiến lược được chia sẻ" subtitle="Member có thể xem kết quả mới nhất nhưng không thể tạo hoặc phân tích lại chiến lược." />}{profile && page === 'content' && <ContentScreen result={strategy} profile={profile} setPage={setPage} notify={setToast} />}{profile && page === 'members' && can(auth.role, 'members:manage') && <PlaceholderPage title="Thành viên & vai trò" subtitle="Chỉ Admin có thể quản lý thành viên của Workspace." />}{profile && page === 'approvals' && can(auth.role, 'approval:write') && <PlaceholderPage title="Hàng chờ phê duyệt" subtitle="Chỉ Admin có thể phê duyệt hoặc từ chối đề xuất." />}<Toast message={toast} clear={() => setToast('')} /></Shell>
}

export default App
