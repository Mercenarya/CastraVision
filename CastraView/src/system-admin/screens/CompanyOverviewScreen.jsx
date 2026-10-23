import React, { useState } from 'react'
import {
  StatusBadge,
  CompanyAvatar,
  TenantPrivacyNotice,
  AlertBanner,
} from '../ui/Primitives'

/**
 * Screen 3: Company Overview
 * Reference: companyoverview—systemadmin.png
 */
export function CompanyOverviewScreen({
  company,
  onNavigate,
  onUpdateCompany,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', message: string }

  // Editable form state
  const [formData, setFormData] = useState({
    name: company?.name || '',
    legalEntity: company?.legalEntity || company?.name || '',
    accountEmail: company?.accountEmail || '',
    adminEmail: company?.adminEmail || '',
    domain: company?.domain || '',
    status: company?.status || 'Active',
    notes: company?.notes || '',
  })


  if (!company) {
    return (
      <div className="sa-page-container">
        <div className="sa-empty-state">
          <div className="sa-empty-icon">🏢</div>
          <div className="sa-empty-title">No Company Selected</div>
          <p className="sa-empty-desc">
            Please select a company from Company Management to view its configuration and utilization overview.
          </p>
          <button
            type="button"
            className="sa-btn sa-btn-primary"
            onClick={() => onNavigate('sa-company-mgmt')}
          >
            ← Go to Company Management
          </button>
        </div>
      </div>
    )
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRefreshStatus = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setFeedback({
        type: 'success',
        title: 'Status Synchronized',
        message: `Tenant status refreshed for ${company.name}. Node health check confirmed nominal.`,
      })
    }, 500)
  }

  const handleSaveChanges = (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.name.trim()) {
      setFeedback({
        type: 'error',
        title: 'Validation Error',
        message: 'Company Name cannot be empty.',
      })
      return
    }

    if (!formData.accountEmail.trim() || !formData.accountEmail.includes('@')) {
      setFeedback({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide a valid account email address.',
      })
      return
    }

    const updated = {
      ...company,
      ...formData,
      legalEntity: formData.legalEntity || formData.name,
    }

    if (onUpdateCompany) {
      onUpdateCompany(updated)
    }

    setIsEditing(false)
    setFeedback({
      type: 'success',
      title: 'Changes Persisted',
      message: `Organization details for ${formData.name} were successfully updated.`,
    })
  }

  const handleCancelEdit = () => {
    setFormData({
      name: company.name || '',
      legalEntity: company.legalEntity || company.name || '',
      accountEmail: company.accountEmail || '',
      adminEmail: company.adminEmail || '',
      domain: company.domain || '',
      status: company.status || 'Active',
      notes: company.notes || '',
    })
    setIsEditing(false)
    setFeedback(null)
  }

  return (
    <div className="sa-page-container">
      {/* Back button and breadcrumb action */}
      <div className="sa-overview-top-nav">
        <button
          type="button"
          className="sa-btn-back"
          onClick={() => onNavigate('sa-company-mgmt')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Company Management
        </button>
      </div>

      {/* Feedback banner if present */}
      {feedback && (
        <AlertBanner
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Company Identity Header Card */}
      <div className="sa-card sa-overview-header-card">
        <div className="sa-overview-header-row">
          <div className="sa-overview-identity">
            <CompanyAvatar
              initials={company.avatarInitials}
              bg={company.avatarBg}
              size={56}
            />
            <div className="sa-overview-identity-text">
              <div className="sa-overview-title-row">
                <h1 className="sa-overview-company-name">{formData.name}</h1>
                <StatusBadge status={formData.status} />
              </div>
              <div className="sa-overview-meta-tags">
                <span className="sa-meta-tag mono">ID: {company.id}</span>
                <span className="sa-meta-divider">•</span>
                <span className="sa-meta-tag mono">Tenant: {company.tenantId}</span>
                <span className="sa-meta-divider">•</span>
                <span className="sa-meta-tag">Provisioned {company.provisionedOn}</span>
              </div>
            </div>
          </div>

          <div className="sa-overview-header-actions">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  className="sa-btn sa-btn-secondary"
                  onClick={handleRefreshStatus}
                  disabled={isRefreshing}
                >
                  <svg
                    className={`sa-btn-icon ${isRefreshing ? 'sa-spin' : ''}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Refresh Status
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <svg
                    className="sa-btn-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Edit Organization Details
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="sa-btn sa-btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn-primary"
                  onClick={handleSaveChanges}
                >
                  <svg
                    className="sa-btn-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Organization Account Info (Left) + Platform Utilization (Right) */}
      <div className="sa-overview-grid">
        {/* Left Column: Organization Details */}
        <div className="sa-card sa-overview-section">
          <div className="sa-section-header">
            <h2 className="sa-section-title">Company Account Information</h2>
            <span className="sa-section-subtitle">
              {isEditing ? 'Editing permitted tenant fields' : 'Platform registry record'}
            </span>
          </div>

          <form onSubmit={handleSaveChanges} className="sa-form-grid">
            {/* Legal Entity / Display Name */}
            <div className="sa-form-group">
              <label className="sa-form-label">Company Legal Entity / Name</label>
              {isEditing ? (
                <input
                  type="text"
                  className="sa-input"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              ) : (
                <div className="sa-detail-value">{company.name}</div>
              )}
            </div>

            {/* Tenant Identifier (Immutable) */}
            <div className="sa-form-group">
              <label className="sa-form-label">
                Tenant Identifier <span className="sa-label-badge">Immutable</span>
              </label>
              <div className="sa-detail-value mono text-muted">
                {company.tenantId}
              </div>
            </div>

            {/* Account Contact Email */}
            <div className="sa-form-group">
              <label className="sa-form-label">Company Account Administrator Email</label>
              {isEditing ? (
                <input
                  type="email"
                  className="sa-input"
                  value={formData.accountEmail}
                  onChange={(e) =>
                    handleInputChange('accountEmail', e.target.value)
                  }
                  required
                />
              ) : (
                <div className="sa-detail-value mono">{company.accountEmail}</div>
              )}
            </div>

            {/* Registered Domain */}
            <div className="sa-form-group">
              <label className="sa-form-label">Registered Business Domain</label>
              {isEditing ? (
                <input
                  type="text"
                  className="sa-input"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  placeholder="e.g. acmecorp.com"
                />
              ) : (
                <div className="sa-detail-value">{company.domain}</div>
              )}
            </div>

            {/* Operational Activity Status */}
            <div className="sa-form-group">
              <label className="sa-form-label">Activity Status</label>
              {isEditing ? (
                <select
                  className="sa-select"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending Setup">Pending Setup</option>
                </select>
              ) : (
                <div className="sa-detail-value">
                  <StatusBadge status={company.status} />
                </div>
              )}
            </div>

            {/* Creation Date (Immutable) */}
            <div className="sa-form-group">
              <label className="sa-form-label">
                Creation Date <span className="sa-label-badge">Immutable</span>
              </label>
              <div className="sa-detail-value text-muted">
                {company.provisionedOn}
              </div>
            </div>

            {/* Account Notes */}
            <div className="sa-form-group full-width">
              <label className="sa-form-label">Account Notes</label>
              {isEditing ? (
                <textarea
                  className="sa-textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Optional administrative notes regarding this tenant..."
                />
              ) : (
                <div className="sa-detail-value text-muted">
                  {company.notes || 'No administrative notes recorded for this tenant account.'}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Platform Utilization Metrics & Enclave Tier */}
        <div className="sa-overview-right-col">
          {/* Utilization Metrics Card */}
          <div className="sa-card sa-overview-section">
            <div className="sa-section-header">
              <h2 className="sa-section-title">Platform Utilization Metrics</h2>
              <span className="sa-section-badge">Zero PII Access</span>
            </div>

            <div className="sa-utilization-metrics">
              <div className="sa-util-item">
                <div className="sa-util-label">Aggregated Employee Count</div>
                <div className="sa-util-val-row">
                  <span className="sa-util-number">{company.employeeCount}</span>
                  <span className="sa-util-unit">Employees</span>
                </div>
                <div className="sa-util-desc">
                  Aggregate roster count only. Platform admin cannot inspect employee names, profiles, or directories.
                </div>
              </div>

              <div className="sa-util-item">
                <div className="sa-util-label">Licensed Seat Allocation</div>
                <div className="sa-util-val-row">
                  <span className="sa-util-number">{company.licensedSeats || 25}</span>
                  <span className="sa-util-unit">Allocated Seats</span>
                </div>
                <div className="sa-util-desc">
                  Authorized enterprise tier seat quota defined during account onboarding.
                </div>
              </div>

              <div className="sa-util-item">
                <div className="sa-util-label">Assigned Cluster Node</div>
                <div className="sa-util-val-row">
                  <span className="sa-util-node-title">{company.node || 'Enclave Node #04'}</span>
                  <span className="sa-node-status-chip">Nominal</span>
                </div>
                <div className="sa-util-desc">
                  Isolated sandbox container routed through sovereign boundary egress. Uptime: {company.uptime || '99.98%'}.
                </div>
              </div>
            </div>
          </div>

          {/* Platform Provisioning Tier */}
          <div className="sa-card sa-overview-section">
            <div className="sa-section-header">
              <h2 className="sa-section-title">Platform Provisioning Tier</h2>
              <span className="sa-section-badge green">Isolated Sandbox</span>
            </div>

            <div className="sa-provisioning-specs">
              <div className="sa-spec-row">
                <span className="sa-spec-label">Internal Routing:</span>
                <span className="sa-spec-value mono">
                  {company.internalDomain || `${company.name.toLowerCase().replace(/\s+/g, '')}.tenant.castra.internal`}
                </span>
              </div>
              <div className="sa-spec-row">
                <span className="sa-spec-label">Storage Allocated:</span>
                <span className="sa-spec-value">
                  {company.storageUsed || '1.2 GB'} / {company.storageLimit || '10 GB'}
                </span>
              </div>
              <div className="sa-spec-row">
                <span className="sa-spec-label">Boundary Policy:</span>
                <span className="sa-spec-value green-text">Strict Zero-Knowledge Roster Isolation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Governance History */}
      <div className="sa-card sa-overview-section" style={{ marginTop: '24px' }}>
        <div className="sa-section-header">
          <h2 className="sa-section-title">Platform Governance History</h2>
          <span className="sa-section-subtitle">
            Tenant-account level administrative logs (No company-internal activity exposed)
          </span>
        </div>

        <div className="sa-timeline">
          {(company.history || [
            {
              title: 'Status Verified',
              actor: 'Automated Health Probe',
              date: 'Oct 24, 2026 09:15 UTC',
              detail: 'Automated security health check passed across all boundary ingress nodes.',
              icon: '🛡',
            },
            {
              title: 'Domain Verified',
              actor: 'System Admin',
              date: 'Oct 16, 2026 11:42 UTC',
              detail: 'Domain DNS records confirmed with zero trust TLS pin registration.',
              icon: '📄',
            },
            {
              title: 'Tenant Account Provisioned',
              actor: 'System Admin',
              date: `${company.provisionedOn} 14:00 UTC`,
              detail: `Initial tenant container initialized on ${company.node || 'Enclave Node #04'} with sovereign database schema.`,
              icon: '⚙',
            },
          ]).map((evt, idx) => (
            <div key={idx} className="sa-timeline-item">
              <div className="sa-timeline-marker">
                <span className="sa-timeline-icon">{evt.icon}</span>
              </div>
              <div className="sa-timeline-content">
                <div className="sa-timeline-header">
                  <span className="sa-timeline-title">{evt.title}</span>
                  <span className="sa-timeline-date">{evt.date}</span>
                </div>
                <div className="sa-timeline-actor">Actor: {evt.actor}</div>
                <p className="sa-timeline-detail">{evt.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Privacy Sentinel */}
      <TenantPrivacyNotice />
    </div>
  )
}
