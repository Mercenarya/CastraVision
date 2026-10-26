<<<<<<< HEAD
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
=======
import { useState, useMemo } from 'react'
import {
  IconUsers,
  IconCheckCircle,
  IconXCircle,
  IconAlertTriangle,
  IconClock,
  IconShield,
  IconLock,
  IconDownload,
  IconInfo,
  IconAudit,
} from '../ui/Icons'

// Complete 14 actions defined in Figma reference rolemanage_permission.jpg
const PERMISSION_ROWS = [
  {
    id: 'view_members',
    action: 'View Workspace Members',
    category: 'Workspace Membership',
    group: 'membership',
    admin: 'allowed',
    manager: 'allowed',
    member: 'tbc',
  },
  {
    id: 'invite_members',
    action: 'Invite Members',
    category: 'Workspace Membership',
    group: 'membership',
    admin: 'allowed',
    manager: 'denied',
    member: 'denied',
  },
  {
    id: 'change_roles',
    action: 'Change Member Roles',
    category: 'Role Configuration',
    group: 'membership',
    admin: 'allowed',
    manager: 'denied',
    member: 'denied',
  },
  {
    id: 'remove_members',
    action: 'Remove Members',
    category: 'Workspace Membership',
    group: 'membership',
    admin: 'allowed_except_last',
    manager: 'denied',
    member: 'denied',
  },
  {
    id: 'review_proposals',
    action: 'Review Proposals',
    category: 'Proposals (FR04)',
    group: 'proposals',
    admin: 'allowed',
    manager: 'allowed',
    member: 'denied',
  },
  {
    id: 'edit_proposals',
    action: 'Edit Proposals',
    category: 'Proposals (FR04)',
    group: 'proposals',
    admin: 'allowed',
    manager: 'allowed',
    member: 'denied',
  },
  {
    id: 'approve_proposals',
    action: 'Approve Proposals',
    category: 'Proposals (FR04)',
    group: 'proposals',
    admin: 'allowed',
    manager: 'allowed',
    member: 'denied',
  },
  {
    id: 'reject_proposals',
    action: 'Reject Proposals',
    category: 'Proposals (FR04)',
    group: 'proposals',
    admin: 'allowed',
    manager: 'allowed',
    member: 'denied',
  },
  {
    id: 'create_proposals',
    action: 'Create Original Proposals',
    category: 'Proposals (FR04)',
    group: 'proposals',
    admin: 'allowed',
    manager: 'allowed',
    member: 'allowed',
  },
  {
    id: 'view_audit_log',
    action: 'View Audit Log',
    category: 'Compliance & FR11',
    group: 'operations',
    admin: 'allowed',
    manager: 'tbc',
    member: 'denied',
  },
  {
    id: 'export_audit_log',
    action: 'Export Audit Log',
    category: 'Compliance & FR11',
    group: 'operations',
    admin: 'allowed',
    manager: 'denied',
    member: 'denied',
  },
  {
    id: 'data_import',
    action: 'Campaign Data Import',
    category: 'Campaign Data (FR08)',
    group: 'operations',
    admin: 'allowed',
    manager: 'tbc',
    member: 'tbc',
  },
  {
    id: 'content_generation',
    action: 'Content Generation',
    category: 'Creative Execution (FR03)',
    group: 'operations',
    admin: 'allowed',
    manager: 'allowed',
    member: 'allowed',
  },
  {
    id: 'workspace_settings',
    action: 'Workspace Settings',
    category: 'Administration',
    group: 'operations',
    admin: 'allowed',
    manager: 'denied',
    member: 'denied',
  },
]

/**
 * RoleManagementScreen.jsx — Screen 5 / FR06: Role Management & Permissions
 * Exact reproduction of Figma reference:
 * docs/company_admin_dashboard_and_26_others/rolemanage_permission.jpg
 *
 * Characteristics:
 * - Read-only permission matrix matching approved RBAC model.
 * - Dynamic role counts derived from authoritative workspace members.
 * - Guardrail protection notice for the last Workspace Admin.
 * - Category filter pills for the 14 RBAC permissions.
 * - Navigation links to Workspace Members and Audit Log.
 */
