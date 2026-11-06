import { useEffect, useRef, useState } from 'react'
import './App.css'
import MarketingManagerLayout from './company-admin/MarketingManagerLayout'
<<<<<<< Updated upstream
import { SystemAdminLayout } from './system-admin/SystemAdminLayout'
=======
import LeaderDashboard from './leader/screens/LeaderDashboard'
import MemberDashboard from './member/screens/MemberDashboard'
import MemberShell from './member/ui/MemberShell'
import MemberStrategyStudio from './member/ui/MemberStrategyStudio'
import MemberContentStudio from './member/ui/MemberContentStudio'
import MemberImportView from './member/ui/MemberImportView'
import {
  MemberAccountPage,
  MemberCampaignsPage,
  MemberNotificationsPage,
  MemberProposalsPage,
} from './member/ui/MemberWorkspacePages'
import {
  getMemberPageFromHash,
  getMemberPageHash,
  normalizeMemberPage,
} from './member/memberContract'
>>>>>>> Stashed changes
import {
  ApprovalQueuePage,
  BudgetOptimizationPage,
  ReportsPage,
  CompetitorInsightsPage,
  FloatingInput,
  Button,
} from './actor-ui/ActorPages'
import { canAccessFR04ApprovalQueue } from './auth/permissions'

const CHANNELS = ['Meta', 'Google Ads', 'TikTok']
const SIZES = { Micro: '1–10 employees', Small: '11–50 employees', Medium: '51–250 employees', Large: '250+ employees' }
const EMPTY_PROFILE = { business_name: '', industry: '', business_size: '', target_customers: '', primary_goal: '', product_service: '', preferred_channels: [], monthly_budget: '', currency: 'USD' }
const NAV = [
  ['overview', '▦', 'Campaign Overview'],
  ['strategy', '◈', 'Strategy & Insights'],
  ['content', '✦', 'Content Studio'],
<<<<<<< Updated upstream
  ['import', '⇥', 'Campaign Data Import'],
  ['budget', '↗', 'Budget & ROAS'],
  ['audit', '▤', 'Reports & Audit'],
  ['profile', '⚙', 'Settings & API'],
=======
  ['import', '⇥', 'Nhập dữ liệu chiến dịch'],
  ['budget', '↗', 'Tối ưu ngân sách'],
  ['approvals', '✓', 'Hàng chờ phê duyệt'],
  ['reports', '▤', 'Báo cáo chiến dịch'],
  ['insights', '◎', 'Phân tích đối thủ'],
  ['profile', '☷', 'Hồ sơ doanh nghiệp'],
>>>>>>> Stashed changes
]

function csrfToken() { return decodeURIComponent(document.cookie.split('; ').find((part) => part.startsWith('csrftoken='))?.split('=')[1] || '') }
async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData) && options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.method && options.method !== 'GET') headers['X-CSRFToken'] = csrfToken()
  let response
  try { response = await fetch(`/api/${path}`, { credentials: 'same-origin', ...options, headers }) }
  catch { throw new Error('Cannot connect to API server. Please check backend status.') }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || `Request failed (${response.status}).`)
  return data
}

function Notice({ kind = 'error', children }) { return <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div> }
function Toast({ message, clear }) { return message && <div className="toast" role="status"><b>✓</b>{message}<button onClick={clear} aria-label="Close notification">×</button></div> }

