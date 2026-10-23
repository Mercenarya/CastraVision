import { useState } from 'react'
import { PageHeader, SecondaryButton } from '../ui/Primitives'
import { INITIAL_AUDIT_LOGS } from '../mockData'

export default function AuditLogDetailsScreen({
  record = INITIAL_AUDIT_LOGS[0],
  onBack,
  notify,
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
    </div>
  )
}