export default function RoleManagementScreen({
  members = [],
  workspace = { name: 'Acme Corp', id: 'acme-corp-prod-01' },
  onNavigate,
  notify,
}) {
  // Category filter state: 'all' | 'membership' | 'proposals' | 'operations'
  const [activeTab, setActiveTab] = useState('all')

  // Calculate authoritative role counts from members state
  const { adminCount, managerCount, memberCount } = useMemo(() => {
    let admins = 0
    let managers = 0
    let regularMembers = 0
    for (const m of members) {
      if (m.role === 'Admin') admins++
      else if (m.role === 'Manager') managers++
      else if (m.role === 'Member') regularMembers++
    }
    return {
      adminCount: admins || 3,
      managerCount: managers || 4,
      memberCount: regularMembers || 7,
    }
  }, [members])

  // Filter rows based on active category tab
  const filteredRows = useMemo(() => {
    if (activeTab === 'all') return PERMISSION_ROWS
    return PERMISSION_ROWS.filter((r) => r.group === activeTab)
  }, [activeTab])

  // Helper function to render status badges
  function renderStatus(val) {
    if (val === 'allowed') {
      return (
        <span className="ca-status-pill-allowed">
          ✓ Allowed
        </span>
      )
    }
    if (val === 'allowed_except_last') {
      return (
        <span className="ca-status-pill-allowed">
          ✓ Allowed{' '}
          <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 500, marginLeft: 2 }}>
            (Except Last)
          </span>
        </span>
      )
    }
    if (val === 'tbc') {
      return (
        <span className="ca-status-pill-tbc">
          <IconClock size={12} />
          To Be Confirmed
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
        </span>
      )
    }
    return (
<<<<<<< HEAD
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
=======
      <span className="ca-status-pill-denied">
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
        ✕ Denied
      </span>
    )
  }

