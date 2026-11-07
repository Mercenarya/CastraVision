import { useCallback, useEffect, useRef, useState } from 'react'

import { resolveActorRole } from './auth/permissions'
import { SystemAdminLayout } from './system-admin/SystemAdminLayout'
import MarketingManagerLayout from './company-admin/MarketingManagerLayout'
import LeaderLayout from './leader/LeaderLayout'
import MemberLayout from './member/MemberLayout'
import LeaderDashboard from './leader/screens/LeaderDashboard'
import LeaderApprovalQueue from './leader/screens/LeaderApprovalQueue'
import LeaderContentReview from './leader/screens/LeaderContentReview'
import LeaderBudgetReview from './leader/screens/LeaderBudgetReview'
import LeaderCampaigns from './leader/screens/LeaderCampaigns'
import LeaderPerformance from './leader/screens/LeaderPerformance'
import MemberDashboard from './member/screens/MemberDashboard'
import {
  BudgetOptimizationPage,
  CompetitorInsightsPage,
} from './actor-ui/ActorPages'
import DashboardPreviewPage from './preview/DashboardPreviewPage'
import { supabase } from './lib/supabase'
import './App.css'

const CHANNELS = ['Meta', 'Google Ads', 'TikTok']
const SIZES = { Micro: '1–10 employees', Small: '11–50 employees', Medium: '51–250 employees', Large: 'Over 250 employees' }
const EMPTY_PROFILE = { business_name: '', industry: '', business_size: '', target_customers: '', primary_goal: '', product_service: '', preferred_channels: [], monthly_budget: '', currency: 'USD' }

function csrfToken() { return decodeURIComponent(document.cookie.split('; ').find((part) => part.startsWith('csrftoken='))?.split('=')[1] || '') }
async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData) && options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.method && options.method !== 'GET') headers['X-CSRFToken'] = csrfToken()
  let response
  try { response = await fetch(`/api/${path}`, { credentials: 'same-origin', ...options, headers }) }
  catch { throw new Error('Unable to connect to server. Please ensure backend service is running on port 8000.') }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || `Request failed (${response.status}).`)
  return data
}

function Brand() { return <div className="brand"><span className="brand-icon" aria-hidden="true">✣</span><span>CastraVision</span></div> }
function Heading({ eyebrow, title, subtitle, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#03b5d3]">
              {eyebrow}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#03b5d3]" />
          </div>
        )}
        <h1 className="text-xl md:text-2xl font-bold text-[#dfe2f1] tracking-tight m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-[#c7c4d7] mt-1 m-0">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}
