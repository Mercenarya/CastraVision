import React, { useState, useMemo } from 'react'
import {
  MetricCard,
  StatusBadge,
  CompanyAvatar,
  TenantPrivacyNotice,
} from '../ui/Primitives'

/**
 * Screen 1: Platform Overview
 * Reference: platformoverview—systemadmindashboard.png
 */
export function PlatformOverviewScreen({
  companies,
  metrics,
  onNavigate,
  onSelectCompany,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pageSize = 5

  // Calculate dynamic operational rate from real metrics
  const operationalRate = useMemo(() => {
    if (!metrics.totalRegistered) return '0.0'
    return ((metrics.activeTenants / metrics.totalRegistered) * 100).toFixed(1)
  }, [metrics.totalRegistered, metrics.activeTenants])

  // Filter companies by search query
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies
    const term = searchTerm.toLowerCase()
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.accountEmail && c.accountEmail.toLowerCase().includes(term)) ||
        (c.adminEmail && c.adminEmail.toLowerCase().includes(term)) ||
        (c.id && c.id.toLowerCase().includes(term)) ||
        (c.domain && c.domain.toLowerCase().includes(term)) ||
        (c.internalDomain && c.internalDomain.toLowerCase().includes(term))
    )
  }, [companies, searchTerm])

  // Pagination calculation
  const totalRecords = filteredCompanies.length
  const totalPages = Math.ceil(totalRecords / pageSize) || 1
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCompanies.slice(start, start + pageSize)
  }, [filteredCompanies, currentPage, pageSize])

  const handleRefreshClick = () => {
    setIsRefreshing(true)
    if (onRefresh) onRefresh()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  return (
    <div className="sa-page-container">
      {/* Page Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-text">
          <div className="sa-telemetry-tag">
            <span className="sa-telemetry-cyan-dot" />
            INFRASTRUCTURE TELEMETRY // ROOT CONSOLE
          </div>
          <h1 className="sa-page-title">Platform Overview</h1>
          <p className="sa-page-desc">
            High-level overview of registered enterprise & SME tenant organizations across CastraVision platform.
          </p>
        </div>
        <div className="sa-page-actions">
          <button
            type="button"
            className="sa-btn sa-btn-secondary"
            onClick={handleRefreshClick}
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
            Refresh Telemetry
          </button>
          <button
            type="button"
            className="sa-btn sa-btn-primary"
            onClick={() => onNavigate('sa-create-company')}
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            + Register Company
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="sa-kpi-grid">
        <MetricCard
          label="TOTAL REGISTERED"
          value={metrics.totalRegistered}
          subtext="Total active & pending tenant namespaces"
          badge="+12 this month (demo)"
          badgeType="green"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        />
        <MetricCard
          label="ACTIVE TENANTS"
          value={metrics.activeTenants}
          subtext="Engaged in real-time model orchestration"
          badge={`● ${operationalRate}% OPERATIONAL`}
          badgeType="green-solid"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          }
        />
        <MetricCard
          label="INACTIVE / ONBOARDING"
          value={metrics.inactiveTenants}
          subtext="Pending workspace bootstrap or zero run-rate"
          badge="DORMANT / SETUP"
          badgeType="dark"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h.01M12 12h.01M16 12h.01" />
            </svg>
          }
        />
        <MetricCard
          label="AGGREGATE ROSTER HEADCOUNT"
          value={metrics.aggregateHeadcount.toLocaleString()}
          subtext="Zero employee PII accessible across tenant boundaries"
          badge="AGGREGATE"
          badgeType="blue"
          highlight={true}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      </div>

      {/* Registered Companies Directory Table */}
      <div className="sa-card sa-table-card">
        <div className="sa-table-header-row">
          <div className="sa-table-header-left">
            <div className="sa-table-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
              </svg>
            </div>
            <div>
              <h2 className="sa-table-title">Registered Companies Directory</h2>
              <div className="sa-table-header-subtitle">
                Global root listing for tenant identification and billing metadata
              </div>
            </div>
          </div>
          <div className="sa-table-header-right">
            <div className="sa-table-search-box">
              <svg
                className="sa-search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Filter by company name or domain..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="sa-table-search-input"
              />
            </div>
            <button
              type="button"
              className="sa-table-header-link"
              onClick={() => onNavigate('sa-company-mgmt')}
            >
              Go to Company Management →
            </button>
          </div>
        </div>

        <div className="sa-table-responsive">
          <table className="sa-table">
            <thead>
              <tr>
                <th>COMPANY NAME</th>
                <th>ACCOUNT EMAIL</th>
                <th>OPERATIONAL STATUS</th>
                <th>TOTAL EMPLOYEES</th>
                <th>REGISTERED DATE</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="sa-table-empty">
                    No registered companies matched your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="sa-company-cell">
                        <CompanyAvatar
                          initials={c.avatarInitials}
                          bg={c.avatarBg}
                          size={36}
                          rounded="square"
                        />
                        <div className="sa-company-cell-info">
                          <span className="sa-company-name">{c.name}</span>
                          <span className="sa-company-subdomain">
                            {c.internalDomain || `${c.id}.internal (simulated)`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sa-text-mono">{c.adminEmail || c.accountEmail}</span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <span className="sa-employee-count">{c.employeeCount ?? 0}</span>
                    </td>
                    <td>
                      <span className="sa-text-muted">{c.provisionedOn}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="sa-btn-table-action"
                        onClick={() => {
                          onSelectCompany(c)
                          onNavigate('sa-company-overview')
                        }}
                      >
                        View Overview
                      </button>
                    </td>
                  </tr>
                ))
              )
              }
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="sa-pagination-bar">
          <div className="sa-pagination-info">
            Displaying {paginatedCompanies.length} of {totalRecords} registered tenants • Sort: Most recently registered
          </div>
          <div className="sa-pagination-actions">
            <button
              type="button"
              className="sa-btn sa-btn-pagination"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`sa-pagination-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              className="sa-btn sa-btn-pagination"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Full-width Tenant Privacy Boundary Sentinel */}
      <TenantPrivacyNotice />
    </div>
  )
}
