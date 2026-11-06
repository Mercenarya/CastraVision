import './member.css'

export function MemberOverviewLoading() {
  return (
    <div className="member-page member-overview-state member-overview-state--loading" aria-label="Loading Member Overview" aria-busy="true">
      <div className="member-overview-state__intro">
        <div><span className="member-eyebrow">Member workspace</span><h1>My Dashboard</h1><p>Loading your workspace data…</p></div>
        <span className="member-overview-state__skeleton member-overview-state__action" />
      </div>
      <div className="member-overview-state__metrics" aria-hidden="true">{[1, 2, 3, 4].map((item) => <div className="member-overview-state__skeleton-card" key={item}><i /><b /><small /></div>)}</div>
      <div className="member-overview-state__grid" aria-hidden="true">
        <section className="member-panel member-overview-state__table-skeleton"><div className="member-overview-state__skeleton member-overview-state__heading" />{[1, 2, 3, 4].map((item) => <div className="member-overview-state__skeleton-row" key={item}><i /><span /><b /><small /></div>)}<div className="member-overview-state__skeleton member-overview-state__pagination" /></section>
        <aside><section className="member-panel member-overview-state__side-skeleton"><div className="member-overview-state__skeleton member-overview-state__heading" />{[1, 2, 3].map((item) => <div className="member-overview-state__tip-skeleton" key={item}><i /><span /></div>)}</section><section className="member-panel member-overview-state__side-skeleton"><div className="member-overview-state__skeleton member-overview-state__heading" />{[1, 2, 3].map((item) => <div className="member-overview-state__action-skeleton" key={item} />)}</section></aside>
      </div>
      <span className="member-overview-state__sr-only" role="status">Loading your Member Overview</span>
    </div>
  )
}

export function MemberOverviewUnavailable({ onOpenDemoPreview }) {
  return (
    <div className="member-page member-overview-state member-overview-state--empty">
      <header className="member-overview-state__intro">
        <div><span className="member-eyebrow">Member workspace</span><h1>My Dashboard</h1><p>Proposal activity is unavailable because this workspace has no verified proposal data source yet.</p></div>
        <button type="button" className="member-button member-button--secondary" onClick={onOpenDemoPreview}>View labeled demo preview</button>
      </header>
      <section className="member-panel member-overview-state__notifications" role="status">
        <header><h2>Account data not verified</h2><span>UNAVAILABLE</span></header>
        <div><p>Sample proposal records are not used to determine whether your account is empty. Try again after an authoritative proposal service is configured.</p></div>
      </section>
    </div>
  )
}

export function MemberOverviewError() {
  return (
    <div className="member-page member-overview-state member-overview-state--empty">
      <header className="member-overview-state__intro">
        <div><span className="member-eyebrow">Member workspace</span><h1>My Dashboard</h1><p>We couldn’t load verified proposal activity.</p></div>
      </header>
      <section className="member-panel member-overview-state__notifications" role="alert">
        <header><h2>Proposal data could not be loaded</h2><span>ERROR</span></header>
        <div><p>This is not an empty-state confirmation. Please retry when the proposal service is available.</p></div>
      </section>
    </div>
  )
}

export function MemberOverviewNoProposals({ proposalCount = 0, onOpenPage }) {
  return (
    <div className="member-page member-overview-state member-overview-state--empty">
      <header className="member-overview-state__intro">
        <div><span className="member-eyebrow">Workspace activity · Member</span><h1>My Dashboard</h1><p>Track your work and stay updated on your proposals.</p></div>
        <button type="button" className="member-button member-button--primary" onClick={() => onOpenPage('proposals')}>＋ Create Proposal</button>
      </header>
      <section className="member-overview-state__metrics" aria-label="Proposal metrics">
        <article><span>MY PROPOSALS</span><strong>{proposalCount}</strong><small>No proposals submitted</small></article>
        <article><span>PENDING REVIEW</span><strong>0</strong><small>Queue is clear</small></article>
        <article><span>APPROVED</span><strong>0</strong><small>No approved items yet</small></article>
        <article><span>REJECTED</span><strong>0</strong><small>No rejected proposals</small></article>
      </section>
      <div className="member-overview-state__grid">
        <section className="member-panel member-overview-state__empty-panel">
          <header><div><span aria-hidden="true">◷</span><h2>My Recent Proposals</h2></div><span>AUTHORING DESK</span></header>
          <div className="member-overview-state__empty-content"><span className="member-overview-state__folder" aria-hidden="true">▱</span><h2>No Proposals Created Yet</h2><p>You haven't authored any marketing copy or budget proposals yet. Start by creating an original proposal for review by your Workspace Manager.</p><div className="member-overview-state__empty-actions"><button type="button" className="member-button member-button--primary" onClick={() => onOpenPage('proposals')}>＋ Create Your First Proposal</button><button type="button" className="member-button member-button--secondary" onClick={() => onOpenPage('strategy')}>Browse Guidelines &amp; Best Practices</button></div><aside><strong>Proposer Tip</strong><p>You can submit ad headlines, body copy variations, or budget allocations. Proposals are reviewed before any publishing or ad spend.</p></aside></div>
        </section>
        <aside className="member-overview-state__right-column">
          <section className="member-panel member-overview-state__notifications"><header><h2>Recent Notifications</h2><span>0 NEW</span></header><div><strong>All caught up!</strong><p>Notifications regarding proposal approvals and manager revision notes will appear here when the notification service is available.</p><button type="button" className="member-text-button" onClick={() => onOpenPage('notifications')}>View Notifications →</button></div></section>
          <section className="member-panel member-overview-state__quick-actions"><header><h2>Quick Actions</h2><span>MEMBER ACCESS</span></header><button type="button" onClick={() => onOpenPage('proposals')}>Create Proposal <b>→</b></button><button type="button" onClick={() => onOpenPage('proposals')}>View My Proposals <b>→</b></button><button type="button" onClick={() => onOpenPage('notifications')}>View Notifications <b>→</b></button><small>Workspace Members can draft proposals for managerial review.</small></section>
        </aside>
      </div>
    </div>
  )
}
