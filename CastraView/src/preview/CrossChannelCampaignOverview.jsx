/**
 * CrossChannelCampaignOverview.jsx
 * Marketing Manager — Cross-Channel Campaign Performance Overview
 * Full standalone dashboard screen matching the reference design:
 * sidebar nav, KPI cards with sparklines, grouped bar chart,
 * AI budget allocation panel, and channel performance table.
 */

import { useState } from 'react'
import './CrossChannelOverview.css'

// ─── Mock Data ──────────────────────────────────────────────────────
const CHANNELS = [
  {
    id: 'fb',
    name: 'Facebook Ads',
    icon: '📘',
    cls: 'cco-ch-fb',
    model: 'DDA · Advantage+',
    campaign: 'Summer Peak — Retargeting',
    objective: 'Purchase Conversion · Lookalike 2%',
    statusKey: 'stable',
    statusLabel: 'Stable',
    spend: '$18,420',
    clicks: '94,302 clicks',
    cpa: '$14.20',
    roas: '4.8×',
  },
  {
    id: 'gg',
    name: 'Google Ads',
    icon: '🔍',
    cls: 'cco-ch-gg',
    model: 'tROAS · PMax',
    campaign: 'Brand Search + Shopping',
    objective: 'Revenue · Smart Bidding',
    statusKey: 'superior',
    statusLabel: 'Superior ROAS',
    spend: '$22,100',
    clicks: '118,540 clicks',
    cpa: '$11.80',
    roas: '6.2×',
  },
  {
    id: 'tt',
    name: 'TikTok Ads',
    icon: '🎵',
    cls: 'cco-ch-tt',
    model: 'oCPM · Spark Ads',
    campaign: 'Creator-Led Awareness',
    objective: 'Top-Funnel Reach · CPM',
    statusKey: 'optimal',
    statusLabel: 'AI Optimal',
    spend: '$9,480',
    clicks: '210,660 views',
    cpa: '$22.40',
    roas: '2.9×',
  },
]

// Weekly data for grouped bar chart: [FB, GG, TT]
const BAR_DATA = [
  { day: 'Mon', fb: 58, gg: 72, tt: 41 },
  { day: 'Tue', fb: 62, gg: 78, tt: 38 },
  { day: 'Wed', fb: 91, gg: 85, tt: 55 },
  { day: 'Thu', fb: 74, gg: 95, tt: 48 },
  { day: 'Fri', fb: 88, gg: 102, tt: 60 },
  { day: 'Sat', fb: 110, gg: 118, tt: 72 },
  { day: 'Sun', fb: 96, gg: 108, tt: 64 },
]

// Sparkline data for KPI cards (7 pts normalised 0–1)
const SPARKLINES = {
  spend: [.55, .60, .65, .70, .62, .80, .90],
  roas: [.70, .72, .69, .74, .78, .82, .85],
  cpa: [.80, .75, .72, .78, .65, .62, .58],
  reach: [.40, .50, .55, .60, .65, .62, .70],
  conv: [.58, .62, .68, .65, .72, .78, .80],
}

const STATUS_CLASS = {
  stable: 'cco-status-stable',
  superior: 'cco-status-superior',
  optimal: 'cco-status-optimal',
}