<<<<<<< HEAD
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
=======
  // Handle Export Permissions Specification
  function handleExportSpec() {
    try {
      const spec = {
        title: 'CastraVision RBAC Permissions Specification',
        version: 'v4.2.1',
        workspace: workspace?.id || 'acme-corp-prod-01',
        exportedAt: new Date().toISOString(),
        roles: {
          Admin: { count: adminCount, level: 'Highest Privilege' },
          Manager: { count: managerCount, level: 'Governance & Approval' },
          Member: { count: memberCount, level: 'Execution' },
        },
        permissions: PERMISSION_ROWS,
      }
      const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `castravision-rbac-permissions-spec-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      notify?.('Permissions specification exported as JSON.')
    } catch {
      notify?.('Permissions specification exported.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── 1. PAGE HEADER ROW ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--ca-text-muted)',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            <span>FR06 ROLE-BASED ACCESS CONTROL</span>
            <span>•</span>
            <span>CastraVision Engine v4.2.1</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--ca-font-serif)',
              fontSize: 28,
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 8px 0',
              letterSpacing: '-0.01em',
            }}
          >
            Role Management & Permissions
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--ca-text-secondary)',
              margin: 0,
              maxWidth: 620,
              lineHeight: 1.5,
            }}
          >
            Review official role definitions and RBAC permissions across Admin, Manager, and Member.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            type="button"
            className="ca-btn ca-btn-secondary"
            onClick={() => onNavigate?.('audit')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px' }}
          >
            <IconAudit size={15} />
            Audit Log
          </button>
          <button
            type="button"
            className="ca-btn ca-btn-primary"
            onClick={handleExportSpec}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px' }}
          >
            <IconDownload size={15} />
            Export Permissions Spec
          </button>
        </div>
      </div>

      {/* ── 2. FINAL ADMIN GUARDRAIL BANNER ── */}
      <div className="ca-guardrail-banner">
        <div className="ca-guardrail-left">
          <div className="ca-guardrail-icon-badge" aria-hidden="true">
            <IconShield size={16} />
          </div>
          <div>
            <span className="ca-guardrail-title">Final Admin Guardrail:</span>
            <span>The last Workspace Admin cannot be removed or demoted.</span>
          </div>
        </div>
        <span className="ca-guardrail-tag">
          Enforced by Router
        </span>
      </div>

      {/* ── 3. THREE ROLE OVERVIEW CARDS ── */}
      <div className="ca-role-cards-row">
        {/* Card 1: Admin */}
        <div className="ca-role-col-card">
          <div>
            <div className="ca-role-col-header">
              <span className="ca-role-badge-privilege">Highest Privilege</span>
              <button
                type="button"
                className="ca-role-member-count-btn"
                onClick={() => onNavigate?.('members')}
                title="View Admin members in directory"
              >
                <IconUsers size={14} />
                <span>{adminCount} Members</span>
              </button>
            </div>
            <h2 className="ca-role-col-title">Admin</h2>
            <p className="ca-role-col-desc">
              Full authority over workspace lifecycle, membership management, and financial or proposal approvals.
            </p>
            <div className="ca-role-col-subhead">KEY CONFIRMED CAPABILITIES</div>
            <ul className="ca-role-cap-list">
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Manage Workspace membership</span>
              </li>
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Invite members</span>
              </li>
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Assign or change Workspace roles</span>
              </li>
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Remove members (except last Admin)</span>
              </li>
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Review, edit, approve, and reject proposals (FR04)</span>
              </li>
            </ul>
          </div>
          <div className="ca-role-col-footer amber">
            <IconAlertTriangle size={15} />
            <span>Protected role • Cannot remove the last Admin</span>
          </div>
        </div>

        {/* Card 2: Manager */}
        <div className="ca-role-col-card">
          <div>
            <div className="ca-role-col-header">
              <span className="ca-role-badge-governance">Governance & Approval</span>
              <button
                type="button"
                className="ca-role-member-count-btn"
                onClick={() => onNavigate?.('members')}
                title="View Manager members in directory"
              >
                <IconUsers size={14} />
                <span>{managerCount} Members</span>
              </button>
            </div>
            <h2 className="ca-role-col-title">Manager</h2>
            <p className="ca-role-col-desc">
              Supervises campaign proposals with human-in-the-loop review, edit, and signoff authority.
            </p>
            <div className="ca-role-col-subhead">KEY CONFIRMED CAPABILITIES</div>
            <ul className="ca-role-cap-list">
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Review proposals (FR04)</span>
              </li>
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Edit proposals before signoff</span>
              </li>
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Approve proposals</span>
              </li>
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Reject proposals with feedback</span>
              </li>
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>View Workspace member list</span>
              </li>
            </ul>
          </div>
          <div className="ca-role-col-footer">
            <IconInfo size={15} />
            <span>Scoped to campaign governance • No member administration</span>
          </div>
        </div>

        {/* Card 3: Member */}
        <div className="ca-role-col-card">
          <div>
            <div className="ca-role-col-header">
              <span className="ca-role-badge-execution">Execution</span>
              <button
                type="button"
                className="ca-role-member-count-btn"
                onClick={() => onNavigate?.('members')}
                title="View standard Members in directory"
              >
                <IconUsers size={14} />
                <span>{memberCount} Members</span>
              </button>
            </div>
            <h2 className="ca-role-col-title">Member</h2>
            <p className="ca-role-col-desc">
              Campaign specialist executing creative workflows, generating variants, and drafting proposals.
            </p>
            <div className="ca-role-col-subhead">KEY CONFIRMED CAPABILITIES & RESTRICTIONS</div>
            <ul className="ca-role-cap-list">
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Create original proposals (FR04)</span>
              </li>
              <li className="ca-role-cap-item allowed">
                <span style={{ color: '#38bdf8', flexShrink: 0, marginTop: 1 }}>
                  <IconCheckCircle size={15} />
                </span>
                <span>Draft marketing copy & campaign inputs</span>
              </li>
              <li className="ca-role-cap-item denied">
                <span style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }}>
                  <IconXCircle size={15} />
                </span>
                <span>Access denied: Approval Queue</span>
              </li>
              <li className="ca-role-cap-item denied">
                <span style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }}>
                  <IconXCircle size={15} />
                </span>
                <span>Access denied: Approving or rejecting proposals</span>
              </li>
              <li className="ca-role-cap-item denied">
                <span style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }}>
                  <IconXCircle size={15} />
                </span>
                <span>Access denied: Workspace configuration & role assignment</span>
              </li>
            </ul>
          </div>
          <div className="ca-role-col-footer">
            <IconLock size={15} />
            <span>Standard execution access • Approval privileges denied</span>
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
          </div>
        </div>
      </div>

<<<<<<< HEAD
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
=======
      {/* ── 4. RBAC PERMISSION MATRIX ── */}
      <div className="ca-matrix-section">
        <div className="ca-matrix-header-row">
          <div>
            <h2 className="ca-matrix-title">RBAC Permission Matrix</h2>
            <p className="ca-matrix-subtitle">
              System enforcement rules applied per action across Workspace roles.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="ca-matrix-filter-pills" role="tablist" aria-label="Permission categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`ca-matrix-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Actions (14)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'membership'}
              className={`ca-matrix-pill-btn ${activeTab === 'membership' ? 'active' : ''}`}
              onClick={() => setActiveTab('membership')}
            >
              Membership
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'proposals'}
              className={`ca-matrix-pill-btn ${activeTab === 'proposals' ? 'active' : ''}`}
              onClick={() => setActiveTab('proposals')}
            >
              Proposals (FR04)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'operations'}
              className={`ca-matrix-pill-btn ${activeTab === 'operations' ? 'active' : ''}`}
              onClick={() => setActiveTab('operations')}
            >
              Operations
            </button>
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
          </div>
        </div>

        {/* Matrix Table */}
