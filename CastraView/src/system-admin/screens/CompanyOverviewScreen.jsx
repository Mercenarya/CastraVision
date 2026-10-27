import React, { useState } from 'react'
import {
  StatusBadge,
  AlertBanner,
} from '../ui/Primitives'

/**
 * Screen 3: Company Overview
<<<<<<< HEAD
 * Reference: companyoverview—systemadmin.png
=======
 * Matches Figma Reference: docs/admin_system/companyoverview—systemadmin.png
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
 */
export function CompanyOverviewScreen({
  company,
  onNavigate,
  onUpdateCompany,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', title: string, message: string }

  // Editable form state initialized with company data
  const [formData, setFormData] = useState({
    name: company?.name || '',
    legalEntity: company?.legalEntity || company?.name || '',
    accountEmail: company?.accountEmail || company?.adminEmail || '',
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
            ← Back to Company Management
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
        title: 'Status Synchronized (Local Simulation)',
        message: `Demo status refreshed from local data for ${company.name}.`,
      })
    }, 450)
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setFeedback(null)
  }

  const handleCancelEdit = () => {
    setFormData({
      name: company.name || '',
      legalEntity: company.legalEntity || company.name || '',
      accountEmail: company.accountEmail || company.adminEmail || '',
      domain: company.domain || '',
      status: company.status || 'Active',
      notes: company.notes || '',
    })
    setIsEditing(false)
    setFeedback(null)
  }

  const handleSaveChanges = (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!isEditing) {
      // If user clicks Save Changes without being in edit mode
      setFeedback({
        type: 'info',
        title: 'Organization Details Current',
        message: `Tenant profile for "${formData.name}" is already up to date. Click "Edit Organization Details" to modify fields.`,
      })
      return
    }

    // Basic validation
    if (!formData.name.trim()) {
      setFeedback({
        type: 'error',
        title: 'Validation Error',
        message: 'Company legal entity / name cannot be blank.',
      })
      return
    }

    if (!formData.accountEmail.trim() || !formData.accountEmail.includes('@')) {
      setFeedback({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide a valid account administrator email address.',
      })
      return
    }

    const updated = {
      ...company,
      ...formData,
      legalEntity: formData.legalEntity || formData.name,
      adminEmail: formData.accountEmail,
    }

    if (onUpdateCompany) {
      onUpdateCompany(updated)
    }

    setIsEditing(false)
    setFeedback({
      type: 'success',
      title: 'Changes Persisted (Local Session State)',
      message: `Organization details for "${formData.name}" have been updated in local React state. Note: Server persistence is simulated in this client-only environment.`,
    })
  }

  // Domain verification check: only show green checkmark if verification data actually exists
  const isDomainVerified = Boolean(
    company.domainVerified ||
    company.history?.some((h) => h.title === 'Domain Verified')
  )

  // Safe storage percentage calculation
  const parseStorage = (str) => {
    if (!str) return null
    const match = str.match(/([\d.]+)/)
    return match ? parseFloat(match[1]) : null
  }

  const storageUsedNum = parseStorage(company.storageUsed)
  const storageLimitNum = parseStorage(company.storageLimit)
  const storagePercent =
    storageUsedNum !== null &&
      storageLimitNum !== null &&
      storageLimitNum > 0
      ? Math.min(100, Math.max(0, Math.round((storageUsedNum / storageLimitNum) * 100)))
      : null

  // Licensed seats display qualification
  const hasValidLicensedSeats =
    typeof company.licensedSeats === 'number' &&
    !isNaN(company.licensedSeats) &&
    company.licensedSeats >= 0

  return (
    <div className="sa-page-container">
      {/* Top Breadcrumb Navigation */}
      <div className="sa-overview-top-nav">
        <div className="sa-overview-breadcrumbs">
          <button
            type="button"
            className="sa-breadcrumb-link"
            onClick={() => onNavigate('sa-company-mgmt')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
            </svg>
            Company Management
          </button>
          <span className="sa-breadcrumb-sep">/</span>
          <span className="sa-breadcrumb-current">{formData.name || company.name}</span>
          <span className="sa-breadcrumb-sep">/</span>
          <span className="sa-breadcrumb-active">Overview</span>
        </div>

        <button
          type="button"
          className="sa-btn-back"
          onClick={() => onNavigate('sa-company-mgmt')}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Company Management
        </button>
      </div>

      {/* Dismissible Feedback Banner */}
      {feedback && (
        <AlertBanner
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* 1. Company Identity Header Card */}
      <div className="sa-card sa-overview-header-card">
        <div className="sa-overview-header-row">
          <div className="sa-overview-identity">
            <div
              className="sa-overview-avatar"
              style={{
                backgroundColor: company.avatarBg || '#1e293b',
              }}
            >
              {company.avatarInitials ||
                (formData.name
                  ? formData.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  : 'CO')}
            </div>

            <div className="sa-overview-identity-text">
              <div className="sa-overview-title-row">
                <h1 className="sa-overview-company-name">{formData.name}</h1>
                <StatusBadge status={formData.status} />
              </div>

              <div className="sa-overview-node-row">
                <span className="sa-node-badge">
                  <span className="sa-node-dot" />
                  {company.node || 'Enclave Node #04'} (Simulated)
                </span>
              </div>

              <div className="sa-overview-meta-tags">
                <span className="sa-meta-tag">
                  Primary Tenant ID:{' '}
                  <span className="mono">{company.tenantId || company.id}</span>
                </span>
                <span className="sa-meta-divider">·</span>
                <span className="sa-meta-tag">Isolated Enclave Node (Simulated)</span>
              </div>
            </div>
          </div>

          <div className="sa-overview-header-actions">
            {!isEditing ? (
              <button
                type="button"
                className="sa-btn-ghost-edit"
                onClick={handleStartEdit}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Organization Details
              </button>
            ) : (
              <button
                type="button"
                className="sa-btn sa-btn-secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              className="sa-btn-ghost-refresh"
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
              className="sa-btn-save-green"
              onClick={handleSaveChanges}
            >
              <svg
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
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="sa-overview-grid">
        {/* Left Column: Account Information + Platform Provisioning Tier */}
        <div className="sa-overview-left-col">
          {/* Card 2: Company Account Information */}
          <div className="sa-card sa-overview-section">
            <div className="sa-section-header">
              <div className="sa-section-title-wrap">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                >
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                  <path d="M9 22v-4h6v4" />
                  <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
                </svg>
                <h2 className="sa-section-title">Company Account Information</h2>
              </div>
              <span className="sa-badge-muted">TENANT SPECS</span>
            </div>

            <div className="sa-overview-fields-grid">
              {/* Field 1: Company Legal Entity */}
              <div className="sa-overview-field-card">
                <div className="sa-field-card-label">COMPANY LEGAL ENTITY</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="sa-input sa-field-input"
                    value={formData.legalEntity}
                    onChange={(e) => handleInputChange('legalEntity', e.target.value)}
                    required
                  />
                ) : (
                  <div className="sa-field-card-value">{formData.legalEntity || company.name}</div>
                )}
              </div>

              {/* Field 2: Tenant Identifier (Immutable) */}
              <div className="sa-overview-field-card">
                <div className="sa-field-card-label">
                  TENANT IDENTIFIER
                  <span className="sa-immutable-tag">Immutable</span>
                </div>
                <div className="sa-field-card-value mono cyan-text">
                  {company.tenantId || company.id}
                </div>
              </div>

              {/* Field 3: Account Administrator Email */}
              <div className="sa-overview-field-card">
                <div className="sa-field-card-label">ACCOUNT ADMINISTRATOR EMAIL</div>
                {isEditing ? (
                  <input
                    type="email"
                    className="sa-input sa-field-input"
                    value={formData.accountEmail}
                    onChange={(e) => handleInputChange('accountEmail', e.target.value)}
                    required
                  />
                ) : (
                  <div className="sa-field-card-value mono">{formData.accountEmail}</div>
                )}
              </div>

              {/* Field 4: Registered Root Domain */}
              <div className="sa-overview-field-card">
                <div className="sa-field-card-label">REGISTERED ROOT DOMAIN</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="sa-input sa-field-input"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    placeholder="e.g. acmecorp.com"
                  />
                ) : (
                  <div className="sa-field-card-value sa-domain-val-row">
                    <span>{formData.domain || 'Not configured'}</span>
                    {formData.domain && isDomainVerified ? (
                      <span
                        className="sa-domain-verified-badge"
                        title="DNS Verification Confirmed (Mock)"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    ) : (
                      formData.domain && (
                        <span className="sa-domain-unverified-tag" title="DNS Record Unverified">
                          Unverified
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Field 5: Creation Date (Immutable) */}
              <div className="sa-overview-field-card">
                <div className="sa-field-card-label">
                  CREATION DATE
                  <span className="sa-immutable-tag">Immutable</span>
                </div>
                <div className="sa-field-card-value">
                  {company.provisionedOn || company.createdAt || 'October 12, 2026'}
                </div>
              </div>

              {/* Field 6: Activity Status */}
              <div className="sa-overview-field-card">
                <div className="sa-field-card-label">ACTIVITY STATUS</div>
                {isEditing ? (
                  <select
                    className="sa-select sa-field-input"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending Setup">Pending Setup</option>
                  </select>
                ) : (
                  <div className="sa-field-card-value sa-status-val-row">
                    <span
                      className={`sa-status-dot ${formData.status === 'Active'
                          ? 'green'
                          : formData.status === 'Inactive'
                            ? 'slate'
                            : 'amber'
                        }`}
                    />
                    <span>
                      {formData.status === 'Active'
                        ? 'Active (Operational)'
                        : formData.status === 'Inactive'
                          ? 'Inactive (Suspended)'
                          : 'Pending Setup'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Account Notes in edit or view mode if provided */}
            {isEditing ? (
              <div className="sa-account-notes-box">
                <div className="sa-field-card-label">ACCOUNT NOTES</div>
                <textarea
                  className="sa-textarea"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Optional administrative notes regarding this tenant..."
                />
              </div>
            ) : (
              formData.notes && (
                <div className="sa-account-notes-box">
                  <div className="sa-field-card-label">ACCOUNT NOTES</div>
                  <div className="sa-notes-text">{formData.notes}</div>
                </div>
              )
            )}
          </div>

          {/* Card 3: Platform Provisioning Tier */}
          <div className="sa-card sa-overview-section" style={{ marginTop: '24px' }}>
            <div className="sa-section-header">
              <div className="sa-section-title-wrap">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <h2 className="sa-section-title">Platform Provisioning Tier</h2>
              </div>
              <span className="sa-badge-cyan">ENTERPRISE CORE</span>
            </div>

            {/* Inset Provisioning Sandbox Banner */}
            <div className="sa-provisioning-banner">
              <div className="sa-provisioning-icon-box">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              <div className="sa-provisioning-body">
                <div className="sa-provisioning-title-row">
                  <span className="sa-provisioning-heading">Multi-tenant Isolated Sandbox</span>
                  <span className="sa-badge-purple">Strict Multi-Tenant Mode</span>
                </div>
                <p className="sa-provisioning-desc">
                  Tenant workspace segregation with isolated namespace boundaries (Simulated Design Target).
                  Cross-tenant data access, telemetry leakage, and resource sharing are isolated
                  at the application boundary.
                </p>
                <div className="sa-provisioning-disclaimer">
                  * Architecture Specification (Design Target) · Hardware-level microVM and egress
                  proxy enforcement are architectural design targets; current frontend environment
                  simulates these isolation controls without active cryptographic enclaves.
                </div>
              </div>
            </div>

            {/* 3-Column Specifications Row */}
            <div className="sa-spec-3col-grid">
              <div className="sa-spec-3col-card">
                <div className="sa-spec-3col-label">Compute Isolation</div>
                <div className="sa-spec-3col-value">Dedicated microVM (Simulated)</div>
              </div>
              <div className="sa-spec-3col-card">
                <div className="sa-spec-3col-label">Network Routing</div>
                <div className="sa-spec-3col-value">Egress Proxy Enforced (Simulated)</div>
              </div>
              <div className="sa-spec-3col-card">
                <div className="sa-spec-3col-label">Encryption Key (KMS)</div>
                <div className="sa-spec-3col-value">Customer Managed (Simulated)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Utilization Metrics */}
        <div className="sa-overview-right-col">
          <div className="sa-card sa-overview-section">
            <div className="sa-section-header">
              <div className="sa-section-title-wrap">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <h2 className="sa-section-title">Platform Utilization Metrics</h2>
              </div>
              <span className="sa-util-pulse-dot" title="Telemetry Feed Active (Simulated)" />
            </div>

            {/* Seat Allocation and Employee Headcount Block */}
            <div className="sa-metrics-seats-card">
              <div className="sa-seats-label-row">
                <span className="sa-seats-label">TOTAL EMPLOYEE HEADCOUNT</span>
                <span className="sa-badge-tenant-allocation">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Aggregate Headcount
                </span>
              </div>

              <div className="sa-seats-count-row">
                <span className="sa-seats-big-number">
                  {typeof company.employeeCount === 'number'
                    ? company.employeeCount
                    : '—'}
                </span>
                <span className="sa-seats-slash">
                  employees (Roster aggregate)
                </span>
              </div>

              <div className="sa-seats-breakdown-row">
                <span className="sa-seats-cap-item">
                  <strong>Demo Seat Allocation:</strong>{' '}
                  {hasValidLicensedSeats
                    ? `${company.licensedSeats} seats (Demo baseline)`
                    : 'Unallocated quota'}
                </span>
                <span className="sa-seats-cap-item">
                  <strong>Occupied Seats:</strong>{' '}
                  {typeof company.occupiedSeats === 'number'
                    ? `${company.occupiedSeats} seats`
                    : 'Unavailable (Not tracked at platform layer)'}
                </span>
              </div>

              <div className="sa-seats-subtext">
                Roster headcount and licensed capacity are conceptually independent metrics. 25-seat baseline represents a default demo allocation, not a contractual license.
              </div>
            </div>

            {/* Inset Privacy Sentinel Box */}
            <div className="sa-privacy-sentinel-box">
              <div className="sa-privacy-sentinel-title">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                PRIVACY ISOLATION ACTIVE
              </div>
              <p className="sa-privacy-sentinel-desc">
                In accordance with platform governance, employee identities, email rosters,
                individual usage logs, and department workgroups are strictly restricted to{' '}
                <strong style={{ color: '#ffffff' }}>{formData.name || company.name}</strong>
                's internal workspace administrators. System Admin is prohibited from viewing
                individual employee records.
              </p>
            </div>

            {/* Storage Quota Progress Bar */}
            <div className="sa-storage-box">
              <div className="sa-storage-label-row">
                <span className="sa-storage-title">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                  >
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                  Storage Quota
                </span>
                <span className="sa-storage-values">
                  {company.storageUsed || '1.2 GB'} / {company.storageLimit || '10 GB'}
                </span>
              </div>

              <div className="sa-storage-track">
                <div
                  className="sa-storage-fill"
                  style={{
                    width: `${storagePercent !== null ? storagePercent : 0}%`,
                  }}
                />
              </div>

              <div className="sa-storage-footer-row">
                <span>Normalized Data Volume</span>
                <span>
                  {storagePercent !== null ? `${storagePercent}% utilized` : 'Quota unconfigured'}
                </span>
              </div>
            </div>

            {/* API Gateway Uptime */}
            <div className="sa-uptime-card">
              <div className="sa-uptime-left">
                <div className="sa-uptime-icon-wrap">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="sa-uptime-content">
                  <div className="sa-uptime-title">API Gateway Uptime</div>
                  <div className="sa-uptime-sub">
                    {company.uptime
                      ? `Healthy · ${company.uptime} Uptime (Simulated Fixture)`
                      : 'Uptime telemetry unavailable'}
                  </div>
                </div>
              </div>

              <span className={`sa-uptime-badge ${!company.uptime ? 'muted' : ''}`}>
                {company.uptime ? 'STABLE' : 'UNAVAILABLE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Platform Governance History */}
      <div className="sa-card sa-governance-history-card">
        <div className="sa-section-header">
          <div className="sa-section-title-wrap">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <h2 className="sa-section-title">
              Platform Governance History{' '}
              <span className="sa-section-scope">(Tenant Infrastructure Scope Only)</span>
            </h2>
          </div>
          <span className="sa-badge-fixture" title="Simulated governance entries">
            🔒 Demo Governance History (Fixture)
          </span>
        </div>

        <div className="sa-timeline">
          {(company.history || [
            {
              title: 'Status Synchronized',
              actor: 'System Admin',
              date: 'Oct 24, 2026 09:15 UTC',
              detail:
                'Demo operational status refreshed from local telemetry (Simulated).',
              icon: 'shield',
            },
            {
              title: 'Domain Staged',
              actor: 'System Admin',
              date: 'Oct 16, 2026 11:42 UTC',
              detail:
                'Domain record staged in demo metadata (Simulated — no live DNS probe performed).',
              icon: 'file',
            },
            {
              title: 'Company Staged (Demo Session)',
              actor: 'System Admin',
              date: `${company.provisionedOn || 'Oct 12, 2026'} 14:00 UTC`,
              detail:
                'Company added to the local demo session. No backend tenant or database schema was provisioned.',
              icon: 'cpu',
            },
          ]).map((evt, idx) => (
            <div key={idx} className="sa-timeline-item">
              <div className="sa-timeline-icon-box">
                {evt.icon === 'shield' || evt.icon === '🛡' ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ) : evt.icon === 'file' || evt.icon === '📄' ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="18" r="3" />
                    <circle cx="6" cy="6" r="3" />
                    <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                    <line x1="6" y1="9" x2="6" y2="21" />
                  </svg>
                )}
              </div>

              <div className="sa-timeline-body">
                <div className="sa-timeline-head">
                  <div className="sa-timeline-title-row">
                    <span className="sa-timeline-title">{evt.title}</span>
                    <span className="sa-timeline-actor">{evt.actor}</span>
                  </div>
                  <span className="sa-timeline-date mono">{evt.date}</span>
                </div>
                <p className="sa-timeline-desc">{evt.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full-Width Bottom Card: DATA ISOLATION COMPLIANCE GUARANTEE */}
      <div className="sa-card sa-compliance-card">
        <div className="sa-compliance-icon-wrap">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>

        <div className="sa-compliance-body">
          <h3 className="sa-compliance-title">DATA ISOLATION COMPLIANCE GUARANTEE</h3>
          <p className="sa-compliance-desc">
            Company marketing strategies, creative proposals, and ad spend analytics are stored
            within encrypted customer tenancy and are not visible in this view. Platform operators
            possess infrastructure lifecycle control with zero tenant PII or competitive telemetry
            disclosure.
          </p>
          <div className="sa-compliance-note">
            Policy Architecture Specification · System Administrator access is strictly segregated
            at the database schema layer. Platform operators maintain infrastructure operations
            without read privileges into creative assets, internal workspace proposals, or employee
            personal data.
          </div>
        </div>
      </div>
    </div>
  )
}