// ─── Sparkline SVG ──────────────────────────────────────────────────
function Sparkline({ data, color }) {
  const W = 120, H = 30, pad = 4
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (W - pad * 2))
  const ys = data.map((v) => H - pad - v * (H - pad * 2))
  const pts = xs.map((x, i) => `${x},${ys[i]}`).join(' ')
  const areaBottom = `${xs[xs.length - 1]},${H} ${xs[0]},${H}`
  const area = `M ${pts.replace(/ /g, ' L ')} L ${areaBottom} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="cco-kpi-sparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
    </svg>
  )
}

// ─── Grouped Bar Chart SVG ──────────────────────────────────────────
function GroupedBarChart() {
  const W = 560, H = 180
  const ML = 36, MR = 10, MT = 12, MB = 28
  const chartW = W - ML - MR
  const chartH = H - MT - MB
  const maxVal = 130
  const groupW = chartW / BAR_DATA.length
  const barW = groupW * 0.22
  const offsets = [-barW - 2, 0, barW + 2]
  const colors = ['#22d3ee', '#3b82f6', '#f43f5e']
  const gridLines = [0, 25, 50, 75, 100, 125]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="cco-chart-svg-wrap" style={{ display: 'block' }}>
      {/* Grid lines */}
      {gridLines.map((v) => {
        const y = MT + chartH - (v / maxVal) * chartH
        return (
          <g key={v}>
            <line x1={ML} y1={y} x2={W - MR} y2={y} stroke="rgba(255,255,255,.05)" strokeWidth="1" />
            <text x={ML - 4} y={y + 4} fill="#475569" fontSize="9" textAnchor="end">{v}</text>
          </g>
        )
      })}

      {/* Bars */}
      {BAR_DATA.map((d, gi) => {
        const cx = ML + gi * groupW + groupW / 2
        const vals = [d.fb, d.gg, d.tt]
        return (
          <g key={d.day}>
            {vals.map((v, bi) => {
              const bH = (v / maxVal) * chartH
              const x = cx + offsets[bi] - barW / 2
              const y = MT + chartH - bH
              return (
                <g key={bi}>
                  <rect
                    x={x} y={y}
                    width={barW} height={bH}
                    rx="3"
                    fill={colors[bi]}
                    opacity="0.85"
                  />
                  <rect
                    x={x} y={y}
                    width={barW} height={Math.min(3, bH)}
                    rx="3"
                    fill={colors[bi]}
                    opacity="1"
                  />
                </g>
              )
            })}
            {/* Day label */}
            <text
              x={cx} y={H - MB + 16}
              fill="#475569" fontSize="9.5" textAnchor="middle"
            >{d.day}</text>
          </g>
        )
      })}

      {/* Target line */}
      {(() => {
        const y = MT + chartH - (90 / maxVal) * chartH
        return (
          <>
            <line
              x1={ML} y1={y} x2={W - MR} y2={y}
              stroke="#64748b" strokeWidth="1.2"
              strokeDasharray="5,4"
            />
            <text x={W - MR - 2} y={y - 3} fill="#64748b" fontSize="8.5" textAnchor="end">
              Target
            </text>
          </>
        )
      })()}
    </svg>
  )
}

// ─── Main Component ──────────────────────────────────────────────────
export default function CrossChannelCampaignOverview({ onNavigate, notify }) {
  const [activePeriod, setActivePeriod] = useState('7D')
  const [aiApproved, setAiApproved] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleNav = (key) => {
    if (onNavigate) onNavigate(key)
  }

  return (
    <div className="cco-root cco-integrated">
      {/* ── CAMPAIGN BUNDLE STRIP ── */}
      <div className="cco-bundle-strip">
        <div className="cco-bundle-strip-left">
          <div className="cco-live-dot" />
          <div className="cco-bundle-strip-meta">
            <span className="cco-bundle-label">ACTIVE CAMPAIGN BUNDLE</span>
            <span className="cco-bundle-name">Q4 2026 Omnichannel Growth — Acme Corp</span>
          </div>
          <div className="cco-bundle-tags">
            <span className="cco-topbar-tag">META</span>
            <span className="cco-topbar-tag">GOOGLE</span>
            <span className="cco-topbar-tag">TIKTOK</span>
            <span className="cco-topbar-tag">AI-MANAGED</span>
          </div>
        </div>
        <div className="cco-bundle-strip-right">
          <div className="cco-token-widget">
            <span className="cco-token-label">AI Tokens</span>
            <span className="cco-token-count">72,400 / 100k</span>
            <div className="cco-token-track">
              <div className="cco-token-fill" style={{ width: '72%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="cco-main">
        {/* Page Header */}
        <div className="cco-page-header">
          <div className="cco-page-title-group">
            <span className="cco-sync-badge">
              LIVE SYNC
              <span className="cco-sync-time"> · Updated 2 min ago</span>
            </span>
            <h1 className="cco-page-title">Cross-Channel Campaign Performance Overview</h1>
            <p className="cco-page-desc">
              Real-time telemetry across Meta, Google Ads, and TikTok — AI-managed budget allocation,
              ROAS optimisation, and audience intelligence.
            </p>
          </div>
          <div className="cco-page-actions">
            <button
              type="button"
              className="cco-btn-sync"
              onClick={() => notify?.('Syncing live data from Meta, Google Ads, and TikTok...', 'info')}
            >
              🔄 Sync Now
            </button>
            <button
              type="button"
              className="cco-btn-export"
              onClick={() => notify?.('Exporting omnichannel report to CSV/PDF...', 'info')}
            >
              ⬇ Export Report
            </button>
            <button
              type="button"
              className="cco-btn-strategy"
              onClick={() => handleNav('insights')}
            >
              🤖 AI Strategy
            </button>
          </div>
        </div>

        {/* Token Quota Banner */}
        <div className="cco-token-banner" role="alert">
          <span className="cco-token-banner-icon">⚡</span>
          <div className="cco-token-banner-text">
            <div className="cco-token-banner-title">
              AI Token Quota Alert
              <span className="cco-alert-badge">72% Used</span>
            </div>
            <div className="cco-token-banner-sub">
              72,400 of 100,000 tokens consumed · Resets Nov 1, 2026 · Estimated 9 days remaining
            </div>
          </div>
          <div className="cco-token-banner-track">
            <span className="cco-token-banner-nums">72,400 / 100k</span>
            <div className="cco-token-banner-bar">
              <div className="cco-token-banner-bar-fill" style={{ width: '72%' }} />
            </div>
          </div>
          <button
            type="button"
            className="cco-btn-upgrade"
            onClick={() => notify?.('Plan upgrade dialog opened.', 'info')}
          >
            ↑ Upgrade Plan
          </button>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="cco-kpi-row">
          {/* Total Spend */}
          <div className="cco-kpi-card">
            <div className="cco-kpi-label">
              Total Spend
              <span className="cco-kpi-badge cco-kpi-badge-green">↑ 8.4%</span>
            </div>
            <div className="cco-kpi-value">$50K</div>
            <div className="cco-kpi-sub">
              <strong>$49,000</strong> of $50,000 budget · 3 channels active
            </div>
            <Sparkline data={SPARKLINES.spend} color="#22d3ee" />
            <div className="cco-kpi-segbar">
              <div className="cco-kpi-seg cco-kpi-seg-fb" style={{ flex: 37 }} />
              <div className="cco-kpi-seg cco-kpi-seg-gg" style={{ flex: 45 }} />
              <div className="cco-kpi-seg cco-kpi-seg-tt" style={{ flex: 18 }} />
            </div>
          </div>

          {/* Blended ROAS */}
          <div className="cco-kpi-card">
            <div className="cco-kpi-label">
              Blended ROAS
              <span className="cco-kpi-badge cco-kpi-badge-purple">↑ 12%</span>
            </div>
            <div className="cco-kpi-value">4.8×</div>
            <div className="cco-kpi-sub">
              vs <strong>4.3×</strong> prev. period · +0.5× AI optimised
            </div>
            <Sparkline data={SPARKLINES.roas} color="#a78bfa" />
          </div>

          {/* Blended CPA */}
          <div className="cco-kpi-card">
            <div className="cco-kpi-label">
              Blended CPA
              <span className="cco-kpi-badge cco-kpi-badge-green">↓ 7.3%</span>
            </div>
            <div className="cco-kpi-value">$16.10</div>
            <div className="cco-kpi-sub">
              Target <strong>$18.50</strong> · FB $14.20 · GG $11.80
            </div>
            <Sparkline data={SPARKLINES.cpa} color="#34d399" />
          </div>

          {/* Total Reach */}
          <div className="cco-kpi-card">
            <div className="cco-kpi-label">
              Total Reach
              <span className="cco-kpi-badge cco-kpi-badge-blue">↑ 22%</span>
            </div>
            <div className="cco-kpi-value">2.4M</div>
            <div className="cco-kpi-sub">
              <strong>Meta</strong> 1.1M · <strong>Google</strong> 890K · <strong>TikTok</strong> 410K
            </div>
            <Sparkline data={SPARKLINES.reach} color="#60a5fa" />
          </div>

          {/* Conversions */}
          <div className="cco-kpi-card">
            <div className="cco-kpi-label">
              Conversions
              <span className="cco-kpi-badge cco-kpi-badge-orange">3,046</span>
            </div>
            <div className="cco-kpi-value">3.0K</div>
            <div className="cco-kpi-sub">
              Budget pace <strong>98%</strong> · 2 days remaining
            </div>
            <Sparkline data={SPARKLINES.conv} color="#f59e0b" />
            <div className="cco-kpi-progress">
              <div className="cco-kpi-progress-fill" style={{ width: '98%' }} />
            </div>
          </div>
        </div>

        {/* ── MID: CHART + AI PANEL ── */}
        <div className="cco-mid-section">
          {/* Bar Chart */}
          <div className="cco-chart-card">
            <div className="cco-chart-header">
              <div>
                <div className="cco-chart-title">
                  Weekly Channel Performance
                  <span className="cco-live-chip">LIVE</span>
                </div>
                <div className="cco-chart-subtitle">
                  Daily spend (× $1,000) by channel · {activePeriod} view
                </div>
              </div>
              <div className="cco-chart-controls">
                <div className="cco-period-tabs">
                  {['7D', '14D', '30D', '90D'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`cco-period-tab${activePeriod === p ? ' active' : ''}`}
                      onClick={() => setActivePeriod(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cco-chart-legend">
              <div className="cco-legend-item">
                <div className="cco-legend-dot cco-legend-fb" />
                Facebook Ads · $18.4K
              </div>
              <div className="cco-legend-item">
                <div className="cco-legend-dot cco-legend-gg" />
                Google Ads · $22.1K
              </div>
              <div className="cco-legend-item">
                <div className="cco-legend-dot cco-legend-tt" />
                TikTok Ads · $9.5K
              </div>
            </div>

            <GroupedBarChart />
          </div>

          {/* AI Budget Allocation Panel */}
          <div className="cco-ai-panel">
            <div className="cco-ai-panel-title">
              <span className="cco-ai-icon">🤖</span>
              AI Budget Allocation
            </div>

            <div className="cco-spike-box">
              <div className="cco-spike-header">⚡ ROAS Spike Detected</div>
              <div className="cco-spike-body">
                Google Ads ROAS surged to <em>6.2×</em> (Sat–Sun). AI recommends reallocating{' '}
                <strong>+$3,200</strong> from TikTok to Google PMax to capitalise on conversion momentum.
              </div>
            </div>

            <div className="cco-realloc-flow">
              <div className="cco-realloc-from">
                <span className="cco-realloc-channel">TikTok Ads</span>
                <span className="cco-realloc-amount-red">− $3,200</span>
              </div>
              <span className="cco-realloc-arrow">→</span>
              <div className="cco-realloc-to">
                <span className="cco-realloc-channel">Google PMax</span>
                <span className="cco-realloc-amount-green">+ $3,200</span>
              </div>
            </div>

            <div className="cco-governance-note">
              <span className="cco-gov-icon">🔒</span>
              FR04 governance approval required. Budget shift exceeds automated threshold of $2,000.
            </div>

            {!aiApproved ? (
              <button
                type="button"
                className="cco-btn-approve"
                onClick={() => setAiApproved(true)}
              >
                ✓ Approve Reallocation
              </button>
            ) : (
              <div style={{ padding: '9px', textAlign: 'center', borderRadius: '8px', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
                ✓ Approved — Syncing to Google Ads
              </div>
            )}

            <div className="cco-ai-secondary-btns">
              <button type="button" className="cco-btn-customize">⚙ Customize</button>
              <button
                type="button"
                className="cco-btn-reject"
                onClick={() => setAiApproved(false)}
              >
                ✕ Reject
              </button>
            </div>
          </div>
        </div>

        {/* ── CAMPAIGN STATUS TABLE ── */}
        <div className="cco-table-card">
          <div className="cco-table-header">
            <div>
              <div className="cco-table-title">Active Channel Performance</div>
              <div className="cco-table-subtitle">
                AI-optimised campaigns · CPA, ROAS, and budget efficiency
              </div>
            </div>
            <div className="cco-table-search">
              <span style={{ opacity: 0.7 }}>🔍</span>
              <input
                type="text"
                placeholder="Search channels or campaigns…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cco-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="cco-search-clear"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <table className="cco-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Campaign</th>
                <th>AI Status</th>
                <th>Spend / Clicks</th>
                <th>CPA</th>
                <th>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.filter((ch) => {
                if (!searchQuery.trim()) return true
                const q = searchQuery.toLowerCase()
                return (
                  ch.name.toLowerCase().includes(q) ||
                  ch.campaign.toLowerCase().includes(q) ||
                  ch.objective.toLowerCase().includes(q) ||
                  ch.model.toLowerCase().includes(q)
                )
              }).map((ch) => (
                <tr key={ch.id}>
                  <td>
                    <div className="cco-channel-cell">
                      <div className={`cco-channel-avatar ${ch.cls}`}>{ch.icon}</div>
                      <div>
                        <div className="cco-channel-name">{ch.name}</div>
                        <div className="cco-channel-model">{ch.model}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cco-campaign-name">{ch.campaign}</div>
                    <div className="cco-campaign-objective">{ch.objective}</div>
                  </td>
                  <td>
                    <span className={`cco-status-chip ${STATUS_CLASS[ch.statusKey]}`}>
                      {ch.statusLabel}
                    </span>
                  </td>
                  <td>
                    <div className="cco-spend">{ch.spend}</div>
                    <div className="cco-clicks">{ch.clicks}</div>
                  </td>
                  <td>
                    <span className="cco-cpa">{ch.cpa}</span>
                  </td>
                  <td>
                    <span className="cco-roas">{ch.roas}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
