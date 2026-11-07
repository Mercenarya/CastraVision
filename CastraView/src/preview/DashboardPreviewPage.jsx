/**
 * DashboardPreviewPage.jsx — Centralized Development-Only Multi-Role Dashboard Preview
 * Allows developers to inspect and switch between Marketing Manager, Leader, and Employee dashboards.
 * This is a development inspection tool, NOT a replacement for production authentication or RBAC.
 */

import { useEffect, useState } from 'react'
import './preview.css'
import CrossChannelCampaignOverview from './CrossChannelCampaignOverview'
import MarketingManagerLayout from '../company-admin/MarketingManagerLayout'
import LeaderLayout from '../leader/LeaderLayout'
import MemberLayout from '../member/MemberLayout'
import MainLeaderDashboard from '../leader/screens/LeaderDashboard'
import MainEmployeeDashboard from '../member/screens/MemberDashboard'
import {
  ApprovalQueuePage,
  BudgetOptimizationPage,
  ReportsPage,
  CompetitorInsightsPage,
} from '../actor-ui/ActorPages'


// ─── Development Preview Mock Datasets ──────────────────────────────────────
const MOCK_PREVIEW_PROFILE = {
  business_name: 'Acme Corp',
  industry: 'Enterprise SaaS',
  business_size: 'Enterprise',
  target_customers: 'VP Marketing, Growth Directors, and Enterprise Performance Teams',
  product_service: 'Autonomous Multi-Channel AI Marketing Platform',
  primary_goal: 'Scale DTC & B2B pipeline acquisition across Meta and Google Ads',
  monthly_budget: '50000',
  currency: 'USD',
  preferred_channels: ['Meta', 'Google Ads', 'TikTok'],
}

const MOCK_PREVIEW_USERS = {
  marketing_manager: {
    email: 'sarah.jenkins@acmecorp.com',
    full_name: 'Sarah Jenkins',
    role: 'admin',
    workspaceRole: 'admin',
  },
  leader: {
    email: 'marcus.vance@acmecorp.com',
    full_name: 'Marcus Vance',
    role: 'manager',
    workspaceRole: 'manager',
  },
  employee: {
    email: 'member@acmecorp.com',
    full_name: 'Alex Mercer',
    role: 'member',
    workspaceRole: 'member',
  },
}

const MOCK_PREVIEW_IMPORTS = [
  { id: 'imp-001', filename: 'q3_omnichannel_performance.csv', row_count: 1420, date: '2026-10-24' },
  { id: 'imp-002', filename: 'september_meta_roas_export.xlsx', row_count: 860, date: '2026-10-15' },
]

const MOCK_PREVIEW_STRATEGY = {
  strategy: {
    recommended_channel: 'Meta Ads',
    target_cpa: '$18.50',
    primary_angle: 'Accelerate SME customer acquisition with closed-loop AI analytics.',
  },
}

export const PREVIEW_ROLES = [
  { key: 'marketing_manager', label: 'Marketing Manager', internalRole: 'company_admin / admin', icon: '🏢' },
  { key: 'leader', label: 'Leader', internalRole: 'manager', icon: '✓' },
  { key: 'employee', label: 'Employee', internalRole: 'member', icon: '✦' },
]

