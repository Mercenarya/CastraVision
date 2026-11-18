/**
 * RoleDashboards.jsx — Shared role dashboard layouts and views
 * Exports LeaderDashboard, EmployeeDashboard, Shell, and shared presentation primitives.
 */

import { canAccessFR04ApprovalQueue } from '../auth/permissions'
import LeaderLayout from '../leader/LeaderLayout'
import MemberLayout from '../member/MemberLayout'
import { useLanguage } from '../hooks/useLanguage'

const SIZES = {
  Micro: '1–10 employees',
  Small: '11–50 employees',
  Medium: '51–250 employees',
  Large: '250+ employees',
}

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon" aria-hidden="true">✣</span>
      <span>CastraVision</span>
    </div>
  )
}

export function Heading({ eyebrow, title, subtitle, children }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow"><i /> {eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

export function Shell({ user, profile, page, setPage, logout, children }) {
  const isAdmin = user?.role === 'admin'
  const isLeader = user?.role === 'manager'
  const isEmployee = user?.role === 'member'

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

  const canApprove = canAccessFR04ApprovalQueue(user)

  const dashboardLabel = isLeader
    ? 'Leader Dashboard'
    : isEmployee
      ? 'Employee Dashboard'
      : 'Campaign Overview'

  const navList = [
    ['overview', '▦', dashboardLabel],
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
  const userName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'User')
  const userInitials = userName.slice(0, 2).toUpperCase()
  const userRoleTitle = isLeader
    ? 'Leader • Campaign Lead'
    : isEmployee
      ? 'Employee • Marketing Specialist'
      : (isAdmin ? 'Marketing Manager • Workspace Lead' : 'Workspace Specialist')

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

export function LeaderDashboard({ user, profile, imports = [], strategy, setPage }) {
  const { t } = useLanguage()
  const companyName = profile?.business_name || 'Acme Corp'
  const leaderName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Leader')

  return (
    <>
      <Heading
        eyebrow={t('leaderDashboard.eyebrow')}
        title={t('leaderDashboard.welcome', { name: leaderName })}
        subtitle={t('leaderDashboard.subtitle')}
      />

      <div className="overview-hero card">
        <div>
          <span className="mini-label">{t('leaderDashboard.heroLabel')}</span>
          <h2>{t('leaderDashboard.heroTitle')}</h2>
          <p>{t('leaderDashboard.heroDesc')}</p>
        </div>
        <button
          className="button primary"
          style={{ whiteSpace: 'nowrap', zIndex: 1 }}
          onClick={() => setPage('approvals')}
        >
          {t('leaderDashboard.openApprovalQueue')}
        </button>
      </div>

      <div className="overview-grid">
        <button className="overview-card card" onClick={() => setPage('approvals')}>
          <span className="overview-number">01 / FR04</span>
          <span className="overview-icon cyan">✓</span>
          <strong>{t('navigation.approvals')}</strong>
          <p>Review, edit, authorize, or reject AI proposals before campaigns go live.</p>
          <span className="card-link">{t('leaderDashboard.reviewQueue')}</span>
        </button>

        <button className="overview-card card" onClick={() => setPage('strategy')}>
          <span className="overview-number">02 / FR01</span>
          <span className="overview-icon violet">◈</span>
          <strong>{t('navigation.strategyReference')}</strong>
          <p>{strategy ? `Active channel: ${strategy.strategy?.recommended_channel || 'Meta'}` : 'Review and guide multi-channel marketing recommendations.'}</p>
          <span className="card-link">{strategy ? t('leaderDashboard.viewStrategy') : t('leaderDashboard.inspectStrategy')}</span>
        </button>

        <button className="overview-card card" onClick={() => setPage('budget')}>
          <span className="overview-number">03 / FR05</span>
          <span className="overview-icon cyan">↗</span>
          <strong>{t('navigation.budgetRoas')}</strong>
          <p>Monitor multi-channel ad spend allocation, conversion forecasts, and ROAS projections.</p>
          <span className="card-link">{t('leaderDashboard.analyzeBudget')}</span>
        </button>

        <button className="overview-card card" onClick={() => setPage('import')}>
          <span className="overview-number">04 / FR08</span>
          <span className="overview-icon violet">⇥</span>
          <strong>{t('navigation.campaignImport')}</strong>
          <p>{imports.length ? `${imports[0].row_count} records imported` : 'Supervise historical datasets across Meta, Google Ads, and TikTok.'}</p>
          <span className="card-link">{imports.length ? t('leaderDashboard.viewDataRecords') : t('leaderDashboard.openDataHub')}</span>
        </button>

        <button className="overview-card card" onClick={() => setPage('reports')}>
          <span className="overview-number">05 / FR07</span>
          <span className="overview-icon cyan">▤</span>
          <strong>{t('navigation.reports')}</strong>
          <p>Download and export cross-channel performance analytics and team summaries.</p>
          <span className="card-link">{t('leaderDashboard.viewReports')}</span>
        </button>

        <button className="overview-card card" onClick={() => setPage('profile')}>
          <span className="overview-number">06 / FR12</span>
          <span className="overview-icon violet">▣</span>
          <strong>{t('navigation.settings')}</strong>
          <p>{companyName} · {profile?.industry || 'Enterprise SaaS'}</p>
          <span className="card-link">{t('leaderDashboard.viewProfile')}</span>
        </button>
      </div>

      <div className="overview-note card">
        <span>ⓘ</span>
        <div>
          <strong>{t('leaderDashboard.governanceTitle')}</strong>
          <p>{t('leaderDashboard.governanceDesc')}</p>
        </div>
        <button className="button subtle" onClick={() => setPage('approvals')}>
          {t('leaderDashboard.checkPendingApprovals')}
        </button>
      </div>
    </>
  )
}

export function EmployeeDashboard({ user, profile, imports = [], strategy, setPage }) {
  const { t } = useLanguage()
  const companyName = profile?.business_name || 'Acme Corp'
  const employeeName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Employee')

  return (
    <>
      <Heading
        eyebrow={t('employeeDashboard.eyebrow')}
        title={t('employeeDashboard.welcome', { name: employeeName })}
        subtitle={t('employeeDashboard.subtitle')}
      />

      <div className="overview-hero card">
        <div>
          <span className="mini-label">{t('employeeDashboard.heroLabel')}</span>
          <h2>{t('employeeDashboard.heroTitle')}</h2>
          <p>{t('employeeDashboard.heroDesc', { companyName })}</p>
        </div>
        <button
          className="button primary"
          style={{ whiteSpace: 'nowrap', zIndex: 1 }}
          onClick={() => setPage('content')}
        >
          {t('employeeDashboard.launchContentStudio')}
        </button>
      </div>

      <div className="overview-grid">
        <button className="overview-card card" onClick={() => setPage('strategy')}>
          <span className="overview-number">01 / FR01</span>
          <span className="overview-icon violet">◈</span>
          <strong>{t('employeeDashboard.generateStrategy')}</strong>
          <p>{strategy ? `Recommended Channel: ${strategy.strategy?.recommended_channel || 'Meta'}` : 'Synthesize business profile & historical performance data.'}</p>
          <span className="card-link">{strategy ? t('employeeDashboard.viewStrategy') : t('employeeDashboard.generateStrategy')}</span>
        </button>

        <button className="overview-card card" onClick={() => setPage('content')}>
          <span className="overview-number">02 / FR03</span>
          <span className="overview-icon cyan">✦</span>
          <strong>{t('navigation.contentStudio')}</strong>
          <p>Create and refine channel-specific ad copy, headlines, hooks, and creative assets.</p>
          <span className="card-link">{t('employeeDashboard.openContentStudio')}</span>
        </button>

        <button className="overview-card card" onClick={() => setPage('import')}>
          <span className="overview-number">03 / FR08</span>
          <span className="overview-icon violet">⇥</span>
          <strong>{t('navigation.campaignImport')}</strong>
          <p>{imports.length ? `${imports[0].row_count} records normalized` : 'Upload CSV / XLSX campaign datasets to train AI models.'}</p>
          <span className="card-link">{imports.length ? t('employeeDashboard.viewIngestedData') : t('employeeDashboard.startDataImport')}</span>
        </button>

        <button className="overview-card card" onClick={() => setPage('profile')}>
          <span className="overview-number">04 / FR12</span>
          <span className="overview-icon cyan">▣</span>
          <strong>{t('settings.tabs.business')}</strong>
          <p>{profile?.industry || 'Enterprise'} · {SIZES[profile?.business_size] || profile?.business_size || 'Active Workspace'}</p>
          <span className="card-link">{t('employeeDashboard.viewWorkspaceProfile')}</span>
        </button>

        <button className="overview-card card" onClick={() => setPage('budget')}>
          <span className="overview-number">05 / FR05</span>
          <span className="overview-icon violet">↗</span>
          <strong>{t('navigation.budgetRoas')}</strong>
          <p>Inspect recommended budget distribution across Meta, Google Ads, and TikTok.</p>
          <span className="card-link">{t('employeeDashboard.viewProjections')}</span>
        </button>

        <button className="overview-card card" onClick={() => setPage('insights')}>
          <span className="overview-number">06 / FR06</span>
          <span className="overview-icon cyan">◎</span>
          <strong>{t('navigation.competitorInsights')}</strong>
          <p>Analyze competitor trends and industry marketing benchmark data.</p>
          <span className="card-link">{t('employeeDashboard.exploreInsights')}</span>
        </button>
      </div>

      <div className="overview-note card">
        <span>ⓘ</span>
        <div>
          <strong>{t('employeeDashboard.scopeNoticeTitle')}</strong>
          <p>{t('employeeDashboard.scopeNoticeDesc')}</p>
        </div>
        <button className="button subtle" onClick={() => setPage('strategy')}>
          {t('employeeDashboard.createNewStrategy')}
        </button>
      </div>
    </>
  )
}
