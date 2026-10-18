/**
 * CompanyManagement.jsx — System Admin Company Management page
 *
 * Full-page data table listing all companies from mock data.
 * Columns: Company Name (with avatar + tenant ID), Admin Email,
 *          Activity Status (StatusBadge), Employee Count (plain text).
 *
 * Controls:
 *  - FloatingInput search bar to filter by name
 *  - Status filter tabs (All / Active / Inactive)
 *  - "Refresh" secondary button
 *  - "Create Company" primary button → opens CreateCompanyModal
 *
 * RBAC Rule: Employee Count is plain text — NOT clickable.
 * System Admins cannot see inside a company.
 */

import { useState, useMemo } from 'react'
import { MOCK_COMPANIES } from '../../data/mockSystemData'
import { FloatingInput, Button, StatusBadge } from '../ActorPages'
import CreateCompanyModal from './CreateCompanyModal'

export default function CompanyManagement({ notify }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = MOCK_COMPANIES.filter(c => c.status === 'Active').length
    const inactive = MOCK_COMPANIES.length - active
    return { total: MOCK_COMPANIES.length, active, inactive }
  }, [])

  // ── Filtered list ─────────────────────────────────────────────────────────
  const visibleCompanies = useMemo(() => {
    return MOCK_COMPANIES.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      const matchFilter = filter === 'all' || c.status.toLowerCase() === filter
      return matchSearch && matchFilter
    })
  }, [search, filter])

  function handleCreateCompany(data) {
    notify?.(`Company "${data.companyName}" created. Invitation sent to ${data.adminEmail}.`)
    setModalOpen(false)
  }

  return (
    <>
      {/* ── Eyebrow + Title ──────────────────────────────────────────────── */}
      <div className="sa-eyebrow">
        <span className="sa-eyebrow-label">PLATFORM ARCHITECTURE / TENANT ORGS</span>
      </div>

      <div className="sa-page-title-row">
        <div>
          <h1 className="sa-page-title">Company Management</h1>
          <p className="sa-page-subtitle">
            Oversee registered corporate tenants, administrative operational statuses, and baseline team capacities across the orchestration cluster.
          </p>
        </div>
        <div className="sa-stat-pills">
          <div className="sa-stat-pill">
            <span className="sa-stat-pill-label">TOTAL TENANTS</span>
            <strong className="sa-stat-pill-value">{stats.total}</strong>
            <span className="sa-stat-pill-tag">Enterprise</span>
          </div>
          <div className="sa-stat-pill">
            <span className="sa-stat-pill-label">OPERATIONAL</span>
            <strong className="sa-stat-pill-value">{stats.active}</strong>
            <span className="sa-stat-pill-tag sa-stat-pill-active">Active</span>
          </div>
          <div className="sa-stat-pill">
            <span className="sa-stat-pill-label">DECOMMISSIONED</span>
            <strong className="sa-stat-pill-value">{stats.inactive}</strong>
            <span className="sa-stat-pill-tag sa-stat-pill-paused">Paused</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar row ──────────────────────────────────────────────────── */}
      <div className="sa-toolbar">
        <div style={{ minWidth: 280, maxWidth: 360 }}>
          <FloatingInput
            label="Search by company name (optional)"
            name="sa-company-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="sa-filter-tabs">
          <button className={`sa-filter-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
            All Statuses <span className="sa-tab-count">{stats.total}</span>
          </button>
          <button className={`sa-filter-tab${filter === 'active' ? ' active' : ''}`} onClick={() => setFilter('active')}>
            <span className="sa-tab-dot sa-tab-dot-green" /> Active <span className="sa-tab-count">{stats.active}</span>
          </button>
          <button className={`sa-filter-tab${filter === 'inactive' ? ' active' : ''}`} onClick={() => setFilter('inactive')}>
            <span className="sa-tab-dot sa-tab-dot-muted" /> Inactive <span className="sa-tab-count">{stats.inactive}</span>
          </button>
        </div>

        <div className="sa-toolbar-actions">
          <Button variant="secondary" onClick={() => notify?.('Data refreshed.')}>↻ Refresh</Button>
          <Button variant="primary" onClick={() => setModalOpen(true)}>+ Create Company</Button>
        </div>
      </div>

      {/* ── Privacy scope info bar ────────────────────────────────────────── */}
      <div className="sa-privacy-info-bar">
        <span className="sa-privacy-info-icon">🛡</span>
        <span>
          <strong>Privacy Scope Enforced:</strong> System Admin access provides enterprise infrastructure management only.
          Member rosters, campaign telemetry, and employee direct profiles remain sandboxed to tenant workspace admins.
        </span>
        <span className="sa-scope-tag">NODE_SCOPE::LVL_SYS_ADMIN</span>
      </div>

      {/* ── Data Table ────────────────────────────────────────────────────── */}
      <section className="sa-card">
        <div className="sa-card-header">
          <h2 className="sa-card-title">🏢 Registered Companies</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="sa-shown-tag">Showing {visibleCompanies.length} of {stats.total} entries</span>
            <span className="sa-tls-tag">TLS 1.3 ENCRYPTED</span>
          </div>
        </div>

        <div className="actor-table-wrap">
          <table className="actor-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Account Email</th>
                <th>Activity Status</th>
                <th>Employee Count</th>
                <th style={{ textAlign: 'center' }}>🔒</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleCompanies.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 56, color: 'var(--cv-muted)' }}>
                    No companies match your search criteria.
                  </td>
                </tr>
              )}
              {visibleCompanies.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="sa-company-cell">
                      <span className="sa-company-avatar">{c.name.slice(0, 2).toUpperCase()}</span>
                      <div>
                        <strong>{c.name}</strong>
                        <small style={{ display: 'block', color: 'var(--cv-muted)', fontSize: 11, marginTop: 2 }}>
                          {c.tenantId}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="sa-email">@ {c.email}</span>
                  </td>
                  <td>
                    <StatusBadge status={c.status.toLowerCase()} />
                  </td>
                  <td>
                    <strong>{c.employeeCount.toLocaleString()}</strong>
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--cv-muted)' }}>SEATS</span>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--cv-muted)' }}>🔒</td>
                  <td>
                    <Button
                      variant="secondary"
                      onClick={() => notify?.(`Viewing ${c.name} overview.`)}
                    >
                      👁 View Overview
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sa-table-footer">
          <span>🖥 Storage Cluster: US-EAST-PRIMARY-01</span>
          <span>Page 1 of 1</span>
        </div>
      </section>

      {/* ── Create Company Modal ─────────────────────────────────────────── */}
      {modalOpen && (
        <CreateCompanyModal
          onClose={() => setModalOpen(false)}
          onCreate={handleCreateCompany}
        />
      )}
    </>
  )
}
