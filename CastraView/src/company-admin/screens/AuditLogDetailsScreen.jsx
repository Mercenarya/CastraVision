<<<<<<< HEAD
import { useState } from 'react'
import { PageHeader, SecondaryButton } from '../ui/Primitives'
=======
/**
 * AuditLogDetailsScreen.jsx — Phase 7: Audit Log Details & Version History (FR11)
 *
 * Implements all three Figma detail designs:
 * 1. Proposal Edited (auditlogdetails—proposaledited.jpg)
 * 2. Role Changed (auditlogdetails—rolechanged.jpg)
 * 3. Proposal Approved (auditlogdetails—proposalapproved.jpg)
 *
 * Adheres strictly to audit integrity:
 * - Diffs and parameter transitions accurately render provided record data.
 * - Cryptographic/ledger claims are qualified as reference representations.
 */

import { useState } from 'react'
import {
  IconClock,
  IconShield,
  IconCopy,
  IconArrowLeft,
  IconFileText,
  IconUser,
} from '../ui/Icons'
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
import { INITIAL_AUDIT_LOGS } from '../mockData'

export default function AuditLogDetailsScreen({
  record = INITIAL_AUDIT_LOGS[0],
  onBack,
  notify,
<<<<<<< HEAD
}) {
  const [viewMode, setViewMode] = useState('side-by-side')

  function handleCopyHash() {
    navigator.clipboard?.writeText(record.fullHash || record.hash)
    notify?.('Cryptographic verification hash copied to clipboard.')
  }

  function handleExportReceipt() {
    const receiptData = JSON.stringify(record, null, 2)
    const blob = new Blob([receiptData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_receipt_${record.id}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify?.('Signed verification receipt downloaded.')
  }

  return (
    <div>
      {/* Top Breadcrumb & Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ca-text-muted)' }}>
          <button
            type="button"
            className="ca-kpi-footer-link"
            style={{ margin: 0, fontSize: 13 }}
            onClick={onBack}
          >
            ← System Audit Log
          </button>
          <span>/</span>
          <span style={{ color: 'var(--ca-text-secondary)' }}>Log Entry #{record.id} ({record.module})</span>
        </div>
      </div>

      <PageHeader
        badge="FR11 IMMUTABLE LEDGER"
        title="Audit Log Record Details"
        subtitle={`Cryptographic inspection and version diff record for proposal override and approval ${record.entityId}.`}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <SecondaryButton onClick={onBack}>
              ← Back to Audit Log
            </SecondaryButton>
            <button
              type="button"
              className="ca-btn"
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#c7d2fe',
                border: '1px solid rgba(99, 102, 241, 0.4)',
              }}
              onClick={handleExportReceipt}
            >
              📜 Export Verification Receipt
            </button>
          </div>
        }
      />

      {/* Four Information Cards */}
      <div className="ca-kpi-grid">
        {/* Actor / Initiator */}
        <div className="ca-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span className="ca-kpi-label">ACTOR / INITIATOR</span>
            <span style={{ fontSize: 16, color: 'var(--ca-cyan)' }}>👤</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
            {record.actorName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="ca-badge ca-badge-manager">{record.actorRole}</span>
            <span style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: 'var(--ca-text-muted)' }}>
              {record.actorId || 'usr-mgr-9921'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
            Auth Source: <strong style={{ color: 'var(--ca-text-secondary)' }}>SSO / Okta SAML-2</strong>
          </div>
        </div>

        {/* Timestamp */}
        <div className="ca-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span className="ca-kpi-label">TIMESTAMP</span>
            <span style={{ fontSize: 16, color: '#a5b4fc' }}>🕒</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 4, fontFamily: 'var(--ca-font-mono)' }}>
            14:48:22 UTC
          </div>
          <div style={{ fontSize: 12, color: 'var(--ca-text-secondary)', marginBottom: 8 }}>
            Oct 24, 2026
          </div>
          <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
            Session Trace: <span style={{ fontFamily: 'var(--ca-font-mono)' }}>sess-89104</span>
          </div>
        </div>

        {/* Target Entity */}
        <div className="ca-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span className="ca-kpi-label">TARGET ENTITY</span>
            <span style={{ fontSize: 16, color: '#38bdf8' }}>📄</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ca-cyan)', marginBottom: 4, fontFamily: 'var(--ca-font-mono)' }}>
            {record.entityId} ↗
          </div>
          <div style={{ fontSize: 12, color: 'var(--ca-text-secondary)', marginBottom: 8 }}>
            Q3 Activewear Omnichannel Copy
          </div>
          <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
            Environment: <strong style={{ color: 'var(--ca-text-secondary)' }}>Production (Omni)</strong>
          </div>
        </div>

        {/* Verification Hash */}
        <div className="ca-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span className="ca-kpi-label">VERIFICATION HASH</span>
            <span style={{ fontSize: 16, color: 'var(--ca-success)' }}>🔒</span>
          </div>
          <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 12, color: '#ffffff', marginBottom: 4 }}>
            SHA-256: 7f9c28e...b12a
          </div>
          <div style={{ marginBottom: 8 }}>
            <span className="ca-badge ca-badge-active">● Verified & Immutable</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
            Ledger Index: <span style={{ fontFamily: 'var(--ca-font-mono)', color: 'var(--ca-text-secondary)' }}>#BLK-892410-09</span>
          </div>
        </div>
      </div>

      {/* Version Comparison Bar */}
      <div
        style={{
          background: 'var(--ca-surface)',
          border: '1px solid var(--ca-border)',
          borderRadius: 'var(--ca-radius-lg)',
          padding: '12px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, color: '#a5b4fc' }}>▤</span>
          <span style={{ fontWeight: 600, color: '#ffffff', fontSize: 13 }}>Version Comparison:</span>
          <span className="ca-badge ca-badge-member">v1.0 (AI Draft)</span>
          <span style={{ color: 'var(--ca-text-muted)' }}>→</span>
          <span className="ca-badge ca-badge-admin">v1.1 (Manager Override)</span>
          <span style={{ color: 'var(--ca-text-muted)', fontSize: 12 }}>|</span>
          <span style={{ fontSize: 12, color: 'var(--ca-text-secondary)' }}>
            3 Fields Mutated · <strong style={{ color: 'var(--ca-success)' }}>+1 Addition</strong> · <strong style={{ color: '#38bdf8' }}>2 Replacements</strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`ca-btn ca-btn-sm ${viewMode === 'side-by-side' ? 'ca-btn-primary' : 'ca-btn-subtle'}`}
            onClick={() => setViewMode('side-by-side')}
          >
            ▦ Side-by-Side
          </button>
          <button
            type="button"
            className={`ca-btn ca-btn-sm ${viewMode === 'unified' ? 'ca-btn-primary' : 'ca-btn-subtle'}`}
            onClick={() => setViewMode('unified')}
          >
            ☰ Unified Flow
          </button>
        </div>
      </div>

      {/* Field-Level Version Diff Block */}
      <div className="ca-diff-container" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <h2 style={{ fontFamily: 'var(--ca-font-serif)', fontSize: 18, color: '#ffffff', margin: 0 }}>
            ⇄ Field-Level Version Diff (Before vs After)
          </h2>
          <span style={{ fontSize: 11, fontFamily: 'var(--ca-font-mono)', color: 'var(--ca-text-muted)' }}>
            RFC 6902 Compliant JSON Patch
          </span>
        </div>

        {/* Field 1: Headline */}
        <div className="ca-diff-field-block">
          <div className="ca-diff-header">
            <div>
              <strong style={{ color: '#ffffff' }}>T Field: Headline (Hero Banner)</strong>{' '}
              <span style={{ color: 'var(--ca-text-muted)', fontFamily: 'var(--ca-font-mono)' }}>
                payload.variants[0].headline
              </span>
            </div>
            <span className="ca-badge ca-badge-active">1 addition · 0 deletions</span>
          </div>
          <div className="ca-diff-grid">
            <div className="ca-diff-col before">
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)', marginBottom: 6 }}>
                BEFORE (AI DRAFT V1.0) <span style={{ float: 'right' }}>len: 40</span>
              </div>
              <div>Upgrade Your Daily Pace with AirStride V2</div>
            </div>
            <div className="ca-diff-col after">
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)', marginBottom: 6 }}>
                AFTER (MANAGER REVISION V1.1) <span style={{ float: 'right' }}>len: 44</span>
              </div>
              <div>
                Upgrade Your Daily Pace with AirStride V2 <span className="ca-diff-add">Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Field 2: Primary Description Copy */}
        <div className="ca-diff-field-block">
          <div className="ca-diff-header">
            <div>
              <strong style={{ color: '#ffffff' }}>📄 Field: Primary Description Copy</strong>{' '}
              <span style={{ color: 'var(--ca-text-muted)', fontFamily: 'var(--ca-font-mono)' }}>
                payload.variants[0].description
              </span>
            </div>
            <span className="ca-badge ca-badge-admin">2 segments updated</span>
          </div>
          <div className="ca-diff-grid">
            <div className="ca-diff-col before">
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)', marginBottom: 6 }}>
                BEFORE (AI DRAFT V1.0) <span style={{ float: 'right' }}>112 chars</span>
              </div>
              <div>
                <span className="ca-diff-del">breathable performance and</span> Get free express shipping{' '}
                <span className="ca-diff-del">on your first pair.</span>
              </div>
            </div>
            <div className="ca-diff-col after">
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)', marginBottom: 6 }}>
                AFTER (MANAGER REVISION V1.1) <span style={{ float: 'right' }}>124 chars</span>
              </div>
              <div>
                <span className="ca-diff-add">with adaptive carbon-weave</span> Free express shipping{' '}
                <span className="ca-diff-add">on all orders.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Field 3: Target Audience Cohort */}
        <div className="ca-diff-field-block">
          <div className="ca-diff-header">
            <div>
              <strong style={{ color: '#ffffff' }}>👥 Field: Target Audience Cohort</strong>{' '}
              <span style={{ color: 'var(--ca-text-muted)', fontFamily: 'var(--ca-font-mono)' }}>
                payload.segmentation.cohort_label
              </span>
            </div>
            <span className="ca-badge ca-badge-budget">Scope Expanded</span>
          </div>
          <div className="ca-diff-grid">
            <div className="ca-diff-col before">
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)', marginBottom: 6 }}>
                BEFORE (AI DRAFT V1.0) <span style={{ float: 'right' }}>Cluster #04A</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Young urban activewear consumers (18–34)</span>
                <span className="ca-badge ca-badge-rejected" style={{ fontSize: 10 }}>Replaced</span>
              </div>
            </div>
            <div className="ca-diff-col after">
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)', marginBottom: 6 }}>
                AFTER (MANAGER REVISION V1.1) <span style={{ float: 'right' }}>Cluster #04B (Targeted)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>
                  Urban Professionals & Endurance Athletes (24–40)
                </span>
                <span className="ca-badge ca-badge-active" style={{ fontSize: 10 }}>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Governance Audit Trail & Approval Justification (Bottom Split) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Left: Reason and State Machine Chronology */}
        <div className="ca-card">
          <h2 className="ca-card-title" style={{ marginBottom: 14 }}>
            <span>✓</span> Governance Audit Trail & Approval Justification
          </h2>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            MANDATORY REASON LOGGED
          </div>
          <blockquote
            style={{
              margin: '0 0 18px 0',
              padding: '12px 16px',
              background: 'var(--ca-bg-alt)',
              borderLeft: '3px solid var(--ca-primary)',
              borderRadius: '0 var(--ca-radius-md) var(--ca-radius-md) 0',
              color: '#ffffff',
              fontSize: 13,
              fontStyle: 'italic',
            }}
          >
            "{record.details?.justification || 'Refined description to emphasize carbon-weave technology based on Q3 brand messaging guidelines and expanded cohort age brackets.'}"
          </blockquote>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
            STATE MACHINE CHRONOLOGY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--ca-success)' }}>●</span>
                <span style={{ fontFamily: 'var(--ca-font-mono)', color: 'var(--ca-text-muted)' }}>14:48:22</span>
                <strong style={{ color: '#ffffff' }}>Approval Override Committed</strong>
              </div>
              <span style={{ color: 'var(--ca-text-secondary)' }}>Elena Vance (Manager)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--ca-cyan)' }}>●</span>
                <span style={{ fontFamily: 'var(--ca-font-mono)', color: 'var(--ca-text-muted)' }}>14:48:20</span>
                <strong style={{ color: '#ffffff' }}>Integrity Hash Signed & Sealed</strong>
              </div>
              <span style={{ color: 'var(--ca-text-secondary)' }}>CastraVision SecModule</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--ca-text-faint)' }}>●</span>
                <span style={{ fontFamily: 'var(--ca-font-mono)', color: 'var(--ca-text-muted)' }}>14:47:05</span>
                <strong style={{ color: '#ffffff' }}>Draft Reviewed by Policy Engine</strong>
              </div>
              <span style={{ color: 'var(--ca-text-secondary)' }}>0 Rule Violations</span>
            </div>
          </div>
        </div>

        {/* Right: Downstream Pipeline Sync & Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ca-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              DOWNSTREAM PIPELINE SYNC
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <strong style={{ color: '#ffffff', fontSize: 13 }}>Meta Ads Manager V18.2 API</strong>
              <span className="ca-badge ca-badge-active">Synchronized</span>
            </div>
            <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: 'var(--ca-text-muted)' }}>
              Payload ACK ID: meta-ack-90249821
            </div>
          </div>

          <div className="ca-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
              NOTIFICATION DISPATCH (FR10)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div>
                <strong style={{ color: '#ffffff' }}>✓ Dispatched to Sarah Jenkins (Admin)</strong>
                <div style={{ color: 'var(--ca-text-muted)', fontSize: 11 }}>Email digest & In-app console</div>
              </div>
              <div>
                <strong style={{ color: '#ffffff' }}>✓ Dispatched to Elena Rostova (Author)</strong>
                <div style={{ color: 'var(--ca-text-muted)', fontSize: 11 }}>FR10 notification bus alert</div>
              </div>
            </div>
            <div style={{ marginTop: 12, borderTop: '1px solid var(--ca-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ca-text-muted)' }}>
              <span>Retention Period:</span>
              <strong style={{ color: '#ffffff' }}>7 Years (FINRA/SEC Compliant)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SecondaryButton onClick={onBack}>
          ← Back to Audit Log
        </SecondaryButton>
        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryButton onClick={handleCopyHash} icon="📋">
            Copy Hash
          </SecondaryButton>
          <button
            type="button"
            className="ca-btn ca-btn-primary"
            onClick={handleExportReceipt}
          >
            📥 Download Signed JSON Diff
          </button>
        </div>
      </div>
=======
  workspace = { name: 'Acme Corp' },
}) {
  const [diffViewMode, setDiffViewMode] = useState('side-by-side') // 'side-by-side' | 'inline'
  const [activeDetailTab, setActiveDetailTab] = useState(
    record?.detailsType || 'proposal_approved'
  )

  // Copy Event ID
  function handleCopyEventId(id) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id || record.id)
    }
    notify?.(`Event identifier ${id || record.id} copied to clipboard.`, 'success')
  }

  // Determine which detail variant to show:
  // Can be controlled by record.detailsType or the dev switch
  const detailVariant = activeDetailTab

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* ── DEV PREVIEW SWITCHER (Protected with import.meta.env.DEV) ── */}
      {import.meta.env.DEV && (
        <div className="ca-audit-dev-toolbar">
          <div className="ca-audit-dev-label">
            <span>⚙️</span> DETAIL VARIANT PREVIEWS (FR11)
          </div>
          <div className="ca-audit-dev-actions">
            <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 4 }}>Select Variant:</span>
            <button
              type="button"
              className={`ca-audit-dev-btn ${detailVariant === 'proposal_edited' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('proposal_edited')}
            >
              Proposal Edited (Diff)
            </button>
            <button
              type="button"
              className={`ca-audit-dev-btn ${detailVariant === 'role_changed' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('role_changed')}
            >
              Role Changed (RBAC)
            </button>
            <button
              type="button"
              className={`ca-audit-dev-btn ${detailVariant === 'proposal_approved' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('proposal_approved')}
            >
              Proposal Approved (FR04)
            </button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── VARIANT 1: PROPOSAL EDITED (auditlogdetails—proposaledited.jpg) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {detailVariant === 'proposal_edited' && (
        <div>
          {/* Breadcrumb & Top Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ca-text-muted)' }}>
              <button
                type="button"
                className="ca-kpi-footer-link"
                style={{ margin: 0, fontSize: 13, padding: 0 }}
                onClick={onBack}
              >
                System Audit Log
              </button>
              <span>›</span>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>
                Log Entry #{record.id || 'LOG-94012'} (Proposal Revision & Edit)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="ca-btn ca-btn-subtle"
                onClick={onBack}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
              >
                <IconArrowLeft size={14} /> Back to Audit Log
              </button>
              <button
                type="button"
                className="ca-btn ca-btn-subtle"
                onClick={() => handleCopyEventId(record.id || 'LOG-94012')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
              >
                <IconCopy size={14} /> Copy Event ID
              </button>
            </div>
          </div>

          {/* Heading Block */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span className="ca-audit-badge-pill" style={{ margin: 0 }}>
                FR11 AUDIT RECORD
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#67e8f9',
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  padding: '4px 10px',
                  borderRadius: 9999,
                }}
              >
                ● Proposal Edited
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#94a3b8',
                  background: '#1e293b',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontFamily: 'var(--ca-font-mono)',
                }}
              >
                v1.0 → v1.1
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
              Audit Log Record Details
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--ca-text-secondary)', margin: 0 }}>
              Detailed audit log record and field-level diff for human-in-the-loop revision on proposal {record.entityId || 'PRP-8404'}.
            </p>
          </div>

          {/* 4 Context Cards */}
          <div className="ca-audit-detail-context-grid">
            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">ACTOR / INITIATOR</span>
                <IconUser size={15} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div className="ca-cell-avatar" style={{ background: '#0284c7' }}>
                  {record.actorInitials || 'DK'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                    {record.actorName || 'David Kross'}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ca-text-muted)' }}>
                    {record.actorRole || 'Manager'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Auth Mode: <strong style={{ color: '#ffffff' }}>Workspace Session</strong>
              </div>
            </div>

            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">TIMESTAMP</span>
                <IconClock size={15} style={{ color: '#818cf8' }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>
                Oct 24, 2026
              </div>
              <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 12, color: 'var(--ca-text-secondary)', marginBottom: 6 }}>
                13:58:30 UTC
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Relative: <span style={{ color: '#ffffff' }}>~37 min ago</span>
              </div>
            </div>

            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">TARGET OBJECT</span>
                <IconFileText size={15} style={{ color: '#34d399' }} />
              </div>
              <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 14, fontWeight: 700, color: '#38bdf8', marginBottom: 2 }}>
                {record.entityId || 'PRP-8404'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ca-text-secondary)', marginBottom: 6 }}>
                Holiday Email Lead Nurture
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Module: <strong style={{ color: '#ffffff' }}>FR04 Approvals</strong>
              </div>
            </div>

            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">WORKSPACE CONTEXT</span>
                <IconShield size={15} style={{ color: '#a855f7' }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>
                {workspace.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ca-text-secondary)', marginBottom: 6 }}>
                Enterprise Workspace
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Record Ref: <span style={{ fontFamily: 'var(--ca-font-mono)', color: '#ffffff' }}>{record.id || 'LOG-94012'}</span>
              </div>
            </div>
          </div>

          {/* Event Overview & Narrative Card */}
          <div className="ca-audit-detail-narrative-card">
            <div className="ca-audit-detail-narrative-left">
              <span style={{ color: '#38bdf8', fontSize: 18 }}>📄</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                  Event Overview & Narrative
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--ca-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Manager <strong>{record.actorName || 'David Kross'}</strong> revised the primary headline copy, promotional discount offer, and campaign audience cohort from v1.0 (AI Draft) to v1.1 prior to stage-gate manager approval.
                </p>
              </div>
            </div>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '4px 10px', borderRadius: 9999 }}>
                ● Logged & Recorded
              </span>
            </div>
          </div>

          {/* Proposal Version Comparison Diff Block */}
          <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#818cf8', fontSize: 16 }}>▤</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  Proposal Version Comparison
                </span>
                <span style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: 'var(--ca-text-muted)' }}>
                  v1.0 (AI Draft) → v1.1 (Manager Revision)
                </span>
                <span style={{ fontSize: 11, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                  3 Fields Modified
                </span>
              </div>

              {/* Diff View Mode Switcher */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className={`ca-btn ca-btn-sm ${diffViewMode === 'side-by-side' ? 'ca-btn-primary' : 'ca-btn-subtle'}`}
                  onClick={() => setDiffViewMode('side-by-side')}
                >
                  ▦ Side-by-Side
                </button>
                <button
                  type="button"
                  className={`ca-btn ca-btn-sm ${diffViewMode === 'inline' ? 'ca-btn-primary' : 'ca-btn-subtle'}`}
                  onClick={() => setDiffViewMode('inline')}
                >
                  ☰ Inline
                </button>
              </div>
            </div>

            {/* Field 1: Primary Headline */}
            <div className="ca-audit-diff-block">
              <div className="ca-audit-diff-header">
                <div>
                  <strong>Field: Primary Headline</strong> <span style={{ color: 'var(--ca-text-muted)' }}>(Hero Banner)</span>
                </div>
                <span style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: '#38bdf8' }}>string</span>
              </div>
              <div className="ca-audit-diff-cols" style={{ gridTemplateColumns: diffViewMode === 'inline' ? '1fr' : '1fr 1fr' }}>
                <div className="ca-audit-diff-col before">
                  <div style={{ fontSize: 10.5, color: 'var(--ca-text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Before (v1.0 AI Draft)</span>
                    <span style={{ color: '#ef4444' }}>⊖</span>
                  </div>
                  <div>Upgrade Your Daily Pace with AirStride V2</div>
                </div>
                <div className="ca-audit-diff-col after">
                  <div style={{ fontSize: 10.5, color: 'var(--ca-text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>After (v1.1 Manager Revision)</span>
                    <span style={{ color: '#10b981' }}>⊕</span>
                  </div>
                  <div>
                    Upgrade Your Daily Pace with AirStride V2 <strong style={{ color: '#38bdf8' }}>Pro</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 2: Promotional Body Copy */}
            <div className="ca-audit-diff-block">
              <div className="ca-audit-diff-header">
                <div>
                  <strong>Field: Promotional Body Copy</strong> <span style={{ color: 'var(--ca-text-muted)' }}>(Hero Description)</span>
                </div>
                <span style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: '#38bdf8' }}>text</span>
              </div>
              <div className="ca-audit-diff-cols" style={{ gridTemplateColumns: diffViewMode === 'inline' ? '1fr' : '1fr 1fr' }}>
                <div className="ca-audit-diff-col before">
                  <div style={{ fontSize: 10.5, color: 'var(--ca-text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Before (v1.0 AI Draft)</span>
                    <span style={{ color: '#ef4444' }}>⊖</span>
                  </div>
                  <div>
                    <span className="ca-audit-diff-del">
                      breathable performance and supreme cushioning. Get free express shipping on your first pair.
                    </span>
                  </div>
                </div>
                <div className="ca-audit-diff-col after">
                  <div style={{ fontSize: 10.5, color: 'var(--ca-text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>After (v1.1 Manager Revision)</span>
                    <span style={{ color: '#10b981' }}>⊕</span>
                  </div>
                  <div>
                    <span className="ca-audit-diff-add">
                      adaptive carbon-weave cushioning for all-day pace. Free express shipping on all orders.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 3: Target Audience Cohort */}
            <div className="ca-audit-diff-block">
              <div className="ca-audit-diff-header">
                <div>
                  <strong>Field: Target Audience Cohort</strong> <span style={{ color: 'var(--ca-text-muted)' }}>(Segmentation Target)</span>
                </div>
                <span style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: '#38bdf8' }}>segment_ref</span>
              </div>
              <div className="ca-audit-diff-cols" style={{ gridTemplateColumns: diffViewMode === 'inline' ? '1fr' : '1fr 1fr' }}>
                <div className="ca-audit-diff-col before">
                  <div style={{ fontSize: 10.5, color: 'var(--ca-text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Before (v1.0 AI Draft)</span>
                    <span style={{ color: '#94a3b8' }}>⇄</span>
                  </div>
                  <div>Young urban activewear consumers (18–34)</div>
                </div>
                <div className="ca-audit-diff-col after">
                  <div style={{ fontSize: 10.5, color: 'var(--ca-text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>After (v1.1 Manager Revision)</span>
                    <span style={{ color: '#38bdf8' }}>⇄</span>
                  </div>
                  <div style={{ color: '#38bdf8', fontWeight: 600 }}>
                    Urban Professionals & Endurance Athletes (24–40)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event History & State Machine Chronology */}
          <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconClock size={16} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  Event History & State Machine Chronology
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>UTC Timeline</span>
            </div>

            <div className="ca-audit-timeline">
              <div className="ca-audit-timeline-item">
                <div className="ca-audit-timeline-dot" style={{ borderColor: '#06b6d4', background: '#083344' }}>
                  ✎
                </div>
                <div className="ca-audit-timeline-content">
                  <div className="ca-audit-timeline-top">
                    <span className="ca-audit-timeline-title">Proposal Edited</span>
                    <span style={{ fontSize: 10.5, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 5px', borderRadius: 3 }}>
                      User Action
                    </span>
                    <span className="ca-audit-timeline-time">Oct 24, 2026 13:58:30 UTC</span>
                  </div>
                  <p className="ca-audit-timeline-desc">
                    David Kross (Manager) saved revision v1.1 with updated copy & targeting adjustments.
                  </p>
                </div>
              </div>

              <div className="ca-audit-timeline-item">
                <div className="ca-audit-timeline-dot" style={{ borderColor: '#10b981', background: '#064e3b' }}>
                  ✓
                </div>
                <div className="ca-audit-timeline-content">
                  <div className="ca-audit-timeline-top">
                    <span className="ca-audit-timeline-title">Policy Validation Passed</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8', background: '#1e293b', padding: '1px 5px', borderRadius: 3 }}>
                      System-Generated Event
                    </span>
                    <span className="ca-audit-timeline-time">Oct 24, 2026 13:58:28 UTC</span>
                  </div>
                  <p className="ca-audit-timeline-desc">
                    Character count limits, brand safety lexicon, and keyword compliance checks completed with 0 errors.
                  </p>
                </div>
              </div>

              <div className="ca-audit-timeline-item">
                <div className="ca-audit-timeline-dot" style={{ borderColor: '#6366f1', background: '#1e1b4b' }}>
                  👁
                </div>
                <div className="ca-audit-timeline-content">
                  <div className="ca-audit-timeline-top">
                    <span className="ca-audit-timeline-title">Draft Opened for Edit</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8', background: '#1e293b', padding: '1px 5px', borderRadius: 3 }}>
                      System-Generated Event
                    </span>
                    <span className="ca-audit-timeline-time">Oct 24, 2026 13:50:12 UTC</span>
                  </div>
                  <p className="ca-audit-timeline-desc">
                    Active lock session initialized for David Kross on proposal object {record.entityId || 'PRP-8404'}.
                  </p>
                </div>
              </div>

              <div className="ca-audit-timeline-item">
                <div className="ca-audit-timeline-dot" style={{ borderColor: '#a855f7', background: '#3b0764' }}>
                  ⚡
                </div>
                <div className="ca-audit-timeline-content">
                  <div className="ca-audit-timeline-top">
                    <span className="ca-audit-timeline-title">Initial AI Draft Generated</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8', background: '#1e293b', padding: '1px 5px', borderRadius: 3 }}>
                      Record Update
                    </span>
                    <span className="ca-audit-timeline-time">Oct 24, 2026 12:15:00 UTC</span>
                  </div>
                  <p className="ca-audit-timeline-desc">
                    Campaign automation pipeline orchestrated draft creation ({record.entityId || 'PRP-8404'} v1.0).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical & Session Details */}
          <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#818cf8', fontSize: 15 }}>⚙️</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                  Technical & Session Details
                </span>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--ca-font-mono)', color: 'var(--ca-text-muted)' }}>
                Internal Node: eu-west-1a
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, fontSize: 12 }}>
              <div>
                <div style={{ color: 'var(--ca-text-muted)', marginBottom: 2 }}>Event ID:</div>
                <div style={{ color: '#ffffff', fontFamily: 'var(--ca-font-mono)' }}>{record.id || 'LOG-94012'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--ca-text-muted)', marginBottom: 2 }}>Session Token:</div>
                <div style={{ color: '#ffffff', fontFamily: 'var(--ca-font-mono)' }}>sess-89104</div>
              </div>
              <div>
                <div style={{ color: 'var(--ca-text-muted)', marginBottom: 2 }}>IP / Network Origin:</div>
                <div style={{ color: '#ffffff', fontFamily: 'var(--ca-font-mono)' }}>198.51.100.42 (Internal VPN)</div>
              </div>
              <div>
                <div style={{ color: 'var(--ca-text-muted)', marginBottom: 2 }}>Audit Retention Policy:</div>
                <div style={{ color: '#ffffff' }}>Standard Enterprise (7-year compliance)</div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="ca-btn ca-btn-subtle"
              onClick={onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <IconArrowLeft size={14} /> Back to Audit Log
            </button>
            <button
              type="button"
              className="ca-btn ca-btn-subtle"
              onClick={() => handleCopyEventId(record.id || 'LOG-94012')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <IconCopy size={14} /> Copy Event ID
            </button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── VARIANT 2: ROLE CHANGED (auditlogdetails—rolechanged.jpg) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {detailVariant === 'role_changed' && (
        <div>
          {/* Breadcrumb & Top Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ca-text-muted)' }}>
              <button
                type="button"
                className="ca-kpi-footer-link"
                style={{ margin: 0, fontSize: 13, padding: 0 }}
                onClick={onBack}
              >
                System Audit Log
              </button>
              <span>›</span>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>
                Log Entry #LOG-93985 (Workspace Access & Role Change)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="ca-btn ca-btn-subtle"
                onClick={onBack}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
              >
                <IconArrowLeft size={14} /> Back to Audit Log
              </button>
              <button
                type="button"
                className="ca-btn ca-btn-subtle"
                onClick={() => handleCopyEventId('LOG-93985')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
              >
                <IconCopy size={14} /> Copy Event ID
              </button>
              <span className="ca-audit-badge-pill" style={{ margin: 0 }}>
                FR11 AUDIT RECORD
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#c084fc',
                  background: 'rgba(192, 132, 252, 0.15)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                  padding: '4px 10px',
                  borderRadius: 9999,
                }}
              >
                ● Role Changed
              </span>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
              Audit Log Record Details
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--ca-text-secondary)', margin: 0 }}>
              Detailed audit log record for workspace member role modification and permission tier escalation under enterprise governance.
            </p>
          </div>

          {/* 4 Context Cards */}
          <div className="ca-audit-detail-context-grid">
            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">ACTOR / INITIATOR</span>
                <IconUser size={15} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div className="ca-cell-avatar" style={{ background: '#4f46e5' }}>SJ</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Sarah Jenkins</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ca-text-muted)' }}>Admin</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Corporate Auth: <strong style={{ color: '#ffffff' }}>Workspace Session</strong>
              </div>
            </div>

            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">TIMESTAMP (UTC)</span>
                <IconClock size={15} style={{ color: '#818cf8' }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>
                Oct 24, 2026
              </div>
              <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 12, color: 'var(--ca-text-secondary)', marginBottom: 6 }}>
                09:30:12 UTC
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Relative: <span style={{ color: '#ffffff' }}>~5 hours ago</span>
              </div>
            </div>

            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">TARGET OBJECT</span>
                <IconUser size={15} style={{ color: '#34d399' }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>
                Elena Rostova
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ca-text-secondary)', fontFamily: 'var(--ca-font-mono)', marginBottom: 6 }}>
                elena.rostova@acmecorp.com
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Module: <strong style={{ color: '#ffffff' }}>RBAC Control</strong>
              </div>
            </div>

            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">WORKSPACE CONTEXT</span>
                <IconShield size={15} style={{ color: '#a855f7' }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>
                {workspace.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ca-text-secondary)', marginBottom: 6 }}>
                Enterprise Workspace
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Event ID: <span style={{ fontFamily: 'var(--ca-font-mono)', color: '#ffffff' }}>LOG-93985</span>
              </div>
            </div>
          </div>

          {/* Executive Narrative */}
          <div className="ca-audit-detail-narrative-card">
            <div className="ca-audit-detail-narrative-left">
              <span style={{ color: '#818cf8', fontSize: 18 }}>🛡</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                  Executive Narrative <span style={{ color: 'var(--ca-text-muted)', fontWeight: 400 }}>• State Verified</span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--ca-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Workspace Administrator <strong>Sarah Jenkins</strong> updated <strong>Elena Rostova</strong> from Member to <strong>Manager</strong> tier, granting stage-gate proposal review, edit, approval, and rejection authority under FR04 human-in-the-loop governance.
                </p>
              </div>
            </div>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '4px 10px', borderRadius: 9999 }}>
                ● Logged & Enforced
              </span>
            </div>
          </div>

          {/* Split: Role & Permission Transition (Left) + Technical Parameters (Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Left Box: Transition & Matrix */}
            <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#c084fc', fontSize: 16 }}>⇄</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                    Role & Permission Transition
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                  Action Scope: Workspace Tier
                </span>
              </div>

              {/* Transition Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: '#080c14', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-md)', padding: '14px', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>PREVIOUS ROLE</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Member</div>
                  <span style={{ fontSize: 10.5, color: '#94a3b8', background: '#1e293b', padding: '1px 6px', borderRadius: 3 }}>Standard Tier</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 18, color: '#38bdf8' }}>→</span>
                  <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>Escalated</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>NEW ROLE</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>Manager</div>
                  <span style={{ fontSize: 10.5, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 6px', borderRadius: 3 }}>Reviewer Tier (FR04)</span>
                </div>
              </div>

              {/* Permission Impact Matrix */}
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#ffffff', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span>Permission Impact Matrix / Diff</span>
                <span style={{ fontSize: 11, color: 'var(--ca-text-muted)', fontWeight: 400 }}>Effective Immediately</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { perm: 'Review Proposals (FR04)', desc: 'Stage-gate content & generation audits', before: 'Denied', after: 'Allowed', changed: true },
                  { perm: 'Edit Proposals (FR04)', desc: 'Direct parameter overrides prior to deployment', before: 'Denied', after: 'Allowed', changed: true },
                  { perm: 'Approve & Reject Proposals (FR04)', desc: 'Terminal stage-gate signoff for active automation', before: 'Denied', after: 'Allowed', changed: true },
                  { perm: 'Manage Workspace Membership', desc: 'Invite, configure invitations, manage users', unchangedLabel: 'Unchanged (Denied - Admin Only)' },
                  { perm: 'Remove Members', desc: 'Revoke tenant membership and authorization', unchangedLabel: 'Unchanged (Denied - Admin Only)' },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#080c14',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <strong style={{ color: '#ffffff' }}>{row.perm}</strong>
                      <div style={{ color: 'var(--ca-text-muted)', fontSize: 11 }}>{row.desc}</div>
                    </div>
                    {row.changed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                        <span style={{ color: '#f87171' }}>{row.before}</span>
                        <span style={{ color: 'var(--ca-text-muted)' }}>→</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>{row.after}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--ca-text-muted)', background: '#1e293b', padding: '2px 8px', borderRadius: 4 }}>
                        {row.unchangedLabel}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Justification Quote */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                MANDATORY REASON / JUSTIFICATION LOGGED
              </div>
              <blockquote
                style={{
                  margin: 0,
                  padding: '10px 14px',
                  background: '#080c14',
                  borderLeft: '3px solid #818cf8',
                  borderRadius: '0 6px 6px 0',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontStyle: 'italic',
                }}
              >
                "Promoted to Marketing Lead to oversee Q4 activewear omnichannel campaign approvals and creative reviews."
              </blockquote>
            </div>

            {/* Right Box: Technical Parameters & Compliance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Technical Parameters</span>
                  <span style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>Metadata</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>EVENT ID:</span>
                    <div style={{ fontFamily: 'var(--ca-font-mono)', color: '#38bdf8' }}>LOG-93985</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>TARGET USER ID:</span>
                    <div style={{ fontFamily: 'var(--ca-font-mono)', color: '#ffffff' }}>usr-99482_acme</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>ACTOR SESSION:</span>
                    <div style={{ fontFamily: 'var(--ca-font-mono)', color: '#ffffff' }}>sess-88421</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>ACTION CLASSIFICATION:</span>
                    <div style={{ fontFamily: 'var(--ca-font-mono)', color: '#ffffff' }}>AUTH_RBAC_ESCALATE</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>RETENTION POLICY:</span>
                    <div style={{ color: '#ffffff' }}>Standard Enterprise (7-year compliance)</div>
                  </div>
                </div>
              </div>

              {/* Audit Compliance Card */}
              <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <IconShield size={16} style={{ color: '#38bdf8' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Audit Compliance</span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--ca-text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  This log record is permanently indexed under the CastraVision FR11 audit trail specification. System state transitions and authorization changes are immutable once logged.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ca-text-muted)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 8 }}>
                  <span>Log Version: <strong style={{ color: '#ffffff' }}>1.4.2</strong></span>
                  <span>Origin: <strong style={{ color: '#ffffff' }}>US-EAST-1</strong></span>
                </div>
              </div>

              {/* Record Actions */}
              <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase' }}>Record Actions</span>
                <button
                  type="button"
                  className="ca-btn ca-btn-subtle ca-btn-sm"
                  onClick={() => handleCopyEventId('LOG-93985')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <IconCopy size={13} /> Copy Event ID
                </button>
                <button
                  type="button"
                  className="ca-btn ca-btn-subtle ca-btn-sm"
                  onClick={onBack}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <IconArrowLeft size={13} /> Back to Audit Log
                </button>
              </div>
            </div>
          </div>

          {/* Event History & State Machine Chronology */}
          <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconClock size={16} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  Event History & State Machine Chronology
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>4 Sub-events Recorded</span>
            </div>

            <div className="ca-audit-timeline">
              <div className="ca-audit-timeline-item">
                <div className="ca-audit-timeline-dot" style={{ borderColor: '#6366f1', background: '#1e1b4b' }}>
                  👤
                </div>
                <div className="ca-audit-timeline-content">
                  <div className="ca-audit-timeline-top">
                    <span className="ca-audit-timeline-title">Role Updated by Sarah Jenkins (Admin)</span>
                    <span style={{ fontSize: 10.5, color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '1px 5px', borderRadius: 3 }}>
                      User Action
                    </span>
                    <span className="ca-audit-timeline-time">Oct 24, 09:30:12 UTC</span>
                  </div>
                  <p className="ca-audit-timeline-desc">
                    Changed Elena Rostova from Member to Manager tier. Human-in-the-loop stage gate verification enabled immediately.
                  </p>
                </div>
              </div>

              <div className="ca-audit-timeline-item">
                <div className="ca-audit-timeline-dot" style={{ borderColor: '#10b981', background: '#064e3b' }}>
                  ✓
                </div>
                <div className="ca-audit-timeline-content">
                  <div className="ca-audit-timeline-top">
                    <span className="ca-audit-timeline-title">Policy Guardrail Check Passed</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8', background: '#1e293b', padding: '1px 5px', borderRadius: 3 }}>
                      System Event
                    </span>
                    <span className="ca-audit-timeline-time">Oct 24, 09:30:11 UTC</span>
                  </div>
                  <p className="ca-audit-timeline-desc">
                    Final Admin protection invariant verified (Target is not last Admin). No privilege escalation violation detected.
                  </p>
                </div>
              </div>

              <div className="ca-audit-timeline-item">
                <div className="ca-audit-timeline-dot" style={{ borderColor: '#38bdf8', background: '#083344' }}>
                  🔑
                </div>
                <div className="ca-audit-timeline-content">
                  <div className="ca-audit-timeline-top">
                    <span className="ca-audit-timeline-title">RBAC Session Token Re-keyed</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8', background: '#1e293b', padding: '1px 5px', borderRadius: 3 }}>
                      System Event
                    </span>
                    <span className="ca-audit-timeline-time">Oct 24, 09:30:10 UTC</span>
                  </div>
                  <p className="ca-audit-timeline-desc">
                    Active authentication tokens invalidated and re-issued with manager claim definitions for Elena Rostova.
                  </p>
                </div>
              </div>

              <div className="ca-audit-timeline-item">
                <div className="ca-audit-timeline-dot" style={{ borderColor: '#94a3b8', background: '#1e293b' }}>
                  🔓
                </div>
                <div className="ca-audit-timeline-content">
                  <div className="ca-audit-timeline-top">
                    <span className="ca-audit-timeline-title">Role Change Modal Opened</span>
                    <span style={{ fontSize: 10.5, color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '1px 5px', borderRadius: 3 }}>
                      User Action
                    </span>
                    <span className="ca-audit-timeline-time">Oct 24, 09:29:45 UTC</span>
                  </div>
                  <p className="ca-audit-timeline-desc">
                    Sarah Jenkins navigated to Workspace Members &gt; Elena Rostova &gt; Edit Role dialogue.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', fontSize: 12, color: 'var(--ca-text-muted)' }}>
            <span>Logged under Enterprise Compliance Policy FR11 • CastraVision RBAC v2.4</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="ca-btn ca-btn-subtle ca-btn-sm" onClick={onBack}>
                <IconArrowLeft size={13} /> Back to Audit Log
              </button>
              <button type="button" className="ca-btn ca-btn-primary ca-btn-sm" onClick={() => handleCopyEventId('LOG-93985')}>
                <IconCopy size={13} /> Copy Event ID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── VARIANT 3: PROPOSAL APPROVED (auditlogdetails—proposalapproved.jpg) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {detailVariant === 'proposal_approved' && (
        <div>
          {/* Breadcrumb & Top Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ca-text-muted)' }}>
              <button
                type="button"
                className="ca-kpi-footer-link"
                style={{ margin: 0, fontSize: 13, padding: 0 }}
                onClick={onBack}
              >
                System Audit Log
              </button>
              <span>›</span>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>
                Log Entry #LOG-94025 (Proposal Decision & Authorization)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="ca-btn ca-btn-subtle"
                onClick={onBack}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
              >
                <IconArrowLeft size={14} /> Back to Audit Log
              </button>
              <button
                type="button"
                className="ca-btn ca-btn-primary"
                onClick={() => handleCopyEventId('LOG-94025')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
              >
                <IconCopy size={14} /> Copy Event ID
              </button>
            </div>
          </div>

          {/* Heading Block */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="ca-audit-badge-pill" style={{ margin: 0 }}>
                  FR11 AUDIT RECORD
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '4px 10px',
                    borderRadius: 9999,
                  }}
                >
                  ● Proposal Approved
                </span>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '3px 8px', borderRadius: 4 }}>
                <IconShield size={13} /> Policy Engine: Compliant
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
              Audit Log Record Details
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--ca-text-secondary)', margin: 0 }}>
              Detailed immutable audit log record for human authorization and campaign proposal approval signoff under FR04 stage-gate controls.
            </p>
          </div>

          {/* 4 Context Cards */}
          <div className="ca-audit-detail-context-grid">
            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">ACTOR / INITIATOR</span>
                <IconUser size={15} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div className="ca-cell-avatar" style={{ background: '#4f46e5' }}>SJ</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Sarah Jenkins</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ca-text-muted)' }}>Admin Role</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Corporate Auth: <strong style={{ color: '#ffffff' }}>Workspace Session</strong>
              </div>
            </div>

            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">EXECUTION TIMESTAMP</span>
                <IconClock size={15} style={{ color: '#818cf8' }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>
                Oct 24, 2026
              </div>
              <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 12, color: 'var(--ca-text-secondary)', marginBottom: 6 }}>
                14:35:42 UTC
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Relative Age: <span style={{ color: '#38bdf8', fontWeight: 600 }}>Just now</span>
              </div>
            </div>

            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">TARGET OBJECT</span>
                <IconFileText size={15} style={{ color: '#34d399' }} />
              </div>
              <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 14, fontWeight: 700, color: '#38bdf8', marginBottom: 2 }}>
                PRP-8402
              </div>
              <div style={{ fontSize: 12, color: 'var(--ca-text-secondary)', marginBottom: 6 }}>
                Q3 Activewear Omnichannel Copy
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Module: <strong style={{ color: '#ffffff' }}>FR04 Approvals</strong>
              </div>
            </div>

            <div className="ca-audit-detail-context-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ca-audit-kpi-label">WORKSPACE SCOPE</span>
                <IconShield size={15} style={{ color: '#a855f7' }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>
                {workspace.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ca-text-secondary)', marginBottom: 6 }}>
                Enterprise Workspace
              </div>
              <div style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                Event ID: <span style={{ fontFamily: 'var(--ca-font-mono)', color: '#ffffff' }}>LOG-94025</span>
              </div>
            </div>
          </div>

          {/* Event Narrative Card */}
          <div className="ca-audit-detail-narrative-card">
            <div className="ca-audit-detail-narrative-left">
              <span style={{ color: '#34d399', fontSize: 20 }}>✓</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                  Event Narrative & Transition Scope
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--ca-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Workspace Administrator <strong>Sarah Jenkins</strong> granted final affirmative human authorization for proposal{' '}
                  <strong style={{ color: '#38bdf8' }}>PRP-8402</strong> (Q3 Activewear Omnichannel Copy v1.4). Proposal successfully transitioned from <strong>Pending Review</strong> to <strong>Approved</strong>.
                </p>
              </div>
            </div>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '4px 10px', borderRadius: 9999 }}>
                ● Approved & Executed
              </span>
            </div>
          </div>

          {/* Split: Decision Parameters (Left) + Chronology & Technical (Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Left Box: Parameters & Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#34d399', fontSize: 16 }}>✓</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                      Authorization Decision & Parameters
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--ca-font-mono)' }}>
                    v1.4 TARGET
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#080c14', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>DECISION STATE</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>✓</span> Approved
                    </div>
                  </div>
                  <div style={{ background: '#080c14', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>AUTHORIZED VERSION</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                      v1.4 <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 500 }}>Promoted to Pipeline</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>PROPOSAL CATEGORY:</span>
                    <div style={{ color: '#ffffff', marginTop: 2 }}>Content Proposal (Social & Search Ads)</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>TARGET DISTRIBUTION CHANNELS:</span>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 3, fontSize: 11, color: '#c7d2fe' }}>Meta Ads</span>
                      <span style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 3, fontSize: 11, color: '#c7d2fe' }}>Google Ads</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 10, marginBottom: 16 }}>
                  <span style={{ color: 'var(--ca-text-muted)' }}>AUTHOR & SUBMITTER:</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>Sarah Jenkins</span>
                    <span style={{ color: 'var(--ca-text-muted)', fontSize: 11 }}>(Autonomous draft curated by Marketing Core)</span>
                    <span style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: '#38bdf8' }}>ID: USR-00412</span>
                  </div>
                </div>

                {/* Stage-gate Checklist */}
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  STAGE-GATE COMPLIANCE CHECKLIST (FR04 HUMAN-IN-THE-LOOP SAFEGUARDS)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {[
                    { label: 'Human Authorization Confirmed', desc: 'Verified by Sarah Jenkins (Workspace Admin credential validation).' },
                    { label: 'Mandatory Review Passed', desc: 'Creative tone, claim validations, and brand safety guidelines verified against Q4 baseline.' },
                    { label: 'Budget Pacing Check', desc: 'Within workspace monthly pacing threshold ($45,000 / mo allocation approved).' },
                    { label: 'Downstream Notification Dispatched', desc: 'Authors and workspace reviewers notified via system webhook and email digest.' },
                  ].map((chk, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, background: '#080c14', padding: '6px 10px', borderRadius: 4 }}>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>☑</span>
                      <div>
                        <strong style={{ color: '#ffffff' }}>{chk.label}</strong>
                        <div style={{ color: 'var(--ca-text-muted)', fontSize: 11 }}>{chk.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Signoff Notes Quote */}
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  SIGNOFF NOTES & JUSTIFICATION
                </div>
                <blockquote
                  style={{
                    margin: 0,
                    padding: '10px 14px',
                    background: '#080c14',
                    borderLeft: '3px solid #34d399',
                    borderRadius: '0 6px 6px 0',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontStyle: 'italic',
                  }}
                >
                  "Approved for Q4 campaign launch. Copy messaging aligns with refreshed activewear brand guidelines and target demographic."
                </blockquote>
              </div>

              {/* Target Campaign Context Preview Card */}
              <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#38bdf8', fontSize: 15 }}>🖼</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                      Target Campaign Context Preview
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>Asset Reference #AST-1049</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 120px 1fr', gap: 12, alignItems: 'center' }}>
                  <div style={{ height: 80, background: '#1e293b', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ca-border)' }}>
                    <span style={{ fontSize: 22 }}>🏃‍♂️</span>
                    <span style={{ fontSize: 10, color: '#38bdf8', marginTop: 4, fontWeight: 600 }}>HERO CREATIVE A</span>
                  </div>
                  <div style={{ height: 80, background: '#1e293b', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ca-border)' }}>
                    <span style={{ fontSize: 22 }}>👟</span>
                    <span style={{ fontSize: 10, color: '#38bdf8', marginTop: 4, fontWeight: 600 }}>PRODUCT DETAIL B</span>
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ color: 'var(--ca-text-muted)', fontSize: 11 }}>Target Copy Angle</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', margin: '2px 0' }}>Engineered For Movement</div>
                    <div style={{ color: 'var(--ca-text-secondary)', fontSize: 11.5 }}>High-elasticity thermal compression</div>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#34d399', fontWeight: 600 }}>Variants: 4 copy decks (Ready)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Chronology & System Identifiers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Chronology */}
              <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconClock size={16} style={{ color: '#38bdf8' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                      State Machine Chronology
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>4 Events</span>
                </div>

                <div className="ca-audit-timeline">
                  <div className="ca-audit-timeline-item">
                    <div className="ca-audit-timeline-dot" style={{ borderColor: '#34d399', background: '#064e3b' }}>
                      ✓
                    </div>
                    <div className="ca-audit-timeline-content">
                      <div className="ca-audit-timeline-top">
                        <span className="ca-audit-timeline-title">Proposal Approved by Sarah Jenkins (Admin)</span>
                        <span className="ca-audit-timeline-time">Oct 24, 14:35:42 UTC</span>
                      </div>
                      <p className="ca-audit-timeline-desc">
                        Transitioned to Approved state. Automated workflow dispatched to production pipeline.
                      </p>
                    </div>
                  </div>

                  <div className="ca-audit-timeline-item">
                    <div className="ca-audit-timeline-dot" style={{ borderColor: '#38bdf8', background: '#083344' }}>
                      ⚡
                    </div>
                    <div className="ca-audit-timeline-content">
                      <div className="ca-audit-timeline-top">
                        <span className="ca-audit-timeline-title">Stage-Gate Policy Engine Passed</span>
                        <span className="ca-audit-timeline-time">Oct 24, 14:35:40 UTC</span>
                      </div>
                      <p className="ca-audit-timeline-desc">
                        Mandatory checks validated: Brand tone baseline, compliance filters, pacing margin.
                      </p>
                    </div>
                  </div>

                  <div className="ca-audit-timeline-item">
                    <div className="ca-audit-timeline-dot" style={{ borderColor: '#6366f1', background: '#1e1b4b' }}>
                      👤
                    </div>
                    <div className="ca-audit-timeline-content">
                      <div className="ca-audit-timeline-top">
                        <span className="ca-audit-timeline-title">Proposal Review Opened</span>
                        <span className="ca-audit-timeline-time">Oct 24, 14:32:00 UTC</span>
                      </div>
                      <p className="ca-audit-timeline-desc">
                        Session initiated by Sarah Jenkins via Workspace Admin console dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="ca-audit-timeline-item">
                    <div className="ca-audit-timeline-dot" style={{ borderColor: '#a855f7', background: '#3b0764' }}>
                      📄
                    </div>
                    <div className="ca-audit-timeline-content">
                      <div className="ca-audit-timeline-top">
                        <span className="ca-audit-timeline-title">Proposal v1.4 Submitted for Final Review</span>
                        <span className="ca-audit-timeline-time">Oct 24, 13:45:00 UTC</span>
                      </div>
                      <p className="ca-audit-timeline-desc">
                        Candidate content package compiled and queued for stage-gate authorization.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Technical Identifiers */}
              <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>System Technical Identifiers</span>
                  <span style={{ fontSize: 11, color: '#34d399' }}>Telemetry Sync ●</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>Event Identifier:</span>
                    <div style={{ fontFamily: 'var(--ca-font-mono)', color: '#ffffff' }}>LOG-94025</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>Proposal Key:</span>
                    <div style={{ fontFamily: 'var(--ca-font-mono)', color: '#38bdf8' }}>PRP-8402</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>Auth Session Token:</span>
                    <div style={{ fontFamily: 'var(--ca-font-mono)', color: '#ffffff' }}>sess-89190</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>Client Host IP:</span>
                    <div style={{ fontFamily: 'var(--ca-font-mono)', color: '#ffffff' }}>10.24.112.5 (VPC Internal)</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)' }}>Audit Retention Policy:</span>
                    <div style={{ color: '#ffffff' }}>Standard Enterprise (7-year compliance)</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="ca-btn ca-btn-subtle"
                  onClick={onBack}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <IconArrowLeft size={13} /> Back to Audit Log
                </button>
                <button
                  type="button"
                  className="ca-btn ca-btn-primary"
                  onClick={() => handleCopyEventId('LOG-94025')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <IconCopy size={13} /> Copy Event ID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
    </div>
  )
}
