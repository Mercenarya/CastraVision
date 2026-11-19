import { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react'

import { resolveActorRole } from './auth/permissions'
import AccountEntryPage from './pages/onboarding/AccountEntryPage'
import CompanyJoinPage from './pages/onboarding/CompanyJoinPage'
import SetPasswordPage from './pages/onboarding/SetPasswordPage'
import AuthCompletePage from './pages/onboarding/AuthCompletePage'
import EmailLinkSentPage from './pages/onboarding/EmailLinkSentPage'
import { SystemAdminLayout } from './system-admin/SystemAdminLayout'
import MarketingManagerLayout from './company-admin/MarketingManagerLayout'
import LeaderLayout from './leader/LeaderLayout'
import LeaderWorkspace from './leader/LeaderWorkspace'
import WorkflowCampaignSelect from './leader/components/WorkflowCampaignSelect'
import WorkflowStudio from './leader/WorkflowStudio'
import WorkflowInbox from './leader/WorkflowInbox'
import MemberLayout from './member/MemberLayout'
import MemberDashboard from './member/screens/MemberDashboard'
import {
  BudgetOptimizationPage,
  CompetitorInsightsPage,
} from './actor-ui/ActorPages'
import DashboardPreviewPage from './preview/DashboardPreviewPage'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/AuthContext'
import { api } from './services/api'
import { LanguageProvider } from './contexts/LanguageContext'
import SettingsPage from './pages/SettingsPage'
import LiveManagerReports from './pages/LiveManagerReports'
import LiveManagerCompetitors from './pages/LiveManagerCompetitors'
import LiveManagerBudget from './pages/LiveManagerBudget'
import './App.css'

const CHANNELS = ['Meta', 'Google Ads', 'TikTok']

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

export function ImportScreen({ imports, onImported, notify }) {
  const [campaignId, setCampaignId] = useState('')
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
      body.append('campaign_id', campaignId)
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
        <WorkflowCampaignSelect value={campaignId} onChange={setCampaignId} />
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
                disabled={busy || !campaignId || !preview || preview.error_count > 0 || preview.row_count === 0}
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

export function StrategyScreen({ profile, latestRows, result, setResult, notify }) {
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

export function ContentScreen({ result, profile, setPage, notify }) {
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
  const auth = useAuth()
  const { user, membership, ready } = auth
  const [backendError, setBackendError] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [emailSent, setEmailSent] = useState('')
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState(() => window.location.hash === '#personnel-requests' ? 'members' : 'overview')
  const [imports, setImports] = useState([])
  const [, setLatestRows] = useState([])
  const [strategy] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [dataReady, setDataReady] = useState(false)
  const actorRole = resolveActorRole(user, membership, { platformRole: auth.platformRole })
  const userId = user?.id
  const workspaceId = membership?.workspaceId
  const workspaceRole = membership?.role
  const currentWorkspace = useRef(workspaceId)
  useLayoutEffect(() => {
    currentWorkspace.current = workspaceId
    return () => { currentWorkspace.current = null }
  }, [workspaceId])

  const refreshData = useCallback(async () => {
    const [business, history] = await Promise.all([api('business-profile/'), api('campaign-imports/')])
    setProfile(business.profile)
    setImports(history.imports)
    setLatestRows(history.latest_rows)
    setBackendError('')
    setDataReady(true)
    if (!business.profile && membership?.role === 'admin') setPage('profile')
  }, [membership?.role])

  useEffect(() => {
    if (!userId || !workspaceId || auth.platformRole || actorRole === 'leader') return undefined
    let active = true
    Promise.all([api('business-profile/'), api('campaign-imports/')]).then(([business, history]) => {
      if (!active) return
      setProfile(business.profile)
      setImports(history.imports)
      setLatestRows(history.latest_rows)
      setBackendError('')
      setDataReady(true)
      if (!business.profile && workspaceRole === 'admin') setPage('profile')
    }).catch(cause => { if (active) setBackendError(cause.message) })
    return () => { active = false }
  }, [userId, workspaceId, workspaceRole, auth.platformRole, actorRole])

  async function handleLogin(email, password, isSignup = false) {
    setBusy(true)
    setError('')
    try {
      if (isSignup) {
        await auth.requestEmailLink(email)
        setEmailSent(email)
      } else {
        await auth.signIn(email, password)
      }
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }

  async function saveProfile(draft) {
    const savingWorkspace = workspaceId
    setBusy(true)
    setError('')
    try {
      const data = await api('business-profile/', { method: 'PUT', body: JSON.stringify(draft) })
      if (currentWorkspace.current !== savingWorkspace) throw new Error('Doanh nghiệp đã thay đổi trong khi lưu. Hãy tải lại hồ sơ hiện tại.')
      setProfile(data.profile)
      setPage('overview')
      setToast('Business profile saved successfully.')
      return data.profile
    } catch (cause) {
      setError(cause.message)
      throw cause
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    try { await auth.signOut() }
    catch (cause) { setError(cause.message) }
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
    if (emailSent) return <EmailLinkSentPage email={emailSent} onResend={() => auth.requestEmailLink(emailSent)} onBack={() => { setEmailSent(''); setAuthMode('login') }} />
    return (
      <AccountEntryPage
        mode={authMode}
        setMode={setAuthMode}
        onLogin={handleLogin}
        busy={busy}
        error={error || auth.error || backendError}
        notice={toast}
      />
    )
  }

  if (auth.passwordSetupRequired) return <SetPasswordPage auth={auth} />
  if (!auth.platformRole && !membership && !auth.memberships.length) return <CompanyJoinPage auth={auth} />
  if (!auth.platformRole && !membership) {
    return <div className="loading-screen"><Brand />
      <h1>{auth.memberships.length ? 'Chọn không gian làm việc' : 'Tài khoản đang chờ được cấp quyền'}</h1>
      <p>{auth.memberships.length ? 'Chọn Workspace đã được cấp trong danh sách phía trên.' : 'Đăng ký không tự cấp quyền doanh nghiệp. Liên hệ người quản lý để được mời.'}</p>
      <button className="button subtle" onClick={logout}>Đăng xuất</button>
    </div>
  }
  // LeaderWorkspace loads its own scoped context and data. The legacy profile
  // and import history are unused here and must not block its first render.
  if (actorRole === 'leader') return <LeaderWorkspace logout={logout} />

  if (!auth.platformRole && !dataReady) {
    return <div className="loading-screen"><Brand /><p role="status">{backendError || 'Đang tải dữ liệu Workspace…'}</p>
      {backendError && <button className="button primary" onClick={() => refreshData().catch(cause => setBackendError(cause.message))}>Thử lại</button>}
      <button className="button subtle" onClick={logout}>Đăng xuất</button>
    </div>
  }
  if (!auth.platformRole && !profile && membership?.role !== 'admin') {
    return <div className="loading-screen"><Brand /><p>Doanh nghiệp chưa hoàn tất hồ sơ. Vui lòng liên hệ Marketing Manager.</p>
      <button className="button subtle" onClick={logout}>Đăng xuất</button>
    </div>
  }

  // ─── 1. SYSTEM ADMIN: Vào giao diện system-admin ──────────────────────────
  if (actorRole === 'system_admin') {
    return (
      <SystemAdminLayout
        user={user}
        onLogout={logout}
        onSignOut={logout}
        onSelectWorkspace={auth.selectWorkspace}
        notify={setToast}
      />
    )
  }

  // ─── 2. MANAGER: Vào giao diện company-admin ──────────────────────────────
  if (actorRole === 'manager') {
    return (
      <MarketingManagerLayout
        key={membership?.workspaceId}
        user={user}
        membership={membership}
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
          <WorkflowStudio kind="strategy" />
        )}
        {page === 'content' && (
          <WorkflowStudio kind="content" />
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
            onProfileUpdated={setProfile}
          />
        )}
        {(page === 'budget' || page === 'budget-review') && <LiveManagerBudget key={membership?.workspaceId} />}
        {page === 'reports' && <LiveManagerReports key={membership?.workspaceId} workspaceId={membership?.workspaceId} />}
        {page === 'insights' && <LiveManagerCompetitors key={membership?.workspaceId} workspaceId={membership?.workspaceId} />}
      </MarketingManagerLayout>
    )
  }

  // ─── 3. LEADER: Vào giao diện leader ──────────────────────────────────────

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
      {(page === 'submissions' || page === 'reports') && <WorkflowInbox mine />}
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
      {page === 'notifications' && <WorkflowInbox mine mode="notifications" />}
      {page === 'budget' && <BudgetOptimizationPage notify={setToast} />}
      {page === 'insights' && <CompetitorInsightsPage notify={setToast} />}
      {page === 'import' && (
        <ImportScreen imports={imports} onImported={onImported} notify={setToast} />
      )}
      {page === 'strategy' && (
        <WorkflowStudio kind="strategy" />
      )}
      {page === 'content' && (
        <WorkflowStudio kind="content" />
      )}
      {page === 'profile' && (
        <SettingsPage
          user={user}
          actorRole="member"
          membership={membership}
          profile={profile}
          notify={setToast}
        />
      )}
      <Toast message={toast} clear={() => setToast('')} />
    </Shell>
  )
}

function WorkspaceEntry() {
  const auth = useAuth()
  const [joinUser, setJoinUser] = useState(null)
  const [invitationCallback, setInvitationCallback] = useState(() => new URLSearchParams(window.location.search).has('invitationId'))
  if (auth.user && !auth.platformRole && !auth.passwordSetupRequired && auth.memberships.length > 0 && (joinUser === auth.user.id || invitationCallback)) {
    return <CompanyJoinPage auth={auth} onBack={() => { window.history.replaceState({}, '', '/'); setInvitationCallback(false); setJoinUser(null) }} />
  }
  return <>
    {auth.user && auth.memberships.length > 1 && <div className="flex items-center gap-3 border-b border-border bg-background p-2 text-foreground">
      <label htmlFor="active-workspace">Không gian làm việc</label>
      <select id="active-workspace" className="rounded border border-border bg-background p-1" value={auth.workspaceId || ''} onChange={event => auth.selectWorkspace(event.target.value)}>
        <option value="" disabled>Chọn Workspace</option>
        {auth.memberships.map(item => <option key={item.workspaceId} value={item.workspaceId}>{item.workspaceName}</option>)}
      </select>
    </div>}
    <WorkspaceApp key={String(auth.user?.id || 'signed-out') + ':' + String(auth.workspaceId || 'none')} />
  </>
}

function AppContent() {
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

  return <AuthProvider>{window.location.pathname === '/auth/complete' ? <AuthCompletePage><WorkspaceEntry /></AuthCompletePage> : <WorkspaceEntry />}</AuthProvider>
}

export default function App() {
  return <LanguageProvider><AppContent /></LanguageProvider>
}
