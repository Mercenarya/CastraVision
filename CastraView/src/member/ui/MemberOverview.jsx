import { useMemo, useState } from 'react'

import { resolveMemberOverviewState } from '../memberOverviewState'
import { memberDashboardPreview } from '../memberDashboardMockData'
import { MemberOverviewError, MemberOverviewLoading, MemberOverviewNoProposals } from './MemberOverviewStates'
import './member.css'

const statusClass = (status) => status.toLowerCase().replace(/[^a-z]+/g, '-')

function PreviewMark() {
  return <span className="member-dashboard-ref__preview-mark">Preview data · not account activity</span>
}

function SectionHeading({ eyebrow, title, action, onAction }) {
  return (
    <div className="member-dashboard-ref__section-heading">
      <div>
        <span className="member-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action && <button type="button" className="member-text-button" onClick={onAction}>{action} <span aria-hidden="true">→</span></button>}
    </div>
  )
}

export function MemberOverview({ user, profile, onOpenPage, loading = false, proposalStatus = 'unavailable', proposals = [] }) {
  const [taskFilter, setTaskFilter] = useState('All tasks')
  const [taskSearch, setTaskSearch] = useState('')
  const overviewState = loading
    ? 'loading'
    : resolveMemberOverviewState({ status: proposalStatus, proposals })
  const displayName = user?.full_name || user?.user_metadata?.full_name || 'Member'
  const firstName = displayName.trim().split(/\s+/)[0]
  const preview = memberDashboardPreview
  const filteredTasks = useMemo(() => preview.tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.status} ${task.priority}`.toLowerCase().includes(taskSearch.toLowerCase())
    const matchesFilter = taskFilter === 'All tasks' || task.status === taskFilter
    return matchesSearch && matchesFilter
  }), [preview.tasks, taskFilter, taskSearch])

  if (overviewState === 'loading') return <MemberOverviewLoading />
  if (overviewState === 'error') return <MemberOverviewError />
  if (overviewState === 'empty') return <MemberOverviewNoProposals proposalCount={proposals.length} onOpenPage={onOpenPage} />

  return (
    <div className="member-page member-overview member-dashboard-ref">
      {overviewState === 'demo' && (
        <div className="member-dashboard-ref__availability" role="status">
          <strong>Account proposal data unavailable</strong>
          <span>The full Dashboard is shown with clearly labeled illustrative content; no sample proposal is treated as an account record.</span>
        </div>
      )}
      <header className="member-dashboard-ref__welcome">
        <div className="member-dashboard-ref__welcome-copy">
          <div className="member-dashboard-ref__welcome-meta">
            <span className="member-eyebrow">CONTRIBUTOR WORKSPACE · {profile?.business_name || 'MEMBER WORKSPACE'}</span>
            <span className="member-dashboard-ref__cycle">Active Cycle</span>
          </div>
          <h1>Welcome back, {firstName} <span aria-hidden="true">👋</span></h1>
          <p>Here’s a snapshot of your workload, recent submissions, and creative workspace.</p>
        </div>
        <div className="member-dashboard-ref__welcome-actions">
          <PreviewMark />
          <button type="button" className="member-button member-button--secondary" onClick={() => onOpenPage('import')}>
            <span aria-hidden="true">⇧</span> Import Campaign Data
          </button>
          <button type="button" className="member-button member-button--primary" onClick={() => onOpenPage('content')}>
            <span aria-hidden="true">✦</span> Create Content
          </button>
        </div>
      </header>

      <section className="member-dashboard-ref__metrics" aria-label="Illustrative workspace metrics">
        {preview.metrics.map((metric) => (
          <article className={`member-dashboard-ref__metric is-${metric.tone}`} key={metric.title}>
            <div className="member-dashboard-ref__metric-heading">
              <span>{metric.title}</span>
              <span className="member-dashboard-ref__metric-icon" aria-hidden="true">{metric.icon}</span>
            </div>
            <div className="member-dashboard-ref__metric-value"><strong>{metric.value}</strong><span>{metric.unit}</span><span className="member-dashboard-ref__metric-badge">{metric.badge}</span></div>
            <div className="member-dashboard-ref__metric-bottom"><div className="member-dashboard-ref__meter" aria-hidden="true"><i style={{ width: `${metric.progress}%` }} /></div><small>{metric.note}</small>{metric.footer && <small className="member-dashboard-ref__metric-footer">{metric.footer}</small>}</div>
          </article>
        ))}
      </section>

      <div className="member-dashboard-ref__columns">
        <div className="member-dashboard-ref__main-column">
          <section className="member-panel member-dashboard-ref__tasks">
            <div className="member-dashboard-ref__panel-header">
              <SectionHeading eyebrow="YOUR WORKLOAD" title="My Priority Tasks" />
              <div className="member-dashboard-ref__task-controls">
                <label className="member-dashboard-ref__sr-only" htmlFor="member-task-search">Search preview tasks</label>
                <input id="member-task-search" type="search" placeholder="Search tasks…" value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} />
                <label className="member-dashboard-ref__sr-only" htmlFor="member-task-filter">Filter preview tasks</label>
                <select id="member-task-filter" value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)}>
                  <option>All tasks</option>
                  <option>Revision Required</option>
                  <option>In Progress</option>
                  <option>To Do</option>
                </select>
              </div>
            </div>
            <div className="member-dashboard-ref__preview-context"><PreviewMark /><span>Sample tasks shown for layout preview; no task assignment or completion is recorded.</span></div>
            <ul className="member-dashboard-ref__task-list">
              {filteredTasks.map((task) => (
                <li className="member-dashboard-ref__task" key={task.title}>
                  <span className={`member-dashboard-ref__priority is-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <div className="member-dashboard-ref__task-copy"><div><span className={`member-dashboard-ref__status is-${statusClass(task.status)}`}>{task.status}</span><small>Due: {task.due}</small></div><h3>{task.title}</h3><p>{task.campaign} <span aria-hidden="true">·</span> {task.context}</p></div>
                  <span className="member-dashboard-ref__task-chevron" aria-hidden="true">›</span>
                </li>
              ))}
              {filteredTasks.length === 0 && <li className="member-dashboard-ref__no-results">No preview tasks match these filters.</li>}
            </ul>
            <div className="member-dashboard-ref__panel-footer"><span>Preview-only items cannot be opened, completed, or submitted.</span><button type="button" disabled aria-label="Task list unavailable">View My Tasks (5) <span aria-hidden="true">→</span></button></div>
          </section>

          <section className="member-panel member-dashboard-ref__submissions">
            <SectionHeading eyebrow="RECENT ACTIVITY" title="My Recent Submissions" action="View proposals" onAction={() => onOpenPage('proposals')} />
            <div className="member-dashboard-ref__preview-context"><PreviewMark /><span>These sample rows are separate from your proposals and approval history.</span></div>
            <div className="member-dashboard-ref__table-wrap">
              <table className="member-dashboard-ref__table">
                <thead><tr><th>Deliverable</th><th>Campaign</th><th>Submitted</th><th>Status</th><th>Reviewer / Feedback</th><th>Action</th></tr></thead>
                <tbody>{preview.submissions.map((item) => (
                  <tr key={item.title}><td><strong>{item.title}</strong></td><td>{item.campaign}</td><td>{item.submitted}</td><td><span className={`member-dashboard-ref__status is-${statusClass(item.status)}`}>{item.status}</span></td><td>{item.reviewer}</td><td><button type="button" disabled className="member-dashboard-ref__sample-action" aria-label={`${item.status} action is preview-only`}>{item.status === 'Changes Requested' ? 'Edit & Resubmit' : 'View'}</button></td></tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <section className="member-panel member-dashboard-ref__campaigns">
            <SectionHeading eyebrow="CAMPAIGN WORKSPACE" title="My Assigned Campaigns" action="Open campaigns" onAction={() => onOpenPage('campaigns')} />
            <div className="member-dashboard-ref__preview-context"><PreviewMark /><span>Illustrative campaign cards; these are not account assignments.</span></div>
            <div className="member-dashboard-ref__campaign-grid">{preview.campaigns.map((campaign) => (
              <article className={`member-dashboard-ref__campaign is-${campaign.tone}`} key={campaign.name}>
                <div className="member-dashboard-ref__campaign-mark" aria-hidden="true">{campaign.name.slice(0, 2).toUpperCase()}</div>
                <div className="member-dashboard-ref__campaign-main"><h3>{campaign.name}</h3><span>{campaign.channels}</span></div>
                <div className="member-dashboard-ref__campaign-details"><span>Objective</span><strong>{campaign.objective}</strong></div>
                <div className="member-dashboard-ref__campaign-progress"><span>{campaign.progress}</span><i aria-hidden="true"><b /></i></div>
              </article>
            ))}</div>
          </section>
        </div>

        <aside className="member-dashboard-ref__side-column">
          <section className="member-panel member-dashboard-ref__studio">
            <SectionHeading eyebrow="CREATIVE WORKSPACE" title="AI Content Studio" />
            <div className="member-dashboard-ref__preview-context"><PreviewMark /><span>Shortcuts open the existing local draft workspace; no generation is run here.</span></div>
            {preview.studio.map((item) => <button type="button" className="member-dashboard-ref__shortcut" key={item.title} onClick={() => onOpenPage('content')}><span className="member-dashboard-ref__shortcut-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><b aria-hidden="true">→</b></button>)}
            <button type="button" className="member-button member-button--primary" onClick={() => onOpenPage('content')}>Open Content Studio <span aria-hidden="true">→</span></button>
            <small className="member-dashboard-ref__fine-print">Drafts remain local until a supported save workflow is available.</small>
          </section>

          <section className="member-panel member-dashboard-ref__assistant">
            <SectionHeading eyebrow="YOUR AI PARTNER" title="AI Work Assistant" />
            <div className="member-dashboard-ref__preview-context"><PreviewMark /><span>Generic writing tips, not personalized AI output.</span></div>
            {preview.assistant.map((item) => <article key={item.title}><strong>{item.title}</strong><p>{item.detail}</p></article>)}
            <button type="button" className="member-button member-button--secondary" onClick={() => onOpenPage('strategy')}>Open Strategy Studio <span aria-hidden="true">→</span></button>
          </section>

          <section className="member-panel member-dashboard-ref__velocity">
            <SectionHeading eyebrow="SPRINT OVERVIEW" title="Current Sprint Velocity" />
            <div className="member-dashboard-ref__preview-context"><PreviewMark /><span>Sample sprint figures; not operational performance data.</span></div>
            <div className="member-dashboard-ref__sprint-name">{preview.sprint.name}</div>
            <div className="member-dashboard-ref__velocity-stat"><strong>{preview.sprint.complete} tasks</strong><span>{preview.sprint.pace}</span></div>
            <div className="member-dashboard-ref__meter" role="img" aria-label={`Preview sprint completion: ${preview.sprint.pace}`}><i style={{ width: `${preview.sprint.progress}%` }} /></div>
            <div className="member-dashboard-ref__sprint-foot"><span>{preview.sprint.target}</span><span>Preview</span></div>
            <p className="member-dashboard-ref__sprint-note">{preview.sprint.note}</p>
          </section>
        </aside>
      </div>
      <p className="member-dashboard-ref__disclaimer">Preview figures, tasks, submissions, campaign assignments, assistant tips, and sprint data are illustrative only. They are not read from or written to account records and do not affect permissions, approvals, metrics, or business decisions.</p>
    </div>
  )
}
