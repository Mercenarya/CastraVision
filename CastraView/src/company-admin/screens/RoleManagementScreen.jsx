import { useState } from 'react'
import { PageHeader, SecondaryButton, NoticeBanner } from '../ui/Primitives'

export default function RoleManagementScreen({ notify }) {
  const [activeScopeTab, setActiveScopeTab] = useState('All')

  const capabilities = [
    {
      scope: 'Admin Tier',
      name: 'Workspace Settings & Billing',
      desc: 'Modify global domain policies, invoice access, tier limits, and API keys.',
      admin: 'Full Control',
      manager: 'Denied',
      member: 'Denied',
      icon: '🏢',
    },
    {
      scope: 'Admin Tier',
      name: 'Member Invitation & Role Assignment',
      desc: 'Send invitation tokens, assign RBAC tiers, and force 2FA compliance.',
      admin: 'Full Control',
      manager: 'Denied',
      member: 'Denied',
      icon: '👥',
    },
    {
      scope: 'Admin Tier',
      name: 'Remove Member Confirmation',
      badge: 'Last Admin Protected',
      desc: 'Revoke active sessions and offboard users. Zero deletion allowed when count is 1.',
      admin: 'Admin Only',
      manager: 'Denied',
      member: 'Denied',
      icon: '👤',
    },
    {
      scope: 'Governance (FR04/FR11)',
      name: 'FR04 Proposal Approval & Rejection',
      desc: 'Gatekeeper verification of AI-generated campaign pitches before deployment.',
      admin: 'Authorized',
      manager: 'Authorized',
      member: 'Denied',
      icon: '✓',
    },
    {
      scope: 'Governance (FR04/FR11)',
      name: 'FR04 Proposal Revision & Manager Override',
      desc: 'Human-in-the-Loop text revision, target audience tweaking, and budget reallocation.',
      admin: 'Authorized',
      manager: 'Authorized',
      member: 'Denied',
      icon: '✍',
    },
    {
      scope: 'Governance (FR04/FR11)',
      name: 'FR11 Cryptographic Audit Log & Diff Inspection',
      desc: 'Audit trail inspection, signature verification, and export of tamper-evident events.',
      admin: 'Read & Export',
      manager: 'Read Only',
      member: 'Denied',
      icon: '📜',
    },
    {
      scope: 'Execution (FR03/FR08)',
      name: 'FR08 Campaign Data Import & CSV/Excel Upload',
      desc: 'Ingestion of historical ad matrices, creative archives, and performance metrics.',
      admin: 'Full Control',
      manager: 'Full Control',
      member: 'Authorized',
      icon: '⇥',
    },
    {
      scope: 'Execution (FR03/FR08)',
      name: 'FR03 Content Generation & AI Execution',
      desc: 'Execute inference runs, variant prompts, copy generation, and visual layout ideation.',
      admin: 'Authorized',
      manager: 'Authorized',
      member: 'Authorized',
      icon: '✦',
    },
  ]

  const filteredCapabilities = capabilities.filter((c) => {
    if (activeScopeTab === 'All') return true
    if (activeScopeTab === 'Admin Tier' && c.scope === 'Admin Tier') return true
    if (activeScopeTab === 'Governance' && c.scope.includes('Governance')) return true
    if (activeScopeTab === 'Execution' && c.scope.includes('Execution')) return true
    return true
  })

  function renderStatusPill(val) {
    if (val === 'Full Control' || val === 'Admin Only') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 'var(--ca-radius-sm)',
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(99, 102, 241, 0.16)',
            color: '#c7d2fe',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          ✓ {val}
        </span>
      )
    }
    if (val === 'Authorized') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 'var(--ca-radius-sm)',
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#6ee7b7',
            border: '1px solid rgba(16, 185, 129, 0.28)',
          }}
        >
          ✓ Authorized
        </span>
      )
    }
    if (val === 'Read Only' || val === 'Read & Export') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 'var(--ca-radius-sm)',
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(6, 182, 212, 0.12)',
            color: '#67e8f9',
            border: '1px solid rgba(6, 182, 212, 0.28)',
          }}
        >
          👁 {val}
        </span>
      )
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          borderRadius: 'var(--ca-radius-sm)',
          fontSize: 11,
          fontWeight: 600,
          background: 'rgba(239, 68, 68, 0.08)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        ✕ Denied
      </span>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        badge="FR06 ROLE-BASED ACCESS CONTROL · CastraVision Engine v4.2.1"
        title="Role Management & RBAC Permissions"
        subtitle="Review role definitions, manage privileges across Admin, Manager, and Member, and audit security boundaries."
        actions={
          <>
            <SecondaryButton onClick={() => notify?.('Multi-Factor Authentication policy is active for all Admin accounts.')} icon="🛡">
              MFA Policy
            </SecondaryButton>
            <button
              type="button"
              className="ca-btn"
              style={{
                background: 'rgba(99, 102, 241, 0.18)',
                color: '#c7d2fe',
                border: '1px solid rgba(99, 102, 241, 0.4)',
              }}
              onClick={() => notify?.('Security Audit Report generated and verified.')}
            >
              📄 Security Audit Report
            </button>
          </>
        }
      />

      {/* Destructive Action Protection Banner */}
      <NoticeBanner
        type="danger"
        icon="🛡"
        title="Destructive Action Protection Active"
        description="Removing a member or reassigning an Admin role requires explicit multi-factor verification and will be permanently committed to FR11 Audit Log."
        action={
          <SecondaryButton className="ca-btn-sm" onClick={() => notify?.('FR06 Policy Verification verified.')}>
            Verify Policy
          </SecondaryButton>
        }
      />

      {/* Three Role Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 28 }}>
        {/* Admin Card */}
        <div className="ca-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="ca-badge ca-badge-admin">ADMIN · HIGHEST PRIVILEGE</span>
              <span style={{ fontSize: 12, color: 'var(--ca-text-muted)' }}>👥 3 Members</span>
            </div>
            <h2 style={{ fontFamily: 'var(--ca-font-serif)', fontSize: 20, color: '#ffffff', margin: '0 0 8px 0' }}>
              Admin Role
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--ca-text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
              Full authority over workspace, user lifecycle, security settings, and financial approvals.
            </p>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              SCOPE PERMISSIONS
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--ca-text-secondary)' }}>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Create & Delete Workspaces</li>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Invite & Remove Members</li>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Modify Member Roles (RBAC)</li>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Approve, Reject & Edit Proposals (FR04)</li>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> View & Export Cryptographic Audit Log (FR11)</li>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Campaign Data Import & Normalization (FR08)</li>
            </ul>
          </div>
          <div style={{ padding: '8px 12px', background: 'var(--ca-bg-alt)', borderRadius: 'var(--ca-radius-md)', fontSize: 11.5, color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🛡</span> Guardrail: Cannot remove the last Admin.
          </div>
        </div>

        {/* Manager Card */}
        <div className="ca-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="ca-badge ca-badge-manager">MANAGER · GOVERNANCE</span>
              <span style={{ fontSize: 12, color: 'var(--ca-text-muted)' }}>👥 4 Members</span>
            </div>
            <h2 style={{ fontFamily: 'var(--ca-font-serif)', fontSize: 20, color: '#ffffff', margin: '0 0 8px 0' }}>
              Manager Role
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--ca-text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
              Operational supervisor responsible for reviewing and governing AI marketing outputs.
            </p>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              SCOPE PERMISSIONS
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--ca-text-secondary)' }}>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Review, Approve, Reject Proposals (FR04)</li>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Human-in-the-Loop Content & Budget Editing (FR04)</li>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Strategy Creation & Campaign Data Import</li>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> View Workspace Member List</li>
              <li style={{ color: 'var(--ca-text-muted)' }}><span style={{ color: '#ef4444' }}>✕</span> Cannot change roles or remove members</li>
              <li style={{ color: 'var(--ca-text-muted)' }}><span style={{ color: '#ef4444' }}>✕</span> Cannot delete workspace</li>
            </ul>
          </div>
          <div style={{ padding: '8px 12px', background: 'var(--ca-bg-alt)', borderRadius: 'var(--ca-radius-md)', fontSize: 11.5, color: '#67e8f9', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📜</span> Read-only access to FR11 cryptographic audits.
          </div>
        </div>

        {/* Member Card */}
        <div className="ca-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="ca-badge ca-badge-member">MEMBER · EXECUTION</span>
              <span style={{ fontSize: 12, color: 'var(--ca-text-muted)' }}>👥 7 Members</span>
            </div>
            <h2 style={{ fontFamily: 'var(--ca-font-serif)', fontSize: 20, color: '#ffffff', margin: '0 0 8px 0' }}>
              Member Role
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--ca-text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
              Marketing specialist and content creator executing campaigns and generating variants.
            </p>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              SCOPE PERMISSIONS
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--ca-text-secondary)' }}>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Business Profile Setup & Strategy (FR01, FR02)</li>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Content Generation & Prompt Tuning (FR03)</li>
              <li><strong style={{ color: '#38bdf8' }}>✓</strong> Campaign Data Import (FR08)</li>
              <li style={{ color: '#f87171' }}>🚫 ACCESS DENIED: Approval Queue (FR04)</li>
              <li style={{ color: '#f87171' }}>🚫 ACCESS DENIED: Audit Log & RBAC Config</li>
              <li style={{ color: 'var(--ca-text-muted)' }}><span style={{ color: '#ef4444' }}>✕</span> No administrative overrides permitted</li>
            </ul>
          </div>
          <div style={{ padding: '8px 12px', background: 'var(--ca-bg-alt)', borderRadius: 'var(--ca-radius-md)', fontSize: 11.5, color: 'var(--ca-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🔒</span> Sandbox isolation for non-approved models.
          </div>
        </div>
      </div>

      {/* Granular Capability Matrix Section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--ca-font-serif)', fontSize: 22, color: '#ffffff', margin: 0 }}>
              Granular Capability Matrix
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ca-text-secondary)', margin: '4px 0 0 0' }}>
              System enforcement rules applied per module endpoint across operational scopes.
            </p>
          </div>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, background: 'var(--ca-surface)', padding: 4, borderRadius: 'var(--ca-radius-md)', border: '1px solid var(--ca-border)' }}>
            {['All', 'Admin Tier', 'Governance', 'Execution'].map((tab) => (
              <button
                type="button"
                key={tab}
                className={`ca-btn ca-btn-sm ${activeScopeTab === tab ? 'ca-btn-primary' : 'ca-btn-subtle'}`}
                style={{ border: 'none', height: 26, fontSize: 11 }}
                onClick={() => setActiveScopeTab(tab)}
              >
                {tab === 'All' ? 'All Scopes (8)' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Table */}
        <div className="ca-table-wrap">
          <table className="ca-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>OPERATIONAL MODULE & CAPABILITY SCOPE</th>
                <th style={{ textAlign: 'center', width: '18%' }}>ADMIN ●</th>
                <th style={{ textAlign: 'center', width: '18%' }}>MANAGER ●</th>
                <th style={{ textAlign: 'center', width: '18%' }}>MEMBER ●</th>
              </tr>
            </thead>
            <tbody>
              {filteredCapabilities.map((row) => (
                <tr key={row.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: 15, color: '#a5b4fc', marginTop: 2 }}>{row.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong style={{ fontSize: 13, color: '#ffffff' }}>{row.name}</strong>
                          {row.badge && (
                            <span className="ca-badge ca-badge-admin" style={{ fontSize: 10 }}>
                              {row.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ca-text-muted)', marginTop: 2 }}>
                          {row.desc}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{renderStatusPill(row.admin)}</td>
                  <td style={{ textAlign: 'center' }}>{renderStatusPill(row.manager)}</td>
                  <td style={{ textAlign: 'center' }}>{renderStatusPill(row.member)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer HMAC Node Signature Verification Card */}
      <div
        style={{
          background: 'var(--ca-surface)',
          border: '1px solid var(--ca-border)',
          borderRadius: 'var(--ca-radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20, color: 'var(--ca-cyan)' }}>🔑</span>
          <div>
            <strong style={{ color: '#ffffff', fontSize: 13 }}>HMAC-SHA256 Node Signature Verification</strong>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--ca-text-muted)' }}>
              Every permission modification commits an immutable cryptographic event with payload hashing, epoch timestamp, and operator identifier.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, flexShrink: 0, textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ca-text-muted)', textTransform: 'uppercase' }}>ACTIVE WORKSPACE</div>
            <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 12, color: 'var(--ca-cyan)' }}>acme-corp-prod-01</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ca-text-muted)', textTransform: 'uppercase' }}>ROOT QUORUM</div>
            <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 12, color: 'var(--ca-success)' }}>1/3 Validated</div>
          </div>
        </div>
      </div>
    </div>
  )
}
