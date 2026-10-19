import React, { useState, useMemo } from 'react'
import {
  MetricCard,
  StatusBadge,
  CompanyAvatar,
  TenantPrivacyNotice,
} from '../ui/Primitives'

/**
 * Screen 2: Company Management
 * Reference: companymanagement—systemadmin.png
 */
export function CompanyManagementScreen({
  companies,
  metrics,
  onNavigate,
  onSelectCompany,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'emp-desc'
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pageSize = 8

  // Calculate filtered totals
  const totalCount = companies.length
  const activeCount = companies.filter((c) => c.status === 'Active').length
  const inactiveCount = companies.filter((c) => c.status !== 'Active').length

  // Filter & Sort
  const processedCompanies = useMemo(() => {
    let result = [...companies]

    // Status filter
    if (statusFilter === 'ACTIVE') {
      result = result.filter((c) => c.status === 'Active')
    } else if (statusFilter === 'INACTIVE') {
      result = result.filter((c) => c.status !== 'Active')
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.accountEmail.toLowerCase().includes(term) ||
          (c.id && c.id.toLowerCase().includes(term)) ||
          (c.domain && c.domain.toLowerCase().includes(term))
      )
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      if (sortBy === 'emp-desc') return (b.employeeCount || 0) - (a.employeeCount || 0)
      if (sortBy === 'oldest') {
        return new Date(a.provisionedOn || 0) - new Date(b.provisionedOn || 0)
      }
      // default: newest
      return new Date(b.provisionedOn || 0) - new Date(a.provisionedOn || 0)
    })

    return result
  }, [companies, statusFilter, searchTerm, sortBy])

  // Pagination
  const totalFiltered = processedCompanies.length
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedCompanies.slice(start, start + pageSize)
  }, [processedCompanies, currentPage, pageSize])

  const handleRefreshClick = () => {
    setIsRefreshing(true)
    if (onRefresh) onRefresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="sa-page-container">
      {/* Page Header */}
      <div className="sa-page-header">
        <div className="sa-page-header-text">
          <div className="sa-telemetry-tag">TENANT DIRECTORY CONTROLS</div>
          <h1 className="sa-page-title">Company Management</h1>
          <p className="sa-page-desc">
            Search, inspect, and manage registered company accounts across the CastraVision platform.
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
            Refresh
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
            Create Company
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="sa-kpi-grid">
        <MetricCard
          label="Total Registered Tenants"
          value={metrics.totalRegistered}
          subtext="Total platform enterprises"
          badge="Global"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
            </svg>
          }
        />
        <MetricCard
          label="Active Companies"
          value={metrics.activeTenants}
          subtext="In good standing & verified"
          badge="Operational"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          }
        />
        <MetricCard
          label="Inactive / Suspended Companies"
          value={metrics.inactiveTenants}
          subtext="Pending verification or inactive"
          badge="Action Required"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <MetricCard
          label="Aggregated Employee Count"
          value={metrics.aggregateHeadcount.toLocaleString()}
          subtext="Aggregated platform roster (Zero PII)"
          badge="Aggregated"
          highlight={true}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
        />
      </div>

      {/* Filter and Search Toolbar */}
      <div className="sa-card sa-filter-card">
        <div className="sa-filter-toolbar">
          {/* Search */}
          <div className="sa-search-wrapper">
            <svg
              className="sa-search-icon"
              width="15"
              height="15"
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
              className="sa-input-search"
              placeholder="Filter by company name, email, or domain..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          {/* Status Segmented Buttons */}
          <div className="sa-filter-pills">
            <button
              type="button"
              className={`sa-filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('ALL')
                setCurrentPage(1)
              }}
            >
              All Companies <span className="sa-pill-count">{totalCount}</span>
            </button>
            <button
              type="button"
              className={`sa-filter-pill ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('ACTIVE')
                setCurrentPage(1)
              }}
            >
              Active <span className="sa-pill-count">{activeCount}</span>
            </button>
            <button
              type="button"
              className={`sa-filter-pill ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('INACTIVE')
                setCurrentPage(1)
              }}
            >
              Inactive <span className="sa-pill-count">{inactiveCount}</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="sa-sort-wrapper">
            <label htmlFor="sa-sort-select" className="sa-sort-label">Sort:</label>
            <select
              id="sa-sort-select"
              className="sa-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Creation Date (Newest)</option>
              <option value="oldest">Creation Date (Oldest)</option>
              <option value="name-asc">Company Name (A–Z)</option>
              <option value="name-desc">Company Name (Z–A)</option>
              <option value="emp-desc">Employee Count (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Company Table */}
      <div className="sa-card sa-table-card">
        <div className="sa-table-responsive">
          <table className="sa-table">
            <thead>
              <tr>
                <th>COMPANY NAME</th>
                <th>ACCOUNT EMAIL</th>
                <th>STATUS</th>
                <th>EMPLOYEE COUNT</th>
                <th>PROVISIONED / CREATED ON</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="sa-table-empty">
                    <div className="sa-empty-state">
                      <div className="sa-empty-icon">🔍</div>
                      <div className="sa-empty-title">No companies found</div>
                      <p className="sa-empty-desc">
                        No company records matched your current filters. Try resetting search criteria or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <div className="sa-company-cell">
                        <CompanyAvatar
                          initials={company.avatarInitials}
                          bg={company.avatarBg}
                          size={36}
                        />
                        <div className="sa-company-cell-info">
                          <span className="sa-company-name">{company.name}</span>
                          <span className="sa-company-subid">{company.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sa-text-mono">{company.accountEmail}</span>
                    </td>
                    <td>
                      <StatusBadge status={company.status} />
                    </td>
                    <td>
                      <div className="sa-headcount-cell">
                        <span className="sa-headcount-val">
                          {company.employeeCount}
                        </span>
                        <span className="sa-headcount-sub">employees</span>
                      </div>
                    </td>
                    <td>
                      <span className="sa-text-muted">{company.provisionedOn}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="sa-btn-link"
                        onClick={() => {
                          onSelectCompany(company)
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
              {totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="sa-text-white">
              {Math.min(currentPage * pageSize, totalFiltered)}
            </span>{' '}
            of <span className="sa-text-white">{totalFiltered}</span> companies
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

      {/* Bottom Privacy Notice (Compact) */}
      <TenantPrivacyNotice compact={true} />
    </div>
  )
}
