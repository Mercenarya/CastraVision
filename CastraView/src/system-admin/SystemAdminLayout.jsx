import React, { useState, useMemo } from 'react'
import { SystemAdminSidebar } from './SystemAdminSidebar'
import { SystemAdminHeader } from './SystemAdminHeader'
import { PlatformOverviewScreen } from './screens/PlatformOverviewScreen'
import { CompanyManagementScreen } from './screens/CompanyManagementScreen'
import { CompanyOverviewScreen } from './screens/CompanyOverviewScreen'
import { CreateCompanyScreen } from './screens/CreateCompanyScreen'
import { INITIAL_COMPANIES, PLATFORM_METRICS } from './mockData'
import './system-admin.css'

/**
 * SystemAdminLayout — Master layout container for System Admin operations
 */
export function SystemAdminLayout({ user, onLogout, onSignOut, notify }) {
  const [activeTab, setActiveTab] = useState('sa-dashboard')
  const [companies, setCompanies] = useState(INITIAL_COMPANIES)
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    INITIAL_COMPANIES[0]?.id || 'cv-org-9041'
  )
  const [globalSearch, setGlobalSearch] = useState('')

  const handleSignOut = onLogout || onSignOut

  // Dynamically compute platform metrics from current companies registry
  const metrics = useMemo(() => {
    const total = companies.length
    const active = companies.filter((c) => c.status === 'Active').length
    const inactive = total - active
    const aggregateEmployees = companies.reduce(
      (acc, c) => acc + (c.employeeCount || 0),
      0
    )
    const allocatedSeats = companies.reduce(
      (acc, c) => acc + (c.licensedSeats || 25),
      0
    )

    return {
      totalRegistered: total || PLATFORM_METRICS.totalRegistered,
      activeTenants: active || PLATFORM_METRICS.activeTenants,
      inactiveTenants: inactive || PLATFORM_METRICS.inactiveTenants,
      aggregateHeadcount:
        aggregateEmployees > 0
          ? aggregateEmployees
          : PLATFORM_METRICS.aggregateHeadcount,
      allocatedSeats:
        allocatedSeats > 0 ? allocatedSeats : PLATFORM_METRICS.allocatedSeats,
    }
  }, [companies])

  // Get currently selected company record
  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0]
  }, [companies, selectedCompanyId])

  // Navigation handler
  const handleNavigate = (tab) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Company selection handler
  const handleSelectCompany = (company) => {
    setSelectedCompanyId(company.id)
    setActiveTab('sa-company-overview')
  }

  // Create company handler
  const handleCreateCompany = (newCompany) => {
    setCompanies((prev) => [newCompany, ...prev])
    setSelectedCompanyId(newCompany.id)
    if (notify) notify(`Tenant company "${newCompany.name}" provisioned successfully.`)
  }

  // Update company handler
  const handleUpdateCompany = (updatedCompany) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === updatedCompany.id ? updatedCompany : c))
    )
    if (notify) notify(`Organization details for "${updatedCompany.name}" updated.`)
  }

  // Refresh handler
  const handleRefresh = () => {
    if (notify) notify('Platform telemetry refreshed.')
  }

  // Global search from top header
  const handleHeaderSearch = (val) => {
    setGlobalSearch(val)
    if (activeTab !== 'sa-company-mgmt' && activeTab !== 'sa-dashboard') {
      setActiveTab('sa-company-mgmt')
    }
  }

  return (
    <div className="sa-app-layout">
      {/* Fixed Left Sidebar */}
      <SystemAdminSidebar activeTab={activeTab} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <div className="sa-main-content">
        {/* Top Header */}
        <SystemAdminHeader
          activeTab={activeTab}
          selectedCompany={selectedCompany}
          user={user}
          onLogout={handleSignOut}
          onNavigate={handleNavigate}
          searchTerm={globalSearch}
          onSearchChange={handleHeaderSearch}
        />

        {/* Screen Routing */}
        <main className="sa-body-area">
          {activeTab === 'sa-dashboard' && (
            <PlatformOverviewScreen
              companies={companies}
              metrics={metrics}
              onNavigate={handleNavigate}
              onSelectCompany={handleSelectCompany}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'sa-company-mgmt' && (
            <CompanyManagementScreen
              companies={companies}
              metrics={metrics}
              onNavigate={handleNavigate}
              onSelectCompany={handleSelectCompany}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'sa-company-overview' && (
            <CompanyOverviewScreen
              key={selectedCompany?.id || 'default'}
              company={selectedCompany}
              onNavigate={handleNavigate}
              onUpdateCompany={handleUpdateCompany}
            />
          )}

          {activeTab === 'sa-create-company' && (
            <CreateCompanyScreen
              existingCompanies={companies}
              onNavigate={handleNavigate}
              onCreateCompany={handleCreateCompany}
            />
          )}
        </main>
      </div>
    </div>
  )
}
