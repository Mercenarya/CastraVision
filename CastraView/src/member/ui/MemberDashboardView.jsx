import './member.css'

const sizes = {
  Micro: '1–10 employees',
  Small: '11–50 employees',
  Medium: '51–250 employees',
  Large: '250+ employees',
}

export function MemberDashboardView({ profile, imports, strategy, onOpenPage }) {
  const businessName = profile?.business_name || 'CastraVision Workspace'
  const businessSize = sizes[profile?.business_size] || profile?.business_size || 'Not configured'
  const importedCopy = imports?.length
    ? `${imports[0].row_count} records imported`
    : 'CSV / XLSX validation & normalization'
  const strategyCopy = strategy
    ? `Recommended channel: ${strategy.strategy.recommended_channel}`
    : 'Synthesize your profile and campaign history'

  return (
    <>
      <header className="member-dashboard-intro">
        <div>
          <span className="member-dashboard-code">MEMBER · CAMPAIGN WORKSPACE</span>
          <h1>Welcome back, {businessName}</h1>
          <p>Manage the campaign inputs and recommendations that power your workspace.</p>
        </div>
      </header>

      <section className="member-dashboard-hero" aria-label="Workspace overview">
        <div>
          <span className="member-dashboard-label">MEMBER WORKSPACE</span>
          <h2>Build a clear path from campaign data to action.</h2>
          <p>Keep your profile, historical data, and strategy inputs ready for the next decision.</p>
        </div>
        <span className="member-dashboard-mark" aria-hidden="true">✣</span>
      </section>

      <section className="member-dashboard-grid" aria-label="Member workspace actions">
        <button type="button" className="member-dashboard-card" onClick={() => onOpenPage('profile')}>
          <span className="member-dashboard-number">01 · PROFILE</span>
          <span className="member-dashboard-icon member-dashboard-icon-violet" aria-hidden="true">▣</span>
          <strong>Business Profile</strong>
          <p>{profile?.industry || 'Industry not configured'} · {businessSize}</p>
          <span className="member-dashboard-link">View profile →</span>
        </button>

        <button type="button" className="member-dashboard-card" onClick={() => onOpenPage('import')}>
          <span className="member-dashboard-number">02 · DATA</span>
          <span className="member-dashboard-icon member-dashboard-icon-cyan" aria-hidden="true">⇥</span>
          <strong>Campaign Data Import</strong>
          <p>{importedCopy}</p>
          <span className="member-dashboard-link">{imports?.length ? 'View data' : 'Start import'} →</span>
        </button>

        <button type="button" className="member-dashboard-card" onClick={() => onOpenPage('strategy')}>
          <span className="member-dashboard-number">03 · STRATEGY</span>
          <span className="member-dashboard-icon member-dashboard-icon-violet" aria-hidden="true">◈</span>
          <strong>Generate AI Strategy</strong>
          <p>{strategyCopy}</p>
          <span className="member-dashboard-link">{strategy ? 'View strategy' : 'Generate strategy'} →</span>
        </button>
      </section>

      <section className="member-dashboard-note" aria-label="Content Studio">
        <span aria-hidden="true">ⓘ</span>
        <div>
          <strong>About Content Studio</strong>
          <p>Review and refine generated channel drafts before they are shared with your workspace.</p>
        </div>
        <button type="button" className="button subtle" onClick={() => onOpenPage('content')}>
          Open Content Studio →
        </button>
      </section>
    </>
  )
}
