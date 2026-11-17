import './member.css'

// ── Mock data for development preview ──────────────────────────────────────
const MOCK_TASKS = [
  {
    id: 't1', priority: 'HIGH', status: 'Revision Required',
    due: 'Today, 15:00', dueClass: 'overdue',
    title: 'Revise TikTok Hook Copy for Gen Z UGC #3',
    campaign: 'Summer Streetwear Launch 2025', leader: 'Marcus Vance',
    campaignIcon: '🎵', action: 'Edit & Resubmit', actionType: 'edit',
  },
  {
    id: 't2', priority: 'MEDIUM', status: 'In Progress',
    due: 'Today, 18:00', dueClass: '',
    title: 'Draft 3 Variations of Instagram Reels Ad Captions',
    campaign: 'Summer Streetwear Launch 2025', leader: 'Meta Placement Specs',
    campaignIcon: '📣', action: 'Continue in Studio', actionType: 'continue',
  },
  {
    id: 't3', priority: 'MEDIUM', status: 'To Do',
    due: 'Tomorrow, 12:00', dueClass: '',
    title: 'Generate Headline A/B Options for Google Search Ad',
    campaign: "Men's Athletic Shoes P-Max", leader: 'Max 30 characters each',
    campaignIcon: '🔍', action: 'Start Task', actionType: 'default',
  },
  {
    id: 't4', priority: 'LOW', status: 'To Do',
    due: 'Oct 26', dueClass: '',
    title: 'Submit Final Hashtag Cluster & Creator Guidelines',
    campaign: 'Summer Streetwear Launch 2025', leader: 'Micro-influencer kit',
    campaignIcon: '#', action: 'Start Task', actionType: 'default',
  },
  {
    id: 't5', priority: 'LOW', status: 'In Progress',
    due: 'Oct 27', dueClass: '',
    title: 'Review Audience Persona Brief: Gen Z Urban Runners',
    campaign: 'Q4 Winter Activewear', leader: 'Audience Intel Hub',
    campaignIcon: '👥', action: 'Open Brief', actionType: 'default',
  },
]

const MOCK_SUBMISSIONS = [
  {
    id: 's1', deliverable: 'TikTok Video Hook Script v1.2', campaign: 'Summer Streetwear',
    submitted: 'Oct 24, 09:30', status: 'Changes Requested', statusType: 'changes',
    reviewer: 'Marcus Vance', feedback: '"Tone down urgency in Hook B"',
    action: 'Edit & Resubmit', actionType: 'danger',
  },
  {
    id: 's2', deliverable: 'Instagram Carousel Ad Copy v1.0', campaign: 'Summer Streetwear',
    submitted: 'Oct 23, 14:15', status: 'Pending Review', statusType: 'pending',
    reviewer: 'Marcus Vance (Leader)', feedback: '',
    action: 'View Submission', actionType: 'default',
  },
  {
    id: 's3', deliverable: 'Google Search Headlines v2.0', campaign: "Men's Athletic Shoes",
    submitted: 'Oct 22, 11:00', status: 'Approved', statusType: 'approved',
    reviewer: 'Marcus Vance (Leader)', feedback: '',
    action: 'View Submission', actionType: 'default',
  },
  {
    id: 's4', deliverable: 'Email Teaser: Early Drop', campaign: 'Summer Streetwear',
    submitted: 'Oct 21, 16:45', status: 'Approved', statusType: 'approved',
    reviewer: 'Marcus Vance (Leader)', feedback: '',
    action: 'View Submission', actionType: 'default',
  },
]

const MOCK_CAMPAIGNS = [
  {
    id: 'c1', name: 'Summer Streetwear Launch 2025', statusLabel: 'Active Flight',
    channels: 'Meta & TikTok Ads', objective: 'Brand Conversions',
    tasksCompleted: 2, tasksTotal: 4, icon: '📲',
  },
  {
    id: 'c2', name: "Men's Athletic Shoes P-Max", statusLabel: 'Active Flight',
    channels: 'Google Search & P-Max', objective: 'High-Intent Sales',
    tasksCompleted: 1, tasksTotal: 2, icon: '🎯',
  },
]