function Notice({ kind = 'error', children }) { return <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div> }
function Toast({ message, clear }) { return message && <div className="toast" role="status"><b>✓</b>{message}<button onClick={clear} aria-label="Dismiss notification">×</button></div> }

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
      setLocalError('Passwords do not match.')
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
            <h1>{signup ? 'Create an Account' : 'Welcome Back'}</h1>
            <p>
              {signup
                ? 'Register your account to access CastraVision RBAC workspaces.'
                : 'Sign in with your credentials for automated role-based redirection.'}
            </p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label>
              Account Email
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
              Password
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  minLength={6}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            {signup && (
              <label>
                Confirm Password
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={6}
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </label>
            )}
            {displayError && <Notice>{displayError}</Notice>}
            <button className="button primary full" disabled={busy}>
              {busy ? 'Authenticating…' : signup ? 'Create Account →' : 'Sign In to Workspace →'}
            </button>
          </form>

          <div className="auth-switch">
            {signup ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => {
                setLocalError('')
                setMode(signup ? 'login' : 'signup')
              }}
            >
              {signup ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          {/* Quick role testing access for demonstration and inspection */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: 700, letterSpacing: '.06em', marginBottom: 10 }}>
              QUICK RBAC DEMO ACCESS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <button
                type="button"
                className="button subtle"
                style={{ fontSize: 11, padding: '8px 6px', borderColor: '#38bdf8', color: '#38bdf8', textAlign: 'center', lineHeight: 1.3 }}
                onClick={() => onDemoLogin('system_admin')}
                title="tritran0932523321@gmail.com (System Admin)"
              >
                <strong>🛡 System Admin</strong>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>tritran0932523321@gmail.com</div>
              </button>
              <button
                type="button"
                className="button subtle"
                style={{ fontSize: 11, padding: '8px 6px', borderColor: '#818cf8', color: '#818cf8', textAlign: 'center', lineHeight: 1.3 }}
                onClick={() => onDemoLogin('manager')}
                title="GRFDonk@gmail.com (Manager)"
              >
                <strong>🏢 Manager</strong>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>GRFDonk@gmail.com</div>
              </button>
              <button
                type="button"
                className="button subtle"
                style={{ fontSize: 11, padding: '8px 6px', borderColor: '#34d399', color: '#34d399', textAlign: 'center', lineHeight: 1.3 }}
                onClick={() => onDemoLogin('leader')}
                title="tranthanhtri2@gmail.com (Leader)"
              >
                <strong>✓ Leader</strong>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>tranthanhtri2@gmail.com</div>
              </button>
              <button
                type="button"
                className="button subtle"
                style={{ fontSize: 11, padding: '8px 6px', borderColor: '#a78bfa', color: '#a78bfa', textAlign: 'center', lineHeight: 1.3 }}
                onClick={() => onDemoLogin('member')}
                title="Bengin2@gmail.com (Member)"
              >
                <strong>✦ Member</strong>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Bengin2@gmail.com</div>
              </button>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
            <a href="/dashboard-preview" style={{ color: '#818cf8', fontSize: 13, textDecoration: 'none' }}>
              🔍 Dashboard Workspace Preview →
            </a>
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
  const isLeader = role === 'leader' || user?.role === 'manager' || user?.role === 'leader'
  const isEmployee = role === 'member' || user?.role === 'member'

  if (isLeader) {
    return (
      <LeaderLayout
        user={user}
        profile={profile}
        page={page}
        setPage={setPage}
        logout={logout}
      >
        {children}
      </LeaderLayout>
    )
  }

  if (isEmployee) {
    return (
      <MemberLayout
        user={user}
        profile={profile}
        page={page}
        setPage={setPage}
        logout={logout}
      >
        {children}
      </MemberLayout>
    )
  }

  return <div className="shell">{children}</div>
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
  return (
    <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1] font-sans">
      <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-12">
        <Heading
          eyebrow={onboarding ? 'NEW ACCOUNT SETUP' : 'BUSINESS SETTINGS'}
          title={onboarding ? 'Business Setup' : 'Business Profile & Settings'}
          subtitle="Provide information about your business to personalize AI marketing strategies."
        />
        <div className="stepper">
          <div className={step === 1 ? 'current' : 'done'}><b>1</b> Company Information</div>
          <div className={step === 2 ? 'current' : ''}><b>2</b> Goals &amp; Channels</div>
          <div className="step-track"><span style={{ width: step === 1 ? '50%' : '100%' }} /></div>
        </div>
        <form
          className="card profile-card"
          onSubmit={(event) => {
            event.preventDefault()
            if (step === 1) setStep(2)
            else saveProfile(draft)
          }}
        >
          {step === 1 ? (
            <div className="form-grid">
              <label className="wide">
                Company Name *
                <input
                  value={draft.business_name}
                  onChange={(e) => set('business_name', e.target.value)}
                  minLength={2}
                  maxLength={120}
                  required
                  placeholder="e.g., Acme Corporation"
                />
              </label>
              <label>
                Industry *
                <input
                  value={draft.industry}
                  onChange={(e) => set('industry', e.target.value)}
                  minLength={2}
                  maxLength={120}
                  required
                  placeholder="e.g., Fashion &amp; Apparel"
                />
              </label>
              <label>
                Company Size *
                <select
                  value={draft.business_size}
                  onChange={(e) => set('business_size', e.target.value)}
                  required
                >
                  <option value="">Select company size</option>
                  {Object.entries(SIZES).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="wide">
                Target Audience *
                <textarea
                  value={draft.target_customers}
                  onChange={(e) => set('target_customers', e.target.value)}
                  minLength={3}
                  maxLength={500}
                  required
                  placeholder="Demographics, age groups, pain points, interests, and regional focus..."
                />
              </label>
            </div>
          ) : (
            <div className="form-grid">
              <label className="wide">
                Core Product / Service
                <input
                  value={draft.product_service}
                  onChange={(e) => set('product_service', e.target.value)}
                  maxLength={500}
                  placeholder="Products or services to promote"
                />
              </label>
              <label className="wide">
                Primary Objective
                <input
                  value={draft.primary_goal}
                  onChange={(e) => set('primary_goal', e.target.value)}
                  maxLength={300}
                  placeholder="e.g., Maximize multi-channel ROAS and qualified leads"
                />
              </label>
              <label>
                Monthly Budget
                <input
                  type="number"
                  min="0"
                  max="1000000000"
                  value={draft.monthly_budget}
                  onChange={(e) => set('monthly_budget', e.target.value)}
                  placeholder="30000"
                />
              </label>
              <label>
                Currency
                <select value={draft.currency} onChange={(e) => set('currency', e.target.value)}>
                  <option>USD</option>
                  <option>VND</option>
                </select>
              </label>
              <div className="wide">
                <div className="field-title">Priority Channels</div>
                <ChannelPicker channels={draft.preferred_channels} toggle={toggle} />
              </div>
            </div>
          )}
          {error && <Notice>{error}</Notice>}
          <div className="form-actions">
            <button
              type="button"
              className="button coral"
              onClick={step === 2 ? () => setStep(1) : cancel}
            >
              {step === 2 ? '← Back' : 'Cancel'}
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? 'Saving…' : step === 1 ? 'Continue →' : 'Save Profile ✓'}
            </button>
          </div>
        </form>
        <div className="under-card">
          <span>◈ Profile settings can be adjusted anytime in Account Settings.</span>
          <span>Linked directly to your workspace account</span>
        </div>
      </div>
    </div>
  )
}

