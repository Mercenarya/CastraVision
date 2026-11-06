import React, { useState } from 'react'
import './leader.css'

// ── Mock data for development preview ────────────────────────────────────
const DAYS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'Today']

const CHART_DATA = {
  '7 Days': {
    CPA: {
      facebook: [3.1, 3.2, 3.0, 3.4, 3.1, 3.2, 3.12],
      google:   [3.4, 3.2, 3.1, 2.9, 3.0, 2.95, 2.88],
      tiktok:   [4.2, 4.6, 4.8, 4.9, 4.7, 4.85, 4.80],
    },
    ROAS: {
      facebook: [3.6, 3.7, 3.5, 3.8, 3.7, 3.8, 3.8],
      google:   [4.8, 4.9, 5.0, 5.1, 5.0, 5.0, 4.9],
      tiktok:   [2.7, 2.6, 2.5, 2.4, 2.5, 2.6, 2.8],
    },
  },
  '14 Days': {
    CPA: {
      facebook: [3.3, 3.1, 3.2, 3.0, 3.4, 3.1, 3.12],
      google:   [3.1, 3.4, 3.2, 3.1, 2.9, 3.0, 2.88],
      tiktok:   [4.5, 4.2, 4.6, 4.8, 4.9, 4.85, 4.80],
    },
    ROAS: {
      facebook: [3.5, 3.6, 3.7, 3.5, 3.8, 3.7, 3.8],
      google:   [4.7, 4.8, 4.9, 5.0, 5.1, 5.0, 4.9],
      tiktok:   [2.9, 2.7, 2.6, 2.5, 2.4, 2.5, 2.8],
    },
  },
  '30 Days': {
    CPA: {
      facebook: [3.5, 3.3, 3.1, 3.2, 3.0, 3.4, 3.12],
      google:   [3.3, 3.1, 3.4, 3.2, 3.1, 2.9, 2.88],
      tiktok:   [4.0, 4.5, 4.2, 4.6, 4.8, 4.9, 4.80],
    },
    ROAS: {
      facebook: [3.4, 3.5, 3.6, 3.7, 3.5, 3.8, 3.8],
      google:   [4.6, 4.7, 4.8, 4.9, 5.0, 5.1, 4.9],
      tiktok:   [3.0, 2.9, 2.7, 2.6, 2.5, 2.4, 2.8],
    },
  },
}

const MOCK_REVIEWS = [
  {
    id: 'r1', title: 'AirStride Reels Hook Variant C', format: 'Format: 9:16 Vertical Video (34MB)',
    submitter: 'Elena Rostova', initials: 'ER', avatarBg: '#7c3aed',
    channel: 'Meta Video', channelCls: 'ldr-channel-meta',
    date: 'Today, 11:20',
  },
  {
    id: 'r2', title: 'Back-to-School Search Copy Brief', format: 'Format: Responsive Search Ad Assets',
    submitter: 'Alex Mercer', initials: 'AM', avatarBg: '#0e7490',
    channel: 'Google Search', channelCls: 'ldr-channel-google',
    date: 'Today, 09:45',
  },
  {
    id: 'r3', title: 'TikTok UGC Trend Script #4', format: 'Format: Audio Sync Storyboard',
    submitter: 'Maya Lin', initials: 'ML', avatarBg: '#be185d',
    channel: 'TikTok Feed', channelCls: 'ldr-channel-tiktok',
    date: 'Yesterday, 16:30',
  },
  {
    id: 'r4', title: 'Retargeting Dynamic Banner Set', format: 'Format: 5 Sizes (Static Display Kit)',
    submitter: 'Liam Patel', initials: 'LP', avatarBg: '#1d4ed8',
    channel: 'Meta Display', channelCls: 'ldr-channel-meta',
    date: 'Yesterday, 14:10',
  },
]

