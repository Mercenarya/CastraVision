/**
 * DashboardPreviewPage.jsx — Centralized Development-Only Multi-Role Dashboard Preview
 * Allows developers to inspect and switch between Marketing Manager, Leader, and Employee dashboards.
 * This is a development inspection tool, NOT a replacement for production authentication or RBAC.
 */

import { useEffect, useState } from 'react'
import './preview.css'
import CrossChannelCampaignOverview from './CrossChannelCampaignOverview'
import MarketingManagerLayout from '../company-admin/MarketingManagerLayout'
import MainLeaderDashboard from '../leader/screens/LeaderDashboard'
import MainEmployeeDashboard from '../member/screens/MemberDashboard'
import { Shell } from '../dashboards/RoleDashboards'
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

export default function DashboardPreviewPage({ onExit, role = 'marketing_manager' }) {
  const [activeRole] = useState(role)
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

  return (
    <div className="dev-preview-root">

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
          <Shell
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
              />
            )}
            {previewPage === 'approvals' && (
              <ApprovalQueuePage notify={handleNotify} role="manager" />
            )}
            {previewPage === 'budget' && <BudgetOptimizationPage notify={handleNotify} />}
            {previewPage === 'reports' && <ReportsPage profile={MOCK_PREVIEW_PROFILE} notify={handleNotify} />}
            {previewPage === 'insights' && <CompetitorInsightsPage notify={handleNotify} />}
            {previewPage === 'strategy' && (
              <div className="card" style={{ padding: 32, margin: '20px 0' }}>
                <h2>Strategy &amp; Insights Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  Active strategy target: <strong>{MOCK_PREVIEW_STRATEGY.strategy.recommended_channel}</strong> with target CPA {MOCK_PREVIEW_STRATEGY.strategy.target_cpa}.
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Leader Dashboard
                </button>
              </div>
            )}
            {previewPage === 'content' && (
              <div className="card" style={{ padding: 32, margin: '20px 0' }}>
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
              <div className="card" style={{ padding: 32, margin: '20px 0' }}>
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
              <div className="card" style={{ padding: 32, margin: '20px 0' }}>
                <h2>Company Profile Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  {MOCK_PREVIEW_PROFILE.business_name} · {MOCK_PREVIEW_PROFILE.industry} · {MOCK_PREVIEW_PROFILE.business_size}
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Leader Dashboard
                </button>
              </div>
            )}
          </Shell>
        )}

        {/* 3. EMPLOYEE DASHBOARD */}
        {activeRole === 'employee' && (
          <Shell
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
              />
            )}
            {previewPage === 'approvals' && (
              <div className="card" style={{ padding: '48px 32px', textAlign: 'center', margin: '24px 0' }}>
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
            {previewPage === 'reports' && <ReportsPage profile={MOCK_PREVIEW_PROFILE} notify={handleNotify} />}
            {previewPage === 'insights' && <CompetitorInsightsPage notify={handleNotify} />}
            {previewPage === 'strategy' && (
              <div className="card" style={{ padding: 32, margin: '20px 0' }}>
                <h2>Generate AI Strategy Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  AI recommendations synthesized from customer personas and channel records.
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Employee Dashboard
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
                  ← Back to Employee Dashboard
                </button>
              </div>
            )}
            {previewPage === 'import' && (
              <div className="card" style={{ padding: 32, margin: '20px 0' }}>
                <h2>Campaign Data Import Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  CSV / XLSX validation and normalization upload tool.
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Employee Dashboard
                </button>
              </div>
            )}
            {previewPage === 'profile' && (
              <div className="card" style={{ padding: 32, margin: '20px 0' }}>
                <h2>Target Audience &amp; Profile Preview</h2>
                <p style={{ color: 'var(--cv-muted, #94a3b8)', marginTop: 8 }}>
                  Audience preferences: {MOCK_PREVIEW_PROFILE.target_customers}
                </p>
                <button className="button primary" style={{ marginTop: 16 }} onClick={() => setPreviewPage('overview')}>
                  ← Back to Employee Dashboard
                </button>
              </div>
            )}
          </Shell>
        )}
      </main>
    </div>
  )
}
