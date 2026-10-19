import React, { useState, useId } from 'react'
import { AlertBanner, TenantPrivacyNotice } from '../ui/Primitives'

/**
 * Screen 4: Create Company Account (Validation & Success States)
 * Reference: createcompanyaccount—validation&successstates.png
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
    status: 'Active', // 'Active' | 'Inactive / Pending Setup'
    notes: '',
  })

  const [activeAlert, setActiveAlert] = useState(null)
  // activeAlert: { type: 'error' | 'warning' | 'success', title: string, message: string, tag: string } | null
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState({})

  const nameInputId = useId()
  const emailInputId = useId()
  const domainInputId = useId()
  const slugInputId = useId()
  const notesInputId = useId()

  // Real-time pre-flight validation check
  const validateForm = (data) => {
    // 1. Required name
    if (!data.name.trim()) {
      return {
        type: 'error',
        title: 'Validation Error: Company Name Required',
        message: 'Please provide a valid company legal entity or organization name.',
        tag: 'REJECTED',
      }
    }

    // 2. Email format & business domain check
    if (!data.accountEmail.trim() || !data.accountEmail.includes('@')) {
      return {
        type: 'error',
        title: 'Validation Error: Invalid Company Account Email',
        message:
          'Company account contact must be a valid RFC-5322 email address with standard domain formatting.',
        tag: 'REJECTED',
      }
    }

    const freeMailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']
    const emailDomain = data.accountEmail.split('@')[1]?.toLowerCase()
    if (freeMailProviders.includes(emailDomain)) {
      return {
        type: 'error',
        title: 'Validation Error: Invalid Company Account Email',
        message:
          'Public webmail domains (@gmail.com, @yahoo.com) are prohibited for platform tenant governance accounts.',
        tag: 'REJECTED',
      }
    }

    // 3. Slug or Duplicate check
    const cleanSlug = data.slug.trim().toLowerCase()
    const duplicate = existingCompanies.find(
      (c) =>
        (c.name && c.name.toLowerCase() === data.name.trim().toLowerCase()) ||
        (cleanSlug && c.tenantId && c.tenantId.toLowerCase() === cleanSlug) ||
        (c.accountEmail && c.accountEmail.toLowerCase() === data.accountEmail.trim().toLowerCase())
    )

    if (duplicate) {
      return {
        type: 'warning',
        title: 'Duplicate Tenant Notice',
        message: `A tenant with matching name or email (${duplicate.name} / ${duplicate.accountEmail}) already exists in the registry.`,
        tag: 'COLLISION DETECTED',
      }
    }

    // 4. Domain format validation
    if (data.domain.trim() && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.domain.trim())) {
      return {
        type: 'error',
        title: 'Validation Error: Malformed Business Domain',
        message: 'Domain name must match valid fully qualified domain name structure (e.g. acmecorp.com).',
        tag: 'REJECTED',
      }
    }

    // All checks passed
    return {
      type: 'success',
      title: 'Account Provisioning Ready',
      message: 'All pre-flight tenant parameters, domain integrity, and boundary configurations passed validation.',
      tag: 'PRE-FLIGHT PASSED',
    }
  }

  const handleInputChange = (field, value) => {
    const updated = { ...formData, [field]: value }

    // Auto-generate slug from name if slug not manually customized
    if (field === 'name' && (!touched.slug || !formData.slug)) {
      updated.slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Auto-fill domain from email if not filled
    if (field === 'accountEmail' && (!touched.domain || !formData.domain)) {
      const parts = value.split('@')
      if (parts.length === 2 && parts[1].includes('.')) {
        updated.domain = parts[1].toLowerCase()
      }
    }

    setFormData(updated)
    setTouched((prev) => ({ ...prev, [field]: true }))

    // Run pre-flight check when key fields have values
    if (updated.name && updated.accountEmail) {
      setActiveAlert(validateForm(updated))
    } else {
      setActiveAlert(null)
    }
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
    setActiveAlert(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const validation = validateForm(formData)
    if (validation.type === 'error') {
      setActiveAlert(validation)
      return
    }

    setIsSubmitting(true)

    // Simulate account provisioning
    setTimeout(() => {
      const newCompanyId = `cv-org-${Math.floor(1000 + Math.random() * 9000)}`
      const newTenantId = formData.slug ? `tenant_${formData.slug}` : `tenant_${newCompanyId}`
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
        domain: formData.domain.trim() || `${formData.slug || 'company'}.com`,
        internalDomain: `${(formData.slug || 'company').toLowerCase()}.tenant.castra.internal`,
        status: formData.status === 'Active' ? 'Active' : 'Pending Setup',
        employeeCount: 0, // Zero initial roster
        licensedSeats: 25,
        provisionedOn: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }),
        node: 'Enclave Node #03',
        storageUsed: '0.05 GB',
        storageLimit: '10 GB',
        uptime: '100%',
        avatarBg: '#059669',
        avatarInitials: initials || 'CO',
        notes: formData.notes.trim(),
        history: [
          {
            title: 'Tenant Account Provisioned',
            actor: 'System Admin',
            date: 'Just now',
            detail: `Initial container initialized on Enclave Node #03 under ${newTenantId}.`,
            icon: '⚙',
          },
        ],
      }

      if (onCreateCompany) {
        onCreateCompany(newCompany)
      }

      setIsSubmitting(false)
      onNavigate('sa-company-mgmt')
    }, 600)
  }

  return (
    <div className="sa-page-container">
      {/* Top Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-text">
          <div className="sa-telemetry-tag">TENANT REGISTRATION PIPELINE</div>
          <h1 className="sa-page-title">Create Company Account</h1>
          <p className="sa-page-desc">
            Register a new company account in CastraVision. Platform provisioning will initialize an isolated tenant enclave with sovereign boundary controls.
          </p>
        </div>
        <div className="sa-page-actions">
          <button
            type="button"
            className="sa-btn sa-btn-secondary"
            onClick={() => onNavigate('sa-company-mgmt')}
          >
            ← Back to Directory
          </button>
        </div>
      </div>

      {/* Validation Alert Display Area */}
      {activeAlert && (
        <AlertBanner
          type={activeAlert.type}
          title={activeAlert.title}
          message={activeAlert.message}
          tag={activeAlert.tag}
          onDismiss={() => setActiveAlert(null)}
        />
      )}

      {/* Two Column Layout */}
      <div className="sa-create-grid">
        {/* Left Column: Organization Details Form */}
        <div className="sa-card sa-create-form-card">
          <div className="sa-form-header">
            <h2 className="sa-form-title">Organization Details</h2>
            <p className="sa-form-subtitle">
              Enter primary platform tenant configuration. Tenant accounts are separated by boundary isolation.
            </p>
          </div>

          <form onSubmit={handleSubmit} id="create-company-form">
            <div className="sa-form-body">
              {/* Company Legal Entity Name */}
              <div className="sa-form-group">
                <label htmlFor={nameInputId} className="sa-form-label">
                  Company Name <span className="sa-required">*</span>
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  className="sa-input"
                  placeholder="e.g. Apex Global Logistics"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              {/* Company Account Email */}
              <div className="sa-form-group">
                <label htmlFor={emailInputId} className="sa-form-label">
                  Company Account Email <span className="sa-required">*</span>
                </label>
                <input
                  id={emailInputId}
                  type="email"
                  className="sa-input"
                  placeholder="e.g. contact@apexlogistics.io"
                  value={formData.accountEmail}
                  onChange={(e) =>
                    handleInputChange('accountEmail', e.target.value)
                  }
                  required
                />
                <span className="sa-form-help">
                  Official tenant administrative email. Public email providers (@gmail, @yahoo) are prohibited.
                </span>
              </div>

              {/* Authorized Business Domain */}
              <div className="sa-form-group">
                <label htmlFor={domainInputId} className="sa-form-label">
                  Authorized Business Domain
                </label>
                <input
                  id={domainInputId}
                  type="text"
                  className="sa-input"
                  placeholder="e.g. apexlogistics.io"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                />
                <span className="sa-form-help">
                  Tenant DNS domain used for employee authentication federation.
                </span>
              </div>

              {/* Organization Identifier / Slug */}
              <div className="sa-form-group">
                <label htmlFor={slugInputId} className="sa-form-label">
                  Organization Identifier / Slug
                </label>
                <input
                  id={slugInputId}
                  type="text"
                  className="sa-input mono"
                  placeholder="e.g. apex-logistics"
                  value={formData.slug}
                  onChange={(e) =>
                    handleInputChange(
                      'slug',
                      e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                    )
                  }
                />
                <span className="sa-form-help">
                  Unique internal cluster subdomain namespace identifier.
                </span>
              </div>

              {/* Initial Company Status Selector (Cards) */}
              <div className="sa-form-group">
                <span className="sa-form-label">Initial Company Status</span>
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
                        <span className="sa-option-title">Active</span>
                        <span className="sa-status-pill green">Immediate</span>
                      </div>
                      <p className="sa-option-desc">
                        Deploy tenant container immediately into active state with default baseline quota.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`sa-status-option-card ${formData.status === 'Inactive / Pending Setup' ? 'selected' : ''}`}
                    onClick={() =>
                      handleInputChange('status', 'Inactive / Pending Setup')
                    }
                  >
                    <div className="sa-option-radio">
                      <span className="sa-radio-circle" />
                    </div>
                    <div className="sa-option-content">
                      <div className="sa-option-title-row">
                        <span className="sa-option-title">Inactive / Pending Setup</span>
                        <span className="sa-status-pill amber">Staged</span>
                      </div>
                      <p className="sa-option-desc">
                        Register configuration metadata only. Defer ingress routing until manual activation.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Account Notes */}
              <div className="sa-form-group">
                <label htmlFor={notesInputId} className="sa-form-label">
                  Account Notes <span className="sa-optional">(Optional)</span>
                </label>
                <textarea
                  id={notesInputId}
                  className="sa-textarea"
                  rows={3}
                  placeholder="Record administrative onboarding notes or enterprise contract references..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Information Panels & Privacy Notice */}
        <div className="sa-create-right-col">
          {/* Account Setup Summary */}
          <div className="sa-card sa-side-panel">
            <div className="sa-panel-header">
              <h3 className="sa-panel-title">Account Setup Summary</h3>
              <span className="sa-panel-tag">PRE-FLIGHT</span>
            </div>
            <div className="sa-summary-list">
              <div className="sa-summary-row">
                <span className="sa-summary-label">Target Name:</span>
                <span className="sa-summary-val">{formData.name || '—'}</span>
              </div>
              <div className="sa-summary-row">
                <span className="sa-summary-label">Admin Contact:</span>
                <span className="sa-summary-val mono">{formData.accountEmail || '—'}</span>
              </div>
              <div className="sa-summary-row">
                <span className="sa-summary-label">Namespace Slug:</span>
                <span className="sa-summary-val mono">
                  {formData.slug ? `tenant_${formData.slug}` : '—'}
                </span>
              </div>
              <div className="sa-summary-row">
                <span className="sa-summary-label">Initial Status:</span>
                <span className="sa-summary-val">{formData.status}</span>
              </div>
              <div className="sa-summary-row">
                <span className="sa-summary-label">Starting Roster:</span>
                <span className="sa-summary-val green-text">0 Employees (Zero PII)</span>
              </div>
            </div>
          </div>

          {/* Provisioning Architecture & Node Enclave */}
          <div className="sa-card sa-side-panel">
            <div className="sa-panel-header">
              <h3 className="sa-panel-title">Tenant Provisioning Specs</h3>
              <span className="sa-panel-tag green">ISOLATED NODE</span>
            </div>
            <p className="sa-panel-text">
              New tenant environments are provisioned into an isolated application boundary sandbox on{' '}
              <strong style={{ color: '#f8fafc' }}>Enclave Node #03</strong>.
            </p>
            <div className="sa-spec-items">
              <div className="sa-spec-bullet">
                <span className="sa-bullet-dot" />
                <span>Single-tenant database boundary schema</span>
              </div>
              <div className="sa-spec-bullet">
                <span className="sa-bullet-dot" />
                <span>Automatic zero-trust TLS boundary registration</span>
              </div>
              <div className="sa-spec-bullet">
                <span className="sa-bullet-dot" />
                <span>Strict platform separation from internal company workgroups</span>
              </div>
            </div>
          </div>

          {/* Zero Employee Data Notice */}
          <div className="sa-card sa-side-panel zero-pii-panel">
            <div className="sa-panel-header">
              <div className="sa-zero-pii-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <h3 className="sa-panel-title" style={{ color: '#10b981', marginLeft: '6px' }}>
                  Zero Employee Data Ingestion
                </h3>
              </div>
            </div>
            <p className="sa-panel-text">
              Creating a company account does NOT require or accept individual employee records.
              System Admin has zero visibility into employee rosters, names, emails, or personal identities.
              Company Admins configure their internal teams independently post-onboarding.
            </p>
          </div>
        </div>
      </div>

      {/* Form Action Bar (Bottom) */}
      <div className="sa-card sa-form-actions-card">
        <div className="sa-actions-left">
          <button
            type="button"
            className="sa-btn sa-btn-secondary"
            onClick={() => onNavigate('sa-company-mgmt')}
          >
            Cancel
          </button>
          <button
            type="button"
            className="sa-btn sa-btn-danger"
            onClick={handleReset}
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
              <polyline points="1 4 1 10 7 10" />
              <polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            Reset Fields
          </button>
        </div>

        <div className="sa-actions-right">
          <button
            type="submit"
            form="create-company-form"
            className="sa-btn sa-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="sa-btn-icon sa-spin"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Provisioning Tenant...
              </>
            ) : (
              <>
                <svg
                  className="sa-btn-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Create Account
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sentinel notice */}
      <TenantPrivacyNotice compact={true} />
    </div>
  )
}
