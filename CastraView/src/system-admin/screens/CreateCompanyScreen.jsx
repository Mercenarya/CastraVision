import React, { useState, useId } from 'react'

/**
 * Screen 4: Create Company Account (Validation & Success States)
 * Reference: docs/admin_system/createcompanyaccount—validation&successstates.png
 */
export function CreateCompanyScreen({
  existingCompanies = [],
  onNavigate,
  onCreateCompany,
}) {
  const [formData, setFormData] = useState({
    name: '',
    accountEmail: '',
    domain: '',
    slug: '',
    status: 'Active', // 'Active' | 'Inactive (Pending Setup)'
    notes: '',
  })

  // Development-only visual QA preview state
  const [devPreviewState, setDevPreviewState] = useState('auto') // 'auto' | 'invalid-email' | 'duplicate-tenant' | 'provisioning-ready'
  const [dismissedAlerts, setDismissedAlerts] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState({})

  const nameInputId = useId()
  const emailInputId = useId()
  const domainInputId = useId()
  const slugInputId = useId()
  const notesInputId = useId()

  // Real-time pre-flight client-side validation
  const getValidationAlert = (data) => {
    // 1. Email format and business domain check
    const freeMailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com']
    const email = data.accountEmail.trim().toLowerCase()

    if (email && email.includes('@')) {
      const emailDomain = email.split('@')[1]
      if (freeMailProviders.includes(emailDomain)) {
        return {
          id: 'invalid-email',
          type: 'error',
          title: 'Validation Error: Invalid Company Account Email',
          tag: 'REJECTED',
          message: `The domain ${emailDomain} is not a recognized corporate domain. Free email providers (@gmail.com, @yahoo.com) are strictly prohibited for tenant administration.`,
        }
      }
    }

    // 2. Duplicate Tenant collision check
    const cleanSlug = data.slug.trim().toLowerCase()
    const cleanName = data.name.trim().toLowerCase()
    const cleanDomain = data.domain.trim().toLowerCase()

    const duplicate = existingCompanies.find((c) => {
      const cName = c.name?.toLowerCase()
      const cTenantId = (c.tenantId || c.id)?.toLowerCase()
      const cEmail = c.accountEmail?.toLowerCase()
      const cDomain = c.domain?.toLowerCase()

      return (
        (cleanName && cName === cleanName) ||
        (cleanSlug && (cTenantId === cleanSlug || cTenantId === `tenant_${cleanSlug}`)) ||
        (email && cEmail === email) ||
        (cleanDomain && cDomain === cleanDomain)
      )
    })

    if (duplicate) {
      return {
        id: 'duplicate-tenant',
        type: 'warning',
        title: 'Duplicate Tenant Notice',
        tag: 'Collision Detected',
        message: `An organization with identifier ${cleanSlug || cleanName} or domain ${cleanDomain || 'domain'} is already registered on cluster node us-east-core-01. Please specify a unique corporate domain.`,
      }
    }

    // 3. Ready state if minimum valid fields are present
    if (cleanName && email && email.includes('@') && cleanSlug && !duplicate) {
      return {
        id: 'provisioning-ready',
        type: 'success',
        title: 'Account Provisioning Ready',
        tag: 'Pre-Flight Passed',
        message: `Namespace ${cleanSlug} validated. Ready for root tenant cluster initialization across physical NVMe volumes (Simulated Pre-Flight).`,
      }
    }

    return null
  }

  // Determine which alert to display based on dev preview or live validation
  const liveAlert = getValidationAlert(formData)

  let activeAlert = null
  if (import.meta.env.DEV && devPreviewState !== 'auto') {
    if (devPreviewState === 'invalid-email') {
      activeAlert = {
        id: 'dev-invalid-email',
        type: 'error',
        title: 'Validation Error: Invalid Company Account Email',
        tag: 'REJECTED',
        message:
          'The domain company@gmail.com is not a recognized corporate domain. Free email providers (@gmail.com, @yahoo.com) are strictly prohibited for tenant administration.',
      }
    } else if (devPreviewState === 'duplicate-tenant') {
      activeAlert = {
        id: 'dev-duplicate-tenant',
        type: 'warning',
        title: 'Duplicate Tenant Notice',
        tag: 'Collision Detected',
        message:
          'An organization with identifier acmecorp or domain acmecorp.com is already registered on cluster node us-east-core-01. Please specify a unique corporate domain.',
      }
    } else if (devPreviewState === 'provisioning-ready') {
      activeAlert = {
        id: 'dev-provisioning-ready',
        type: 'success',
        title: 'Account Provisioning Ready',
        tag: 'Pre-Flight Passed',
        message:
          'Namespace apex-logistics validated. Ready for root tenant cluster initialization across physical NVMe volumes (Simulated Pre-Flight).',
      }
    }
  } else if (liveAlert && !dismissedAlerts[liveAlert.id]) {
    activeAlert = liveAlert
  }

  const handleInputChange = (field, value) => {
    const updated = { ...formData, [field]: value }

    // Auto-generate slug from company name if slug hasn't been manually touched
    if (field === 'name' && (!touched.slug || !formData.slug)) {
      updated.slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Auto-fill domain from email if domain hasn't been manually touched
    if (field === 'accountEmail' && (!touched.domain || !formData.domain)) {
      const parts = value.split('@')
      if (parts.length === 2 && parts[1].includes('.')) {
        updated.domain = parts[1].toLowerCase()
      }
    }

    setFormData(updated)
    setTouched((prev) => ({ ...prev, [field]: true }))
    setDismissedAlerts({})
  }

  const handleReset = () => {
    setFormData({
      name: '',
      accountEmail: '',
      domain: '',
      slug: '',
      status: 'Active',
      notes: '',
    })
    setTouched({})
    setDismissedAlerts({})
    setDevPreviewState('auto')
  }

  const handleDismissAlert = (alertId) => {
    setDismissedAlerts((prev) => ({ ...prev, [alertId]: true }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter a Company Name.')
      return
    }

    if (!formData.accountEmail.trim() || !formData.accountEmail.includes('@')) {
      alert('Please enter a valid Company Account Email.')
      return
    }

    const freeMailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com']
    const emailDomain = formData.accountEmail.trim().toLowerCase().split('@')[1]
    if (freeMailProviders.includes(emailDomain)) {
      alert(`The domain ${emailDomain} is a free webmail provider and cannot be used for tenant administration.`)
      return
    }

    const cleanSlug = formData.slug.trim().toLowerCase() || formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const isDuplicate = existingCompanies.some(
      (c) =>
        (c.name && c.name.toLowerCase() === formData.name.trim().toLowerCase()) ||
        (c.tenantId && c.tenantId.toLowerCase() === `tenant_${cleanSlug}`)
    )

    if (isDuplicate) {
      alert(`Tenant "${formData.name}" or slug "${cleanSlug}" already exists. Please choose a unique name or slug.`)
      return
    }

    setIsSubmitting(true)

    // Simulate tenant account provisioning into local session state
    setTimeout(() => {
      const newCompanyId = `cv-org-${Math.floor(1000 + Math.random() * 9000)}`
      const newTenantId = `tenant_${cleanSlug}`
      const initials = formData.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()

      const newCompany = {
        id: newCompanyId,
        name: formData.name.trim(),
        legalEntity: formData.name.trim(),
        tenantId: newTenantId,
        accountEmail: formData.accountEmail.trim(),
        adminEmail: formData.accountEmail.trim(),
        domain: formData.domain.trim() || `${cleanSlug}.com`,
        internalDomain: `${cleanSlug}.tenant.castra.internal`,
        status: formData.status === 'Active' ? 'Active' : 'Inactive',
        employeeCount: 0, // Strict zero initial roster
        licensedSeats: 25, // Baseline demo seat quota (Not a contractual license)
        provisionedOn: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }),
        createdAt: new Date().toISOString().split('T')[0],
        node: 'Enclave Node #03',
        storageUsed: '0.05 GB',
        storageLimit: '10 GB',
        uptime: '100%',
        avatarBg: '#059669',
        avatarInitials: initials || 'CO',
        notes: formData.notes.trim(),
        history: [
          {
            title: 'Company Staged (Demo Session)',
            actor: 'System Admin',
            date: 'Just now',
            detail: `Company added to the local demo session under ${newTenantId}. No backend tenant or cluster node was provisioned.`,
            icon: '⚙',
          },
        ],
      }

      if (onCreateCompany) {
        onCreateCompany(newCompany)
      }

      setIsSubmitting(false)
      onNavigate('sa-company-mgmt')
    }, 500)
  }

  // Checklist verification state derivation
  const isSlugValid = Boolean(formData.slug.trim())
  const hasSlugCollision = existingCompanies.some(
    (c) =>
      c.tenantId &&
      c.tenantId.toLowerCase() === `tenant_${formData.slug.trim().toLowerCase()}`
  )

  return (
    <div className="sa-page-container">
      {/* Breadcrumb Navigation & Top Metadata */}
      <div className="sa-create-top-bar">
        <div className="sa-create-breadcrumbs">
          <button
            type="button"
            className="sa-breadcrumb-link"
            onClick={() => onNavigate('sa-company-mgmt')}
          >
            Company Management
          </button>
          <span className="sa-breadcrumb-sep">/</span>
          <span className="sa-breadcrumb-active">Create Company Account</span>
          <span className="sa-breadcrumb-dot">•</span>
          <span className="sa-badge-schema" title="Simulated Schema Specification">
            CLUSTER SCHEMA V2.4
          </span>
        </div>

        <div className="sa-target-node-chip">
          <span className="sa-node-dot" />
          <span>Target Node: us-east-core-01 (Simulated)</span>
        </div>
      </div>

      {/* Page Title & Subtitle */}
      <div className="sa-create-page-heading">
        <h1 className="sa-create-title">Create Company Account</h1>
        <p className="sa-create-subtitle">
          Provision a new isolated tenant organization on the CastraVision core cluster.
        </p>
      </div>

      {/* Development-Only Visual QA Preview Toolbar (Hidden in Production) */}
      {import.meta.env.DEV && (
        <div className="sa-dev-preview-bar">
          <div className="sa-dev-preview-meta">
            <span className="sa-dev-preview-tag">DEV ONLY QA PREVIEW</span>
            <span className="sa-dev-preview-text">
              Visual Validation State Tool (Does not mutate state or bypass validation)
            </span>
          </div>
          <div className="sa-dev-preview-buttons">
            <button
              type="button"
              className={`sa-dev-btn ${devPreviewState === 'auto' ? 'active' : ''}`}
              onClick={() => setDevPreviewState('auto')}
            >
              Auto (Form Input)
            </button>
            <button
              type="button"
              className={`sa-dev-btn ${devPreviewState === 'invalid-email' ? 'active' : ''}`}
              onClick={() => setDevPreviewState('invalid-email')}
            >
              Preview 1: Invalid Email
            </button>
            <button
              type="button"
              className={`sa-dev-btn ${devPreviewState === 'duplicate-tenant' ? 'active' : ''}`}
              onClick={() => setDevPreviewState('duplicate-tenant')}
            >
              Preview 2: Duplicate Tenant
            </button>
            <button
              type="button"
              className={`sa-dev-btn ${devPreviewState === 'provisioning-ready' ? 'active' : ''}`}
              onClick={() => setDevPreviewState('provisioning-ready')}
            >
              Preview 3: Provisioning Ready
            </button>
          </div>
        </div>
      )}

      {/* Pre-Flight Validation Alert Banner */}
      {activeAlert && (
        <div className={`sa-alert-banner ${activeAlert.type}`}>
          <div className="sa-alert-icon-wrap">
            {activeAlert.type === 'error' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
            {activeAlert.type === 'warning' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {activeAlert.type === 'success' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            )}
          </div>

          <div className="sa-alert-content">
            <div className="sa-alert-title-row">
              <span className="sa-alert-title">{activeAlert.title}</span>
              <span className={`sa-alert-tag ${activeAlert.type}`}>{activeAlert.tag}</span>
            </div>
            <p className="sa-alert-message">{activeAlert.message}</p>
          </div>

          <button
            type="button"
            className="sa-alert-dismiss"
            onClick={() => handleDismissAlert(activeAlert.id)}
            title="Dismiss Alert"
          >
            ×
          </button>
        </div>
      )}

      {/* 2-Column Main Layout */}
      <div className="sa-create-grid">
        {/* Left Column: Organization Details Form */}
        <div className="sa-card sa-create-form-card">
          <div className="sa-form-header">
            <div className="sa-form-header-title-row">
              <div className="sa-form-header-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                  <path d="M9 22v-4h6v4" />
                  <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
                </svg>
                <h2 className="sa-form-title">Organization Details</h2>
              </div>
              <span className="sa-step-badge">Step 1 of 1</span>
            </div>
            <p className="sa-form-subtitle">
              Tenant Specification v2 • Zero-PII Enforced
            </p>
          </div>

          <form onSubmit={handleSubmit} id="create-company-form">
            <div className="sa-form-body">
              {/* Company Legal Entity Name */}
              <div className="sa-form-group">
                <label htmlFor={nameInputId} className="sa-form-label">
                  COMPANY NAME
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  className="sa-input"
                  placeholder="Apex Logistics Global"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div >

              {/* 2-Column Row: Account Email & Authorized Domain */}
              <div className="sa-form-row-2col">
                <div className="sa-form-group">
                  <label htmlFor={emailInputId} className="sa-form-label">
                    COMPANY ACCOUNT EMAIL
                  </label>
                  <input
                    id={emailInputId}
                    type="email"
                    className="sa-input"
                    placeholder="admin@apexlogistics.io"
                    value={formData.accountEmail}
                    onChange={(e) => handleInputChange('accountEmail', e.target.value)}
                    required
                  />
                </div>

                <div className="sa-form-group">
                  <label htmlFor={domainInputId} className="sa-form-label">
                    AUTHORIZED BUSINESS DOMAIN
                  </label>
                  <input
                    id={domainInputId}
                    type="text"
                    className="sa-input"
                    placeholder="apexlogistics.io"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                  />
                </div>
              </div>

              {/* Organization Identifier / Slug */}
              < div className="sa-form-group" >
                <label htmlFor={slugInputId} className="sa-form-label">
                  ORGANIZATION IDENTIFIER (SLUG)
                </label>
                <div className="sa-slug-input-wrap">
                  <span className="sa-slug-prefix">castra.io/</span>
                  <input
                    id={slugInputId}
                    type="text"
                    className="sa-slug-input"
                    placeholder="apex-logistics"
                    value={formData.slug}
                    onChange={(e) =>
                      handleInputChange(
                        'slug',
                        e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                      )
                    }
                  />
                </div>
                <span className="sa-form-help">
                  Unique root namespace identifier used across node clusters, API gateways, and storage buckets. (Preview namespace)
                </span>
              </div>

              {/* Initial Provisioning Status Selector */}
              <div className="sa-form-group">
                <span className="sa-form-label">INITIAL PROVISIONING STATUS</span>
                <div className="sa-status-selector-grid">
                  <button
                    type="button"
                    className={`sa-status-option-card ${formData.status === 'Active' ? 'selected' : ''}`}
                    onClick={() => handleInputChange('status', 'Active')}
                  >
                    <div className="sa-option-radio">
                      <span className="sa-radio-circle" />
                    </div>
                    <div className="sa-option-content">
                      <div className="sa-option-title-row">
                        <span className="sa-option-title">Active Tenant</span>
                        <span className="sa-status-pill green">LIVE</span>
                      </div>
                      <p className="sa-option-desc">
                        Status staged as Active. (Demo session: no live cluster partitions or backend ingress allocated).
                      </p>
                    </div >
                  </button >

                  <button
                    type="button"
                    className={`sa-status-option-card ${formData.status === 'Inactive (Pending Setup)' ? 'selected' : ''}`}
                    onClick={() => handleInputChange('status', 'Inactive (Pending Setup)')}
                  >
                    <div className="sa-option-radio">
                      <span className="sa-radio-circle" />
                    </div>
                    <div className="sa-option-content">
                      <div className="sa-option-title-row">
                        <span className="sa-option-title">Inactive (Pending Setup)</span>
                        <span className="sa-status-pill locked">LOCKED</span>
                      </div>
                      <p className="sa-option-desc">
                        Metadata staged. Workspaces and pipelines suspended until manual system admin activation.
                      </p>
                    </div >
                  </button >
                </div >
              </div >

              {/* Account Notes (Optional) */}
              <div className="sa-form-group">
                <label htmlFor={notesInputId} className="sa-form-label">
                  ACCOUNT NOTES (OPTIONAL)
                </label>
                <textarea
                  id={notesInputId}
                  className="sa-textarea"
                  rows={2}
                  placeholder="Initial enterprise pilot provisioning."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>

              {/* Zero Employee Data Policy Box */}
              <div className="sa-zero-employee-box">
                <div className="sa-zero-employee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="sa-zero-employee-body">
                  <h4 className="sa-zero-employee-title">Zero Employee Data Policy Active</h4>
                  <p className="sa-zero-employee-desc">
                    This company will be initialized with exactly{' '}
                    <strong style={{ color: '#22d3ee' }}>0 employees</strong>. In accordance with zero-trust isolation standards, no employee assignment or user forms are accepted at creation. Member invitations and workspace roles are managed independently by the tenant's internal organization administrators.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Cluster Placement & Tenancy Verification */}
        <div className="sa-create-right-col">
          {/* Card 1: Cluster Placement */}
          <div className="sa-card sa-cluster-placement-card">
            <div className="sa-panel-header">
              <div className="sa-panel-title-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
                <h3 className="sa-panel-title">Cluster Placement</h3>
              </div>
              <span className="sa-badge-node">NODE 01</span>
            </div>

            <div className="sa-cluster-specs-table">
              <div className="sa-cluster-spec-row">
                <span className="sa-cluster-spec-label">Target Policy</span>
                <span className="sa-cluster-spec-val">Auto-Assign (Weighted)</span>
              </div>
              <div className="sa-cluster-spec-row">
                <span className="sa-cluster-spec-label">Partition ID</span>
                <span className="sa-cluster-spec-val cyan mono">
                  {formData.slug ? `prt-${formData.slug.slice(0, 4)}-apx` : 'prt-8841-apx'}
                </span>
              </div>
              <div className="sa-cluster-spec-row">
                <span className="sa-cluster-spec-label">Storage Engine</span>
                <span className="sa-cluster-spec-val">NVMe Encrypted (AES-256) (Simulated)</span>
              </div>
              <div className="sa-cluster-spec-row">
                <span className="sa-cluster-spec-label">Telemetry Pipeline</span>
                <span className="sa-cluster-spec-val">Isolated Stream (Simulated)</span>
              </div>
              <div className="sa-cluster-spec-row">
                <span className="sa-cluster-spec-label">Provision Status</span>
                <span className="sa-cluster-spec-val amber">
                  <span className="sa-status-dot amber" /> Pending Admin Submit
                </span>
              </div>
            </div>

            {/* Inset Memory & Capacity Progress */}
            <div className="sa-cluster-memory-box">
              <div className="sa-cluster-mem-header">
                <span>Cluster Memory Allocated</span>
                <span>41.8% (Simulated)</span>
              </div>
              <div className="sa-storage-track">
                <div className="sa-storage-fill" style={{ width: '41.8%' }} />
              </div>
              <div className="sa-cluster-mem-footer">
                <span>Tenant capacity: 2,400 / 5,000 (Simulated)</span>
                <span className="sa-optimal-text">Optimal</span>
              </div>
            </div>
          </div>

          {/* Card 2: Tenancy Verification Checklist */}
          <div className="sa-card sa-tenancy-verification-card">
            <div className="sa-panel-header">
              <div className="sa-panel-title-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <h3 className="sa-panel-title">Tenancy Verification</h3>
              </div>
              <span className="sa-badge-preflight">Pre-Flight</span>
            </div>

            <div className="sa-verification-list">
              {/* Item 1: DNS Domain Record */}
              <div className="sa-verification-item">
                <div className="sa-verification-icon-wrap unverified">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="sa-verification-content">
                  <div className="sa-verification-title-row">
                    <span className="sa-verification-title">DNS Domain Record Verified</span>
                    <span className="sa-item-tag amber">Not verified (No live DNS probe)</span>
                  </div>
                  <p className="sa-verification-desc">
                    Domain entry recorded for {formData.domain || 'apexlogistics.io'} (Simulated — no live DNS lookup performed).
                  </p>
                </div>
              </div>

              {/* Item 2: Namespace Collision Check */}
              <div className="sa-verification-item">
                <div className={`sa-verification-icon-wrap ${isSlugValid && !hasSlugCollision ? 'passed' : 'pending'}`}>
                  {isSlugValid && !hasSlugCollision ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </div>
                <div className="sa-verification-content">
                  <div className="sa-verification-title-row">
                    <span className="sa-verification-title">Namespace Collision Check</span>
                    <span className={`sa-item-tag ${isSlugValid && !hasSlugCollision ? 'green' : 'slate'}`}>
                      {isSlugValid ? (!hasSlugCollision ? 'Passed locally' : 'Collision detected') : 'Pending input'}
                    </span>
                  </div>
                  <p className="sa-verification-desc">
                    Slug uniqueness confirmed across active platform tenants.
                  </p>
                </div>
              </div>

              {/* Item 3: Zero Raw Passwords */}
              <div className="sa-verification-item">
                <div className="sa-verification-icon-wrap passed">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="sa-verification-content">
                  <div className="sa-verification-title-row">
                    <span className="sa-verification-title">Zero Raw Passwords</span>
                    <span className="sa-item-tag green">Passed locally</span>
                  </div>
                  <p className="sa-verification-desc">
                    No raw passwords stored; invitation magic link will be issued upon backend integration (Simulated policy target).
                  </p>
                </div>
              </div>

              {/* Item 4: Root Platform Authorization */}
              <div className="sa-verification-item">
                <div className="sa-verification-icon-wrap auth-pending">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="sa-verification-content">
                  <div className="sa-verification-title-row">
                    <span className="sa-verification-title">Local Session Authorization</span>
                    <span className="sa-item-tag amber">Awaiting click confirmation</span>
                  </div>
                  <p className="sa-verification-desc" style={{ color: '#f59e0b' }}>
                    Tenant metadata staged for local demo session upon confirmation.
                  </p>
                </div>
              </div>
            </div>

            <div className="sa-tenancy-verification-footer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Zero-Knowledge Tenant Partitioning (Architecture Design Target)</span>
            </div>
          </div>
        </div>
      </div >

      {/* Bottom Action Bar */}
      <div className="sa-card sa-create-bottom-bar">
        <div className="sa-bottom-left-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>
            Local demo environment: No passwords generated or transmitted. No backend tenant provisioned.
          </span>
        </div>

        <div className="sa-bottom-actions">
          <button
            type="button"
            className="sa-btn sa-btn-cancel"
            onClick={() => onNavigate('sa-company-mgmt')}
          >
            Cancel
          </button>

          <button
            type="button"
            className="sa-btn sa-btn-reset-red"
            onClick={handleReset}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Reset Fields
          </button>

          <button
            type="submit"
            form="create-company-form"
            className="sa-btn sa-btn-create-green"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="sa-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Creating Account...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Create Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