const MOCK_CAMPAIGNS = [
  {
    id: 'c1', name: 'AirStride Reels Hook Variant C', engine: 'Format: 9:16 Vertical Video (34MB)',
    status: 'In Review', statusCls: 'ldr-badge-review',
    pod: 'Elena Rostova', podInitials: 'ER', podBg: '#7c3aed',
    channel: 'Meta Video', channelCls: 'ldr-channel-meta',
    date: 'Today, 11:20',
  },
  {
    id: 'c2', name: 'Back-to-School Search Copy Brief', engine: 'Format: Responsive Search Ad Assets',
    status: 'Active', statusCls: 'ldr-badge-active',
    pod: 'Alex Mercer', podInitials: 'AM', podBg: '#0e7490',
    channel: 'Google Search', channelCls: 'ldr-channel-google',
    date: 'Today, 09:45',
  },
  {
    id: 'c3', name: 'TikTok UGC Trend Script #4', engine: 'Format: Audio Sync Storyboard',
    status: 'Pending', statusCls: 'ldr-badge-pending',
    pod: 'Maya Lin', podInitials: 'ML', podBg: '#be185d',
    channel: 'TikTok Feed', channelCls: 'ldr-channel-tiktok',
    date: 'Yesterday, 16:30',
  },
  {
    id: 'c4', name: 'Retargeting Dynamic Banner Set', engine: 'Format: 5 Sizes (Static Display Kit)',
    status: 'Active', statusCls: 'ldr-badge-active',
    pod: 'Liam Patel', podInitials: 'LP', podBg: '#1d4ed8',
    channel: 'Meta Display', channelCls: 'ldr-channel-meta',
    date: 'Yesterday, 14:10',
  },
]

const MEMBERS = [
  { initials: 'ER', name: 'Elena Rostova', role: 'Senior Media Buyer', bg: '#7c3aed', done: 8, active: 1, revision: false },
  { initials: 'AM', name: 'Alex Mercer', role: 'Search Intent Specialist', bg: '#0e7490', done: 11, active: 1, revision: false },
  { initials: 'ML', name: 'Maya Lin', role: 'Short-form Video Lead', bg: '#be185d', done: 7, active: 0, revision: true },
  { initials: 'LP', name: 'Liam Patel', role: 'Creative Visual Designer', bg: '#1d4ed8', done: 9, active: 1, revision: false },
]

