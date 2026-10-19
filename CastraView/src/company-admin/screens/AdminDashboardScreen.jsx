import { useState } from 'react'
import { PageHeader, PrimaryButton, SecondaryButton, MetricCard } from '../ui/Primitives'
import { INITIAL_WORKSPACE, INITIAL_PROPOSALS, INITIAL_AUDIT_LOGS } from '../mockData'

export default function AdminDashboardScreen({
  workspace = INITIAL_WORKSPACE,
  proposals = INITIAL_PROPOSALS,
  auditLogs = INITIAL_AUDIT_LOGS,
  onNavigate,
  onOpenInvite,
  notify,
}) {
  const [pendingList, setPendingList] = useState(
    proposals.filter((p) => p.status === 'pending' || p.status === 'edited')
  )

  function handleQuickApprove(id) {
    setPendingList((prev) => prev.filter((p) => p.id !== id))
    notify?.(`Proposal ${id} approved and recorded in FR11 Audit Log.`)
  }

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        badge="LIVE NODE"
        title="Admin Console"
        subtitle={`Governing ${workspace.name} enterprise workspace, member privileges, proposal approvals, and compliance audit trail.`}
        actions={
          <>
            <SecondaryButton onClick={onOpenInvite} icon="👥">
              Invite Member
            </SecondaryButton>
            <SecondaryButton onClick={() => onNavigate('roles')} icon="🛡">
              Manage Roles
            </SecondaryButton>
            <PrimaryButton
              onClick={() => notify?.('Workspace creation API ready. Connect with backend service.')}
              icon="🏢"
            >
              Create Workspace
            </PrimaryButton>
          </>
        }
      />

      {/* KPI Cards (4 Columns) */}
      <div className="ca-kpi-grid">
        <MetricCard
          label="CURRENT WORKSPACE"
          value={workspace.name}
          subtext={`ID: ${workspace.id} · ${workspace.tierShort}`}
          icon="🏢"
          linkText="Workspace Settings →"
          onLinkClick={() => onNavigate('profile')}
        />
        <MetricCard
          label="WORKSPACE MEMBERS"
          value={`${workspace.totalMembers} Active Members`}
          subtext={`${workspace.adminCount} Admins · ${workspace.managerCount} Managers · ${workspace.memberCount} Members`}
          icon="👥"
          linkText="Manage Members →"
          onLinkClick={() => onNavigate('members')}
        />
        <MetricCard
          label="PENDING APPROVALS"
          value={`${pendingList.length} Proposals`}
          badge="Action Req."
          subtext="2 Content · 1 Budget · Needs Sign-off"
          icon="✓"
          linkText="Open Approval Queue →"
          onLinkClick={() => onNavigate('approvals')}
        />
        <MetricCard
          label="AUDIT EVENTS (24H)"
          value="48 Events Logged"
          subtext="100% cryptographically committed"
          icon="🛡"
          linkText="View Full Audit Log →"
          onLinkClick={() => onNavigate('audit')}
        />
      </div>

      {/* Main Split Content: Left 60% / Right 40% */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Workspace Management & Resource Health */}
          <section className="ca-card">
            <div className="ca-card-header">
              <h2 className="ca-card-title">
                <span className="ca-card-icon-title">▦</span>
                Workspace Management & Resource Health
              </h2>
              <span className="ca-badge ca-badge-active">Active · Healthy</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase' }}>
                  Organization Entity
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginTop: 4 }}>
                  {workspace.fullName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase' }}>
                  Provisioned Plan
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginTop: 4 }}>
                  {workspace.tier}
                </div>
              </div>
            </div>

            {/* Capacity bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--ca-text-secondary)' }}>24/7 AI Engine Orchestration Allocation</span>
                  <strong style={{ color: '#ffffff' }}>{workspace.aiAllocation}</strong>
                </div>
                <div style={{ height: 6, background: 'var(--ca-bg-alt)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: '68%', height: '100%', background: 'var(--ca-cyan)', borderRadius: 4 }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--ca-text-secondary)' }}>Cryptographic Audit Ledger Throughput</span>
                  <strong style={{ color: '#ffffff' }}>{workspace.auditThroughput}</strong>
                </div>
                <div style={{ height: 6, background: 'var(--ca-bg-alt)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: 'var(--ca-success)', borderRadius: 4 }} />
                </div>
              </div>
            </div>

            {/* Quick Actions buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <PrimaryButton onClick={() => onNavigate('members')} icon="👥">
                Manage Members
              </PrimaryButton>
              <PrimaryButton onClick={() => onNavigate('roles')} icon="▦">
                Role Matrix
              </PrimaryButton>
              <PrimaryButton onClick={() => onNavigate('profile')} icon="⚙">
                Workspace Settings
              </PrimaryButton>
            </div>
          </section>

          {/* Pending Governance Approvals (FR04) */}
          <section className="ca-card">
            <div className="ca-card-header">
              <h2 className="ca-card-title">
                <span className="ca-card-icon-title">✓</span>
                Pending Governance Approvals (FR04)
              </h2>
              <span className="ca-badge ca-badge-admin">{pendingList.length} Pending Review</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingList.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ca-text-muted)' }}>
                  ✓ All governance proposals have been reviewed.
                </div>
              ) : (
                pendingList.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--ca-bg-alt)',
                      border: '1px solid var(--ca-border)',
                      borderRadius: 'var(--ca-radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--ca-radius-md)',
                          background: item.type === 'Budget' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: item.type === 'Budget' ? '#d8b4fe' : '#a5b4fc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                        }}
                      >
                        {item.type === 'Budget' ? '💳' : '📄'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: 'var(--ca-cyan)' }}>
                            {item.id}
                          </span>
                          <span className={`ca-badge ca-badge-${item.type.toLowerCase()}`}>
                            {item.type.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', marginTop: 2 }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ca-text-muted)' }}>
                          Engine: {item.engine} · Author: {item.author}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <SecondaryButton className="ca-btn-sm" onClick={() => onNavigate('approvals')}>
                        Review
                      </SecondaryButton>
                      <button
                        type="button"
                        className="ca-btn ca-btn-success ca-btn-sm"
                        onClick={() => handleQuickApprove(item.id)}
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Recent Workspace Audit Trail (FR11) */}
        <section className="ca-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ca-card-header">
            <h2 className="ca-card-title">
              <span className="ca-card-icon-title">🛡</span>
              Recent Workspace Audit Trail (FR11)
            </h2>
            <span className="ca-status-dot" aria-hidden="true" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '12px 14px',
                  background: 'var(--ca-bg-alt)',
                  border: '1px solid var(--ca-border)',
                  borderRadius: 'var(--ca-radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="ca-badge ca-badge-admin">{log.module}</span>
                  <span style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>{log.timestamp.split('UTC')[0]}</span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#ffffff' }}>
                  {log.action}: {log.summary}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ca-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>👤 By: {log.actorName} ({log.actorRole})</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="ca-btn ca-btn-secondary"
            style={{ marginTop: 18, width: '100%' }}
            onClick={() => onNavigate('audit')}
          >
            ▤ View Full Audit Log
          </button>
        </section>
      </div>
    </div>
  )
}