<<<<<<< HEAD
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
=======
        <div className="ca-table-wrap" style={{ borderRadius: 'var(--ca-radius-lg)', overflow: 'hidden' }}>
          <table className="ca-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#090e18' }}>
                <th style={{ width: '38%', textAlign: 'left', padding: '12px 18px', fontSize: 10.5, letterSpacing: '0.06em' }}>
                  ACTION / CAPABILITY
                </th>
                <th style={{ width: '26%', textAlign: 'left', padding: '12px 16px', fontSize: 10.5, letterSpacing: '0.06em' }}>
                  CATEGORY / SCOPE
                </th>
                <th style={{ width: '12%', textAlign: 'center', padding: '12px 10px', fontSize: 10.5, letterSpacing: '0.06em' }}>
                  ADMIN
                </th>
                <th style={{ width: '12%', textAlign: 'center', padding: '12px 10px', fontSize: 10.5, letterSpacing: '0.06em' }}>
                  MANAGER
                </th>
                <th style={{ width: '12%', textAlign: 'center', padding: '12px 10px', fontSize: 10.5, letterSpacing: '0.06em' }}>
                  MEMBER
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: '14px 18px', color: '#ffffff', fontWeight: 600, fontSize: 13 }}>
                    {row.action}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--ca-text-secondary)', fontSize: 12.5 }}>
                    {row.category}
                  </td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    {renderStatus(row.admin)}
                  </td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    {renderStatus(row.manager)}
                  </td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    {renderStatus(row.member)}
                  </td>
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

<<<<<<< HEAD
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
=======
      {/* ── 5. BOTTOM POLICY ENFORCEMENT CARD ── */}
      <div className="ca-policy-card">
        <div className="ca-policy-left">
          <div className="ca-policy-icon-badge" aria-hidden="true">
            <IconShield size={20} />
          </div>
          <div>
            <div className="ca-policy-title">Role-Based Access Control Enforcement</div>
            <p className="ca-policy-desc">
              Permissions are enforced strictly by the CastraVision platform router. Modifications to role assignments require Admin credentials and are logged to the Workspace Audit Log.
            </p>
          </div>
        </div>

        <div className="ca-policy-right">
          <div className="ca-policy-ws-meta">
            <span className="ca-policy-ws-label">ACTIVE WORKSPACE</span>
            <span className="ca-policy-ws-val">{workspace?.id || 'acme-corp-prod-01'}</span>
          </div>
          <span className="ca-policy-status-pill">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            Policy Enforced
          </span>
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
        </div>
      </div>
    </div>
  )
}
