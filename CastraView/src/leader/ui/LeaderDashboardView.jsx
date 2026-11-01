import PropTypes from 'prop-types'

import {
  CAMPAIGNS,
  DASHBOARD_KPIS,
  PENDING_REVIEWS,
  PERFORMANCE_BARS,
  TEAM_EXECUTION,
} from '../data/leaderMock'
import './leader.css'

const INSIGHTS = [
  { tone: 'warning', title: 'Meta retargeting is outperforming', detail: 'Consider shifting 8% of Google prospecting budget.', action: 'Review recommendation' },
  { tone: 'info', title: 'TikTok frequency is rising', detail: 'Audience fatigue signal detected in 2 ad sets.', action: 'Open audience report' },
]

function StatusPill({ children, tone = 'pending' }) {
  return <span className={`leader-status-pill ${tone}`}>{children}</span>
}

StatusPill.propTypes = { children: PropTypes.node.isRequired, tone: PropTypes.string }

export function LeaderDashboardView({ importCount, onOpenApprovals, onRefresh }) {
  return (
    <div className="leader-dashboard-page">
      <header className="leader-page-intro">
        <div>
          <span className="leader-eyebrow">LEADER WORKSPACE · OVERVIEW</span>
          <h1>Campaign &amp; Team Performance Overview</h1>
          <p>Monitor campaign health, team execution, and the decisions that need your attention.</p>
        </div>
        <div className="leader-intro-actions">
          <span className="leader-data-status"><i /> Last synced 4 min ago</span>
          <button type="button" className="leader-refresh-button" onClick={onRefresh}>↻ Refresh data</button>
        </div>
      </header>

      <section className="leader-token-banner" aria-label="AI engine status">
        <span className="leader-token-icon">✦</span>
        <div><strong>AI Engine is operating at full capacity</strong><small>Campaign recommendations and review checks are ready for your workspace.</small></div>
        <span className="leader-token-usage"><b>78.4%</b> Copilot quota remaining</span>
      </section>

      <section className="leader-kpi-grid" aria-label="Campaign KPI summary">
        {DASHBOARD_KPIS.map((card) => (
          <article className={`leader-kpi-card ${card.tone}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.change} <em>{card.detail}</em></small>
          </article>
        ))}
      </section>

      <div className="leader-dashboard-grid leader-dashboard-top-grid">
        <section className="leader-card leader-performance-card">
          <div className="leader-card-heading">
            <div><span className="leader-section-kicker">CAMPAIGN PERFORMANCE</span><h2>Spend and return</h2></div>
            <div className="leader-card-controls"><span className="leader-chart-total">$48.2k <small>total spend</small></span><button type="button" className="leader-filter-button">Last 30 days⌄</button></div>
          </div>
          <div className="leader-chart-legend"><span><i className="legend-spend" /> Spend</span><span><i className="legend-return" /> Return</span><strong>ROAS 4.2×</strong></div>
          <div className="leader-bar-chart" role="img" aria-label="Campaign spend and return grouped bar chart over the last 30 days">
            <div className="leader-chart-y-axis"><span>$20k</span><span>$10k</span><span>$0</span></div>
            <div className="leader-bars">
              {PERFORMANCE_BARS.map((bar) => <div className="leader-bar-group" key={bar.day}><div className="leader-bar-pair"><span className="leader-bar spend" style={{ height: `${bar.spend}%` }} /><span className="leader-bar return" style={{ height: `${bar.return}%` }} /></div><small>{bar.day}</small></div>)}
            </div>
          </div>
        </section>

        <section className="leader-card leader-team-card">
          <div className="leader-card-heading"><div><span className="leader-section-kicker">TEAM EXECUTION</span><h2>Execution status</h2></div><button type="button" className="leader-more-button" aria-label="More team options">•••</button></div>
          <div className="leader-team-summary"><strong>76%</strong><span>average completion</span><div className="leader-progress"><span style={{ width: '76%' }} /></div></div>
          <div className="leader-team-list">
            {TEAM_EXECUTION.map((member) => <div className="leader-team-row" key={member.name}><span className={`leader-team-avatar ${member.tone}`}>{member.initials}</span><span><strong>{member.name}</strong><small>{member.task}</small></span><span className="leader-team-progress"><i style={{ width: `${member.progress}%` }} /></span><b>{member.status}</b></div>)}
          </div>
          <button type="button" className="leader-text-link" onClick={() => onOpenApprovals()}>View team activity →</button>
        </section>
      </div>

      <section className="leader-card leader-review-card-wide">
        <div className="leader-card-heading"><div><span className="leader-section-kicker">CONTENT WORKFLOW</span><h2>Pending Content Reviews <b className="leader-heading-count">{PENDING_REVIEWS.length}</b></h2></div><button type="button" className="leader-text-link" onClick={onOpenApprovals}>View all →</button></div>
        <div className="leader-table-wrap"><table className="leader-review-table"><thead><tr><th>Proposal</th><th>Type</th><th>Submitted by</th><th>Submitted</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{PENDING_REVIEWS.map((review) => <tr key={review.id}><td><strong>{review.title}</strong><small>{review.id}</small></td><td><span className="leader-type-tag">{review.type}</span></td><td>{review.submittedBy}</td><td>{review.submitted}</td><td><StatusPill tone={review.status === 'Needs review' ? 'attention' : 'pending'}>{review.status}</StatusPill></td><td><button type="button" className="leader-row-action" onClick={onOpenApprovals}>Review</button></td></tr>)}</tbody></table></div>
      </section>

      <div className="leader-dashboard-grid leader-lower-grid">
        <section className="leader-card leader-insights-card">
          <div className="leader-card-heading"><div><span className="leader-section-kicker">AI CAMPAIGN INSIGHTS</span><h2>What needs attention</h2></div><span className="leader-ai-badge">✦ AI</span></div>
          <div className="leader-insight-list">{INSIGHTS.map((insight) => <div className="leader-insight" key={insight.title}><span className={`leader-insight-dot ${insight.tone}`} /><span><strong>{insight.title}</strong><small>{insight.detail}</small></span><button type="button" aria-label={insight.action} onClick={onOpenApprovals}>→</button></div>)}</div>
          <div className="leader-insight-governance"><span>✓</span><span>Insights are grounded in your active campaign data and policy checks.</span></div>
          <button type="button" className="leader-insight-footer" onClick={onOpenApprovals}>Explore all insights →</button>
        </section>

        <section className="leader-card leader-assigned-card">
          <div className="leader-card-heading"><div><span className="leader-section-kicker">ASSIGNED CAMPAIGNS</span><h2>Campaigns you own</h2></div><span className="leader-import-note">{importCount ? `${importCount} recent imports` : 'No live imports connected'}</span></div>
          <div className="leader-campaign-list">{CAMPAIGNS.map((campaign) => <div className="leader-campaign-row" key={campaign.name}><div><strong>{campaign.name}</strong><small>{campaign.channel} · {campaign.owner}</small></div><span>{campaign.spend}</span><b className="leader-roas-value">{campaign.roas}</b><StatusPill tone={campaign.status === 'On track' ? 'on-track' : 'attention'}>{campaign.status}</StatusPill><small>{campaign.next}</small></div>)}</div>
        </section>
      </div>
    </div>
  )
}

LeaderDashboardView.propTypes = { importCount: PropTypes.number, onOpenApprovals: PropTypes.func.isRequired, onRefresh: PropTypes.func.isRequired }
