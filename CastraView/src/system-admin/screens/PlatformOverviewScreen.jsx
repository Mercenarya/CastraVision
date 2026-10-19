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

  // Filter companies by search query
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies
    const term = searchTerm.toLowerCase()
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.accountEmail.toLowerCase().includes(term) ||
        (c.id && c.id.toLowerCase().includes(term)) ||
        (c.domain && c.domain.toLowerCase().includes(term))
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
          <div className="sa-telemetry-tag">INFRASTRUCTURE TELEMETRY</div>
          <h1 className="sa-page-title">Platform Overview</h1>
          <p className="sa-page-desc">
            Comprehensive platform overview and enterprise tenant account monitoring across all isolated enclaves.
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
            Register Company
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="sa-kpi-grid">
        <MetricCard
          label="Total Registered"
          value={metrics.totalRegistered}
          subtext="Total registered company accounts"
          badge="+12% this month"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
            </svg>
          }
        />
        <MetricCard
          label="Active Tenants"
          value={metrics.activeTenants}
          subtext="92% active platform rate"
          badge="Nominal"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <MetricCard
          label="Inactive / Onboarding"
          value={metrics.inactiveTenants}
          subtext="Requires provisioning review"
          badge="Attention"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <MetricCard
          label="Aggregate Roster Headcount"
          value={metrics.aggregateHeadcount.toLocaleString()}
          subtext="Strictly aggregated • Zero PII exposure"
          badge="Aggregated"
          highlight={true}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      </div>

      {/* Registered Companies Directory Table */}
      <div className="sa-card sa-table-card">
        <div className="sa-table-header-row">
          <div className="sa-table-header-left">
            <h2 className="sa-table-title">Registered Companies Directory</h2>
            <span className="sa-table-count">({totalRecords} total tenants)</span>
          </div>
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
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="sa-table-search-input"
            />
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
                          size={34}
                        />
                        <div className="sa-company-cell-info">
                          <span className="sa-company-name">{c.name}</span>
                          <span className="sa-company-subid">{c.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sa-text-mono">{c.accountEmail}</span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <span className="sa-stat-pill">
                        {c.employeeCount} employees
                      </span>
                    </td>
                    <td>
                      <span className="sa-text-muted">{c.provisionedOn}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="sa-btn-link"
                        onClick={() => {
                          onSelectCompany(c)
                          onNavigate('sa-company-overview')
                        }}
                      >
                        View Overview →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="sa-pagination-bar">
          <div className="sa-pagination-info">
            Showing{' '}
            <span className="sa-text-white">
              {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="sa-text-white">
              {Math.min(currentPage * pageSize, totalRecords)}
            </span>{' '}
            of <span className="sa-text-white">{totalRecords}</span> companies
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
            <span className="sa-page-num-pill">
              Page {currentPage} of {totalPages}
            </span>
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