// ── Status / priority badge helpers ───────────────────────────────────────
function PriorityBadge({ level }) {
  const cls = level === 'HIGH' ? 'emp-badge emp-badge-high'
    : level === 'MEDIUM' ? 'emp-badge emp-badge-medium'
    : 'emp-badge emp-badge-low'
  return <span className={cls}>{level}</span>
}

function StatusBadge({ status }) {
  const map = {
    'Revision Required': 'emp-badge emp-badge-revision',
    'In Progress': 'emp-badge emp-badge-in-progress',
    'To Do': 'emp-badge emp-badge-todo',
    'Submitted': 'emp-badge emp-badge-submitted',
    'Completed': 'emp-badge emp-badge-approved',
    'Approved': 'emp-badge emp-badge-approved',
    'Pending Review': 'emp-badge emp-badge-pending',
    'Changes Requested': 'emp-badge emp-badge-changes',
  }
  return <span className={map[status] || 'emp-badge emp-badge-todo'}>{status}</span>
}

// ── Priority Tasks Section ─────────────────────────────────────────────────
function PriorityTasksSection({ onOpenPage }) {
  const [activeFilter, setActiveFilter] = React.useState('All')
  const [search, setSearch] = React.useState('')

  const FILTERS = [
    { label: 'All', key: 'All', count: MOCK_TASKS.length },
    { label: 'To Do', key: 'To Do', count: MOCK_TASKS.filter(t => t.status === 'To Do').length },
    { label: 'In Progress', key: 'In Progress', count: MOCK_TASKS.filter(t => t.status === 'In Progress').length },
    { label: 'Revision Req', key: 'Revision Required', count: MOCK_TASKS.filter(t => t.status === 'Revision Required').length },
  ]

  const filtered = MOCK_TASKS.filter(task => {
    const matchFilter = activeFilter === 'All' || task.status === activeFilter
    const q = search.toLowerCase()
    const matchSearch = !q || task.title.toLowerCase().includes(q)
      || task.campaign.toLowerCase().includes(q)
      || task.due.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  function handleAction(task) {
    if (task.actionType === 'continue' || task.actionType === 'default') {
      onOpenPage?.('content')
    }
  }

  return (
    <div className="emp-panel">
      <div className="emp-panel-header">
        <div className="emp-panel-header-left">
          <h2 className="emp-panel-title">My Priority Tasks</h2>
          <span className="emp-panel-badge emp-panel-badge-blue">{MOCK_TASKS.length} Active</span>
        </div>
        <div className="emp-filter-tabs">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`emp-filter-tab${activeFilter === f.key ? ' active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>
      <div className="emp-task-toolbar">
        <div className="emp-search">
          <span className="emp-search-icon">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search task by title, campaign, or due date..."
            aria-label="Search tasks"
          />
        </div>
      </div>
      <div className="emp-task-list">
        {filtered.length === 0 && (
          <div className="emp-empty-tasks">No tasks match your current filter.</div>
        )}
        {filtered.map(task => (
          <div key={task.id} className="emp-task-row">
            <div className="emp-task-left">
              <div className="emp-task-meta">
                <div className="emp-task-badges">
                  <PriorityBadge level={task.priority} />
                  <StatusBadge status={task.status} />
                  <span className={`emp-task-due${task.dueClass ? ' ' + task.dueClass : ''}`}>
                    Due: {task.due}
                  </span>
                </div>
                <div className="emp-task-title">{task.title}</div>
                <div className="emp-task-campaign">
                  <span className="emp-task-campaign-icon">{task.campaignIcon}</span>
                  {task.campaign}
                  {task.leader && <span style={{ color: '#4d5f7a' }}> • {task.leader}</span>}
                </div>
              </div>
            </div>
            <div className="emp-task-action">
              <button
                className={`emp-task-action-btn${task.actionType === 'edit' ? ' edit' : task.actionType === 'continue' ? ' continue' : ''}`}
                onClick={() => handleAction(task)}
                aria-label={`${task.action}: ${task.title}`}
              >
                {task.actionType === 'edit' ? '✎' : task.actionType === 'continue' ? '⟳' : '▶'} {task.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AI Content Studio Panel ────────────────────────────────────────────────
function AIContentStudioPanel({ onOpenPage }) {
  const options = [
    {
      icon: '◫',
      label: 'Social Media Post',
      desc: 'Generate Instagram & TikTok captions with tested hashtags.',
    },
    {
      icon: '▤',
      label: 'Ad Copy Generator',
      desc: 'Produce punchy headlines and primary text variants for P-Max.',
    },
    {
      icon: '◈',
      label: 'Campaign Caption & Hook',
      desc: 'Ideate 5 opening 3-second hooks for short-form video UGC.',
    },
  ]

  return (
    <div className="emp-ai-panel">
      <div className="emp-ai-panel-header">
        <div className="emp-ai-panel-title">
          <span className="emp-ai-panel-title-icon">✦</span>
          AI Content Studio
        </div>
        <span className="emp-ai-fastpath">Member Fast-Path</span>
      </div>
      <p className="emp-ai-panel-desc">
        Create marketing content aligned with your assigned campaign strategy.
      </p>
      <div className="emp-ai-options-list">
        {options.map(opt => (
          <button
            key={opt.label}
            className="emp-ai-option"
            onClick={() => onOpenPage?.('content')}
            aria-label={`Open ${opt.label}`}
          >
            <div className="emp-ai-option-left">
              <span className="emp-ai-option-icon">{opt.icon}</span>
              <div className="emp-ai-option-text">
                <strong>{opt.label}</strong>
                <span>{opt.desc}</span>
              </div>
            </div>
            <span className="emp-ai-option-arrow">→</span>
          </button>
        ))}
      </div>
      <div className="emp-ai-cta">
        <button
          onClick={() => onOpenPage?.('content')}
        >
          <span>✦</span> + Open Content Studio
        </button>
      </div>
    </div>
  )
}

// ── AI Work Assistant Panel ────────────────────────────────────────────────
function AIWorkAssistantPanel({ notify }) {
  function handleAudit() {
    // Brand Safety Audit — no live backend endpoint, honest unavailable state
    notify?.('Brand Safety Audit is not yet connected to a backend service.')
  }

  return (
    <div className="emp-assist-panel">
      <div className="emp-assist-header">
        <span className="emp-assist-icon">🤖</span>
        <div>
          <div className="emp-assist-title">AI Work Assistant</div>
          <div className="emp-assist-subtitle">Real-time contextual tips</div>
        </div>
      </div>
      <div className="emp-assist-tip">
        <div className="emp-assist-tip-label">
          ✓ TONE GUIDELINE CHECK
        </div>
        <p className="emp-assist-tip-text">
          The Summer 2025 voice emphasizes effortless street confidence without overt discount jargon.
          Consider replacing <strong>&ldquo;Buy Now 50% Off&rdquo;</strong> with{' '}
          <em>&ldquo;Explore the Drop&rdquo;</em>.
        </p>
      </div>
      <div className="emp-assist-tip">
        <div className="emp-assist-tip-label emp-assist-tip-label-warn">
          ↗ PRE-SUBMISSION CHECKLIST
        </div>
        <p className="emp-assist-tip-text">
          Remember to verify character counts (Headlines &lt;90 chars, Descriptions &lt;280 chars)
          before submitting to Leader Marcus Vance.
        </p>
      </div>
      <div className="emp-assist-audit">
        <button onClick={handleAudit} aria-label="Run Quick Brand Safety Audit">
          🛡 Run Quick Brand Safety Audit
        </button>
      </div>
    </div>
  )
}

// ── Sprint Progress Panel ──────────────────────────────────────────────────
function SprintProgressPanel() {
  const completed = 14
  const total = 16
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="emp-sprint-panel">
      <div className="emp-sprint-header">
        <span className="emp-sprint-label">Current Sprint Velocity</span>
        <span className="emp-sprint-squad">Squad Alpha #42</span>
      </div>
      <p className="emp-sprint-target">
        Personal Target: <strong>{total} tasks</strong>
      </p>
      <div style={{ position: 'relative' }}>
        <div className="emp-sprint-progress">
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="emp-sprint-pct">{pct}%</span>
      </div>
      <p className="emp-sprint-note">
        {completed} / {total} ({pct}%) · Pacing 1.4 days ahead of scheduled review milestone. Keep it up!
      </p>
    </div>
  )
}

// ── Submissions Table ──────────────────────────────────────────────────────
function RecentSubmissionsSection({ onOpenPage }) {
  return (
    <div className="emp-panel">
      <div className="emp-panel-header">
        <div className="emp-panel-header-left">
          <h2 className="emp-panel-title">My Recent Submissions</h2>
        </div>
        <button className="emp-panel-link" onClick={() => onOpenPage?.('reports')}>
          View All Submissions →
        </button>
      </div>
      <p style={{ padding: '8px 20px 4px', fontSize: 12, color: '#7a89a8', margin: 0 }}>
        Track review status and leader feedback on your creative deliverables.
      </p>
      <div className="emp-table-wrap">
        <table className="emp-table">
          <thead>
            <tr>
              <th>Deliverable</th>
              <th>Campaign</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Reviewer / Feedback</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SUBMISSIONS.map(sub => (
              <tr key={sub.id}>
                <td className="deliverable">
                  <strong>{sub.deliverable}</strong>
                </td>
                <td>{sub.campaign}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{sub.submitted}</td>
                <td><StatusBadge status={sub.status} /></td>
                <td>
                  <div style={{ fontSize: 12, color: '#9ca8c4' }}>{sub.reviewer}</div>
                  {sub.feedback && (
                    <div style={{ fontSize: 11, color: '#7a89a8', fontStyle: 'italic', marginTop: 2 }}>
                      {sub.feedback}
                    </div>
                  )}
                </td>
                <td>
                  <button
                    className={`emp-sub-action-btn${sub.actionType === 'danger' ? ' danger' : ''}`}
                    aria-label={`${sub.action} for ${sub.deliverable}`}
                    onClick={() => onOpenPage?.('reports')}
                  >
                    {sub.action}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Assigned Campaigns Section ─────────────────────────────────────────────
function AssignedCampaignsSection() {
  return (
    <div className="emp-campaigns-section">
      <div className="emp-campaigns-header">
        <h2 className="emp-campaigns-title">My Assigned Campaigns</h2>
        <span className="emp-campaigns-sub">2 active flights</span>
      </div>
      <div className="emp-campaign-cards">
        {MOCK_CAMPAIGNS.map(camp => {
          const pct = Math.round((camp.tasksCompleted / camp.tasksTotal) * 100)
          return (
            <div key={camp.id} className="emp-campaign-card">
              <div className="emp-campaign-card-top">
                <span className="emp-campaign-badge emp-campaign-badge-active">
                  ● {camp.statusLabel}
                </span>
                <span className="emp-campaign-icon">{camp.icon}</span>
              </div>
              <div className="emp-campaign-name">{camp.name}</div>
              <div className="emp-campaign-meta-row">
                <div>
                  <div className="emp-campaign-meta-label">Channels</div>
                  <div className="emp-campaign-meta-value">{camp.channels}</div>
                </div>
                <div>
                  <div className="emp-campaign-meta-label">Objective</div>
                  <div className="emp-campaign-meta-value">{camp.objective}</div>
                </div>
              </div>
              <div className="emp-campaign-progress-label">
                <span>My Assigned Tasks</span>
                <strong>{camp.tasksCompleted} / {camp.tasksTotal} Completed</strong>
              </div>
              <div className="emp-campaign-bar">
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── KPI Cards ─────────────────────────────────────────────────────────────
function KpiCards() {
  return (
    <div className="emp-kpis">
      {/* 1. My Assigned Tasks */}
      <div className="emp-kpi-card">
        <div className="emp-kpi-top">
          <span className="emp-kpi-label">MY ASSIGNED TASKS</span>
          <span className="emp-kpi-badge emp-kpi-badge-blue">3 Due Today</span>
        </div>
        <div className="emp-kpi-value-row">
          <span className="emp-kpi-val">8</span>
          <span className="emp-kpi-unit">Total</span>
        </div>
        <div className="emp-kpi-progress-wrap">
          <div className="emp-kpi-progress">
            <span style={{ width: '62%' }} />
          </div>
          <div className="emp-kpi-sub-row">
            <span>5 active in sprint</span>
            <span className="emp-kpi-pct-txt">62%</span>
          </div>
        </div>
      </div>

      {/* 2. Tasks Completed */}
      <div className="emp-kpi-card">
        <div className="emp-kpi-top">
          <span className="emp-kpi-label">TASKS COMPLETED</span>
          <span className="emp-kpi-badge emp-kpi-badge-green">+4 this week</span>
        </div>
        <div className="emp-kpi-value-row">
          <span className="emp-kpi-val">14</span>
          <span className="emp-kpi-unit">Done</span>
        </div>
        <div className="emp-kpi-sub">93% on-time pace</div>
        <div className="emp-kpi-sub-green">Sprint pace ✓</div>
      </div>

      {/* 3. Pending Submissions */}
      <div className="emp-kpi-card">
        <div className="emp-kpi-top">
          <span className="emp-kpi-label">PENDING SUBMISSIONS</span>
          <span className="emp-kpi-badge emp-kpi-badge-slate">In Review</span>
        </div>
        <div className="emp-kpi-value-row">
          <span className="emp-kpi-val">2</span>
          <span className="emp-kpi-unit">Items</span>
        </div>
        <div className="emp-kpi-sub" style={{ marginTop: 8 }}>Awaiting Marcus Vance review</div>
      </div>

      {/* 4. Revisions Req. */}
      <div className="emp-kpi-card">
        <div className="emp-kpi-top">
          <span className="emp-kpi-label">REVISIONS REQ.</span>
          <span className="emp-kpi-badge emp-kpi-badge-red">Action Req</span>
        </div>
        <div className="emp-kpi-value-row">
          <span className="emp-kpi-val">1</span>
          <span className="emp-kpi-unit">Item</span>
        </div>
        <div className="emp-kpi-mini-bar red"><span style={{ width: '40%' }} /></div>
        <div className="emp-kpi-sub-red">TikTok Hook Variant B</div>
      </div>

      {/* 5. Sprint Deadline */}
      <div className="emp-kpi-card">
        <div className="emp-kpi-top">
          <span className="emp-kpi-label">SPRINT DEADLINE</span>
          <span className="emp-kpi-badge emp-kpi-badge-violet">Sprint End</span>
        </div>
        <div className="emp-kpi-value-row">
          <span className="emp-kpi-val">2</span>
          <span className="emp-kpi-unit">Days left</span>
        </div>
        <div className="emp-kpi-mini-bar violet"><span style={{ width: '80%' }} /></div>
        <div className="emp-kpi-sub" style={{ marginTop: 4 }}>Friday, Oct 26, 17:00 UTC</div>
      </div>
    </div>
  )
}

// ── Main Export ────────────────────────────────────────────────────────────
import React from 'react'

export function MemberDashboardView({ profile, _imports, _strategy, onOpenPage, notify }) {
  // profile used for potential future dynamic name binding
  void profile

  return (
    <div className="emp-page">
      {/* Breadcrumb */}
      <div className="emp-breadcrumb">
        <span className="emp-dot" />
        WORKSPACE ACTIVE
        <span>/</span>
        Assigned to Growth Squad Alpha
      </div>

      {/* Page Header */}
      <div className="emp-page-header">
        <div className="emp-page-header-left">
          <h1>Welcome back, Alex!</h1>
          <p>
            Here&apos;s what needs your attention today. &bull; Assigned to Growth Squad Alpha &bull;{' '}
            <strong style={{ color: '#dde3f8' }}>Synchronized 2 mins ago</strong>
          </p>
        </div>
        <div className="emp-page-header-actions">
          <button
            className="emp-btn emp-btn-outline"
            onClick={() => onOpenPage?.('emp-tasks')}
            aria-label="View My Tasks"
          >
            ≡ View My Tasks (5)
          </button>
          <button
            className="emp-btn emp-btn-primary"
            onClick={() => onOpenPage?.('content')}
            aria-label="Create Content"
          >
            + Create Content
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards />

      {/* Main Two-Column Layout */}
      <div className="emp-main-cols">
        {/* Left Column */}
        <div className="emp-left-col">
          <PriorityTasksSection onOpenPage={onOpenPage} />
          <RecentSubmissionsSection onOpenPage={onOpenPage} />
          <AssignedCampaignsSection />
        </div>

        {/* Right Column */}
        <div className="emp-right-col">
          <AIContentStudioPanel onOpenPage={onOpenPage} />
          <AIWorkAssistantPanel notify={notify} />
          <SprintProgressPanel />
        </div>
      </div>
    </div>
  )
}