function ImportScreen({ imports, onImported, notify }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef(null)
  async function stage(selected) {
    if (!selected) return
    setFile(selected)
    setPreview(null)
    setError('')
    setBusy(true)
    try {
      const body = new FormData()
      body.append('file', selected)
      setPreview(await api('campaign-imports/upload/', { method: 'POST', body }))
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }
  async function commit() {
    setBusy(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('mode', 'commit')
      const data = await api('campaign-imports/upload/', { method: 'POST', body })
      await onImported()
      notify(`${data.row_count} records imported successfully.`)
      setFile(null)
      setPreview(null)
      if (input.current) input.current.value = ''
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }
  function downloadSample() {
    const csv = 'channel,period,spend,clicks,impressions,conversions,revenue\nMeta,2026-09,1500000,320,18000,25,3900000\nGoogle Ads,2026-09,1000000,240,12000,18,2800000\n'
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }))
    link.download = 'castravision_sample.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return (
    <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1] font-sans">
      <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-12">
        <Heading
          eyebrow="DATA INGESTION HUB"
          title="Campaign Data Import"
          subtitle="Upload historical campaign performance data to enrich AI strategy blueprints."
        />
        <div
          className={`upload-zone card ${file ? 'has-file' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            stage(e.dataTransfer.files[0])
          }}
        >
          <div className="upload-icon">⇧</div>
          <h2>Drag &amp; drop file here</h2>
          <p>or browse from your device</p>
          <span className="upload-separator">OR</span>
          <button className="button primary" type="button" onClick={() => input.current?.click()} disabled={busy}>
            ⇧ Select CSV / Excel File
          </button>
          <input className="sr-only" ref={input} type="file" accept=".csv,.xlsx" onChange={(e) => stage(e.target.files[0])} />
          <small>Max 5 MB · CSV UTF-8 or XLSX</small>
          <button type="button" className="inline-link" onClick={downloadSample}>
            ↓ Download Sample CSV
          </button>
        </div>
        {file && (
          <div className="file-card card">
            <div className="file-success">✓</div>
            <div className="file-info">
              <span className="mini-label">SELECTED FILE · {(file.size / 1024 / 1024).toFixed(2)} MB</span>
              <strong>{file.name}</strong>
              <small>
                {busy ? 'Validating…' : preview ? `${preview.row_count} valid rows · ${preview.error_count} errors` : 'Unverified'}
              </small>
            </div>
            <div className="file-actions">
              <button
                className="button coral"
                type="button"
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                  setError('')
                }}
              >
                Remove
              </button>
              <button
                className="button primary"
                type="button"
                disabled={busy || !preview || preview.error_count > 0 || preview.row_count === 0}
                onClick={commit}
              >
                Import Data →
              </button>
            </div>
          </div>
        )}
        {error && <Notice>{error}</Notice>}
        {preview?.errors?.length > 0 && (
          <div className="card validation-card">
            <h3>Resolve {preview.error_count} error(s) before importing</h3>
            {preview.errors.map((item) => (
              <p key={item.row}>Row {item.row}: {item.message}</p>
            ))}
          </div>
        )}
        {preview?.preview?.length > 0 && (
          <div className="card preview-card">
            <h3>Standardized Data Preview</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {['Channel', 'Period', 'Spend', 'Clicks', 'Impressions', 'Conversions', 'Revenue'].map((value) => (
                      <th key={value}>{value}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, index) => (
                    <tr key={index}>
                      <td>{row.channel}</td>
                      <td>{row.period}</td>
                      <td>{Number(row.spend).toLocaleString('en-US')}</td>
                      <td>{row.clicks}</td>
                      <td>{row.impressions}</td>
                      <td>{row.conversions}</td>
                      <td>{Number(row.revenue).toLocaleString('en-US')}</td>
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
            <strong>Standardized Formatting</strong>
            <p>Automatically maps spend, clicks, impressions, and conversions.</p>
          </div>
          <div className="card">
            <b>♢</b>
            <strong>Automated Verification</strong>
            <p>Flags missing columns, negative numbers, and invalid rows prior to ingestion.</p>
          </div>
          <div className="card">
            <b>ϟ</b>
            <strong>Strategic Analytics</strong>
            <p>Ingested performance metrics feed directly into the AI strategy engine.</p>
          </div>
        </div>
        {imports.length > 0 && (
          <div className="card import-history">
            <h3>Recent Ingestions</h3>
            {imports.map((item) => (
              <div key={item.id}>
                <span>{item.filename}</span>
                <small>{item.row_count} rows · {new Date(item.created_at).toLocaleDateString('en-US')}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StrategyScreen({ profile, latestRows, result, setResult, notify }) {
  const initial = () => ({
    campaign_goal: profile?.primary_goal || '',
    target_audience: profile?.target_customers || '',
    budget: profile?.monthly_budget || '',
    preferred_channels: profile?.preferred_channels?.length ? profile.preferred_channels : CHANNELS,
  })
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
    event?.preventDefault()
    setBusy(true)
    setError('')
    try {
      const historical_data = latestRows.slice(0, 30).map((row) => ({
        channel: CHANNELS.includes(row.channel) ? row.channel : 'Other',
        period: row.period,
        ctr: row.impressions ? +((row.clicks / row.impressions) * 100).toFixed(2) : 0,
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
        currency: profile.currency || 'USD',
        preferred_channels: draft.preferred_channels,
        historical_data,
      }
      const data = await api('strategies/generate/', { method: 'POST', body: JSON.stringify(payload) })
      setResult(data)
      notify('Strategy generated successfully. Please review recommendations.')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }
  const money = (percentage) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: profile?.currency || 'USD',
      maximumFractionDigits: 0,
    }).format((Number(draft.budget || 0) * percentage) / 100)

  return (
    <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1] font-sans">
      <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-12">
        <Heading
          eyebrow="STRATEGY ENGINE"
          title="Strategy Studio"
          subtitle="Set campaign goals and target audience to generate data-driven marketing blueprints."
        >
          {latestRows.length > 0 && (
            <span className="data-chip">✓ {latestRows.length} historical records utilized</span>
          )}
        </Heading>
        <div className="strategy-grid">
          <form className="card strategy-form" onSubmit={generate}>
            <div className="section-head">
              <h2><i /> Campaign Setup</h2>
              <span className="step-badge">FR01 · Strategy Studio</span>
            </div>
            <label>
              Campaign Objective
              <input
                value={draft.campaign_goal}
                onChange={(e) => setDraft({ ...draft, campaign_goal: e.target.value })}
                minLength={3}
                required
                placeholder="e.g., Q4 Multi-channel Sales Growth"
              />
            </label>
            <label>
              Target Audience
              <input
                value={draft.target_audience}
                onChange={(e) => setDraft({ ...draft, target_audience: e.target.value })}
                minLength={3}
                required
                placeholder="e.g., Active millennials aged 22–35"
              />
            </label>
            <label>
              Monthly Budget ({profile?.currency || 'USD'})
              <input
                type="number"
                min="1"
                value={draft.budget}
                onChange={(e) => setDraft({ ...draft, budget: e.target.value })}
                required
                placeholder="30000"
              />
            </label>
            <div className="field-title">Planned Channels</div>
            <ChannelPicker channels={draft.preferred_channels} toggle={toggle} />
            {error && <Notice>{error}</Notice>}
            <div className="form-actions">
              <button type="button" className="button coral" onClick={() => setDraft(initial())}>
                ↻ Reset
              </button>
              <button className="button primary" disabled={busy || !draft.preferred_channels.length}>
                {busy ? 'Analyzing…' : 'ϟ Generate Strategy'}
              </button>
            </div>
          </form>

          <div className="card result-card">
            <div className="section-head">
              <div>
                <h2>AI Strategy Recommendations</h2>
                <p>Based on your business profile and historical data</p>
              </div>
              {result && <span className="active-badge">{result.strategy.confidence}% confidence</span>}
            </div>
            {!result ? (
              <div className="result-empty">
                <span>◈</span>
                <h3>No Strategy Generated Yet</h3>
                <p>Complete the setup form and click “Generate Strategy” to view channels, messaging, and budget allocation.</p>
              </div>
            ) : (
              <>
                <div className="insight-box">
                  <span className="mini-label">STRATEGIC FOCUS</span>
                  <p>{result.strategy.rationale}</p>
                </div>
                <div className="insight-box">
                  <div className="allocation-head">
                    <span className="mini-label">RECOMMENDED ALLOCATION</span>
                    <span>{money(100)} total</span>
                  </div>
                  <div className="stacked-bar">
                    {result.strategy.budget_allocation.map((item, index) => (
                      <span key={index} style={{ width: `${item.percentage}%` }} />
                    ))}
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
                  <span className="mini-label">MESSAGING &amp; SEGMENT</span>
                  <p>“{result.strategy.message}”</p>
                  <small>{result.strategy.segment}</small>
                </div>
                <div className="insight-box">
                  <span className="mini-label">RECOMMENDED ACTIONS</span>
                  <ol>
                    {result.strategy.actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ol>
                </div>
                <div className="result-footer">
                  <span>
                    {result.provider === 'openai' ? 'OpenAI Engine' : 'Rule-based Fallback'} · {result.context_sources.length} reference sources
                  </span>
                  <button className="button subtle" type="button" onClick={generate} disabled={busy}>
                    ↻ Re-analyze
                  </button>
                </div>
                {result.warning && <Notice kind="warning">{result.warning}</Notice>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentScreen({ result, profile, setPage, notify }) {
  const [channels, setChannels] = useState(CHANNELS)
  const [tone, setTone] = useState('Dynamic & Bold')
  const [version, setVersion] = useState(0)
  const [edits, setEdits] = useState({})
  const [editing, setEditing] = useState(null)
  const message = result?.strategy.message || ''
  const businessName = profile?.business_name || 'CastraVision'
  const drafts = {
    Meta: {
      title: `${businessName} — Discover the Difference`,
      body: version % 2
        ? `A new choice tailored for you. ${message}`
        : `${message} Explore now and find inspiration for your next breakthrough.`,
      cta: 'Learn More',
    },
    'Google Ads': {
      title: `${businessName} | Solutions Built for Your Growth`,
      body: `${profile?.product_service || businessName}. Explore proven solutions for ${profile?.target_customers || 'customers'}.`,
      cta: 'Visit Website',
    },
    TikTok: {
      title: `Hook 0–3s · ${businessName}`,
      body: version % 2
        ? `Open with a compelling question for ${profile?.target_customers || 'customers'}. Fast-cut to the solution: ${profile?.product_service || businessName}.`
        : `Start with a relatable scenario for ${profile?.target_customers || 'customers'}. Highlight key benefits and close with a clear CTA.`,
      cta: 'Watch Now',
    },
  }
  const toggle = (channel) =>
    setChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]
    )
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value)
      notify('Content copied to clipboard.')
    } catch {
      notify('Unable to copy on this browser.')
    }
  }
  return (
    <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1] font-sans">
      <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-12">
        <Heading
          eyebrow="CAMPAIGN ORCHESTRATION › CONTENT STUDIO"
          title="Content Studio"
          subtitle="Draft multi-channel creative assets aligned with your campaign strategy."
        />
        <div className="content-notice">
          <span>ⓘ</span>
          <p>Template-assisted creative workspace. Review and refine creative copy prior to final submission.</p>
        </div>
        {!result ? (
          <div className="card content-empty">
            <span>✦</span>
            <h2>Generate a Strategy First</h2>
            <p>Content Studio utilizes audience segments and core messaging from your active strategy proposal.</p>
            <button className="button primary" onClick={() => setPage('strategy')}>
              Go to Strategy Studio →
            </button>
          </div>
        ) : (
          <>
            <div className="content-steps">
              {['Strategy', 'Channels', 'Audience', 'Draft Copy', 'Review'].map((step, index) => (
                <div key={step}>
                  <b>{index + 1}</b>{step}
                </div>
              ))}
            </div>
            <div className="card content-controls">
              <div>
                <span className="mini-label">STRATEGY</span>
                <strong>{businessName}</strong>
              </div>
              <div className="control-channels">
                <span className="mini-label">TARGET CHANNELS</span>
                <div>
                  {CHANNELS.map((channel) => (
                    <button
                      type="button"
                      key={channel}
                      onClick={() => toggle(channel)}
                      className={channels.includes(channel) ? 'selected' : ''}
                    >
                      {channel} {channels.includes(channel) && '✓'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mini-label">AUDIENCE</span>
                <strong>{result.strategy.segment}</strong>
              </div>
              <label>
                TONE OF VOICE
                <select value={tone} onChange={(e) => setTone(e.target.value)}>
                  <option>Dynamic &amp; Bold</option>
                  <option>Friendly &amp; Approachable</option>
                  <option>Professional &amp; Clear</option>
                </select>
              </label>
              <div className="content-control-actions">
                <button
                  className="button coral"
                  onClick={() => {
                    setChannels(CHANNELS)
                    setTone('Dynamic & Bold')
                    setEdits({})
                  }}
                >
                  ↻ Reset
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    setVersion(version + 1)
                    setEdits({})
                    notify('Creative copy drafts refreshed.')
                  }}
                >
                  ✦ Generate Drafts
                </button>
              </div>
            </div>

            <div className="content-results-heading">
              <h2>Channel Drafts <span>{channels.length} channels</span></h2>
              <small>Tone: {tone}</small>
            </div>

            <div className="content-grid">
              {channels.map((channel) => {
                const item = drafts[channel]
                const value = edits[channel] ?? item.body
                return (
                  <div className="card content-card" key={channel}>
                    <div className="content-card-top">
                      <span>
                        {channel === 'Meta' ? 'Facebook Feed' : channel === 'Google Ads' ? 'Google Search Ads' : 'TikTok / Reels'}
                      </span>
                      <small>{channel === 'Meta' ? '1080 × 1080' : channel === 'Google Ads' ? 'RSA' : '9:16'}</small>
                    </div>
                    <span className="mini-label">HEADLINE / HOOK</span>
                    <h3>{item.title}</h3>
                    <span className="mini-label">PRIMARY COPY</span>
                    {editing === channel ? (
                      <textarea value={value} onChange={(e) => setEdits({ ...edits, [channel]: e.target.value })} rows={7} />
                    ) : (
                      <p>{value}</p>
                    )}
                    <div className="content-preview">
                      <span>{channel === 'TikTok' ? '0s Hook · 8s Benefit · 15s CTA' : item.cta}</span>
                      <strong>{channel === 'Google Ads' ? '✓ Aligned Messaging' : '✦ Ready for Review'}</strong>
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
              <strong>{channels.length} / 3 channels active</strong>
              <span>Review creative copy and ensure ad policy compliance prior to final publishing.</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
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
  const [selectedProposal, setSelectedProposal] = useState(null)

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
            industry: 'Marketing & Retail',
            business_size: 'Medium',
            currency: 'USD',
          })
        } else {
          setMembership((current) => current || {
            workspaceId: 'default-workspace',
            workspaceName: 'Acme Marketing Corp',
            role: 'member',
          })
          setProfile((current) => current || {
            business_name: 'Acme Marketing Corp',
            industry: 'Fashion & Retail',
            business_size: 'Medium',
            target_customers: 'Modern shoppers aged 20–35 seeking premium apparel',
            primary_goal: 'Multi-channel sales growth across Meta, Google, and TikTok',
            monthly_budget: '50000',
            currency: 'USD',
            preferred_channels: ['Meta', 'Google Ads', 'TikTok'],
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
          setToast('Supabase account initialized successfully.')
          return
        }

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (!authError && data?.user) {
          setUser(data.user)
          await loadUserRoleAndData(data.user)
          setToast('Signed in via Supabase successfully.')
          return
        }

        if (authError && !authError.message.includes('fetch')) {
          throw new Error('Invalid email or password: ' + authError.message)
        }
      }

      // 2. Fallback to Django API session if Supabase is not ready
      const endpoint = isSignup ? 'auth/register/' : 'auth/login/'
      const res = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setUser(res.user)
      setBackendError('')
      await refreshData()
    } catch (cause) {
      setError(cause.message || 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  function handleDemoLogin(roleKey) {
    const demos = {
      system_admin: {
        id: 'sa-001',
        email: 'tritran0932523321@gmail.com',
        full_name: 'Tran Thanh Tri (Admin)',
        role: 'system_admin',
        app_metadata: { role: 'system_admin' },
        user_metadata: { role: 'system_admin' },
      },
      manager: {
        id: 'mgr-001',
        email: 'GRFDonk@gmail.com',
        full_name: 'GRF Donk (Manager)',
        role: 'manager',
        app_metadata: { role: 'manager' },
        user_metadata: { role: 'manager' },
        business_name: 'Acme Marketing Corp',
      },
      leader: {
        id: 'ldr-001',
        email: 'tranthanhtri2@gmail.com',
        full_name: 'Tran Thanh Tri (Leader)',
        role: 'leader',
        app_metadata: { role: 'leader' },
        user_metadata: { role: 'leader' },
        business_name: 'Acme Marketing Corp',
      },
      member: {
        id: 'mbr-001',
        email: 'Bengin2@gmail.com',
        full_name: 'Bengin (Member)',
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
        industry: 'Fashion & Retail',
        business_size: 'Medium',
        target_customers: 'Modern shoppers aged 20–35 seeking premium apparel',
        primary_goal: 'Multi-channel sales growth across Meta, Google, and TikTok',
        monthly_budget: '50000',
        currency: 'USD',
        preferred_channels: ['Meta', 'Google Ads', 'TikTok'],
      })
      setPage('overview')
      setToast(`Switched to workspace role: ${roleKey.toUpperCase()}`)
    }
  }

  async function saveProfile(draft) {
    setBusy(true)
    setError('')
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
        <span>Connecting to Supabase workspace…</span>
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
          <LeaderDashboard imports={imports} setPage={setPage} notify={setToast} />
        )}
        {(page === 'approvals' || page === 'content-reviews' || page === 'my-proposals' || page === 'submissions') && (
          <LeaderApprovalQueue
            setPage={setPage}
            onSelectContentReview={(p) => {
              setSelectedProposal(p)
              setPage('content-review-detail')
            }}
            onSelectBudgetReview={(p) => {
              setSelectedProposal(p)
              setPage('budget-review-detail')
            }}
            notify={setToast}
          />
        )}
        {page === 'content-review-detail' && (
          <LeaderContentReview
            proposal={selectedProposal}
            onBack={() => setPage('approvals')}
            onComplete={() => setPage('approvals')}
            setPage={setPage}
            notify={setToast}
          />
        )}
        {(page === 'budget-review-detail' || page === 'budget') && (
          <LeaderBudgetReview
            proposal={selectedProposal}
            onBack={() => setPage('approvals')}
            onComplete={() => setPage('approvals')}
            setPage={setPage}
            notify={setToast}
          />
        )}
        {(page === 'assigned-campaigns' || page === 'campaigns') && (
          <LeaderCampaigns setPage={setPage} notify={setToast} />
        )}
        {(page === 'performance' || page === 'reports' || page === 'insights' || page === 'team-tasks') && (
          <LeaderPerformance setPage={setPage} notify={setToast} />
        )}
        {page === 'notifications' && (
          <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1] font-sans">
            <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-12">
              <Heading
                eyebrow="COMMUNICATION &amp; ALERTS"
                title="Notifications &amp; Alerts"
                subtitle="Real-time approval requests, status updates, and AI Engine compute notifications."
              />
              <div className="card p-6">
                <p className="text-xs md:text-sm text-[#c7c4d7] m-0">
                  All systems are operating normally. No pending urgent notifications.
                </p>
                <button className="button primary mt-4" onClick={() => setPage('overview')}>
                  ← Return to Overview
                </button>
              </div>
            </div>
          </div>
        )}
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
          notify={setToast}
        />
      )}
      {(page === 'tasks' || page === 'emp-tasks') && (
        <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1] font-sans">
          <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-12">
            <Heading
              eyebrow="CREATIVE DELIVERABLES"
              title="My Tasks"
              subtitle="Content generation and creative review tasks assigned to you."
            />
            <div className="card p-6">
              <p className="text-xs md:text-sm text-[#c7c4d7] m-0">
                You have active tasks waiting for review and copywriting execution.
              </p>
              <div className="flex gap-3 mt-4">
                <button className="button primary" onClick={() => setPage('content')}>
                  Go to Content Studio →
                </button>
                <button className="button subtle" onClick={() => setPage('overview')}>
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {(page === 'submissions' || page === 'reports') && (
        <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1] font-sans">
          <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-12">
            <Heading
              eyebrow="APPROVAL STATUS"
              title="My Submissions"
              subtitle="History of content drafts and proposals submitted for Leader review."
            />
            <div className="card p-6">
              <p className="text-xs md:text-sm text-[#c7c4d7] m-0">
                Check status and feedback on your submitted deliverables.
              </p>
              <button className="button primary mt-4" onClick={() => setPage('overview')}>
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      {page === 'assigned-campaigns' && (
        <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1] font-sans">
          <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-12">
            <Heading
              eyebrow="SQUAD INVOLVEMENT"
              title="Assigned Campaigns"
              subtitle="Active campaigns where you are contributing creative and copy assets."
            />
            <div className="card p-6">
              <p className="text-xs md:text-sm text-[#c7c4d7] m-0">
                Track campaigns linked to your marketing squad.
              </p>
              <button className="button primary mt-4" onClick={() => setPage('overview')}>
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      {page === 'notifications' && (
        <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1] font-sans">
          <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-12">
            <Heading
              eyebrow="FEEDBACK INBOX"
              title="Notifications &amp; Feedback"
              subtitle="Leader feedback, revision requests, and proposal status notifications."
            />
            <div className="card p-6">
              <p className="text-xs md:text-sm text-[#c7c4d7] m-0">
                No new unread feedback from your squad leader.
              </p>
              <button className="button primary mt-4" onClick={() => setPage('overview')}>
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
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
