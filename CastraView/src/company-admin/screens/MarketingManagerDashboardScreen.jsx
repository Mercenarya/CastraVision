/**
 * MarketingManagerDashboardScreen.jsx — Marketing Manager Dashboard
 * Matches the approved Figma reference screenshot: company_admin_dashboard.jpg
 */

import { useState } from 'react'
import {
  IconBuilding,
  IconMembers,
  IconRoles,
  IconAudit,
  IconApprovals,
  IconSettings,
  IconUserPlus,
  IconLock,
  IconArrowRight,
} from '../ui/Icons'
import { INITIAL_WORKSPACE, INITIAL_PROPOSALS, INITIAL_AUDIT_LOGS } from '../mockData'

export default function MarketingManagerDashboardScreen({
  workspace = INITIAL_WORKSPACE,
  proposals = INITIAL_PROPOSALS,
  auditLogs = INITIAL_AUDIT_LOGS,
  onNavigate,
  onOpenInvite,
  notify,
}) {
  const [pendingList] = useState(
    proposals.filter((p) => p.status === 'pending' || p.status === 'edited')
  )

  // Use live/mock audit events with fallback to standard reference events
  const recentLogs = auditLogs && auditLogs.length > 0 ? auditLogs.slice(0, 4) : []

  // Map author initials for proposal cards
  function getInitials(name = '') {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('') || 'U'
    )
  }

  // Color classes for proposal avatar initials
  function getAvatarClass(id, type) {
    if (type === 'Budget') return 'ca-avatar-teal'
    if (id === 'PRP-8402') return 'ca-avatar-purple'
    return 'ca-avatar-indigo'
  }

  return (
    <div className="ca-dashboard-wrap">
      {/* ── 1. PAGE HEADER ── */}
      <div className="ca-dashboard-header">
        <div className="ca-dashboard-title-group">
          {/* Top Pill Indicator */}
          <div className="ca-dashboard-pill">
            <span className="ca-pill-dot" />
            <span>WORKSPACE GOVERNANCE • MARKETING MANAGER CONSOLE</span>
          </div>

          <h1 className="ca-dashboard-title">Marketing Manager Dashboard</h1>
          <p className="ca-dashboard-subtitle">
            Governing {workspace.name} enterprise workspace, member privileges,
            proposal approvals, and compliance audit trail.
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="ca-dashboard-actions">
          <button
            type="button"
            className="ca-btn ca-btn-purple"
            onClick={onOpenInvite}
          >
            <IconUserPlus size={16} />
            <span>+ Invite Member</span>
          </button>

          <button
            type="button"
            className="ca-btn ca-btn-secondary"
            onClick={() => onNavigate('roles')}
          >
            <IconRoles size={16} />
            <span>Manage Roles</span>
          </button>

          <button
            type="button"
            className="ca-btn ca-btn-secondary"
            onClick={() => onNavigate('profile')}
          >
            <IconSettings size={16} />
            <span>Workspace Settings</span>
          </button>
        </div>
      </div>

      {/* ── 2. 4 KPI SUMMARY CARDS ── */}
      <div className="ca-kpi-grid">
        {/* Card 1: Current Workspace */}
        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">CURRENT WORKSPACE</span>
            <div className="ca-kpi-icon-box ca-icon-box-teal">
              <IconBuilding size={16} />
            </div>
          </div>
          <div className="ca-kpi-main">
            <div className="ca-kpi-val">{workspace.name}</div>
          </div>
          <div className="ca-kpi-bottom-row">
            <span className="ca-kpi-mono">{workspace.id || 'wks_acme_89f0e21a'}</span>
            <span className="ca-kpi-badge-purple">Enterprise</span>
          </div>
        </div>

        {/* Card 2: Workspace Members */}
        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">WORKSPACE MEMBERS</span>
            <div className="ca-kpi-icon-box ca-icon-box-blue">
              <IconMembers size={16} />
            </div>
          </div>
          <div className="ca-kpi-main">
            <div className="ca-kpi-val-row">
              <span className="ca-kpi-val">{workspace.totalMembers - 1 || 13} Active</span>
              <span className="ca-kpi-subval">/ {workspace.totalMembers || 14} Total</span>
            </div>
          </div>
          <div className="ca-kpi-bottom-row">
            <span className="ca-kpi-text-muted">
              {workspace.adminCount || 3} Marketing Managers · {workspace.managerCount || 4} Leaders · {workspace.memberCount || 7} Employees
            </span>
            <button
              type="button"
              className="ca-kpi-link-btn"
              onClick={() => onNavigate('members')}
            >
              Manage →
            </button>
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">PENDING APPROVALS</span>
            <div className="ca-kpi-icon-box ca-icon-box-cyan">
              <IconApprovals size={16} />
            </div>
          </div>
          <div className="ca-kpi-main ca-kpi-main-stacked">
            <div>
              <div className="ca-kpi-val ca-kpi-val-cyan">{pendingList.length}</div>
              <div className="ca-kpi-val ca-kpi-val-cyan-sub">Proposals</div>
            </div>
            <span className="ca-badge-action-req">Action Req.</span>
          </div>
          <div className="ca-kpi-bottom-row">
            <span className="ca-kpi-text-muted">2 Content · 1 Budget</span>
            <button
              type="button"
              className="ca-kpi-link-btn"
              onClick={() => onNavigate('approvals')}
            >
              Queue →
            </button>
          </div>
        </div>

        {/* Card 4: Audit Events (30D) */}
        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">AUDIT EVENTS (30D)</span>
            <div className="ca-kpi-icon-box ca-icon-box-slate">
              <IconAudit size={16} />
            </div>
          </div>
          <div className="ca-kpi-main">
            <div className="ca-kpi-val-row">
              <span className="ca-kpi-val">38 Events</span>
              <span className="ca-kpi-subval">142 Total</span>
            </div>
          </div>
          <div className="ca-kpi-bottom-row">
            <span className="ca-kpi-text-muted">Latest: Just now</span>
            <button
              type="button"
              className="ca-kpi-link-btn"
              onClick={() => onNavigate('audit')}
            >
              Log →
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. MIDDLE CARD: WORKSPACE SCOPE & OPERATIONAL HEALTH ── */}
      <section className="ca-card ca-health-card">
        {/* Card Header */}
        <div className="ca-health-header">
          <div className="ca-health-header-left">
            <div className="ca-health-icon-box">
              <IconRoles size={18} />
            </div>
            <div>
              <div className="ca-health-title-row">
                <h2 className="ca-health-title">Workspace Scope & Operational Health</h2>
                <span className="ca-badge-tenant-pill">Strict Tenant Isolation</span>
              </div>
              <p className="ca-health-subtitle">
                Authenticated session under Acme Corp isolated partition (acme-ent-01)
              </p>
            </div>
          </div>

          <div className="ca-enclave-badge">
            <span className="ca-enclave-dot" />
            <span>Enclave Security Verified</span>
          </div>
        </div>

        {/* 4-Tile Health Metrics Grid */}
        <div className="ca-health-grid">
          {/* Tile 1: Organization Entity */}
          <div className="ca-health-tile">
            <div className="ca-tile-label">ORGANIZATION ENTITY</div>
            <div className="ca-tile-value">{workspace.fullName || 'Acme Global Holdings Inc.'}</div>
            <div className="ca-tile-subtext">US-East Primary Realm</div>
          </div>

          {/* Tile 2: Provisioned Tier */}
          <div className="ca-health-tile">
            <div className="ca-tile-label">PROVISIONED TIER</div>
            <div className="ca-tile-value-row">
              <span className="ca-tile-value">Enterprise Max</span>
              <span className="ca-badge-unlimited">UNLIMITED</span>
            </div>
            <div className="ca-tile-subtext">Single-Tenant Dedicated</div>
          </div>

          {/* Tile 3: Authenticated Actor */}
          <div className="ca-health-tile">
            <div className="ca-tile-label">AUTHENTICATED ACTOR</div>
            <div className="ca-tile-value">Sarah Jenkins</div>
            <div className="ca-tile-subtext ca-text-actor">Marketing Manager (Primary)</div>
          </div>

          {/* Tile 4: Seat Utilization */}
          <div className="ca-health-tile">
            <div className="ca-tile-header-row">
              <span className="ca-tile-label">SEAT UTILIZATION</span>
              <span className="ca-tile-seat-stat">14 / 50 (28%)</span>
            </div>
            <div className="ca-progress-track">
              <div className="ca-progress-fill" style={{ width: '28%' }} />
            </div>
            <div className="ca-tile-subtext">36 Available Member Seats</div>
          </div>
        </div>

        {/* Policy Rule Row */}
        <div className="ca-policy-row">
          <div className="ca-policy-content">
            <IconLock size={15} className="ca-policy-lock" />
            <span>
              <strong>Policy Rule:</strong> Last Marketing Manager cannot be removed, demoted, or deactivated.
            </span>
          </div>

          {/* 3 Quick Action Buttons */}
          <div className="ca-policy-buttons">
            <button
              type="button"
              className="ca-btn ca-btn-secondary ca-btn-sm"
              onClick={() => onNavigate('members')}
            >
              <IconMembers size={14} />
              <span>Manage Members</span>
            </button>
            <button
              type="button"
              className="ca-btn ca-btn-secondary ca-btn-sm"
              onClick={() => onNavigate('roles')}
            >
              <IconRoles size={14} />
              <span>Role Matrix</span>
            </button>
            <button
              type="button"
              className="ca-btn ca-btn-secondary ca-btn-sm"
              onClick={() => onNavigate('profile')}
            >
              <IconSettings size={14} />
              <span>Workspace Settings</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 4. SPLIT GRID (LEFT: APPROVAL QUEUE / RIGHT: AUDIT TRAIL) ── */}
      <div className="ca-dashboard-split">
        {/* ── LEFT COLUMN: PENDING APPROVALS (FR04) ── */}
        <section className="ca-card ca-split-card">
          {/* Card Header */}
          <div className="ca-split-header">
            <div className="ca-split-header-left">
              <div className="ca-split-icon ca-split-icon-cyan">
                <IconApprovals size={18} />
              </div>
              <div>
                <div className="ca-split-title-row">
                  <h2 className="ca-split-title">Pending Approvals (FR04)</h2>
                  <span className="ca-badge-pending-pill">{pendingList.length} Pending Review</span>
                </div>
                <p className="ca-split-subtitle">
                  Stage gate approval required before downstream launch
                </p>
              </div>
            </div>

            <button
              type="button"
              className="ca-section-link-btn"
              onClick={() => onNavigate('approvals')}
            >
              <span>View Queue</span>
              <IconArrowRight size={13} />
            </button>
          </div>

          {/* Proposal Items List */}
          <div className="ca-proposal-list">
            {pendingList.slice(0, 3).map((item) => {
              const initials = getInitials(item.author)
              const avatarClass = getAvatarClass(item.id, item.type)
              const isEdited = item.status === 'edited' || item.id === 'PRP-8404'

              return (
                <div key={item.id} className="ca-proposal-item">
                  <div className="ca-proposal-main">
                    {/* Author Avatar Circle */}
                    <div className={`ca-proposal-avatar ${avatarClass}`}>
                      {initials}
                    </div>

                    {/* Proposal Details */}
                    <div className="ca-proposal-info">
                      <div className="ca-proposal-title-row">
                        <span className="ca-proposal-name">{item.name}</span>
                        <span className="ca-ref-badge">{item.id}</span>
                        {item.type === 'Budget' && (
                          <span className="ca-type-badge ca-type-budget">Budget</span>
                        )}
                      </div>

                      <div className="ca-proposal-badges-row">
                        {item.type === 'Content' && (
                          <span className="ca-type-badge ca-type-content">Content</span>
                        )}
                        {isEdited && (
                          <span className="ca-type-badge ca-type-edited">Modified v2</span>
                        )}
                      </div>

                      <div className="ca-proposal-meta">
                        Author: {item.author} • {item.createdDate ? item.createdDate.split('UTC')[0] : 'Oct 24, 14:32'} UTC
                      </div>
                    </div>
                  </div>

                  {/* Review CTA Button */}
                  <button
                    type="button"
                    className="ca-btn ca-btn-purple ca-btn-sm ca-review-btn"
                    onClick={() => {
                      onNavigate('approvals')
                      notify?.(`Opening proposal ${item.id} for review.`)
                    }}
                  >
                    Review
                  </button>
                </div>
              )
            })}
          </div>

          {/* Bottom Full-Width Queue Link */}
          <button
            type="button"
            className="ca-wide-cta-btn"
            onClick={() => onNavigate('approvals')}
          >
            <IconRoles size={15} />
            <span>View All 6 Proposals in Approval Queue</span>
            <IconArrowRight size={14} />
          </button>
        </section>

        {/* ── RIGHT COLUMN: AUDIT TRAIL (FR11) ── */}
        <section className="ca-card ca-split-card">
          {/* Card Header */}
          <div className="ca-split-header">
            <div className="ca-split-header-left">
              <div className="ca-split-icon ca-split-icon-slate">
                <IconAudit size={18} />
              </div>
              <div>
                <div className="ca-split-title-row">
                  <h2 className="ca-split-title">Audit Trail (FR11)</h2>
                  <span className="ca-audit-glowing-dot" title="Live Log Stream" />
                </div>
                <p className="ca-split-subtitle">Real-time cryptographic audit events</p>
              </div>
            </div>

            <button
              type="button"
              className="ca-section-link-btn"
              onClick={() => onNavigate('audit')}
            >
              <span>View Log</span>
              <IconArrowRight size={13} />
            </button>
          </div>

          {/* Audit Event Items List */}
          <div className="ca-audit-list">
            {[
              {
                id: recentLogs[0]?.id || 'LOG-9402',
                type: 'green',
                action: 'Proposal Approved',
                time: '14:35 UTC',
                desc: 'Authorized Q3 Activewear Omnichannel Copy v1.0 promotion into production pipeline.',
                actor: 'By: Sarah Jenkins (Marketing Manager)',
                ref: 'PRP-8402',
              },
              {
                id: recentLogs[1]?.id || 'LOG-9401',
                type: 'red',
                action: 'Proposal Rejected',
                time: '14:10 UTC',
                desc: 'Reason: Content Tone / Brand Inconsistency feedback recorded.',
                actor: 'By: Sarah Jenkins (Marketing Manager)',
                ref: 'PRP-8395',
              },
              {
                id: recentLogs[2]?.id || 'LOG-9398',
                type: 'cyan',
                action: 'Proposal Edited',
                time: '13:58 UTC',
                desc: 'Revised Holiday Email headline and CTA parameters into version v1.1.',
                actor: 'By: David Kross (Leader)',
                ref: 'PRP-8404',
              },
              {
                id: recentLogs[3]?.id || 'LOG-9395',
                type: 'purple',
                action: 'Member Invited',
                time: '11:05 UTC',
                desc: 'Dispatched Leader role invitation with 7-day auth token.',
                actor: 'By: Sarah Jenkins (Marketing Manager)',
                ref: 'marcus.cole@acmecorp.com',
              },
            ].map((event) => (
              <div key={event.id} className="ca-audit-item">
                <div className="ca-audit-top">
                  <span className={`ca-audit-pill ca-audit-pill-${event.type}`}>
                    <span className="ca-audit-dot" />
                    <span>{event.action}</span>
                  </span>
                  <span className="ca-audit-time">{event.time}</span>
                </div>
                <div className="ca-audit-desc">{event.desc}</div>
                <div className="ca-audit-meta">
                  <span className="ca-audit-actor">{event.actor}</span>
                  <span className="ca-audit-ref">{event.ref}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Full-Width Audit Log Link */}
          <button
            type="button"
            className="ca-wide-cta-btn"
            onClick={() => onNavigate('audit')}
          >
            <IconAudit size={15} />
            <span>View Full Audit Log (142 Events)</span>
            <IconArrowRight size={14} />
          </button>
        </section>
      </div>
    </div>
  )
}
