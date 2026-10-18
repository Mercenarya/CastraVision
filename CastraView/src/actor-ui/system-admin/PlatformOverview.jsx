/**
 * PlatformOverview.jsx — System Admin Dashboard
 *
 * Displays:
 *  - 4 KPI summary cards (Total / Active / Inactive companies, Total Employees)
 *  - Node Ingestion visualization (aggregate bar chart)
 *  - Privacy Sentinel card (RBAC boundaries reminder)
 *  - Recent Registered Companies data table
 *
 * Uses FloatingInput, Button, StatusBadge from the shared design system.
 * All styling via --cv-* tokens.
 */

import { useState, useMemo } from 'react'
import { MOCK_COMPANIES } from '../../data/mockSystemData'
import { FloatingInput, Button, StatusBadge } from '../ActorPages'

export default function PlatformOverview({ setPage, notify }) {
  const [search, setSearch] = useState('')
  const [syncBanner, setSyncBanner] = useState(true)

  // ── Derived statistics ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = MOCK_COMPANIES.length
    const active = MOCK_COMPANIES.filter(c => c.status === 'Active').length
    const inactive = total - active
    const totalEmployees = MOCK_COMPANIES.reduce((s, c) => s + c.employeeCount, 0)
    return { total, active, inactive, totalEmployees }
  }, [])

  // ── Filtered list for the "recent" table ──────────────────────────────────
  const recentCompanies = useMemo(() => {
    const sorted = [...MOCK_COMPANIES].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (!search.trim()) return sorted.slice(0, 6)
    const q = search.toLowerCase()
    return sorted.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
  }, [search])

  // ── Mock ingestion bar data ───────────────────────────────────────────────
  const bars = [22, 18, 24, 45, 30, 15, 38]
  const maxBar = Math.max(...bars)

  return (
    <>
      {/* ── Sync banner ──────────────────────────────────────────────────── */}
      {syncBanner && (
        <div className="sa-sync-banner">
          <span className="sa-sync-icon">✓</span>
          <span>
            <strong>Platform sync complete.</strong> All {stats.total} company accounts updated across all operational regions.
          </span>
          <span className="sa-sync-ts">SYNCED JUST NOW</span>
          <button className="sa-sync-close" onClick={() => setSyncBanner(false)} aria-label="Dismiss">&times;</button>
        </div>
      )}

      {/* ── Eyebrow ──────────────────────────────────────────────────────── */}
      <div className="sa-eyebrow">
        <span className="sa-eyebrow-label">TENANT ORCHESTRATION</span>
        <span className="sa-eyebrow-dot" />
        <span className="sa-eyebrow-zone">ZONE CLUSTER: US-EAST-CORE</span>
      </div>

      {/* ── Page title row ───────────────────────────────────────────────── */}
      <div className="sa-page-title-row">
        <div>
          <h1 className="sa-page-title">Platform Overview</h1>
          <p className="sa-page-subtitle">System-wide tenant registries, operational availability, and aggregate resource allocation.</p>
        </div>
        <div className="sa-page-actions">
          <Button variant="secondary" onClick={() => notify?.('Data refreshed.')}>↻ Refresh</Button>
          <Button variant="primary" onClick={() => setPage?.('sa-company-mgmt')}>+ Create Company</Button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="sa-kpi-grid">
        <article className="sa-kpi-card">
          <div className="sa-kpi-header">
            <span className="sa-kpi-label">TOTAL COMPANIES</span>
            <span className="sa-kpi-icon">🏢</span>
          </div>
          <strong className="sa-kpi-value">{stats.total}</strong>
          <span className="sa-kpi-footer">
            <span className="sa-kpi-dot" /> Across all regions
          </span>
        </article>

        <article className="sa-kpi-card">
          <div className="sa-kpi-header">
            <span className="sa-kpi-label">ACTIVE COMPANIES</span>
            <span className="sa-kpi-icon sa-kpi-icon-active">✓</span>
          </div>
          <strong className="sa-kpi-value" style={{ color: 'var(--cv-green)' }}>{stats.active}</strong>
          <span className="sa-kpi-footer sa-kpi-footer-positive">
            ↗ +{Math.floor(stats.active * 0.13)} this month
          </span>
        </article>

        <article className="sa-kpi-card">
          <div className="sa-kpi-header">
            <span className="sa-kpi-label">INACTIVE COMPANIES</span>
            <span className="sa-kpi-icon">⊘</span>
          </div>
          <strong className="sa-kpi-value" style={{ color: 'var(--cv-muted)' }}>{stats.inactive}</strong>
          <span className="sa-kpi-footer">
            <span className="sa-kpi-dot sa-kpi-dot-muted" /> Requires attention
          </span>
        </article>

        <article className="sa-kpi-card">
          <div className="sa-kpi-header">
            <span className="sa-kpi-label">TOTAL EMPLOYEES</span>
            <span className="sa-kpi-icon">👥</span>
          </div>
          <strong className="sa-kpi-value">{stats.totalEmployees.toLocaleString()}</strong>
          <span className="sa-kpi-footer">Platform aggregate estimate</span>
        </article>
      </div>

      {/* ── Middle row: Node Ingestion + Privacy Sentinel ─────────────────── */}
      <div className="sa-middle-row">
        {/* Node Ingestion & Load Distribution */}
        <section className="sa-card sa-ingestion">
          <div className="sa-card-header">
            <div>
              <h2 className="sa-card-title">Node Ingestion &amp; Load Distribution</h2>
              <p className="sa-card-subtitle">24-hour aggregate API payload across verified enterprise nodes.</p>
            </div>
            <StatusBadge status="active" />
          </div>
          <div className="sa-bar-chart">
            {bars.map((val, i) => (
              <div key={i} className="sa-bar-col">
                <div
                  className={`sa-bar${val === maxBar ? ' sa-bar-highlight' : ''}`}
                  style={{ height: `${(val / maxBar) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="sa-bar-legend">
            <span><span className="sa-bar-legend-dot sa-bar-legend-highlight" /> High Utilization</span>
            <span><span className="sa-bar-legend-dot" /> Nominal Load</span>
            <span className="sa-bar-legend-ts">Last synced 3m ago</span>
          </div>
        </section>

        {/* Privacy Sentinel */}
        <section className="sa-card sa-privacy">
          <div className="sa-card-header">
            <h2 className="sa-card-title">Privacy Sentinel</h2>
            <span className="sa-privacy-badge">✓</span>
          </div>
          <p className="sa-card-subtitle" style={{ marginBottom: 16 }}>
            Platform-wide identity masking is active. System administrator roles are barred from inspecting user profiles, individual credentials, or strategy schemas.
          </p>
          <div className="sa-privacy-table">
            <div className="sa-privacy-table-header">
              <span>TELEMETRY SCOPES</span>
              <span className="sa-privacy-enforced">ENFORCED</span>
            </div>
            <div className="sa-privacy-row">
              <span>Data Retention Protocol</span>
              <span>Strict 90-Day</span>
            </div>
            <div className="sa-privacy-row">
              <span>Aggregate Masking Level</span>
              <span>Tier-4 Hardened</span>
            </div>
          </div>
          <div className="sa-privacy-footer">
            <span>🔒</span> Zero employee-level PII accessible
          </div>
        </section>
      </div>

      {/* ── Recent Registered Companies Table ─────────────────────────────── */}
      <section className="sa-card" style={{ marginTop: 20 }}>
        <div className="sa-card-header">
          <div>
            <h2 className="sa-card-title">Recent Registered Companies</h2>
            <p className="sa-card-subtitle">Overview of enterprise accounts and high-level platform status</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ minWidth: 220 }}>
              <FloatingInput
                label="Filter company name…"
                name="sa-dash-filter"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="sa-shown-tag">{recentCompanies.length} Shown</span>
          </div>
        </div>

        <div className="actor-table-wrap">
          <table className="actor-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Company Account Email</th>
                <th>Status</th>
                <th>Employee Count</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--cv-muted)' }}>
                    No companies match your filter.
                  </td>
                </tr>
              )}
              {recentCompanies.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="sa-company-cell">
                      <span className="sa-company-avatar">{c.name.slice(0, 2).toUpperCase()}</span>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td><span className="sa-email">{c.email}</span></td>
                  <td><StatusBadge status={c.status.toLowerCase()} /></td>
                  <td>{c.employeeCount.toLocaleString()}</td>
                  <td>
                    <Button variant="secondary" onClick={() => notify?.(`Viewing ${c.name} overview.`)}>
                      View Overview
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sa-table-footer">
          <span>Showing {recentCompanies.length} of {stats.total} registered enterprise accounts</span>
          <span>Displaying aggregated statistics. Individual employee records restricted by system policy.</span>
        </div>
      </section>
    </>
  )
}
