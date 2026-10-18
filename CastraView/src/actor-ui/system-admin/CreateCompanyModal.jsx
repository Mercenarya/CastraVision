/**
 * CreateCompanyModal.jsx — Modal to create a new company account
 *
 * Fields (all using <FloatingInput>, NO red asterisks):
 *  - Company Name
 *  - Admin First Name
 *  - Admin Last Name
 *  - Admin Email
 *
 * Actions:
 *  - Cancel  → <Button variant="secondary">
 *  - Create Account → <Button variant="primary">
 *
 * Layout: centered modal overlay, matching design reference (dark card).
 */

import { useState } from 'react'
import { FloatingInput, Button } from '../ActorPages'

export default function CreateCompanyModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    companyName: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    phone: '',
    billingId: '',
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.companyName.trim()) errs.companyName = 'Company name is required.'
    if (!form.adminFirstName.trim()) errs.adminFirstName = 'First name is required.'
    if (!form.adminLastName.trim()) errs.adminLastName = 'Last name is required.'
    if (!form.adminEmail.trim()) {
      errs.adminEmail = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) {
      errs.adminEmail = 'Enter a valid email address that is not linked to an active partition.'
    }
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setBusy(true)
    // Simulate async creation
    setTimeout(() => {
      setBusy(false)
      onCreate?.(form)
    }, 600)
  }

  const hasErrors = Object.values(errors).some(Boolean)

  return (
    <div className="sa-modal-backdrop" onClick={onClose}>
      <div className="sa-modal" onClick={e => e.stopPropagation()}>
        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <div className="sa-modal-breadcrumb">
          <span>PLATFORM / Company Management / Create</span>
          <span className="sa-provision-tag">● Provisioning Engine: Active (us-east-1)</span>
        </div>

        {/* ── Card body ──────────────────────────────────────────────────── */}
        <div className="sa-modal-body">
          <div className="sa-modal-eyebrow">
            <span className="sa-eyebrow-label">TENANT ORCHESTRATION</span>
            <span className="sa-modal-step">Step 1 of 1</span>
          </div>
          <h2 className="sa-modal-title">Create Company Account</h2>
          <p className="sa-modal-subtitle">
            Register a new tenant company account on the CastraVision platform.
          </p>

          {/* Error summary */}
          {hasErrors && (
            <div className="sa-modal-error-banner">
              <span className="sa-modal-error-icon">⊘</span>
              <div>
                <strong>Account Registration Conflict</strong>
                <p>Please review the highlighted fields below and correct any issues.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="sa-modal-fields">
              <FloatingInput
                label="Company Name"
                name="create-company-name"
                value={form.companyName}
                onChange={e => update('companyName', e.target.value)}
                error={errors.companyName}
                required
              />
              <FloatingInput
                label="Admin First Name"
                name="create-admin-first"
                value={form.adminFirstName}
                onChange={e => update('adminFirstName', e.target.value)}
                error={errors.adminFirstName}
                required
              />
              <FloatingInput
                label="Admin Last Name"
                name="create-admin-last"
                value={form.adminLastName}
                onChange={e => update('adminLastName', e.target.value)}
                error={errors.adminLastName}
                required
              />
              <FloatingInput
                label="Company Account Email"
                name="create-admin-email"
                type="email"
                value={form.adminEmail}
                onChange={e => update('adminEmail', e.target.value)}
                error={errors.adminEmail}
                autoComplete="email"
                required
              />
              <FloatingInput
                label="Primary Contact Phone (optional)"
                name="create-phone"
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
              />
              <FloatingInput
                label="Billing Partition Identifier (optional)"
                name="create-billing"
                value={form.billingId}
                onChange={e => update('billingId', e.target.value)}
              />
            </div>

            {/* ── Tenant isolation info ───────────────────────────────────── */}
            <div className="sa-modal-isolation">
              <div className="sa-modal-isolation-header">
                <strong>Tenant Isolation Boundary</strong>
                <span className="sa-isolation-badge">DEDICATED</span>
              </div>
              <p>
                Company records are cryptographically tagged and isolated in the tenancy matrix.
                No default credentials or initial users will be dispatched upon creation.
              </p>
            </div>

            {/* ── Actions ─────────────────────────────────────────────────── */}
            <div className="sa-modal-footer">
              <span className="sa-modal-validation-note">
                {hasErrors ? '⊘ Validation errors detected' : '● All input states validated locally'}
              </span>
              <div className="sa-modal-actions">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="primary" loading={busy} disabled={busy}>
                  🏢 Create Account
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* ── Auth footer ─────────────────────────────────────────────────── */}
        <div className="sa-modal-auth-footer">
          <span>🛡 Authorizing Principal</span>
          <div>
            <strong>System Administrator</strong>
            <small> (system.admin@castravision.io)</small>
          </div>
          <span className="sa-sec-tag">SEC-POL-V4.2</span>
        </div>
      </div>
    </div>
  )
}
