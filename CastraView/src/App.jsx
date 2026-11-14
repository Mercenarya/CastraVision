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
import LeaderStrategyStudio from './leader/screens/LeaderStrategyStudio'
import MemberDashboard from './member/screens/MemberDashboard'
import MemberStrategyReferences from './member/screens/MemberStrategyReferences'
import {
  BudgetOptimizationPage as LegacyBudgetOptimizationPage,
  CompetitorInsightsPage as LegacyCompetitorInsightsPage,
} from './actor-ui/ActorPages'
import CompetitorInsightsPage from './pages/CompetitorInsightsPage'
import BudgetOptimizationPage from './pages/BudgetOptimizationPage'
import RecommendationReviewPage from './pages/RecommendationReviewPage'
import ReportsPage from './pages/ReportsPage'
import DashboardPreviewPage from './preview/DashboardPreviewPage'
import SettingsPage from './pages/SettingsPage'
import ChannelPicker from './components/ChannelPicker'
import { supabase } from './lib/supabase'
import { getBusinessProfile, saveBusinessProfile as persistBusinessProfile } from './services/businessProfileService'
import './App.css'

const CHANNELS = ['Meta', 'Google Ads', 'TikTok']

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

function AuthScreen({ mode, setMode, onLogin, busy, error }) {
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
            <span className="auth-pill">● SECURE AUTHENTICATION &amp; RBAC</span>
            <h1>{signup ? 'Create an Account' : 'Welcome Back'}</h1>
            <p>
              {signup
                ? 'Register your account to access CastraVision workspaces.'
                : 'Sign in with your credentials to access your workspace.'}
            </p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email Address
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
                  placeholder="Enter your password"
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
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </label>
            )}
            {displayError && <Notice>{displayError}</Notice>}
            <button className="button primary full" disabled={busy}>
              {busy ? 'Authenticating…' : signup ? 'Create Account →' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-switch">
            <span>{signup ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
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
        </div>
      </main>
      <footer className="auth-footer">
        <span>© 2026 CastraVision</span>
        <span>Enterprise AI Marketing Platform</span>
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

const DEMO_STORAGE_KEY = 'castravision_demo_role'
const PAGE_STORAGE_KEY = 'castravision_active_page'
const DEMO_ROLES = ['system_admin', 'manager', 'leader', 'member']

const DEMO_USERS = {
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

function clearDemoSession() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY)
      window.localStorage.removeItem(PAGE_STORAGE_KEY)
    }
  } catch {
    // Storage access fallback
  }
}

function getValidPageForRole(pageKey, role) {
  if (!pageKey || typeof pageKey !== 'string') return 'overview'
  const cleanKey = pageKey.trim().toLowerCase()

  const ROLE_ALLOWED_PAGES = {
    leader: new Set([
      'overview', 'approvals', 'content-reviews', 'content-review-detail',
      'budget-review-detail', 'budget', 'campaigns', 'assigned-campaigns',
      'my-proposals', 'submissions', 'strategy', 'content', 'import',
      'performance', 'reports', 'insights', 'team-tasks', 'profile', 'notifications',
    ]),
    member: new Set([
      'overview', 'tasks', 'emp-tasks', 'content', 'assigned-campaigns',
      'submissions', 'reports', 'strategy', 'notifications', 'profile',
      'budget', 'insights', 'import',
    ]),
    manager: new Set([
      'overview', 'members', 'roles', 'approvals', 'audit', 'budget',
      'budget-review', 'reports', 'insights', 'import', 'content', 'profile',
    ]),
    system_admin: new Set([
      'overview', 'sa-dashboard', 'sa-company-mgmt', 'sa-company-overview', 'sa-create-company', 'profile',
    ]),
  }

  const allowed = ROLE_ALLOWED_PAGES[role]
  if (allowed && allowed.has(cleanKey)) {
    return cleanKey
  }
  return 'overview'
}