export default function DashboardPreviewPage({ onExit, role: defaultRole = 'marketing_manager' }) {
  const getInitialRole = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const roleParam = params.get('role')
      if (roleParam && PREVIEW_ROLES.some((r) => r.key === roleParam)) {
        return roleParam
      }
    }
    return defaultRole
  }

  const [activeRole, setActiveRole] = useState(getInitialRole)
  const [previewPage, setPreviewPage] = useState('overview')
  const [toastMessage, setToastMessage] = useState('')

  // Automatically dismiss toast notification after 2.5 seconds
  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = setTimeout(() => {
      setToastMessage('')
    }, 2500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // Reset scroll position to top whenever switching roles or subpages
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const containers = document.querySelectorAll(
      '.dev-preview-body, .ca-shell, .ca-main-wrap, .ca-content, .shell, .main-wrap, .app-content'
    )
    containers.forEach((el) => {
      el.scrollTop = 0
    })
  }, [activeRole, previewPage])

  function handleRoleSwitch(roleKey) {
    setActiveRole(roleKey)
    setPreviewPage('overview')
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('role', roleKey)
      window.history.replaceState({}, '', url.toString())
    }
    setToastMessage(`Đã chuyển sang ${PREVIEW_ROLES.find((r) => r.key === roleKey)?.label}`)
  }

  function handleNotify(msg) {
    setToastMessage(msg)
  }

  function handleExit() {
    if (onExit) {
      onExit()
    } else {
      window.location.href = '/'
    }
  }

  const currentUser = MOCK_PREVIEW_USERS[activeRole]
  const currentRoleMeta = PREVIEW_ROLES.find((r) => r.key === activeRole)

  return (
    <div className="dev-preview-root">
      {/* ── TOP PREVIEW TOOLBAR ── */}
      <header className="dev-preview-bar" aria-label="Development Preview Controls">
        <div className="dev-preview-left">
          <span className="dev-preview-badge">DEV PREVIEW</span>
          <span className="dev-preview-title">CastraVision Dashboard Inspector</span>
        </div>

        {/* ── CENTRALIZED ROLE TABS ── */}
        <div className="dev-preview-tabs" role="tablist" aria-label="Role Dashboards">
          {PREVIEW_ROLES.map((r) => {
            const isActive = activeRole === r.key
            return (
              <button
                key={r.key}
                role="tab"
                type="button"
                className={`dev-preview-tab ${isActive ? 'active' : ''}`}
                aria-selected={isActive}
                onClick={() => handleRoleSwitch(r.key)}
              >
                <span aria-hidden="true">{r.icon}</span>
                <span>{r.label}</span>
                <span className="dev-preview-tab-role">{r.internalRole}</span>
              </button>
            )
          })}
        </div>

        <div className="dev-preview-right">
          <span className="dev-preview-mode" title="Loaded in Vite dev mode">
            Đang xem: <strong>{currentRoleMeta?.label}</strong>
          </span>
          <button
            type="button"
            className="dev-preview-exit-btn"
            onClick={handleExit}
            title="Quay lại trang chính"
          >
            Thoát Preview ✕
          </button>
        </div>
      </header>

      {/* ── COMPACT TOP-RIGHT NOTIFICATION TOAST ── */}
      {toastMessage && (
        <div
          className="dev-preview-toast"
          role="status"
          aria-live="polite"
        >
          <span className="dev-preview-toast-icon" aria-hidden="true">✓</span>
          <span className="dev-preview-toast-text">{toastMessage}</span>
          <button
            type="button"
            className="dev-preview-toast-close"
            onClick={() => setToastMessage('')}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {/* ── PREVIEW VIEWPORT ── */}
      <main className="dev-preview-body">
        {/* 1. MARKETING MANAGER DASHBOARD */}
        {activeRole === 'marketing_manager' && (
          <MarketingManagerLayout
            user={currentUser}
            profile={MOCK_PREVIEW_PROFILE}
            page={previewPage}
            setPage={setPreviewPage}
            onSignOut={handleExit}
            notify={handleNotify}
          >
            {previewPage === 'overview' && (
              <CrossChannelCampaignOverview
                onNavigate={setPreviewPage}
                notify={handleNotify}
              />
            )}
            {previewPage === 'budget' && <BudgetOptimizationPage notify={handleNotify} />}
            {previewPage === 'reports' && <ReportsPage profile={MOCK_PREVIEW_PROFILE} notify={handleNotify} />}
            {previewPage === 'insights' && <CompetitorInsightsPage notify={handleNotify} />}
            {previewPage === 'import' && (
              <div className="card" style={{ padding: 32, margin: '20px 0' }}>
                <h2>Campaign Data Import Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  Normalized records from Meta, Google Ads, and TikTok ({MOCK_PREVIEW_IMPORTS[0].row_count} rows ingested).
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Overview
                </button>
              </div>
            )}
            {previewPage === 'content' && (
              <div className="card" style={{ padding: 32, margin: '20px 0' }}>
                <h2>Content Studio Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  Channel-specific copy variations, headlines, and creative assets.
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Overview
                </button>
              </div>
            )}
            {previewPage === 'profile' && (
              <div className="card" style={{ padding: 32, margin: '20px 0' }}>
                <h2>Company Profile &amp; Settings Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  {MOCK_PREVIEW_PROFILE.business_name} · {MOCK_PREVIEW_PROFILE.industry} · {MOCK_PREVIEW_PROFILE.business_size}
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Overview
                </button>
              </div>
            )}
          </MarketingManagerLayout>
        )}

        {/* 2. LEADER DASHBOARD */}
        {activeRole === 'leader' && (
          <LeaderLayout
            user={currentUser}
            profile={MOCK_PREVIEW_PROFILE}
            page={previewPage}
            setPage={setPreviewPage}
            logout={handleExit}
          >
            {previewPage === 'overview' && (
              <MainLeaderDashboard
                imports={MOCK_PREVIEW_IMPORTS}
                setPage={setPreviewPage}
                notify={handleNotify}
              />
            )}
            {(previewPage === 'assigned-campaigns' || previewPage === 'campaigns') && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8' }}>LEADER WORKSPACE // CAMPAIGNS</span>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>Campaigns</h2>
                    <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
                      Active campaigns assigned to Growth Squad Alpha and performance governance.
                    </p>
                  </div>
                  <span style={{ padding: '4px 12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    1 Active Campaign
                  </span>
                </div>
                <div style={{ padding: 20, background: '#070b14', border: '1px solid #1e293b', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Summer Campaign 2025 – SneakerX Streetwear</h3>
                      <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                        Meta Ads, Google Search Ads, TikTok UGC • Target ROAS: 3.8x
                      </p>
                    </div>
                    <span style={{ padding: '3px 10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      ● Live &amp; Scaling
                    </span>
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 24, fontSize: 13, color: '#94a3b8' }}>
                    <span>Budget Allocated: <strong style={{ color: '#f1f5f9' }}>$38,500</strong></span>
                    <span>Delivered Creatives: <strong style={{ color: '#f1f5f9' }}>18 / 24</strong></span>
                    <span>Pending Reviews: <strong style={{ color: '#38bdf8' }}>4 items</strong></span>
                  </div>
                </div>
                <button className="button primary" onClick={() => setPreviewPage('overview')}>
                  ← Back to Leader Dashboard
                </button>
              </div>
            )}
            {previewPage === 'team-tasks' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#818cf8' }}>SQUAD ALPHA // WORKFLOW</span>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>Team Tasks</h2>
                    <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
                      Task distribution and deliverable pipeline across Growth Squad Alpha members.
                    </p>
                  </div>
                  <span style={{ padding: '4px 12px', background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    5 Active Tasks
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {[
                    { title: 'SneakerX Short Copy & Hooks', assignee: 'Alex Mercer', status: 'Needs Revision', due: '2h remaining' },
                    { title: 'Meta Carousel Visual Brief', assignee: 'Alex Mercer', status: 'In Review', due: 'Today, 5:00 PM' },
                    { title: 'TikTok 15s UGC Hook Script', assignee: 'Sarah Wu', status: 'Drafting', due: 'Tomorrow' },
                    { title: 'Google RSA Copy Optimization', assignee: 'Alex Mercer', status: 'Drafting', due: 'Nov 4' },
                  ].map((t) => (
                    <div key={t.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#070b14', border: '1px solid #1e293b', borderRadius: 8 }}>
                      <div>
                        <strong style={{ fontSize: 14, color: '#f1f5f9' }}>{t.title}</strong>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Assignee: {t.assignee} · Due: {t.due}</div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: t.status === 'Needs Revision' ? 'rgba(249, 115, 22, 0.15)' : t.status === 'In Review' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)', color: t.status === 'Needs Revision' ? '#f97316' : t.status === 'In Review' ? '#eab308' : '#38bdf8' }}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="button primary" onClick={() => setPreviewPage('overview')}>
                  ← Back to Leader Dashboard
                </button>
              </div>
            )}
            {(previewPage === 'content-reviews' || previewPage === 'approvals' || previewPage === 'my-proposals') && (
              <ApprovalQueuePage notify={handleNotify} role="manager" />
            )}
            {(previewPage === 'performance' || previewPage === 'budget') && (
              <BudgetOptimizationPage notify={handleNotify} />
            )}
            {previewPage === 'reports' && <ReportsPage profile={MOCK_PREVIEW_PROFILE} notify={handleNotify} />}
            {previewPage === 'insights' && <CompetitorInsightsPage notify={handleNotify} />}
            {previewPage === 'strategy' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#818cf8' }}>AI ENGINE // STRATEGY</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>Strategy &amp; Insights</h2>
                <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
                  Active strategy target: <strong style={{ color: '#f1f5f9' }}>{MOCK_PREVIEW_STRATEGY.strategy.recommended_channel}</strong> with target CPA <strong style={{ color: '#f1f5f9' }}>{MOCK_PREVIEW_STRATEGY.strategy.target_cpa}</strong>.
                </p>
                <p style={{ color: '#cbd5e1', fontSize: 14, marginTop: 8 }}>
                  Angle: {MOCK_PREVIEW_STRATEGY.strategy.primary_angle}
                </p>
                <button className="button primary" style={{ marginTop: 20 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Leader Dashboard
                </button>
              </div>
            )}
            {previewPage === 'notifications' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#f43f5e' }}>LEADER NOTIFICATIONS</span>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>Alerts &amp; Activity Log</h2>
                  </div>
                  <span style={{ padding: '4px 12px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    3 Unread Alerts
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {[
                    { text: 'Alex Mercer submitted 2 creative hooks for SneakerX Summer Campaign', time: '12m ago', unread: true },
                    { text: 'Meta ROAS exceeded target threshold (4.2x vs 3.8x baseline)', time: '1h ago', unread: true },
                    { text: 'Squad Alpha Compute Engine utilized at 78% (78,450 / 100K ops)', time: '3h ago', unread: true },
                  ].map((n, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: '#070b14', border: '1px solid #1e293b', borderRadius: 8 }}>
                      <span style={{ fontSize: 14, color: '#f1f5f9' }}>{n.text}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: 16 }}>{n.time}</span>
                    </div>
                  ))}
                </div>
                <button className="button primary" onClick={() => setPreviewPage('overview')}>
                  ← Back to Leader Dashboard
                </button>
              </div>
            )}
            {previewPage === 'content' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <h2>Content Studio Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  Multi-channel drafting workspace aligned with active campaign strategy.
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Leader Dashboard
                </button>
              </div>
            )}
            {previewPage === 'import' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <h2>Campaign Data Import Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  Normalized records from Meta, Google Ads, and TikTok ({MOCK_PREVIEW_IMPORTS[0].row_count} rows ingested).
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Leader Dashboard
                </button>
              </div>
            )}
            {previewPage === 'profile' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#818cf8' }}>USER PROFILE // LEADER</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>Marcus Vance</h2>
                <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
                  Marketing Team Lead · Growth Squad Alpha · {MOCK_PREVIEW_PROFILE.business_name}
                </p>
                <div style={{ marginTop: 16, padding: 16, background: '#070b14', borderRadius: 8, border: '1px solid #1e293b', fontSize: 13, color: '#94a3b8' }}>
                  <div style={{ marginBottom: 6 }}>Email: <strong style={{ color: '#f1f5f9' }}>marcus.vance@acmecorp.com</strong></div>
                  <div style={{ marginBottom: 6 }}>Workspace Role: <strong style={{ color: '#818cf8' }}>Leader (Manager)</strong></div>
                  <div>Governance Capabilities: <strong style={{ color: '#10b981' }}>FR04 Approval Queue, FR02 Strategy Review, Team Tasks</strong></div>
                </div>
                <button className="button primary" style={{ marginTop: 20 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Leader Dashboard
                </button>
              </div>
            )}
          </LeaderLayout>
        )}

        {/* 3. EMPLOYEE DASHBOARD */}
        {activeRole === 'employee' && (
          <MemberLayout
            user={currentUser}
            profile={MOCK_PREVIEW_PROFILE}
            page={previewPage}
            setPage={setPreviewPage}
            logout={handleExit}
          >
            {previewPage === 'overview' && (
              <MainEmployeeDashboard
                profile={MOCK_PREVIEW_PROFILE}
                imports={MOCK_PREVIEW_IMPORTS}
                strategy={MOCK_PREVIEW_STRATEGY}
                setPage={setPreviewPage}
                notify={handleNotify}
              />
            )}
            {(previewPage === 'tasks' || previewPage === 'emp-tasks') && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8' }}>EMPLOYEE WORKSPACE // TASKS</span>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>My Assigned Tasks</h2>
                    <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
                      Tasks assigned to Alex Mercer for SneakerX Summer Campaign.
                    </p>
                  </div>
                  <span style={{ padding: '4px 12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    5 Assigned Tasks
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {[
                    { title: 'SneakerX Short Copy & Hooks', status: 'Needs Revision', due: 'Due in 2h', channel: 'Meta / IG Feed' },
                    { title: 'Meta Carousel Visual Brief', status: 'In Review', due: 'Due Today', channel: 'Meta Ads' },
                    { title: 'TikTok 15s UGC Hook Script', status: 'Drafting', due: 'Due Tomorrow', channel: 'TikTok Ads' },
                    { title: 'Google RSA Copy Optimization', status: 'Drafting', due: 'Due in 3 days', channel: 'Google Search' },
                    { title: 'Weekly Creative Performance Retrospective', status: 'Drafting', due: 'Due in 4 days', channel: 'Reports' },
                  ].map((t) => (
                    <div key={t.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#070b14', border: '1px solid #1e293b', borderRadius: 8 }}>
                      <div>
                        <strong style={{ fontSize: 14, color: '#f1f5f9' }}>{t.title}</strong>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{t.channel} · {t.due}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: t.status === 'Needs Revision' ? 'rgba(249, 115, 22, 0.15)' : t.status === 'In Review' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)', color: t.status === 'Needs Revision' ? '#f97316' : t.status === 'In Review' ? '#eab308' : '#38bdf8' }}>
                          {t.status}
                        </span>
                        <button className="button subtle" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setPreviewPage('content')}>
                          Open Studio →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="button primary" onClick={() => setPreviewPage('overview')}>
                  ← Back to My Dashboard
                </button>
              </div>
            )}
            {previewPage === 'content' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#818cf8' }}>AI STUDIO // GENERATION</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>Content Studio Workspace</h2>
                <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
                  Generate and iterate multi-channel copy, headlines, hooks, and creative prompts.
                </p>
                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  <button className="button primary" onClick={() => handleNotify('Generated draft copied to clipboard')}>
                    ✦ Generate New Variation
                  </button>
                  <button className="button subtle" onClick={() => setPreviewPage('overview')}>
                    ← Back to My Dashboard
                  </button>
                </div>
              </div>
            )}
            {previewPage === 'assigned-campaigns' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8' }}>EMPLOYEE // CAMPAIGNS</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>Assigned Campaigns</h2>
                <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
                  Campaigns where Alex Mercer is an active creative contributor.
                </p>
                <div style={{ marginTop: 16, padding: 20, background: '#070b14', border: '1px solid #1e293b', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 15, color: '#f1f5f9' }}>Summer Campaign 2025 – SneakerX Streetwear</strong>
                    <span style={{ padding: '3px 10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      Active
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>Role: Content Specialist • Deliverables completed: 8 / 12</p>
                </div>
                <button className="button primary" style={{ marginTop: 20 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to My Dashboard
                </button>
              </div>
            )}
            {(previewPage === 'submissions' || previewPage === 'reports') && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#818cf8' }}>CREATIVE WORKFLOW // SUBMISSIONS</span>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>My Submissions</h2>
                    <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
                      Track the approval status of creative drafts submitted to Marcus Vance.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {[
                    { id: 'SUB-2041', name: 'Summer Sneaker Drop - 5 Carousel Angles', date: 'Oct 29, 2026', status: 'Approved', reviewer: 'Marcus Vance' },
                    { id: 'SUB-2038', name: 'TikTok Gen-Z Streetwear Hook Sequence', date: 'Oct 28, 2026', status: 'In Review', reviewer: 'Marcus Vance' },
                    { id: 'SUB-2035', name: 'Google RSA Headline Variants (Set B)', date: 'Oct 27, 2026', status: 'Approved', reviewer: 'Marcus Vance' },
                  ].map((s) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#070b14', border: '1px solid #1e293b', borderRadius: 8 }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 700 }}>{s.id}</span>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Submitted: {s.date} · Reviewer: {s.reviewer}</div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: s.status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)', color: s.status === 'Approved' ? '#10b981' : '#eab308' }}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="button primary" onClick={() => setPreviewPage('overview')}>
                  ← Back to My Dashboard
                </button>
              </div>
            )}
            {previewPage === 'strategy' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#818cf8' }}>STRATEGY REFERENCE // READ-ONLY</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>Strategy Reference</h2>
                <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
                  Brand tone, positioning, and persona guidelines configured for active deliverables.
                </p>
                <div style={{ marginTop: 16, padding: 18, background: '#070b14', border: '1px solid #1e293b', borderRadius: 8, fontSize: 13, color: '#94a3b8' }}>
                  <div style={{ marginBottom: 8 }}>Primary Angle: <strong style={{ color: '#f1f5f9' }}>{MOCK_PREVIEW_STRATEGY.strategy.primary_angle}</strong></div>
                  <div style={{ marginBottom: 8 }}>Target Persona: <strong style={{ color: '#f1f5f9' }}>{MOCK_PREVIEW_PROFILE.target_customers}</strong></div>
                  <div>Tone of Voice: <strong style={{ color: '#38bdf8' }}>Energetic, Confident, Direct</strong></div>
                </div>
                <button className="button primary" style={{ marginTop: 20 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to My Dashboard
                </button>
              </div>
            )}
            {previewPage === 'notifications' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8' }}>NOTIFICATIONS // EMPLOYEE</span>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>My Notifications</h2>
                  </div>
                  <span style={{ padding: '4px 12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    2 Updates
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {[
                    { text: 'Marcus Vance requested revision on SneakerX Short Copy & Hooks', time: '25m ago' },
                    { text: 'Visual Asset Prompt generation completed in AI Studio', time: '2h ago' },
                  ].map((n, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: '#070b14', border: '1px solid #1e293b', borderRadius: 8 }}>
                      <span style={{ fontSize: 14, color: '#f1f5f9' }}>{n.text}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: 16 }}>{n.time}</span>
                    </div>
                  ))}
                </div>
                <button className="button primary" onClick={() => setPreviewPage('overview')}>
                  ← Back to My Dashboard
                </button>
              </div>
            )}
            {previewPage === 'profile' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8' }}>USER PROFILE // EMPLOYEE</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>Alex Mercer</h2>
                <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
                  Marketing Specialist · Growth Squad Alpha · {MOCK_PREVIEW_PROFILE.business_name}
                </p>
                <div style={{ marginTop: 16, padding: 16, background: '#070b14', borderRadius: 8, border: '1px solid #1e293b', fontSize: 13, color: '#94a3b8' }}>
                  <div style={{ marginBottom: 6 }}>Email: <strong style={{ color: '#f1f5f9' }}>alex.mercer@acmecorp.com</strong></div>
                  <div style={{ marginBottom: 6 }}>Workspace Role: <strong style={{ color: '#38bdf8' }}>Employee (Member)</strong></div>
                  <div>Permissions: <strong style={{ color: '#10b981' }}>FR03 Content Studio, Strategy Reference, Task Execution</strong></div>
                </div>
                <button className="button primary" style={{ marginTop: 20 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to My Dashboard
                </button>
              </div>
            )}
            {previewPage === 'approvals' && (
              <div className="card" style={{ padding: '48px 32px', textAlign: 'center', margin: '24px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
                <h2 style={{ fontSize: 18, marginBottom: 8, color: '#f1f5f9' }}>Access Restricted (FR04)</h2>
                <p style={{ color: '#94a3b8', maxWidth: 480, margin: '0 auto 20px', fontSize: 14 }}>
                  Only Marketing Managers and Leaders have authorization to access the Approval Queue. Employees cannot view or process approvals.
                </p>
                <button className="button primary" onClick={() => setPreviewPage('overview')}>
                  Return to Dashboard
                </button>
              </div>
            )}
            {previewPage === 'budget' && <BudgetOptimizationPage notify={handleNotify} />}
            {previewPage === 'import' && (
              <div className="card" style={{ padding: 32, margin: '20px 0', background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12 }}>
                <h2>Campaign Data Import Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  CSV / XLSX validation and normalization upload tool.
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Employee Dashboard
                </button>
              </div>
            )}
          </MemberLayout>
        )}
      </main>
    </div>
  )
}