function AuthScreen({ onAuth, backendError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api('auth/login/', { method: 'POST', body: JSON.stringify({ email, password }) })
      onAuth(data.user)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  const displayError = error || backendError

  return (
    <div className="auth-page">
      <header className="auth-top"><Brand /></header>
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-heading">
            <Brand />
            <span className="auth-pill">● AI MARKETING ASSISTANT FOR SMBS</span>
            <h1>Welcome back</h1>
            <p>Sign in to manage your marketing strategy and workspace.</p>
          </div>
<<<<<<< Updated upstream

          <form className="auth-form" onSubmit={submit} noValidate>
            <FloatingInput
              label="Work Email"
              name="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <div className="auth-password-wrap">
              <FloatingInput
                label="Password"
                name="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-show-pw"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {displayError && (
              <div className="auth-error" role="alert">
                <span className="auth-error-icon">⚠</span>
                <span>{displayError}</span>
              </div>
=======
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email tài khoản
              <input
                id="auth-email"
                name="email"
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
                  id="auth-password"
                  name="password"
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
                  id="auth-password-confirm"
                  name="passwordConfirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={6}
                  placeholder="Nhập lại mật khẩu"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </label>
>>>>>>> Stashed changes
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={busy}
              loading={busy}
              className="auth-submit-btn"
            >
              {busy ? 'Signing in…' : 'Sign In →'}
            </Button>

            <div className="auth-footer-note">
              Access is by invitation only. Contact your administrator if you need access.
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--cv-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--cv-muted)', textAlign: 'center', fontWeight: 600, letterSpacing: '.05em' }}>DEVELOPER PREVIEW &amp; TEST ACCESS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Button
                  type="button"
                  variant="secondary"
                  style={{ width: '100%', fontSize: 12, borderColor: '#10b981', color: '#10b981', fontWeight: 600 }}
                  onClick={() => onAuth(
                    { email: 'admin@castravision.internal', full_name: 'Platform Administrator', role: 'system_admin' },
                    null,
                    'sa-dashboard'
                  )}
                >
                  Enter as System Admin 🛡 →
                </Button>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    type="button"
                    variant="secondary"
                    style={{ flex: 1, fontSize: 11 }}
                    onClick={() => onAuth(
                      { email: 'sarah.jenkins@acmecorp.com', full_name: 'Sarah Jenkins', role: 'admin' },
                      { business_name: 'Acme Corp', industry: 'Enterprise SaaS', business_size: 'Enterprise' },
                      'overview'
                    )}
                  >
                    Admin →
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    style={{ flex: 1, fontSize: 11, borderColor: '#818cf8', color: '#c7d2fe' }}
                    onClick={() => onAuth(
                      { email: 'marcus.vance@acmecorp.com', full_name: 'Marcus Vance', role: 'manager' },
                      { business_name: 'Acme Corp', industry: 'Enterprise SaaS', business_size: 'Enterprise' },
                      'overview'
                    )}
                  >
                    Manager →
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    style={{ flex: 1, fontSize: 11 }}
                    onClick={() => onAuth(
                      { email: 'member@acmecorp.com', full_name: 'Alex Mercer', role: 'member' },
                      { business_name: 'Acme Corp', industry: 'Enterprise SaaS', business_size: 'Enterprise' },
                      'overview'
                    )}
                  >
                    Member →
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <footer className="auth-footer">
        <span>© 2026 CastraVision · Enterprise Platform</span>
        <span>AI marketing workspace for SMBs</span>
      </footer>
    </div>
  )
}

<<<<<<< Updated upstream
function Shell({ user, profile, page, setPage, logout, children }) {
  const isAdmin = user?.role === 'admin'
  const canApprove = canAccessFR04ApprovalQueue(user)
  const navList = [
    ['overview', '▦', 'Campaign Overview'],
    ['strategy', '◈', 'Strategy & Insights'],
    ['content', '✦', 'Content Studio'],
    ['import', '⇥', 'Campaign Data Import'],
    ['budget', '↗', 'Budget & ROAS'],
    ...(canApprove ? [['approvals', '✓', 'Approval Queue']] : []),
    ...(isAdmin ? [['audit', '▤', 'Reports & Audit']] : []),
    ['profile', '⚙', 'Settings & API'],
    ...(isAdmin ? [
      ['admin', '⚡', 'Admin Console'],
    ] : []),
  ]

  const workspaceName = profile?.business_name || 'Acme Studios'
  const workspaceInitials = workspaceName.slice(0, 2).toUpperCase()
  const userName = user?.email ? user.email.split('@')[0] : 'Admin User'
  const userInitials = userName.slice(0, 2).toUpperCase()
  const userRoleTitle = isAdmin ? 'Admin • Security & Governance Lead' : 'ML • Growth Lead'
=======
function Shell({ user, role, profile, page, setPage, logout, children }) {
  const navList = LEADER_NAV
  const current = navList.find(([key]) => key === page)?.[2] || 'Tổng quan'
  const roleName = role === 'leader' ? 'Leader' : 'Member'
>>>>>>> Stashed changes

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
          <span className="sme-tag">SME AI</span>
        </div>
        <div className="workspace-switch" title="Active Workspace">
          <span className="workspace-avatar">{workspaceInitials}</span>
          <span>
            <strong>{workspaceName}</strong>
            <small>Enterprise Pro</small>
          </span>
          <span className="workspace-caret">⌄</span>
        </div>
        <div className="nav-caption">ENGINE NAVIGATION</div>
        <nav aria-label="Main Navigation">
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
          <div className="quota-header">
            <span>Copilot Quota</span>
            <span>78.4% Online</span>
          </div>
          <div className="quota-track">
            <span style={{ width: '78.4%' }} />
          </div>
          <div className="quota-footer">
            <small>Adaptive SME Model</small>
            <small>Latency 24ms</small>
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="app-topbar">
          <span className="mobile-brand"><Brand /></span>
          <div className="topbar-campaign">
            <span className="live-dot" />
            <span>ACTIVE CAMPAIGN:</span>
            <strong>Summer 2025 Campaign - SneakerX</strong>
            <div className="topbar-tags">
              <span className="topbar-tag">Meta</span>
              <span className="topbar-tag">Google</span>
              <span className="topbar-tag">TikTok</span>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="topbar-bell" type="button" aria-label="Notifications" title="Notifications">🔔</button>
            <div className="topbar-user">
              <span className="user-avatar">{userInitials}</span>
              <div className="user-meta">
                <span className="user-name">{userName}</span>
                <span className="user-role">{userRoleTitle}</span>
              </div>
            </div>
            <button onClick={logout} className="text-button" type="button">Sign Out</button>
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
  return <>
    <Heading
      eyebrow={onboarding ? 'NEW ACCOUNT SETUP' : 'BUSINESS SETTINGS'}
      title={onboarding ? 'Business Profile Setup' : 'Business Profile'}
      subtitle="Tell CastraVision about your business to personalize AI marketing recommendations and budget allocation."
    />
    <div className="stepper">
      <div className={step === 1 ? 'current' : 'done'}><b>1</b> Business Information</div>
      <div className={step === 2 ? 'current' : ''}><b>2</b> Goals &amp; Channels</div>
      <div className="step-track"><span style={{ width: step === 1 ? '50%' : '100%' }} /></div>
    </div>
    <form className="card profile-card" onSubmit={(event) => { event.preventDefault(); if (step === 1) setStep(2); else saveProfile(draft) }}>
      {step === 1 ? (
        <div className="form-grid">
          <label className="wide">Business Name *
            <input value={draft.business_name} onChange={(e) => set('business_name', e.target.value)} minLength={2} maxLength={120} required placeholder="e.g. Acme Studios / SneakerX" />
          </label>
          <label>Industry *
            <input value={draft.industry} onChange={(e) => set('industry', e.target.value)} minLength={2} maxLength={120} required placeholder="e.g. Footwear & Apparel" />
          </label>
          <label>Company Size *
            <select value={draft.business_size} onChange={(e) => set('business_size', e.target.value)} required>
              <option value="">Select company size</option>
              {Object.entries(SIZES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label className="wide">Target Audience / Customers *
            <textarea value={draft.target_customers} onChange={(e) => set('target_customers', e.target.value)} minLength={3} maxLength={500} required placeholder="Demographics, key regions, lifestyle preferences, and primary customer needs..." />
          </label>
        </div>
      ) : (
        <div className="form-grid">
          <label className="wide">Core Product or Service
            <input value={draft.product_service} onChange={(e) => set('product_service', e.target.value)} maxLength={500} placeholder="Primary product line or offering promoted in campaigns" />
          </label>
          <label className="wide">Primary Campaign Goal
            <input value={draft.primary_goal} onChange={(e) => set('primary_goal', e.target.value)} maxLength={300} placeholder="e.g. Accelerate DTC sales & customer acquisition" />
          </label>
          <label>Monthly Marketing Budget
            <input type="number" min="0" max="1000000000" value={draft.monthly_budget} onChange={(e) => set('monthly_budget', e.target.value)} placeholder="30000" />
          </label>
          <label>Currency
            <select value={draft.currency} onChange={(e) => set('currency', e.target.value)}>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>VND</option>
            </select>
          </label>
          <div className="wide">
            <div className="field-title">Preferred Ad Channels</div>
            <ChannelPicker channels={draft.preferred_channels} toggle={toggle} />
          </div>
        </div>
      )}
      {error && <Notice>{error}</Notice>}
      <div className="form-actions">
        <button type="button" className="button coral" onClick={step === 2 ? () => setStep(1) : cancel}>
          {step === 2 ? '← Back' : 'Cancel'}
        </button>
        <button className="button primary" disabled={busy}>
          {busy ? 'Saving Profile…' : step === 1 ? 'Continue →' : 'Save Profile ✓'}
        </button>
      </div>
    </form>
    <div className="under-card">
      <span>◈ Profile configuration can be modified anytime in workspace settings.</span>
      <span>Encrypted &amp; securely bound to your workspace</span>
    </div>
  </>
}

function Overview({ profile, imports, strategy, setPage }) {
  return <>
    <Heading
      eyebrow="CAMPAIGN WORKSPACE"
      title={`Welcome back, ${profile.business_name}`}
      subtitle="From enterprise data ingestion to actionable, multi-channel marketing campaigns."
    />
    <div className="overview-hero card">
      <div>
        <span className="mini-label">SPRINT 1 · MARKETING INTELLIGENCE</span>
        <h2>A clear, unified workflow for superior marketing outcomes.</h2>
        <p>Three core operational pillars integrated into one cohesive intelligence loop.</p>
      </div>
      <span className="hero-orbit" aria-hidden="true">✣</span>
    </div>
    <div className="overview-grid">
      <button className="overview-card card" onClick={() => setPage('profile')}>
        <span className="overview-number">01 / FR12</span>
        <span className="overview-icon violet">▣</span>
        <strong>Business Profile</strong>
        <p>{profile.industry} · {SIZES[profile.business_size] || profile.business_size}</p>
        <span className="card-link">View Profile →</span>
      </button>
      <button className="overview-card card" onClick={() => setPage('import')}>
        <span className="overview-number">02 / FR08</span>
        <span className="overview-icon cyan">⇥</span>
        <strong>Campaign Data Import</strong>
        <p>{imports.length ? `${imports[0].row_count} records imported` : 'CSV / XLSX validation & normalization'}</p>
        <span className="card-link">{imports.length ? 'View Data' : 'Start Import'} →</span>
      </button>
      <button className="overview-card card" onClick={() => setPage('strategy')}>
        <span className="overview-number">03 / FR01</span>
        <span className="overview-icon violet">◈</span>
        <strong>Generate AI Strategy</strong>
        <p>{strategy ? `Recommended Channel: ${strategy.strategy.recommended_channel}` : 'Synthesizing business profile & historical campaign records'}</p>
        <span className="card-link">{strategy ? 'View Strategy' : 'Generate Strategy'} →</span>
      </button>
    </div>
    <div className="overview-note card">
      <span>ⓘ</span>
      <div>
        <strong>About Content Studio</strong>
        <p>Figma prototype included as content draft scaffolding. Dedicated specialized AI generation is scheduled for subsequent sprints.</p>
      </div>
      <button className="button subtle" onClick={() => setPage('content')}>Open Content Studio →</button>
    </div>
  </>
}

function ImportScreen({ imports, onImported, notify, memberPresentation = false }) {
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
    try {
      const body = new FormData(); body.append('file', file); body.append('mode', 'commit')
      const data = await api('campaign-imports/upload/', { method: 'POST', body })
      await onImported()
      notify(`${data.row_count} data records imported successfully.`)
      setFile(null); setPreview(null)
      if (input.current) input.current.value = ''
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }
<<<<<<< Updated upstream
  function downloadSample() {
    const csv = 'channel,period,spend,clicks,impressions,conversions,revenue\nMeta,2026-09,1500,320,18000,25,3900\nGoogle Ads,2026-09,1000,240,12000,18,2800\n'
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }))
    link.download = 'castravision_sample.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return <>
    <Heading
      eyebrow="DATA INGESTION HUB"
      title="Campaign Data Import"
      subtitle="Upload historical campaign performance data to enrich AI strategy and budget models."
    />
    <div
      className={`upload-zone card ${file ? 'has-file' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); stage(e.dataTransfer.files[0]) }}
    >
      <div className="upload-icon">⇧</div>
      <h2>Drag and drop files here</h2>
      <p>or browse files from your computer</p>
      <span className="upload-separator">OR</span>
      <button className="button primary" type="button" onClick={() => input.current?.click()} disabled={busy}>
        ⇧ Select CSV / Excel File
      </button>
      <input className="sr-only" ref={input} type="file" accept=".csv,.xlsx" onChange={(e) => stage(e.target.files[0])} />
      <small>Maximum 5 MB · UTF-8 CSV or XLSX</small>
      <button type="button" className="inline-link" onClick={downloadSample}>↓ Download Sample CSV Template</button>
    </div>
    {file && (
      <div className="file-card card">
        <div className="file-success">✓</div>
        <div className="file-info">
          <span className="mini-label">SELECTED FILE · {(file.size / 1024 / 1024).toFixed(2)} MB</span>
          <strong>{file.name}</strong>
          <small>{busy ? 'Validating file…' : preview ? `${preview.row_count} valid records · ${preview.error_count} errors` : 'Pending validation'}</small>
        </div>
        <div className="file-actions">
          <button className="button coral" type="button" onClick={() => { setFile(null); setPreview(null); setError('') }}>Remove</button>
          <button className="button primary" type="button" disabled={busy || !preview || preview.error_count > 0 || preview.row_count === 0} onClick={commit}>
            Import Data →
          </button>
        </div>
      </div>
    )}
    {error && <Notice>{error}</Notice>}
    {preview?.errors?.length > 0 && (
      <div className="card validation-card">
        <h3>Please fix {preview.error_count} row(s) before importing</h3>
        {preview.errors.map((item) => <p key={item.row}>Row {item.row}: {item.message}</p>)}
      </div>
    )}
    {preview?.preview?.length > 0 && (
      <div className="card preview-card">
        <h3>Normalized Data Preview</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{['Channel', 'Period', 'Spend', 'Clicks', 'Impressions', 'Conversions', 'Revenue'].map((value) => <th key={value}>{value}</th>)}</tr>
            </thead>
            <tbody>
              {preview.preview.map((row, index) => (
                <tr key={index}>
                  <td>{row.channel}</td>
                  <td>{row.period}</td>
                  <td>{typeof row.spend === 'number' ? row.spend.toLocaleString('en-US') : row.spend}</td>
                  <td>{row.clicks}</td>
                  <td>{row.impressions}</td>
                  <td>{row.conversions}</td>
                  <td>{typeof row.revenue === 'number' ? row.revenue.toLocaleString('en-US') : row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
    <div className="benefit-grid">
      <div className="card">
        <b>▣</b>
        <strong>Standard Schema</strong>
        <p>Automatically maps spend, clicks, impressions, conversions, and revenue columns.</p>
      </div>
      <div className="card">
        <b>♢</b>
        <strong>Automated Validation</strong>
        <p>Detects missing headers, negative numbers, and invalid date formats before commit.</p>
      </div>
      <div className="card">
        <b>ϟ</b>
        <strong>Direct Strategy Ingestion</strong>
        <p>Ingested metrics feed directly into the AI strategy allocation and optimization engine.</p>
      </div>
    </div>
    {imports.length > 0 && (
      <div className="card import-history">
        <h3>Recent Imports</h3>
        {imports.map((item) => (
          <div key={item.id}>
            <span>{item.filename}</span>
            <small>{item.row_count} records · {new Date(item.created_at).toLocaleDateString('en-US')}</small>
          </div>
        ))}
      </div>
    )}
  </>
}

function StrategyScreen({ profile, latestRows, result, setResult, notify }) {
  const initial = () => ({
    campaign_goal: profile.primary_goal || '',
    target_audience: profile.target_customers || '',
    budget: profile.monthly_budget || '',
    preferred_channels: profile.preferred_channels?.length ? profile.preferred_channels : CHANNELS,
  })
=======
  function downloadSample() { const csv = 'channel,period,spend,clicks,impressions,conversions,revenue\nMeta,2026-09,1500000,320,18000,25,3900000\nGoogle Ads,2026-09,1000000,240,12000,18,2800000\n'; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' })); link.download = 'castravision_sample.csv'; link.click(); URL.revokeObjectURL(link.href) }
  if (memberPresentation) return <MemberImportView imports={imports} file={file} preview={preview} busy={busy} error={error} input={input} onSelect={stage} onDrop={(event) => { event.preventDefault(); stage(event.dataTransfer.files[0]) }} onRemove={() => { setFile(null); setPreview(null); setError(''); if (input.current) input.current.value = '' }} onCommit={commit} onDownload={downloadSample} />
  return <div className="member-page member-import-page"><Heading eyebrow="CAMPAIGN IMPORT · DATA INGESTION" title="Campaign Data Import" subtitle="Import external campaign telemetry and historical datasets to support your strategy workflow." /><div className="member-callout"><span className="member-callout__icon" aria-hidden="true">ⓘ</span><div><strong>Supported files: CSV and XLSX</strong><p>Use the standard campaign columns for automatic mapping and validation.</p></div><button type="button" className="member-text-button" onClick={downloadSample}>Download schema template ↗</button></div><div className={`upload-zone card ${file ? 'has-file' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); stage(e.dataTransfer.files[0]) }}><div className="upload-icon">⇧</div><h2>Kéo thả tệp vào đây</h2><p>hoặc chọn tệp từ thiết bị</p><span className="upload-separator">OR</span><button className="button primary" type="button" onClick={() => input.current?.click()} disabled={busy}>⇧ Chọn tệp CSV / Excel</button><input className="sr-only" ref={input} type="file" accept=".csv,.xlsx" onChange={(e) => stage(e.target.files[0])} /><small>Tối đa 5 MB · CSV UTF-8 hoặc XLSX</small><button type="button" className="inline-link" onClick={downloadSample}>↓ Tải CSV mẫu</button></div><div className="member-callout"><span className="member-callout__icon" aria-hidden="true">ϟ</span><div><strong>Data stays in the workspace</strong><p>Imported rows are validated before they are used by the strategy engine.</p></div></div>
    {file && <div className="file-card card"><div className="file-success">✓</div><div className="file-info"><span className="mini-label">TỆP ĐÃ CHỌN · {(file.size / 1024 / 1024).toFixed(2)} MB</span><strong>{file.name}</strong><small>{busy ? 'Đang kiểm tra…' : preview ? `${preview.row_count} dòng hợp lệ · ${preview.error_count} dòng lỗi` : 'Chưa xác thực'}</small></div><div className="file-actions"><button className="button coral" type="button" onClick={() => { setFile(null); setPreview(null); setError('') }}>Gỡ bỏ</button><button className="button primary" type="button" disabled={busy || !preview || preview.error_count > 0 || preview.row_count === 0} onClick={commit}>Nhập dữ liệu →</button></div></div>}
    {error && <Notice>{error}</Notice>}{preview?.errors?.length > 0 && <div className="card validation-card"><h3>Cần sửa {preview.error_count} dòng trước khi nhập</h3>{preview.errors.map((item) => <p key={item.row}>Dòng {item.row}: {item.message}</p>)}</div>}{preview?.preview?.length > 0 && <div className="card preview-card"><h3>Xem trước dữ liệu chuẩn hóa</h3><div className="table-wrap"><table><thead><tr>{['Kênh', 'Kỳ', 'Chi phí', 'Clicks', 'Hiển thị', 'Chuyển đổi', 'Doanh thu'].map((value) => <th key={value}>{value}</th>)}</tr></thead><tbody>{preview.preview.map((row, index) => <tr key={index}><td>{row.channel}</td><td>{row.period}</td><td>{row.spend.toLocaleString('vi-VN')}</td><td>{row.clicks}</td><td>{row.impressions}</td><td>{row.conversions}</td><td>{row.revenue.toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div></div>}
    <div className="benefit-grid"><div className="card"><b>▣</b><strong>Định dạng chuẩn</strong><p>Tự ánh xạ cột chi phí, lượt nhấp, hiển thị và chuyển đổi.</p></div><div className="card"><b>♢</b><strong>Kiểm tra tự động</strong><p>Phát hiện cột thiếu, số âm và dòng không hợp lệ trước khi lưu.</p></div><div className="card"><b>ϟ</b><strong>Dùng cho phân tích</strong><p>Chỉ số từ tệp đã nhập được đưa vào yêu cầu tạo chiến lược.</p></div></div><div className="card import-history"><div className="member-panel__header"><div><span className="member-eyebrow">Imported datasets</span><h2>Lần nhập gần đây</h2></div><span className="member-panel__meta">{imports.length} batches</span></div>{imports.length > 0 ? imports.map((item) => <div key={item.id}><span>{item.filename}</span><small>{item.row_count} dòng · {new Date(item.created_at).toLocaleDateString('vi-VN')}</small></div>) : <div className="member-empty-state"><span className="member-empty-state__icon" aria-hidden="true">⇧</span><h2>Chưa có dữ liệu nhập</h2><p>Validated files appear here after an import completes successfully.</p></div>}</div></div>
}

function StrategyScreen({ profile, latestRows, result, setResult, notify, memberPresentation = false, setPage }) {
  const initial = () => ({ campaign_goal: profile?.primary_goal || '', target_audience: profile?.target_customers || '', budget: profile?.monthly_budget || '', preferred_channels: profile?.preferred_channels?.length ? profile.preferred_channels : CHANNELS })
>>>>>>> Stashed changes
  const [draft, setDraft] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toggle = (channel) => setDraft((current) => ({
    ...current,
    preferred_channels: current.preferred_channels.includes(channel)
      ? current.preferred_channels.filter((item) => item !== channel)
      : [...current.preferred_channels, channel],
  }))
  async function generate(event) {
    event?.preventDefault(); setBusy(true); setError('')
    try {
      const historical_data = latestRows.slice(0, 30).map((row) => ({
        channel: CHANNELS.includes(row.channel) ? row.channel : 'Other',
        period: row.period,
        ctr: row.impressions ? +(row.clicks / row.impressions * 100).toFixed(2) : 0,
        cpa: row.conversions ? +(row.spend / row.conversions).toFixed(2) : 0,
        roas: row.spend ? +(row.revenue / row.spend).toFixed(2) : 0,
      }))
      const payload = {
        business_name: profile.business_name,
        industry: profile.industry,
        business_size: profile.business_size,
        product_service: profile.product_service || profile.business_name,
        target_audience: draft.target_audience,
        campaign_goal: draft.campaign_goal,
        budget: Number(draft.budget),
        currency: profile.currency,
        preferred_channels: draft.preferred_channels,
        historical_data,
      }
      const data = await api('strategies/generate/', { method: 'POST', body: JSON.stringify(payload) })
      setResult(data)
      notify('AI Strategy recommendation generated successfully.')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }
<<<<<<< Updated upstream
  const money = (percentage) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: profile.currency || 'USD',
    maximumFractionDigits: 0,
  }).format((Number(draft.budget) || 0) * percentage / 100)

  return <>
    <Heading
      eyebrow="STRATEGY ENGINE"
      title="Strategy &amp; Insights"
      subtitle="Define campaign objectives and audience segments to generate data-driven marketing strategies."
    >
      {latestRows.length > 0 && <span className="data-chip">✓ {latestRows.length} historical records utilized</span>}
    </Heading>
    <div className="strategy-grid">
      <form className="card strategy-form" onSubmit={generate}>
        <div className="section-head">
          <h2><i /> Campaign Configuration</h2>
          <span className="step-badge">FR01 · Sprint 1</span>
        </div>
        <label>Campaign Goal
          <input value={draft.campaign_goal} onChange={(e) => setDraft({ ...draft, campaign_goal: e.target.value })} minLength={3} required placeholder="e.g. Accelerate Q4 direct-to-consumer sales" />
        </label>
        <label>Target Audience
          <input value={draft.target_audience} onChange={(e) => setDraft({ ...draft, target_audience: e.target.value })} minLength={3} required placeholder="e.g. Gen Z urban sneakerheads aged 18–28" />
        </label>
        <label>Monthly Budget ({profile.currency || 'USD'})
          <input type="number" min="1" value={draft.budget} onChange={(e) => setDraft({ ...draft, budget: e.target.value })} required placeholder="30000" />
        </label>
        <div className="field-title">Planned Channels</div>
        <ChannelPicker channels={draft.preferred_channels} toggle={toggle} />
        {error && <Notice>{error}</Notice>}
        <div className="form-actions">
          <button type="button" className="button coral" onClick={() => setDraft(initial())}>↻ Reset</button>
          <button className="button primary" disabled={busy || !draft.preferred_channels.length}>
            {busy ? 'Analyzing Campaign Data…' : 'ϟ Generate Strategy'}
          </button>
        </div>
      </form>
      <div className="card result-card">
        <div className="section-head">
          <div>
            <h2>AI Strategy Recommendation</h2>
            <p>Synthesized from business profile &amp; verified historical metrics</p>
          </div>
          {result && <span className="active-badge">{result.strategy.confidence}% Confidence</span>}
        </div>
        {!result ? (
          <div className="result-empty">
            <span>◈</span>
            <h3>No Strategy Generated Yet</h3>
            <p>Complete the campaign configuration form and click “Generate Strategy” to view recommended channel allocations, messaging, and action steps.</p>
          </div>
        ) : (
          <>
            <div className="insight-box">
              <span className="mini-label">STRATEGY FOCUS</span>
              <p>{result.strategy.rationale}</p>
            </div>
            <div className="insight-box">
              <div className="allocation-head">
                <span className="mini-label">RECOMMENDED ALLOCATION</span>
                <span>{money(100)} Total</span>
              </div>
              <div className="stacked-bar">
                {result.strategy.budget_allocation.map((item, index) => <span key={index} style={{ width: `${item.percentage}%` }} />)}
              </div>
              <div className="allocation-grid">
                {result.strategy.budget_allocation.map((item, index) => (
                  <div key={index}>
                    <i className={`legend-dot d${index}`} />
                    <strong>{item.channel}</strong>
                    <small>{item.percentage}% · {money(item.percentage)}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="insight-box">
              <span className="mini-label">MESSAGING &amp; AUDIENCE SEGMENT</span>
              <p>“{result.strategy.message}”</p>
              <small>{result.strategy.segment}</small>
            </div>
            <div className="insight-box">
              <span className="mini-label">NEXT ACTION STEPS</span>
              <ol>{result.strategy.actions.map((action, index) => <li key={index}>{action}</li>)}</ol>
            </div>
            <div className="result-footer">
              <span>{result.provider === 'openai' ? 'OpenAI GPT-4' : 'Rule-Based Fallback Engine'} · {result.context_sources.length} Context Sources</span>
              <button className="button subtle" type="button" onClick={generate} disabled={busy}>↻ Re-analyze</button>
            </div>
            {result.warning && <Notice kind="warning">{result.warning}</Notice>}
          </>
        )}
      </div>
    </div>
  </>
=======
  const money = (percentage) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: profile?.currency || 'VND', maximumFractionDigits: 0 }).format(Number(draft.budget || 0) * percentage / 100)
  if (memberPresentation) return <MemberStrategyStudio profile={profile} latestRows={latestRows} result={result} onOpenContent={() => setPage('content')} controls={<form className="member-panel member-strategy-controls" onSubmit={generate}><div className="member-panel__header"><div><span className="member-eyebrow">Strategy controls</span><h2>Campaign parameters</h2></div><span className="member-status">FR01 · Planning</span></div><label>Campaign objective<input value={draft.campaign_goal} onChange={(event) => setDraft({ ...draft, campaign_goal: event.target.value })} minLength={3} required /></label><label>Target audience<input value={draft.target_audience} onChange={(event) => setDraft({ ...draft, target_audience: event.target.value })} minLength={3} required /></label><label>Monthly budget ({profile?.currency || 'VND'})<input type="number" min="1" value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: event.target.value })} required /></label><div className="field-title">Preferred channels</div><ChannelPicker channels={draft.preferred_channels} toggle={toggle} />{error && <Notice>{error}</Notice>}<div className="form-actions"><button type="button" className="button coral" onClick={() => setDraft(initial())}>Reset</button><button className="button primary" disabled={busy || !draft.preferred_channels.length}>{busy ? 'Analyzing…' : 'Generate strategy'}</button></div>{result && <button type="button" className="button subtle" onClick={generate} disabled={busy}>Regenerate recommendation</button>}</form>} />
  return <div className="member-page member-strategy-page"><Heading eyebrow="STRATEGY STUDIO · DATA-DRIVEN PLANNING" title="AI Strategy Studio" subtitle="Build and review marketing recommendations using your business profile and imported campaign history.">{latestRows.length > 0 && <span className="data-chip">{latestRows.length.toLocaleString()} workspace rows available</span>}</Heading><div className="strategy-grid"><form className="card strategy-form" onSubmit={generate}><div className="section-head"><h2><i /> Thiết lập chiến dịch</h2><span className="step-badge">FR01 · Sprint 1</span></div><label>Mục tiêu chiến dịch<input value={draft.campaign_goal} onChange={(e) => setDraft({ ...draft, campaign_goal: e.target.value })} minLength={3} required placeholder="Ví dụ: Tăng doanh số mùa hè" /></label><label>Khách hàng mục tiêu<input value={draft.target_audience} onChange={(e) => setDraft({ ...draft, target_audience: e.target.value })} minLength={3} required placeholder="Ví dụ: Người trẻ 18–28 tuổi" /></label><label>Ngân sách tháng ({profile?.currency || 'VND'})<input type="number" min="1" value={draft.budget} onChange={(e) => setDraft({ ...draft, budget: e.target.value })} required placeholder="30000000" /></label><div className="field-title">Kênh dự kiến</div><ChannelPicker channels={draft.preferred_channels} toggle={toggle} />{error && <Notice>{error}</Notice>}<div className="form-actions"><button type="button" className="button coral" onClick={() => setDraft(initial())}>↻ Đặt lại</button><button className="button primary" disabled={busy || !draft.preferred_channels.length}>{busy ? 'Đang phân tích…' : 'ϟ Tạo chiến lược'}</button></div></form><div className="card result-card"><div className="section-head"><div><h2>Đề xuất chiến lược AI</h2><p>Dựa trên hồ sơ và dữ liệu lịch sử của bạn</p></div>{result && <span className="active-badge">{result.strategy.confidence}% tin cậy</span>}</div>{!result ? <div className="result-empty"><span>◈</span><h3>Chưa có đề xuất</h3><p>Hoàn thành biểu mẫu và nhấn “Tạo chiến lược” để xem kênh, thông điệp và phân bổ ngân sách.</p></div> : <><div className="insight-box"><span className="mini-label">TRỌNG TÂM CHIẾN LƯỢC</span><p>{result.strategy.rationale}</p></div><div className="insight-box"><div className="allocation-head"><span className="mini-label">PHÂN BỔ ĐỀ XUẤT</span><span>{money(100)} tổng</span></div><div className="stacked-bar">{result.strategy.budget_allocation.map((item, index) => <span key={index} style={{ width: `${item.percentage}%` }} />)}</div><div className="allocation-grid">{result.strategy.budget_allocation.map((item, index) => <div key={index}><i className={`legend-dot d${index}`} /><strong>{item.channel}</strong><small>{item.percentage}% · {money(item.percentage)}</small></div>)}</div></div><div className="insight-box"><span className="mini-label">THÔNG ĐIỆP & PHÂN KHÚC</span><p>“{result.strategy.message}”</p><small>{result.strategy.segment}</small></div><div className="insight-box"><span className="mini-label">HÀNH ĐỘNG TIẾP THEO</span><ol>{result.strategy.actions.map((action, index) => <li key={index}>{action}</li>)}</ol></div><div className="result-footer"><span>{result.provider === 'openai' ? 'OpenAI' : 'Bản dự phòng có quy tắc'} · {result.context_sources.length} nguồn tham chiếu</span><button className="button subtle" type="button" onClick={generate} disabled={busy}>↻ Phân tích lại</button></div>{result.warning && <Notice kind="warning">{result.warning}</Notice>}</>}</div></div></div>
>>>>>>> Stashed changes
}

function ContentScreen({ result, profile, setPage, notify }) {
  const [channels, setChannels] = useState(CHANNELS)
  const [tone, setTone] = useState('Active & Bold')
  const [version, setVersion] = useState(0)
  const [edits, setEdits] = useState({})
  const [editing, setEditing] = useState(null)
  const message = result?.strategy.message || ''
  const drafts = {
    Meta: {
      title: `${profile.business_name} — Experience the Difference`,
      body: version % 2
        ? `A fresh standard in daily performance. ${message}`
        : `${message} Step forward with confidence and discover the collection designed for your daily journey.`,
      cta: 'Explore Collection',
    },
    'Google Ads': {
      title: `${profile.business_name} | Built for Everyday Performance`,
      body: `${profile.product_service || profile.business_name}. Discover purpose-built designs tailored for ${profile.target_customers}.`,
      cta: 'Visit Official Store',
    },
    TikTok: {
      title: `Hook 0–3s · ${profile.business_name}`,
      body: version % 2
        ? `Open with common pain point among ${profile.target_customers}. Fast cut to product solution: ${profile.product_service || profile.business_name}.`
        : `Start with high-energy POV relatable to ${profile.target_customers}. Highlight signature durability and wrap with prompt to explore the drop.`,
      cta: 'Watch Now',
    },
  }
  const toggle = (channel) => setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel])
<<<<<<< Updated upstream
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value)
      notify('Content copied to clipboard.')
    } catch {
      notify('Unable to access clipboard in this browser.')
    }
  }
  return <>
    <Heading
      eyebrow="CAMPAIGN ORCHESTRATION › CONTENT STUDIO"
      title="Content Studio"
      subtitle="Draft and refine multi-channel advertising copy aligned with your active strategy."
    />
    <div className="content-notice">
      <span>ⓘ</span>
      <p>Draft content templates generated from strategy parameters. Review and refine copy before publishing to ad networks.</p>
    </div>
    {!result ? (
      <div className="card content-empty">
        <span>✦</span>
        <h2>Generate Strategy First</h2>
        <p>Content Studio utilizes audience segments and core messaging generated by your strategy engine.</p>
        <button className="button primary" onClick={() => setPage('strategy')}>Open Strategy Engine →</button>
      </div>
    ) : (
      <>
        <div className="content-steps">
          {['Strategy', 'Channels', 'Audience', 'Drafting', 'Review'].map((step, index) => <div key={step}><b>{index + 1}</b>{step}</div>)}
        </div>
        <div className="card content-controls">
          <div>
            <span className="mini-label">ACTIVE STRATEGY</span>
            <strong>{profile.business_name}</strong>
          </div>
          <div className="control-channels">
            <span className="mini-label">TARGET CHANNELS</span>
            <div>
              {CHANNELS.map((channel) => (
                <button type="button" key={channel} onClick={() => toggle(channel)} className={channels.includes(channel) ? 'selected' : ''}>
                  {channel} {channels.includes(channel) && '✓'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mini-label">AUDIENCE SEGMENT</span>
            <strong>{result.strategy.segment}</strong>
          </div>
          <label>TONE OF VOICE
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option>Active &amp; Bold</option>
              <option>Friendly &amp; Approachable</option>
              <option>Professional &amp; Clear</option>
            </select>
          </label>
          <div className="content-control-actions">
            <button className="button coral" onClick={() => { setChannels(CHANNELS); setTone('Active & Bold'); setEdits({}) }}>↻ Reset</button>
            <button className="button primary" onClick={() => { setVersion(version + 1); setEdits({}); notify('Content drafts refreshed.') }}>✦ Generate Drafts</button>
          </div>
        </div>
        <div className="content-results-heading">
          <h2>Channel Drafts <span>{channels.length} channels selected</span></h2>
          <small>Tone: {tone}</small>
        </div>
        <div className="content-grid">
          {channels.map((channel) => {
            const item = drafts[channel]
            const value = edits[channel] ?? item.body
            return (
              <div className="card content-card" key={channel}>
                <div className="content-card-top">
                  <span>{channel === 'Meta' ? 'Facebook / Instagram Feed' : channel === 'Google Ads' ? 'Google Search RSA' : 'TikTok / Reels'}</span>
                  <small>{channel === 'Meta' ? '1080 × 1080' : channel === 'Google Ads' ? 'RSA' : '9:16'}</small>
                </div>
                <span className="mini-label">HEADLINE / HOOK</span>
                <h3>{item.title}</h3>
                <span className="mini-label">BODY COPY</span>
                {editing === channel ? (
                  <textarea value={value} onChange={(e) => setEdits({ ...edits, [channel]: e.target.value })} rows={7} />
                ) : (
                  <p>{value}</p>
                )}
                <div className="content-preview">
                  <span>{channel === 'TikTok' ? '0s Hook · 8s Benefits · 15s CTA' : item.cta}</span>
                  <strong>{channel === 'Google Ads' ? '✓ Message Match Verified' : '✦ Ready for Review'}</strong>
                </div>
                <div className="content-card-actions">
                  <button className="button subtle" onClick={() => setEditing(editing === channel ? null : channel)}>
                    {editing === channel ? '✓ Done' : '✎ Edit'}
                  </button>
                  <button className="button subtle" onClick={() => copy(`${item.title}\n\n${value}\n\n${item.cta}`)}>
                    ⧉ Copy
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="content-bottom card">
          <strong>{channels.length} / 3 channels configured</strong>
          <span>Review copy and verify advertising network policy compliance prior to export.</span>
        </div>
      </>
    )}
  </>
=======
  async function copy(value) { try { await navigator.clipboard.writeText(value); notify('Đã sao chép nội dung.') } catch { notify('Không thể sao chép trên trình duyệt này.') } }
  return <div className="member-page member-content-page"><Heading eyebrow="CONTENT STUDIO · CAMPAIGN WORKFLOW" title="AI Content Studio" subtitle="Draft and refine channel-ready marketing copy using the strategy and business context available to your workspace." /><div className="content-notice"><span>ⓘ</span><p>Đây là bản nháp nội dung theo mẫu, chưa phải hệ thống sinh nội dung AI chuyên biệt. Hãy biên tập và kiểm tra trước khi đăng.</p></div>{!result ? <div className="card content-empty"><span>✦</span><h2>Hãy tạo chiến lược trước</h2><p>Content Studio sử dụng phân khúc và thông điệp từ đề xuất chiến lược của bạn.</p><button className="button primary" onClick={() => setPage('strategy')}>Đến màn hình chiến lược →</button></div> : <><div className="content-steps">{['Chiến lược', 'Kênh', 'Đối tượng', 'Tạo nháp', 'Rà soát'].map((step, index) => <div key={step}><b>{index + 1}</b>{step}</div>)}</div><div className="card content-controls"><div><span className="mini-label">CHIẾN LƯỢC</span><strong>{businessName}</strong></div><div className="control-channels"><span className="mini-label">KÊNH MỤC TIÊU</span><div>{CHANNELS.map((channel) => <button type="button" key={channel} onClick={() => toggle(channel)} className={channels.includes(channel) ? 'selected' : ''}>{channel} {channels.includes(channel) && '✓'}</button>)}</div></div><div><span className="mini-label">KHÁCH HÀNG</span><strong>{result.strategy.segment}</strong></div><label>GIỌNG ĐIỆU<select value={tone} onChange={(e) => setTone(e.target.value)}><option>Năng động & táo bạo</option><option>Thân thiện & gần gũi</option><option>Chuyên nghiệp & rõ ràng</option></select></label><div className="content-control-actions"><button className="button coral" onClick={() => { setChannels(CHANNELS); setTone('Năng động & táo bạo'); setEdits({}) }}>↻ Đặt lại</button><button className="button primary" onClick={() => { setVersion(version + 1); setEdits({}); notify('Đã làm mới bản nháp nội dung.') }}>✦ Tạo bản nháp</button></div></div><div className="content-results-heading"><h2>Bản nháp theo kênh <span>{channels.length} kênh</span></h2><small>Giọng điệu: {tone}</small></div><div className="content-grid">{channels.map((channel) => { const item = drafts[channel]; const value = edits[channel] ?? item.body; return <div className="card content-card" key={channel}><div className="content-card-top"><span>{channel === 'Meta' ? 'Facebook Feed' : channel === 'Google Ads' ? 'Google Search Ads' : 'TikTok / Reels'}</span><small>{channel === 'Meta' ? '1080 × 1080' : channel === 'Google Ads' ? 'RSA' : '9:16'}</small></div><span className="mini-label">TIÊU ĐỀ / HOOK</span><h3>{item.title}</h3><span className="mini-label">NỘI DUNG CHÍNH</span>{editing === channel ? <textarea value={value} onChange={(e) => setEdits({ ...edits, [channel]: e.target.value })} rows={7} /> : <p>{value}</p>}<div className="content-preview"><span>{channel === 'TikTok' ? '0s Hook · 8s Lợi ích · 15s CTA' : item.cta}</span><strong>{channel === 'Google Ads' ? '✓ Thông điệp nhất quán' : '✦ Bản nháp sẵn để rà soát'}</strong></div><div className="content-card-actions"><button className="button subtle" onClick={() => setEditing(editing === channel ? null : channel)}>{editing === channel ? '✓ Xong' : '✎ Sửa'}</button><button className="button subtle" onClick={() => copy(`${item.title}\n\n${value}\n\n${item.cta}`)}>⧉ Sao chép</button></div></div> })}</div><div className="content-bottom card"><strong>{channels.length} / 3 channels selected</strong><span>Review copy and advertising policy compliance before publishing. Content remains a draft until handled through supported workflows.</span></div></>}</div>
>>>>>>> Stashed changes
}

function WorkspaceApp() {
  const [ready, setReady] = useState(false)
  const [backendError, setBackendError] = useState('')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState(() => getMemberPageFromHash(window.location.hash))
  const [imports, setImports] = useState([])
  const [latestRows, setLatestRows] = useState([])
  const [strategy, setStrategy] = useState(null)
  const [busy, setBusy] = useState(false)
  const [memberDataLoading, setMemberDataLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

<<<<<<< Updated upstream
  async function refreshData() {
    const [business, history] = await Promise.all([api('business-profile/'), api('campaign-imports/')])
    setProfile(business.profile)
    setImports(history.imports)
    setLatestRows(history.latest_rows)
    setPage(business.profile ? 'overview' : 'onboarding')
  }
=======
  const actorRole = resolveActorRole(user, membership)

  const navigateMemberPage = useCallback((nextPage) => {
    const hash = getMemberPageHash(nextPage)
    if (window.location.hash !== hash) {
      window.history.pushState({ memberPage: nextPage }, '', hash)
    }
    setPage(nextPage)
  }, [])

  useEffect(() => {
    function restoreMemberPage() {
      setPage(getMemberPageFromHash(window.location.hash))
    }
    window.addEventListener('popstate', restoreMemberPage)
    window.addEventListener('hashchange', restoreMemberPage)
    return () => {
      window.removeEventListener('popstate', restoreMemberPage)
      window.removeEventListener('hashchange', restoreMemberPage)
    }
  }, [])

  const loadUserRoleAndData = useCallback(async (activeUser) => {
    if (!activeUser) return
    setMemberDataLoading(true)
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
    } finally {
      setMemberDataLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    setMemberDataLoading(true)
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
    } finally {
      setMemberDataLoading(false)
    }
  }, [])
>>>>>>> Stashed changes

  useEffect(() => {
    async function boot() {
      try {
        await api('auth/csrf/')
        const session = await api('auth/session/')
        if (session.user) {
          setUser(session.user)
          if (session.user.role !== 'system_admin' && session.user.role !== 'sys_admin') {
            await refreshData()
          }
        } else {
          // Optional dev shortcut via query params
          const params = new URLSearchParams(window.location.search)
          if (params.get('role') === 'system_admin' || params.get('sa') === 'true') {
            setUser({ email: 'admin@castravision.internal', full_name: 'Platform Administrator', role: 'system_admin' })
          } else if (params.get('role') === 'admin') {
            setUser({ email: 'sarah.jenkins@acmecorp.com', full_name: 'Sarah Jenkins', role: 'admin' })
            setProfile({ business_name: 'Acme Corp', industry: 'Enterprise SaaS', business_size: 'Enterprise' })
          } else if (params.get('role') === 'manager') {
            setUser({ email: 'marcus.vance@acmecorp.com', full_name: 'Marcus Vance', role: 'manager' })
            setProfile({ business_name: 'Acme Corp', industry: 'Enterprise SaaS', business_size: 'Enterprise' })
          } else if (params.get('role') === 'member') {
            setUser({ email: 'member@acmecorp.com', full_name: 'Alex Mercer', role: 'member' })
            setProfile({ business_name: 'Acme Corp', industry: 'Enterprise SaaS', business_size: 'Enterprise' })
          }
          if (params.get('page')) {
            setPage(params.get('page'))
          }
        }
      } catch (cause) {
        setBackendError(cause.message)
      } finally {
        setReady(true)
      }
    }
    boot()
  }, [])

  async function handleAuth(account, demoProfile = null, initialPage = 'overview') {
    setUser(account)
    setBackendError('')
    if (account?.role === 'system_admin' || account?.role === 'sys_admin') {
      return
    }
    if (demoProfile) {
      setProfile(demoProfile)
      setPage(initialPage)
      return
    }
    try {
      await refreshData()
    } catch (cause) {
      setBackendError(cause.message)
    }
  }

  async function saveProfile(draft) {
    setBusy(true); setError('')
    try {
      const data = await api('business-profile/', { method: 'PUT', body: JSON.stringify(draft) })
      setProfile(data.profile)
      setPage('overview')
      setToast('Business profile saved successfully.')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    try {
      await api('auth/logout/', { method: 'POST' })
    } finally {
      setUser(null); setProfile(null); setStrategy(null); setPage('overview')
    }
  }

  async function onImported() {
    const data = await api('campaign-imports/')
    setImports(data.imports)
    setLatestRows(data.latest_rows)
  }

  const isAdmin = user?.role === 'admin'

  if (!ready) {
    return (
      <div className="loading-screen">
        <Brand />
        <span>Connecting to workspace…</span>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onAuth={handleAuth} backendError={backendError} />
  }

  if (user?.role === 'system_admin' || user?.role === 'sys_admin') {
    return <SystemAdminLayout user={user} onLogout={logout} notify={setToast} />
  }

  if (isAdmin || user?.role === 'company_admin') {
    return (
      <MarketingManagerLayout
        user={user}
        profile={profile}
        page={page}
        setPage={setPage}
        onSignOut={logout}
        notify={setToast}
      >
        {backendError && <Notice>{backendError}</Notice>}

        {/* Core Workflow Pages & Tools wrapped inside Company Admin Layout */}
        {(!profile || page === 'onboarding' || page === 'profile') && (
          <ProfileScreen profile={profile} onboarding={!profile} saveProfile={saveProfile} busy={busy} error={error} cancel={profile ? () => setPage('overview') : logout} />
        )}
        {profile && page === 'import' && (
          <ImportScreen imports={imports} onImported={onImported} notify={setToast} />
        )}
        {profile && page === 'strategy' && (
          <StrategyScreen profile={profile} latestRows={latestRows} result={strategy} setResult={setStrategy} notify={setToast} />
        )}
        {profile && page === 'content' && (
          <ContentScreen result={strategy} profile={profile} setPage={setPage} notify={setToast} />
        )}
        {page === 'budget' && <BudgetOptimizationPage notify={setToast} />}
        {page === 'reports' && <ReportsPage profile={profile || { business_name: 'Acme Studios' }} notify={setToast} />}
        {page === 'insights' && <CompetitorInsightsPage notify={setToast} />}

        <Toast message={toast} clear={() => setToast('')} />
      </MarketingManagerLayout>
    )
  }

<<<<<<< Updated upstream
  return (
    <Shell user={user} profile={profile} page={page} setPage={setPage} logout={logout}>
      {backendError && <Notice>{backendError}</Notice>}

      {/* Operations & Governance */}
      {page === 'approvals' && (
        canAccessFR04ApprovalQueue(user) ? (
          <ApprovalQueuePage notify={setToast} />
        ) : (
          <div className="card" style={{ padding: '48px 32px', textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
            <h2 style={{ fontSize: 18, marginBottom: 8, color: '#f1f5f9' }}>Access Restricted (FR04)</h2>
            <p style={{ color: '#94a3b8', maxWidth: 480, margin: '0 auto 20px', fontSize: 14 }}>
              Only Workspace Admins and Managers have authorization to access the Approval Queue. Workspace Members cannot view or process approvals.
            </p>
            <button className="button primary" onClick={() => setPage('overview')}>
              Return to Overview
            </button>
          </div>
        )
      )}
      {page === 'budget' && <BudgetOptimizationPage notify={setToast} />}
      {page === 'reports' && <ReportsPage profile={profile || { business_name: 'Acme Studios' }} notify={setToast} />}
      {page === 'insights' && <CompetitorInsightsPage notify={setToast} />}

      {/* Core Workflow Pages */}
      {(!profile || page === 'onboarding' || page === 'profile') && (
        <ProfileScreen profile={profile} onboarding={!profile} saveProfile={saveProfile} busy={busy} error={error} cancel={profile ? () => setPage('overview') : logout} />
      )}
      {profile && page === 'overview' && (
        <Overview profile={profile} imports={imports} strategy={strategy} setPage={setPage} />
      )}
      {profile && page === 'import' && (
        <ImportScreen imports={imports} onImported={onImported} notify={setToast} />
      )}
      {profile && page === 'strategy' && (
        <StrategyScreen profile={profile} latestRows={latestRows} result={strategy} setResult={setStrategy} notify={setToast} />
      )}
      {profile && page === 'content' && (
        <ContentScreen result={strategy} profile={profile} setPage={setPage} notify={setToast} />
=======
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
  const memberPage = normalizeMemberPage(page)
  const memberShellPage = page === 'profile' ? 'account' : memberPage

  return (
    <MemberShell
      user={user}
      profile={profile}
      page={memberShellPage}
      setPage={navigateMemberPage}
      logout={logout}
    >
      {backendError && <Notice>{backendError}</Notice>}
      {memberPage === 'overview' && (
        <MemberDashboard
          user={user}
          profile={profile}
          imports={imports}
          latestRows={latestRows}
          strategy={strategy}
          setPage={navigateMemberPage}
          loading={memberDataLoading}
        />
      )}
      {memberPage === 'proposals' && <MemberProposalsPage user={user} onOpenPage={navigateMemberPage} />}
      {memberPage === 'campaigns' && (
        <MemberCampaignsPage latestRows={latestRows} imports={imports} />
      )}
      {memberPage === 'notifications' && <MemberNotificationsPage />}
      {memberPage === 'account' && page !== 'profile' && (
        <MemberAccountPage
          user={user}
          profile={profile}
          onEditProfile={() => navigateMemberPage('profile')}
          logout={logout}
        />
      )}
      {memberPage === 'import' && (
        <ImportScreen imports={imports} onImported={onImported} notify={setToast} memberPresentation />
      )}
      {memberPage === 'strategy' && (
        <StrategyScreen
          profile={profile}
          latestRows={latestRows}
          result={strategy}
          setResult={setStrategy}
          notify={setToast}
          memberPresentation
          setPage={navigateMemberPage}
        />
      )}
      {memberPage === 'content' && (
        <MemberContentStudio
          result={strategy}
          profile={profile}
          setPage={navigateMemberPage}
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
          cancel={() => navigateMemberPage('account')}
        />
>>>>>>> Stashed changes
      )}

      <Toast message={toast} clear={() => setToast('')} />
    </MemberShell>
  )
}

function App() {
  // ─── Development Preview Route (/dashboard-preview) ───────────────────────
  const previewPath = typeof window !== 'undefined' ? window.location.pathname : ''
  const isLeaderPreview =
    previewPath === '/dashboard-preview/leader' ||
    previewPath.startsWith('/dashboard-preview/leader/')
  const isPreviewPath =
    typeof window !== 'undefined' &&
    (previewPath === '/dashboard-preview' ||
      previewPath.startsWith('/dashboard-preview/') ||
      window.location.hash === '#/dashboard-preview')

  if (isPreviewPath) {
    if (import.meta.env.DEV) {
      return (
        <DashboardPreviewPage
          role={isLeaderPreview ? 'leader' : undefined}
          initialPage={previewPath === '/dashboard-preview/leader/approval' ? 'approvals' : 'overview'}
          onExit={() => { window.location.href = '/' }}
        />
      )
    }
    // In production builds, development preview is strictly inaccessible
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
