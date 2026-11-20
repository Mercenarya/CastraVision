import React, { useState, useMemo, useEffect } from 'react'
import { SystemAdminSidebar } from './SystemAdminSidebar'
import { SystemAdminHeader } from './SystemAdminHeader'
import { PlatformOverviewScreen } from './screens/PlatformOverviewScreen'
import { CompanyManagementScreen } from './screens/CompanyManagementScreen'
import { CompanyOverviewScreen } from './screens/CompanyOverviewScreen'
import { CreateCompanyScreen } from './screens/CreateCompanyScreen'
import { platformService } from '../services/platform'
import { usePlatformCompanies } from '../hooks/usePlatformCompanies'
import SettingsPage from '@/pages/SettingsPage'
import './system-admin.css'

/**
 * SystemAdminLayout — Master layout container for System Admin operations
 */
export function SystemAdminLayout({ user, page, onNavigate, onLogout, onSignOut, notify, onUserUpdate, service = platformService }) {
  const [internalTab, setInternalTab] = useState(page || (new URLSearchParams(window.location.search).has('company') ? 'sa-company-overview' : 'sa-dashboard'))
  const [previousPage, setPreviousPage] = useState(page)
  if (page !== previousPage) {
    setPreviousPage(page)
    if (page) setInternalTab(page)
  }
  const activeTab = internalTab
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { companies, loading, error, refresh } = usePlatformCompanies(service, user?.id)
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => new URLSearchParams(window.location.search).get('company'))
  const [detail, setDetail] = useState(null)
  const detailGeneration = React.useRef(0)
  const [detailError, setDetailError] = useState('')
  const [detailRefresh, setDetailRefresh] = useState(0)
  const [globalSearch, setGlobalSearch] = useState('')

  const handleSignOut = onLogout || onSignOut

  useEffect(() => {
    if (!selectedCompanyId) return undefined
    const controller = new AbortController()
    const generation = ++detailGeneration.current
    service.company(selectedCompanyId, controller.signal).then(record => {
      if (!controller.signal.aborted && generation === detailGeneration.current) setDetail(record)
    }).catch(failure => {
      if (!controller.signal.aborted && generation === detailGeneration.current) setDetailError(failure.message)
    })
    return () => controller.abort()
  }, [selectedCompanyId, service, user?.id, detailRefresh])

  // Close drawer on Escape key and prevent body scroll when drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [mobileMenuOpen])

  // Dynamically compute platform metrics from current companies registry
  const metrics = useMemo(() => {
    const total = companies.length
    const active = companies.filter((c) => c.status === 'Active').length
    const inactive = total - active
    const aggregateEmployees = companies.reduce(
      (acc, c) =>
        acc +
        (typeof c.employeeCount === 'number' && c.employeeCount >= 0
          ? c.employeeCount
          : 0),
      0
    )

    // Accurate licensed seats calculation: sum only valid numeric values >= 0
    let validSeatCount = 0
    let seatSum = 0
    companies.forEach((c) => {
      if (
        typeof c.licensedSeats === 'number' &&
        !isNaN(c.licensedSeats) &&
        c.licensedSeats >= 0
      ) {
        seatSum += c.licensedSeats
        validSeatCount++
      }
    })

    const hasSeatData = validSeatCount > 0
    const isPartialSeats = validSeatCount > 0 && validSeatCount < total

    return {
      totalRegistered: total,
      activeTenants: active,
      inactiveTenants: inactive,
      aggregateHeadcount: aggregateEmployees,
      allocatedSeats: hasSeatData ? seatSum : null,
      isPartialSeats,
      seatReportingCount: validSeatCount,
    }
  }, [companies])

  // Get currently selected company record
  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || (selectedCompanyId ? null : companies[0])
  }, [companies, selectedCompanyId])

  // Navigation handler
  const handleNavigate = (tab) => {
    setInternalTab(tab)
    if (onNavigate) onNavigate(tab)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Company selection handler
  const handleSelectCompany = (company) => {
    setSelectedCompanyId(company.id)
    const url = new URL(window.location.href)
    url.searchParams.set('company', company.id)
    window.history.replaceState({}, '', url)
    setDetail(null)
    setDetailError('')
    setDetailRefresh(value => value + 1)
    handleNavigate('sa-company-overview')
  }

  // Create company handler
  const handleCreateCompany = async (data) => {
    const saved = await service.create(data)
    await refresh()
    handleSelectCompany(saved)
    notify?.('Đã lưu doanh nghiệp. Lời mời Marketing Manager đang chờ gửi; gửi tại trang chi tiết.')
    return saved
  }

  // Update company handler
  const handleUpdateCompany = async (id, data) => {
    const saved = await service.update(id, data)
    setDetail(await service.company(saved.id))
    await refresh()
    notify?.('Đã lưu và đọc lại thông tin doanh nghiệp.')
    return saved
  }

  // Refresh handler
  const handleRefresh = () => refresh().catch(() => {})

  // Global search from top header
  const handleHeaderSearch = (val) => {
    setGlobalSearch(val)
    if (activeTab !== 'sa-company-mgmt' && activeTab !== 'sa-dashboard') {
      handleNavigate('sa-company-mgmt')
    }
  }

  return (
    <div className="sa-app-layout">
      {/* Fixed Left Sidebar (Desktop) */}
      <SystemAdminSidebar activeTab={activeTab} onNavigate={handleNavigate} />

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="sa-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          role="presentation"
        >
          <div onClick={(e) => e.stopPropagation()} role="presentation">
            <SystemAdminSidebar
              activeTab={activeTab}
              onNavigate={handleNavigate}
              isDrawer={true}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

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
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          service={service}
        />

        {/* Screen Routing */}
        <main className="sa-body-area">
          {loading && <p role="status">Đang tải dữ liệu nền tảng…</p>}
          {error && <div role="alert">{error}<button type="button" onClick={handleRefresh}>Thử lại</button></div>}
          {!loading && !error && <>
          {activeTab === 'sa-dashboard' && (
            <PlatformOverviewScreen
              externalSearch={globalSearch}
              companies={companies}
              metrics={metrics}
              onNavigate={handleNavigate}
              onSelectCompany={handleSelectCompany}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'sa-company-mgmt' && (
            <CompanyManagementScreen
              externalSearch={globalSearch}
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
              company={detail?.id === selectedCompanyId ? detail : null}
              error={detailError}
              onRefresh={() => selectedCompany && handleSelectCompany(selectedCompany)}
              onSendInvitation={id => service.sendInvitation(id).then(async result => { handleSelectCompany(selectedCompany); return result })}
              onRevokeInvitation={id => service.revokeInvitation(id).then(() => handleSelectCompany(selectedCompany))}
              onIssueInvitation={email => service.issueInvitation(selectedCompanyId,email).then(() => handleSelectCompany(selectedCompany))}
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

          {activeTab === 'profile' && (
            <div className="p-6 max-w-7xl mx-auto w-full">
              <SettingsPage
                user={user}
                actorRole="system_admin"
                notify={notify}
                onUserUpdate={onUserUpdate}
              />
            </div>
          )}
          </>}
        </main>
      </div>
    </div>
  )
}