function WorkspaceApp() {
  const [ready, setReady] = useState(false)
  const [backendError, setBackendError] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [user, setUser] = useState(null)
  const [membership, setMembership] = useState(null)
  const [profile, setProfile] = useState(null)
  const [page, setPageState] = useState('overview')
  const [imports, setImports] = useState([])
  const [latestRows, setLatestRows] = useState([])
  const [strategy, setStrategy] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [selectedProposal, setSelectedProposal] = useState(null)

  const actorRole = resolveActorRole(user, membership)

  const setPage = useCallback((nextPage) => {
    setPageState(nextPage)
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof nextPage === 'string') {
        window.localStorage.setItem(PAGE_STORAGE_KEY, nextPage)
      }
    } catch {
      // Safe fallback
    }
  }, [])

  const handleDemoLogin = useCallback((roleKey, targetPage = null) => {
    if (!DEMO_ROLES.includes(roleKey)) {
      clearDemoSession()
      return
    }

    const demo = DEMO_USERS[roleKey]
    if (demo) {
      setUser(demo)
      const workspaceRole = roleKey === 'manager' ? 'admin' : roleKey === 'leader' ? 'manager' : 'member'
      setMembership({
        workspaceId: 'ws-demo-001',
        role: workspaceRole,
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

      const rawPage = targetPage || (typeof window !== 'undefined' ? localStorage.getItem(PAGE_STORAGE_KEY) : null) || 'overview'
      const validatedPage = getValidPageForRole(rawPage, roleKey)
      setPageState(validatedPage)

      // Development-only demo session persistence
      if (import.meta.env.DEV) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(DEMO_STORAGE_KEY, roleKey)
            window.localStorage.setItem(PAGE_STORAGE_KEY, validatedPage)
          }
        } catch {
          // LocalStorage unavailable
        }
      }
      setToast(`Switched to workspace role: ${roleKey.toUpperCase()}`)
    }
  }, [])

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

        let resolvedMembership = null
        if (memberRows && memberRows.length > 0) {
          const item = memberRows[0]
          resolvedMembership = {
            workspaceId: item.workspace_id,
            workspaceName: item.workspaces?.name || 'CastraVision Workspace',
            role: item.role,
          }
          setMembership(resolvedMembership)

          // Load authoritative Business Profile from Supabase
          try {
            const bpResult = await getBusinessProfile(item.workspace_id, item.workspaces?.name)
            if (bpResult?.profile) {
              setProfile(bpResult.profile)
            }
          } catch {
            setProfile((current) => current || {
              business_name: item.workspaces?.name || 'CastraVision Workspace',
              industry: 'Marketing & Retail',
              business_size: 'Medium',
              currency: 'USD',
            })
          }
        } else {
          resolvedMembership = {
            workspaceId: 'default-workspace',
            workspaceName: 'Acme Marketing Corp',
            role: 'member',
          }
          setMembership((current) => current || resolvedMembership)
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
        return resolvedMembership
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
    return null
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
  }, [setPage])

  useEffect(() => {
    async function boot() {
      try {
        // 1. Absolute Priority: Real Supabase Session
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            clearDemoSession()
            setUser(session.user)
            const activeMembership = await loadUserRoleAndData(session.user)
            const resolvedRole = resolveActorRole(session.user, activeMembership)
            const savedPage = typeof window !== 'undefined' ? localStorage.getItem(PAGE_STORAGE_KEY) : null
            if (savedPage) {
              setPageState(getValidPageForRole(savedPage, resolvedRole))
            }
            setReady(true)
            return
          }
        }

        // 2. Real Django API Session
        try {
          await api('auth/csrf/')
          const session = await api('auth/session/')
          if (session?.user) {
            clearDemoSession()
            setUser(session.user)
            await refreshData()
            setReady(true)
            return
          }
        } catch {
          // No active Django session
        }

        // 3. Permitted Development Demo Session Restoration
        if (import.meta.env.DEV) {
          try {
            const savedDemoRole = typeof window !== 'undefined' ? localStorage.getItem(DEMO_STORAGE_KEY) : null
            if (savedDemoRole && DEMO_ROLES.includes(savedDemoRole)) {
              const savedPage = localStorage.getItem(PAGE_STORAGE_KEY)
              handleDemoLogin(savedDemoRole, savedPage)
              setReady(true)
              return
            } else if (savedDemoRole) {
              clearDemoSession()
            }
          } catch {
            clearDemoSession()
          }
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
          clearDemoSession()
          setUser(nextSession.user)
          await loadUserRoleAndData(nextSession.user)
        } else if (!nextSession) {
          setUser(null)
          setMembership(null)
          setProfile(null)
          setStrategy(null)
          setPageState('overview')
          clearDemoSession()
        }
      })
      return () => {
        listener?.subscription?.unsubscribe()
      }
    }
  }, [handleDemoLogin, loadUserRoleAndData, membership, refreshData])

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
          clearDemoSession()
          setUser(data.user)
          setToast('Supabase account initialized successfully.')
          return
        }

        try {
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (!authError && data?.user) {
            clearDemoSession()
            setUser(data.user)
            await loadUserRoleAndData(data.user)
            setToast('Signed in successfully.')
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
        clearDemoSession()
        setUser(res.user)
        setBackendError('')
        await refreshData()
        return
      } catch (djangoErr) {
        if (supabaseAuthFailed && supabaseErrorMessage) {
          if (supabaseErrorMessage.toLowerCase().includes('invalid login credentials')) {
            throw new Error('Invalid email or password. Please verify your credentials or create a new account.')
          }
          throw new Error('Authentication failed: ' + supabaseErrorMessage)
        }
        throw djangoErr
      }

    } catch (cause) {
      setError(cause.message || 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  async function saveProfile(draft) {
    setBusy(true)
    setError('')
    try {
      if (supabase && membership?.workspaceId) {
        const isManager = actorRole === 'manager'
        const saved = await persistBusinessProfile(membership.workspaceId, draft, isManager)
        setProfile(saved)
        setToast('Lưu hồ sơ doanh nghiệp thành công.')
        return
      }

      // Legacy Django API fallback if running on standalone Django session
      const data = await api('business-profile/', { method: 'PUT', body: JSON.stringify(draft) })
      setProfile(data.profile)
      setToast('Lưu hồ sơ doanh nghiệp thành công.')
    } catch (cause) {
      setError(cause.message)
      throw cause
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    try {
      clearDemoSession()
      if (supabase) {
        await supabase.auth.signOut().catch(() => { })
      }
      await api('auth/logout/', { method: 'POST' }).catch(() => { })
    } finally {
      setUser(null)
      setMembership(null)
      setProfile(null)
      setStrategy(null)
      setPageState('overview')
      clearDemoSession()
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
        page={page}
        onNavigate={setPage}
        onLogout={logout}
        onSignOut={logout}
        notify={setToast}
        onUserUpdate={setUser}
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
        {page === 'insights' && (
          <CompetitorInsightsPage notify={setToast} />
        )}
        {page === 'budget' && (
          <BudgetOptimizationPage
            user={user}
            profile={profile}
            membership={membership}
            notify={setToast}
            setPage={setPage}
          />
        )}
        {page === 'budget-review' && (
          <RecommendationReviewPage setPage={setPage} notify={setToast} />
        )}
        {page === 'reports' && (
          <ReportsPage
            profile={profile || { business_name: user?.business_name || 'Acme Corp' }}
            notify={setToast}
          />
        )}
        {page === 'profile' && (
          <SettingsPage
            user={user}
            actorRole="manager"
            membership={membership}
            profile={profile}
            saveProfile={saveProfile}
            busy={busy}
            error={error}
            notify={setToast}
            onUserUpdate={setUser}
            onProfileUpdated={setProfile}
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
          <LeaderStrategyStudio setPage={setPage} notify={setToast} />
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
          <SettingsPage
            user={user}
            actorRole="leader"
            membership={membership}
            profile={profile}
            notify={setToast}
            onUserUpdate={setUser}
            onProfileUpdated={setProfile}
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
      {page === 'budget' && <LegacyBudgetOptimizationPage notify={setToast} />}
      {page === 'insights' && <LegacyCompetitorInsightsPage notify={setToast} />}
      {page === 'import' && (
        <ImportScreen imports={imports} onImported={onImported} notify={setToast} />
      )}
      {page === 'strategy' && (
        <MemberStrategyReferences
          profile={profile}
          strategy={strategy}
          setPage={setPage}
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
        <SettingsPage
          user={user}
          actorRole="member"
          membership={membership}
          profile={profile}
          notify={setToast}
          onUserUpdate={setUser}
          onProfileUpdated={setProfile}
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

export default App;