// ── SVG Bar Chart ──────────────────────────────────────────────────────────
function CampaignPerformanceChart({ metric, range }) {
  const data = CHART_DATA[range]?.[metric] || CHART_DATA['7 Days'].CPA
  const allValues = [...data.facebook, ...data.google, ...data.tiktok]
  const maxVal = Math.max(...allValues) * 1.15
  const minVal = 0

  const W = 580, H = 180, PAD = { top: 10, right: 10, bottom: 28, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const n = DAYS.length
  const groupW = chartW / n
  const barW = Math.max(6, groupW / 4.5)

  function y(v) {
    return PAD.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH
  }

  const COLORS = { facebook: '#37c6ec', google: '#9ca8c4', tiktok: '#f87171' }
  const OFFSETS = [-barW - 1, 0, barW + 1]
  const KEYS = ['facebook', 'google', 'tiktok']

  // Y-axis gridlines
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal]

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      aria-label={`Campaign performance chart — ${metric} over ${range}`}
      role="img"
      style={{ display: 'block' }}
    >
      {/* Grid lines */}
      {yTicks.map((val, i) => {
        const yy = y(val)
        return (
          <g key={i}>
            <line x1={PAD.left} y1={yy} x2={W - PAD.right} y2={yy} stroke="#1a2640" strokeWidth="1" />
            <text x={PAD.left - 4} y={yy + 4} textAnchor="end" fontSize="9" fill="#4d5f7a">
              {val.toFixed(metric === 'ROAS' ? 1 : 2)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {DAYS.map((day, i) => {
        const cx = PAD.left + i * groupW + groupW / 2
        return KEYS.map((key, ki) => {
          const val = data[key][i]
          const bx = cx + OFFSETS[ki] - barW / 2
          const by = y(val)
          const bh = chartH - (by - PAD.top)
          const isToday = i === DAYS.length - 1
          return (
            <rect
              key={`${key}-${i}`}
              x={bx}
              y={by}
              width={barW}
              height={Math.max(2, bh)}
              fill={COLORS[key]}
              opacity={isToday ? 1 : 0.65}
              rx="2"
            />
          )
        })
      })}

      {/* X-axis labels */}
      {DAYS.map((day, i) => {
        const cx = PAD.left + i * groupW + groupW / 2
        const isToday = day === 'Today'
        return (
          <text key={day} x={cx} y={H - 4} textAnchor="middle" fontSize="10" fill={isToday ? '#c0c1ff' : '#4d5f7a'} fontWeight={isToday ? '700' : '400'}>
            {day}
          </text>
        )
      })}

      {/* Target ceiling line (for CPA) */}
      {metric === 'CPA' && (
        <line
          x1={PAD.left} y1={y(3.5)} x2={W - PAD.right} y2={y(3.5)}
          stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,3" opacity="0.6"
        />
      )}
    </svg>
  )
}

// ── KPI Cards ─────────────────────────────────────────────────────────────
function KpiCards() {
  return (
    <div className="ldr-kpis">
      {/* 1. Assigned Campaigns */}
      <div className="ldr-kpi-card">
        <div className="ldr-kpi-top">
          <span className="ldr-kpi-label">ASSIGNED CAMPAIGNS</span>
          <span className="ldr-kpi-badge ldr-kpi-badge-blue">+2 this cycle</span>
        </div>
        <div className="ldr-kpi-value-row">
          <span className="ldr-kpi-val">6</span>
          <span className="ldr-kpi-unit">Active</span>
        </div>
        <div className="ldr-kpi-sub">Across 3 marketing channels</div>
      </div>

      {/* 2. Tasks Completed */}
      <div className="ldr-kpi-card">
        <div className="ldr-kpi-top">
          <span className="ldr-kpi-label">TASKS COMPLETED</span>
          <span className="ldr-kpi-badge ldr-kpi-badge-slate">87.5%</span>
        </div>
        <div className="ldr-kpi-value-row">
          <span className="ldr-kpi-val">42</span>
          <span className="ldr-kpi-unit-slash">/ 48</span>
        </div>
        <div className="ldr-kpi-sub">Sprint deadline in 2 days</div>
        <div className="ldr-kpi-mini-bar"><span style={{ width: '87.5%' }} /></div>
      </div>

      {/* 3. Pending Content Reviews */}
      <div className="ldr-kpi-card">
        <div className="ldr-kpi-top">
          <span className="ldr-kpi-label">PENDING CONTENT REVIEWS</span>
          <span className="ldr-kpi-badge ldr-kpi-badge-amber">Action Req</span>
        </div>
        <div className="ldr-kpi-value-row">
          <span className="ldr-kpi-val">4</span>
          <span className="ldr-kpi-unit">Items</span>
        </div>
        <div className="ldr-kpi-sub">Avg review time: 1.8 hrs</div>
        <div className="ldr-kpi-note-amber">⚠ Highest wait: 2h 10m</div>
      </div>

      {/* 4. Campaign ROAS */}
      <div className="ldr-kpi-card">
        <div className="ldr-kpi-top">
          <span className="ldr-kpi-label">CAMPAIGN ROAS</span>
          <span className="ldr-kpi-badge ldr-kpi-badge-blue">+0.6× target</span>
        </div>
        <div className="ldr-kpi-value-row">
          <span className="ldr-kpi-val">4.15×</span>
        </div>
        <div className="ldr-kpi-sub">Google 4.9× • Meta 3.8×</div>
        <div className="ldr-kpi-mini-bar cyan"><span style={{ width: '82%' }} /></div>
      </div>

      {/* 5. Overdue Tasks */}
      <div className="ldr-kpi-card">
        <div className="ldr-kpi-top">
          <span className="ldr-kpi-label">OVERDUE TASKS</span>
          <span className="ldr-kpi-badge ldr-kpi-badge-red">Attention</span>
        </div>
        <div className="ldr-kpi-value-row">
          <span className="ldr-kpi-val">1</span>
          <span className="ldr-kpi-unit" style={{ color: '#f87171' }}>Overdue</span>
        </div>
        <div className="ldr-kpi-sub" style={{ color: '#f87171' }}>TikTok Creator Brief v2</div>
        <div className="ldr-kpi-note-red">⚠ Assigned to Maya Lin</div>
      </div>
    </div>
  )
}

// ── Campaign Performance Chart Section ────────────────────────────────────
function CampaignPerformanceSection() {
  const [metric, setMetric] = useState('CPA')
  const [range, setRange] = useState('7 Days')

  const ranges = ['7 Days', '14 Days', '30 Days']

  const facebookAvg = (CHART_DATA[range]?.[metric]?.facebook || []).reduce((a, b) => a + b, 0) / 7
  const tiktokLast = CHART_DATA[range]?.[metric]?.tiktok?.at(-1) || 0
  const googleLast = CHART_DATA[range]?.[metric]?.google?.at(-1) || 0

  return (
    <div className="ldr-panel">
      <div className="ldr-panel-header">
        <div className="ldr-panel-header-left">
          <h2 className="ldr-panel-title">Assigned Campaign Performance</h2>
          <p className="ldr-panel-subtitle">
            Comparative daily performance across Meta Ads, Google Search, and TikTok Video for Squad Alpha.
          </p>
        </div>
        <div className="ldr-panel-controls">
          <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, marginRight: 4 }}>Live</span>
          <select
            className="ldr-metric-select"
            value={metric}
            onChange={e => setMetric(e.target.value)}
            aria-label="Select metric"
          >
            <option value="CPA">Cost Per Acquisition (CPA)</option>
            <option value="ROAS">Return on Ad Spend (ROAS)</option>
          </select>
          {ranges.map(r => (
            <button
              key={r}
              className={`ldr-filter-btn${range === r ? ' active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="ldr-chart-area">
        <div className="ldr-chart-legend">
          <span className="ldr-legend-item">
            <span className="ldr-legend-dot" style={{ background: '#37c6ec' }} />
            Facebook Ads
          </span>
          <span className="ldr-legend-item">
            <span className="ldr-legend-dot" style={{ background: '#9ca8c4' }} />
            Google Search
          </span>
          <span className="ldr-legend-item">
            <span className="ldr-legend-dot" style={{ background: '#f87171' }} />
            TikTok Video
          </span>
        </div>
        <div className="ldr-chart-svg-wrap">
          <CampaignPerformanceChart metric={metric} range={range} />
        </div>
        <div className="ldr-chart-footer">
          <span className="ldr-chart-note">
            <span className="dot avg" />
            Facebook Ads: Stable Avg (${facebookAvg.toFixed(2)})
          </span>
          <span className="ldr-chart-note">
            <span className="dot spike" />
            Spike Anomaly: TikTok (${tiktokLast.toFixed(2)})
          </span>
          {metric === 'CPA' && (
            <span className="ldr-chart-note" style={{ color: '#4ade80' }}>
              <span className="dot" style={{ background: '#4ade80' }} />
              Lowest CPA: Google Search (${googleLast.toFixed(2)}) — Target Ceiling: ≤ $3.50
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Team Execution Panel ───────────────────────────────────────────────────
function TeamExecutionPanel() {
  const completed = 42, total = 48
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="ldr-team-panel">
      <div className="ldr-team-panel-header">
        <div>
          <div className="ldr-team-panel-title">
            👥 Team Execution Status
            <span className="ldr-team-panel-sprint">Sprint #22</span>
          </div>
          <div className="ldr-team-panel-sub">
            Current sprint progress for 6 assigned team specialists in Squad Alpha.
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="ldr-team-progress">
        <div className="ldr-team-progress-label">
          <span>Overall Deliverables Pace</span>
          <strong>{completed} / {total} ({pct}%)</strong>
        </div>
        <div className="ldr-team-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="ldr-team-stats">
        <div className="ldr-team-stat">
          <span>
            <span className="ldr-team-stat-dot" style={{ background: '#37c6ec' }} />
            <span className="ldr-team-stat-label">Completed</span>
          </span>
          <div className="ldr-team-stat-value">42 tasks</div>
          <div className="ldr-team-stat-sub">87.5%</div>
        </div>
        <div className="ldr-team-stat">
          <span>
            <span className="ldr-team-stat-dot" style={{ background: '#c0c1ff' }} />
            <span className="ldr-team-stat-label">In-Progress</span>
          </span>
          <div className="ldr-team-stat-value">5 tasks</div>
          <div className="ldr-team-stat-sub">10.4%</div>
        </div>
        <div className="ldr-team-stat">
          <span>
            <span className="ldr-team-stat-dot" style={{ background: '#f59e0b' }} />
            <span className="ldr-team-stat-label">Pending Review</span>
          </span>
          <div className="ldr-team-stat-value">4 deliverables</div>
        </div>
        <div className="ldr-team-stat">
          <span>
            <span className="ldr-team-stat-dot" style={{ background: '#ef4444' }} />
            <span className="ldr-team-stat-label">Overdue</span>
          </span>
          <div className="ldr-team-stat-value">1 deliverable</div>
        </div>
      </div>

      {/* Member Workload */}
      <div className="ldr-workload">
        <div className="ldr-workload-title">Member Workload Allocation</div>
        {MEMBERS.map(m => (
          <div key={m.name} className="ldr-member-row">
            <div className="ldr-member-avatar" style={{ background: m.bg }}>{m.initials}</div>
            <div className="ldr-member-info">
              <div className="ldr-member-name">{m.name}</div>
              <div className="ldr-member-role">{m.role}</div>
            </div>
            <div className="ldr-member-tasks">
              {m.done} done
              {m.revision
                ? <span className="revision"> / 1 revision</span>
                : m.active > 0 ? <span> / {m.active} active</span> : null
              }
            </div>
          </div>
        ))}
      </div>

      <button className="ldr-team-matrix-link" aria-label="View Squad Task Matrix">
        View Squad Task Matrix →
      </button>
    </div>
  )
}

// ── Pending Content Reviews ────────────────────────────────────────────────
function PendingContentReviewsSection({ _onOpenPage, notify }) {
  const [search, setSearch] = useState('')

  const filtered = MOCK_REVIEWS.filter(r => {
    const q = search.toLowerCase()
    return !q || r.title.toLowerCase().includes(q) || r.submitter.toLowerCase().includes(q)
  })

  function handleReview() {
    notify?.('Content review workflow is in preview mode. Connect to backend for live approvals.')
  }

  return (
    <div className="ldr-panel">
      <div className="ldr-panel-header">
        <div className="ldr-panel-header-left">
          <h2 className="ldr-panel-title">Pending Content Reviews</h2>
          <p className="ldr-panel-subtitle">
            Review and approve creative deliverables submitted by team members.
          </p>
        </div>
        <div className="ldr-search">
          <span style={{ color: '#4d5f7a', fontSize: 14 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search deliverables or submitters"
            aria-label="Search content reviews"
          />
        </div>
      </div>
      <div className="ldr-table-wrap">
        <table className="ldr-table">
          <thead>
            <tr>
              <th>Content Title</th>
              <th>Submitted By</th>
              <th>Channel</th>
              <th>Submission Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td className="content-title">
                  <strong>{r.title}</strong>
                  <small>{r.format}</small>
                </td>
                <td>
                  <div className="ldr-submitter">
                    <div className="ldr-submitter-avatar" style={{ background: r.avatarBg }}>
                      {r.initials}
                    </div>
                    {r.submitter}
                  </div>
                </td>
                <td>
                  <span className={`ldr-channel-badge ${r.channelCls}`}>{r.channel}</span>
                </td>
                <td style={{ whiteSpace: 'nowrap', color: '#9ca8c4' }}>{r.date}</td>
                <td>
                  <div className="ldr-review-actions">
                    <button className="ldr-review-action-btn" onClick={handleReview}>
                      Review
                    </button>
                    <button
                      className="ldr-review-action-btn approve"
                      onClick={handleReview}
                    >
                      Approve
                    </button>
                    <button
                      className="ldr-review-action-btn changes"
                      onClick={handleReview}
                    >
                      Changes
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Assigned Campaigns Overview ────────────────────────────────────────────
function AssignedCampaignsOverview() {
  return (
    <div className="ldr-panel">
      <div className="ldr-campaigns-header ldr-panel-header">
        <div className="ldr-panel-header-left">
          <h2 className="ldr-panel-title">Assigned Campaigns Overview</h2>
        </div>
        <span className="ldr-campaigns-squad">GROWTH SQUAD ALPHA</span>
      </div>
      <div className="ldr-table-wrap">
        <table className="ldr-table">
          <thead>
            <tr>
              <th>Campaign &amp; Engine</th>
              <th>Status</th>
              <th>Assigned Pod</th>
              <th>Live ROAS</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CAMPAIGNS.map(c => (
              <tr key={c.id}>
                <td className="content-title">
                  <strong>{c.name}</strong>
                  <small>{c.engine}</small>
                </td>
                <td><span className={`ldr-badge ${c.statusCls}`}>{c.status}</span></td>
                <td>
                  <div className="ldr-submitter">
                    <div className="ldr-submitter-avatar" style={{ background: c.podBg }}>
                      {c.podInitials}
                    </div>
                    {c.pod}
                  </div>
                </td>
                <td>
                  <span className={`ldr-channel-badge ${c.channelCls}`}>{c.channel}</span>
                </td>
                <td style={{ whiteSpace: 'nowrap', color: '#9ca8c4' }}>{c.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── AI Campaign Insights Panel ─────────────────────────────────────────────
function AICampaignInsightsPanel({ notify }) {
  const [dismissed, setDismissed] = useState(false)

  function handlePropose() {
    notify?.('Proposal requires Marketing Manager sign-off before dispatching to execution pool. Feature connected in next sprint.')
  }

  function handleDismiss() {
    setDismissed(true)
    notify?.('Insight dismissed for this session.')
  }

  if (dismissed) {
    return (
      <div className="ldr-insights-panel" style={{ padding: '20px 16px', textAlign: 'center' }}>
        <div style={{ color: '#4d5f7a', fontSize: 13 }}>No pending AI insights.</div>
        <button
          className="ldr-dismiss-btn"
          style={{ marginTop: 10, width: '100%' }}
          onClick={() => setDismissed(false)}
        >
          Restore Insight
        </button>
      </div>
    )
  }

  return (
    <div className="ldr-insights-panel">
      <div className="ldr-insights-header">
        <div className="ldr-insights-title">
          <span className="ldr-insights-title-icon">✦</span>
          AI Campaign Insights
        </div>
        <span className="ldr-copilot-badge">Copilot Model v4.2</span>
      </div>

      <div className="ldr-alert-box">
        <div className="ldr-alert-box-label">⚠ Advisory: Reallocation Detected</div>
        <p className="ldr-alert-box-text">
          TikTok CPA spiked to <strong>$4.80</strong> on Squad Alpha assets. Machine learning predicts
          higher blended yield by shifting budget immediately.
        </p>
        <p className="ldr-alert-box-text" style={{ marginTop: 6 }}>
          Recommending shifting <strong>$100.00/day</strong> from TikTok UGC to Google Search P-Max
          (operating at 5.1× ROAS). Expected blended CPA reduction: <strong style={{ color: '#4ade80' }}>-18.4%</strong>.
        </p>
      </div>

      <div className="ldr-budget-shift">
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.06em', color: '#4d5f7a', textTransform: 'uppercase' }}>TikTok Ads</div>
          <div className="ldr-budget-from">-$100.00/day</div>
        </div>
        <span className="ldr-budget-arrow">→</span>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.06em', color: '#4d5f7a', textTransform: 'uppercase' }}>Google Search Ads</div>
          <div className="ldr-budget-to">+$100.00/day</div>
        </div>
      </div>

      <div className="ldr-governance-note">
        <span className="ldr-governance-note-icon">🔒</span>
        <span className="ldr-governance-note-text">
          Human-in-the-loop Governance: Requires Leader sign-off before dispatching to Marketing Manager execution pool.
        </span>
      </div>

      <div className="ldr-insights-actions">
        <button className="ldr-propose-btn" onClick={handlePropose} aria-label="Propose to Marketing Manager">
          ▶ Propose to Marketing Manager
        </button>
        <button className="ldr-dismiss-btn" onClick={handleDismiss} aria-label="Dismiss Insight">
          Dismiss Insight
        </button>
      </div>
    </div>
  )
}

// ── Squad Copilot Quota Bar ────────────────────────────────────────────────
function SquadCopilotBar() {
  const used = 62300, total = 100000
  const pct = (used / total * 100).toFixed(1)

  return (
    <div className="ldr-quota-bar">
      <span className="ldr-quota-icon">⚙</span>
      <div className="ldr-quota-body">
        <div className="ldr-quota-title">
          Squad Copilot Quota Active
          <span className="ldr-quota-active-badge">{pct}% Consumed</span>
        </div>
        <div className="ldr-quota-sub">
          Squad Alpha Compute Engine: {used.toLocaleString()} / {total.toLocaleString()} Ops logged across real-time bid adjustments and copy synthesis.
        </div>
        <div className="ldr-quota-track-wrap">
          <div className="ldr-quota-track">
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="ldr-quota-numbers">
            {(used / 1000).toFixed(0)}K tkn &nbsp;|&nbsp; {(total / 1000).toFixed(0)},000 tkn
          </span>
        </div>
      </div>
      <button className="ldr-quota-adjust" aria-label="Adjust compute limit">
        Adjust Limit
      </button>
    </div>
  )
}

// ── Main Export ────────────────────────────────────────────────────────────
export function LeaderDashboardView({ _importCount, _onOpenBudget, onRefresh, onOpenPage, notify }) {
  return (
    <div className="ldr-page">
      {/* Breadcrumb */}
      <div className="ldr-breadcrumb">
        <span className="ldr-live-dot" />
        REAL-TIME TELEMETRY SYNCED
        <span>/</span>
        Growth Squad Alpha
        <span>•</span>
        Synchronized 2 mins ago
      </div>

      {/* Page Header */}
      <div className="ldr-page-header">
        <div className="ldr-page-header-left">
          <h1>Campaign &amp; Team Performance Overview</h1>
          <p>
            Monitor assigned campaigns, coordinate your team, and review marketing deliverables. &bull;{' '}
            Growth Squad Alpha &bull; Synchronized 2 mins ago
          </p>
        </div>
        <div className="ldr-page-header-actions">
          <button
            className="ldr-btn ldr-btn-outline"
            onClick={() => onRefresh?.()}
            aria-label="Sync Squad Data"
          >
            ↺ Sync Squad Data
          </button>
          <button
            className="ldr-btn ldr-btn-primary"
            onClick={() => onOpenPage?.('content-reviews')}
            aria-label="Review Pending Content"
          >
            ✓ Review Pending Content (4)
          </button>
        </div>
      </div>

      {/* Squad Copilot Quota */}
      <SquadCopilotBar />

      {/* KPI Cards */}
      <KpiCards />

      {/* Main Two-Column Layout */}
      <div className="ldr-main-cols">
        {/* Left Column */}
        <div className="ldr-left-col">
          <CampaignPerformanceSection />
          <PendingContentReviewsSection onOpenPage={onOpenPage} notify={notify} />
          <AssignedCampaignsOverview />
        </div>

        {/* Right Column */}
        <div className="ldr-right-col">
          <TeamExecutionPanel />
          <AICampaignInsightsPanel notify={notify} />
        </div>
      </div>
    </div>
  )
}
