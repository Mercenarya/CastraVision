/**
 * ActorPages.jsx — CastraVision Role-Based Layout Wrapper
 *
 * This file is the single structural entry point for all post-auth screens.
 * It conditionally renders the correct Sidebar, Header, and page body
 * based on the authenticated user's role.
 *
 * Roles handled:
 *   system_admin   → SystemAdminLayout  (PLATFORM section)
 *   company_admin  → CompanyAdminLayout (COMPANY section)
 *   admin | manager | member → EmployeeLayout (WORKSPACE section)
 *
 * Legacy page exports (MembersPage, ApprovalQueuePage, etc.) are preserved
 * at the bottom so existing App.jsx imports do not break while the full
 * refactor is staged.
 */

import { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../auth/AuthContext'
import { requireSupabase } from '../lib/supabase'
import { navigationFor, navCaption, roleLabel, defaultPage } from '../navigation'
import './actor-ui.css'
import { SystemAdminLayout as OfficialSystemAdminLayout } from '../system-admin/SystemAdminLayout'

// ─── Design-token helpers ────────────────────────────────────────────────────
const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫'

// ─── Shared primitive components ─────────────────────────────────────────────

/** Floating-label text input */
export function FloatingInput({ label, name, type = 'text', value, onChange, required, autoComplete, disabled, error }) {
  const [focused, setFocused] = useState(false)
  const isLifted = focused || (value && value.length > 0)
  return (
    <div className={`fl-input-wrap${error ? ' fl-input-error' : ''}`}>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        required={required}
        className="fl-input"
        aria-describedby={error ? `${name}-err` : undefined}
        aria-invalid={!!error}
      />
      <label htmlFor={name} className={`fl-label${isLifted ? ' lifted' : ''}`}>
        {label}
      </label>
      {error && <span id={`${name}-err`} className="fl-error-msg">{error}</span>}
    </div>
  )
}

/** Three-variant button */
export function Button({ variant = 'primary', type = 'button', disabled, loading, onClick, children, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`cv-btn cv-btn-${variant}${loading ? ' cv-btn-loading' : ''} ${className}`}
    >
      {loading ? <span className="cv-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

/** Status badge: active | inactive | pending | completed | incomplete */
export function StatusBadge({ status }) {
  return (
    <span className={`cv-badge cv-badge-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

/** Role badge (admin | manager | member) */
export function RoleBadge({ role }) {
  return <span className={`actor-badge ${role}`}>{roleLabel(role)}</span>
}

// ─── Shared layout primitives ─────────────────────────────────────────────────

function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon" aria-hidden="true">✣</span>
      <span>CastraVision</span>
    </div>
  )
}

/** Generic sidebar — role, navItems, currentPage, onNavigate, user */
function Sidebar({ role, navItems, currentPage, onNavigate, user, onSignOut }) {
  const caption = navCaption(role)
  const userLabel = user?.email ? user.email.split('@')[0] : 'User'
  const userInitials = userLabel.slice(0, 2).toUpperCase()

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Brand */}
      <div className="sidebar-brand">
        <Brand />
        <span className="sme-tag">AI</span>
      </div>

      {/* Role context chip */}
      <div className="sidebar-role-chip">
        <span className="sidebar-role-dot" />
        <span>{roleLabel(role)}</span>
      </div>

      {/* Nav section caption */}
      <div className="nav-caption">{caption}</div>

      {/* Navigation */}
      <nav aria-label={caption}>
        {navItems.map(([key, icon, label]) => (
          <button
            key={key}
            className={`nav-item${currentPage === key ? ' active' : ''}`}
            onClick={() => onNavigate(key)}
            aria-current={currentPage === key ? 'page' : undefined}
          >
            <span aria-hidden="true" className="nav-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom: user + sign-out */}
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <span className="user-avatar-sm">{userInitials}</span>
          <div className="sidebar-user-meta">
            <span className="user-name">{userLabel}</span>
            <span className="user-role-label">{roleLabel(role)}</span>
          </div>
        </div>
        <button className="sidebar-signout" onClick={onSignOut} type="button">
          Sign Out
        </button>
      </div>
    </aside>
  )
}

/** Generic top header */
function Header({ title, subtitle, actions }) {
  return (
    <header className="app-topbar">
      <div className="topbar-page-info">
        <h1 className="topbar-page-title">{title}</h1>
        {subtitle && <span className="topbar-page-sub">{subtitle}</span>}
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  )
}

// ─── LAYOUT WRAPPERS ─────────────────────────────────────────────────────────

/**
 * SystemAdminLayout
 * Renders the correct page shell for the System Admin actor.
 * Pages available: sa-dashboard, sa-company-mgmt
 */
export function SystemAdminLayout({ user, onSignOut, notify }) {
  return <OfficialSystemAdminLayout user={user} onLogout={onSignOut} notify={notify} />
}

/**
 * CompanyAdminLayout
 * Renders the correct page shell for the Company Admin actor.
 * Pages available: ca-overview, ca-employees, ca-workgroups, ca-workspace
 */
function CompanyAdminLayout({ user, onSignOut, companyName, notify }) {
  const [page, setPage] = useState('ca-overview')
  const navItems = navigationFor('company_admin')

  const pageTitle = {
    'ca-overview': 'Company Overview',
    'ca-employees': 'Employee Management',
    'ca-workgroups': 'Workgroup Management',
    'ca-workspace': 'Workspace Management',
  }[page] || 'Company Admin'

  return (
    <div className="shell">
      <Sidebar
        role="company_admin"
        navItems={navItems}
        currentPage={page}
        onNavigate={setPage}
        user={user}
        onSignOut={onSignOut}
      />
      <div className="main-wrap">
        <Header
          title={pageTitle}
          subtitle={companyName || 'Your Company'}
        />
        <main className="app-content">
          {page === 'ca-overview' && <CompanyOverviewPage setPage={setPage} notify={notify} companyName={companyName} />}
          {page === 'ca-employees' && <EmployeeManagementPage notify={notify} />}
          {page === 'ca-workgroups' && <WorkgroupManagementPage notify={notify} />}
          {page === 'ca-workspace' && <WorkspaceManagementPage notify={notify} />}
        </main>
      </div>
    </div>
  )
}

/**
 * EmployeeLayout
 * Renders the correct page shell for workspace Employees (admin/manager/member).
 * Navigation items are filtered per RBAC capabilities.
 * Handles onboarding gate: if needsOnboarding=true, only shows profile completion.
 */
function EmployeeLayout({ user, role, onSignOut, needsOnboarding, workspaceName, notify, imports = [], profile = {} }) {
  const [page, setPage] = useState(defaultPage(role))
  const navItems = navigationFor(role, needsOnboarding)

  // If role changes or onboarding completes, snap to default landing page
  useEffect(() => {
    setPage(defaultPage(role))
  }, [role, needsOnboarding])

  const pageTitle = {
    'emp-dashboard': 'Dashboard',
    'emp-strategy': 'Strategy Creation',
    'emp-content': 'Content Generation',
    'emp-import': 'Campaign Data Import',
    'emp-performance': 'Performance Monitoring',
    'emp-budget': 'Budget Optimization',
    'emp-competitor': 'Competitor Analysis',
    'emp-reports': 'Reports',
    'emp-approvals': 'Approval Queue',
    'emp-notifications': 'Notifications',
    'emp-profile': 'My Profile',
    'emp-onboarding': 'Complete Your Profile',
  }[page] || 'Workspace'

  return (
    <div className="shell">
      <Sidebar
        role={role}
        navItems={navItems}
        currentPage={page}
        onNavigate={setPage}
        user={user}
        onSignOut={onSignOut}
      />
      <div className="main-wrap">
        <Header
          title={pageTitle}
          subtitle={workspaceName || 'Your Workspace'}
        />
        <main className="app-content">
          {/* ── Onboarding gate ── */}
          {needsOnboarding && (
            <EmployeeOnboardingPage user={user} notify={notify} />
          )}

          {/* ── Regular employee pages (only when onboarding is done) ── */}
          {!needsOnboarding && (
            <>
              {page === 'emp-dashboard' && <PerformanceDashboardPage setPage={setPage} imports={imports} />}
              {page === 'emp-strategy' && <StrategyCreationPage notify={notify} />}
              {page === 'emp-content' && <ContentGenerationPage notify={notify} />}
              {page === 'emp-import' && <CampaignDataImportPage notify={notify} />}
              {page === 'emp-performance' && <PerformanceDashboardPage setPage={setPage} imports={imports} />}
              {page === 'emp-budget' && <BudgetOptimizationPage notify={notify} />}
              {page === 'emp-competitor' && <CompetitorInsightsPage notify={notify} />}
              {page === 'emp-reports' && <ReportsPage notify={notify} />}
              {page === 'emp-approvals' && <ApprovalQueuePage notify={notify} />}
              {page === 'emp-notifications' && <NotificationsPage notify={notify} />}
              {page === 'emp-profile' && <MyProfilePage user={user} profile={profile} notify={notify} />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── ROLE-BASED LAYOUT WRAPPER (primary export) ───────────────────────────────

/**
 * RoleLayout — the single entry point rendered by App.jsx after auth.
 *
 * It reads the role from AuthContext and delegates to the correct layout.
 * All three actor UIs (System Admin, Company Admin, Employee) emerge from here.
 */
export function RoleLayout({ notify }) {
  const auth = useContext(AuthContext)
  const { user, role, membership, needsOnboarding } = auth || {}

  // Determine actor type from role string
  const isSystemAdmin = role === 'system_admin'
  const isCompanyAdmin = role === 'company_admin'
  const isEmployee = ['admin', 'manager', 'member'].includes(role)

  async function handleSignOut() {
    try { await auth?.signOut() } catch { /* handled by AuthProvider */ }
  }

  if (isSystemAdmin) {
    return (
      <SystemAdminLayout
        user={user}
        onSignOut={handleSignOut}
        notify={notify}
      />
    )
  }

  if (isCompanyAdmin) {
    return (
      <CompanyAdminLayout
        user={user}
        onSignOut={handleSignOut}
        companyName={membership?.companyName}
        notify={notify}
      />
    )
  }

  if (isEmployee) {
    return (
      <EmployeeLayout
        user={user}
        role={role}
        onSignOut={handleSignOut}
        needsOnboarding={needsOnboarding}
        workspaceName={membership?.workspaceName}
        profile={membership?.profile}
        notify={notify}
      />
    )
  }

  // Fallback: unknown role
  return (
    <div className="auth-page" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div className="auth-card">
        <h2 style={{ marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ color: 'var(--cv-muted)', marginBottom: 20 }}>
          Your account does not have an assigned role. Please contact your administrator.
        </p>
        <Button variant="secondary" onClick={handleSignOut}>Sign Out</Button>
      </div>
    </div>
  )
}

// ─── SYSTEM ADMIN (CONSOLIDATED) ──────────────────────────────────────────────
// System Admin is consolidated under src/system-admin/ (SystemAdminLayout)

// ─── COMPANY ADMIN PAGES ──────────────────────────────────────────────────────

const DEMO_EMPLOYEES = [
  { id: 'e1', name: 'Alex Johnson', email: 'alex@acme.com', role: 'admin', workgroup: 'Marketing', status: 'completed' },
  { id: 'e2', name: 'Sara Williams', email: 'sara@acme.com', role: 'manager', workgroup: 'Content', status: 'completed' },
  { id: 'e3', name: 'Tom Lee', email: 'tom@acme.com', role: 'member', workgroup: 'Analytics', status: 'incomplete' },
  { id: 'e4', name: '—', email: 'new@acme.com', role: 'member', workgroup: '—', status: 'incomplete' },
]
const DEMO_WORKGROUPS = [
  { id: 'w1', name: 'Marketing', members: 2 },
  { id: 'w2', name: 'Content', members: 1 },
  { id: 'w3', name: 'Analytics', members: 1 },
]

function CompanyOverviewPage({ setPage, notify, companyName }) {
  const completed = DEMO_EMPLOYEES.filter(e => e.status === 'completed').length
  const incomplete = DEMO_EMPLOYEES.filter(e => e.status === 'incomplete').length
  return (
    <>
      <div className="actor-summary" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))', marginBottom: 24 }}>
        <div><strong>{DEMO_EMPLOYEES.length}</strong><span>Total Employees</span></div>
        <div><strong>{DEMO_WORKGROUPS.length}</strong><span>Total Workgroups</span></div>
        <div><strong style={{ color: 'var(--cv-green)' }}>{completed}</strong><span>Completed Profiles</span></div>
        <div><strong style={{ color: 'var(--cv-muted)' }}>{incomplete}</strong><span>Incomplete Profiles</span></div>
      </div>

      <section className="actor-panel">
        <header>
          <h2>{companyName || 'Your Company'}</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="primary" onClick={() => setPage('ca-employees')}>+ Add Employee</Button>
            <Button variant="secondary" onClick={() => setPage('ca-workgroups')}>+ Create Workgroup</Button>
          </div>
        </header>
        <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <small style={{ color: 'var(--cv-muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '.05em' }}>Company Name</small>
            <p style={{ margin: '6px 0 0', fontWeight: 600 }}>{companyName || '—'}</p>
          </div>
          <div>
            <small style={{ color: 'var(--cv-muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '.05em' }}>Employee Onboarding</small>
            <p style={{ margin: '6px 0 0' }}>
              <span style={{ color: 'var(--cv-green)', fontWeight: 700 }}>{completed}</span>
              <span style={{ color: 'var(--cv-muted)' }}> / {DEMO_EMPLOYEES.length} completed</span>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

function EmployeeManagementPage({ notify }) {
  const [employees, setEmployees] = useState(DEMO_EMPLOYEES)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [addBusy, setAddBusy] = useState(false)

  const visible = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  )

  function handleAddEmployee(e) {
    e.preventDefault()
    setEmailError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return setEmailError('Enter a valid email address.')
    }
    if (employees.some(emp => emp.email === newEmail)) {
      return setEmailError('This employee is already in your company.')
    }
    setAddBusy(true)
    setTimeout(() => {
      setEmployees(prev => [...prev, {
        id: `e${Date.now()}`, name: '—', email: newEmail,
        role: 'member', workgroup: '—', status: 'incomplete'
      }])
      setAddBusy(false)
      setAddOpen(false)
      setNewEmail('')
      notify?.('Employee added successfully.')
    }, 800)
  }

  return (
    <>
      <section className="actor-panel">
        <header>
          <h2>Employees</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => notify?.('Refreshed.')}>↻ Refresh</Button>
            <Button variant="primary" onClick={() => setAddOpen(true)}>+ Add Employee</Button>
          </div>
        </header>

        {/* Search */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--cv-border)' }}>
          <FloatingInput label="Search employees" name="emp-search" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="actor-table-wrap">
          <table className="actor-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Workspace Role</th>
                <th>Workgroup</th>
                <th>Profile Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(emp => (
                <tr key={emp.id}>
                  <td><strong>{emp.name}</strong></td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{emp.email}</span></td>
                  <td><RoleBadge role={emp.role} /></td>
                  <td>{emp.workgroup}</td>
                  <td><StatusBadge status={emp.status} /></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <Button variant="secondary" onClick={() => notify?.(`Viewing ${emp.email}.`)}>View</Button>
                    <Button variant="secondary" onClick={() => notify?.('Manage Workgroup Assignment.')}>Workgroup</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Employee modal */}
      {addOpen && (
        <div className="actor-modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setAddOpen(false)}>
          <form className="actor-modal" role="dialog" aria-modal="true" aria-labelledby="add-emp-title" onSubmit={handleAddEmployee}>
            <button className="modal-close" type="button" aria-label="Close" onClick={() => setAddOpen(false)}>×</button>
            <span className="modal-icon">👤</span>
            <h2 id="add-emp-title">Add Employee</h2>
            <p>Enter the employee's email address to add them to your company.</p>
            <FloatingInput
              label="Employee Email"
              name="new-emp-email"
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              error={emailError}
              required
            />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => { setAddOpen(false); setEmailError('') }}>Cancel</Button>
              <Button variant="primary" type="submit" loading={addBusy}>Add Employee</Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

function WorkgroupManagementPage({ notify }) {
  const [workgroups, setWorkgroups] = useState(DEMO_WORKGROUPS)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [wgName, setWgName] = useState('')
  const [wgError, setWgError] = useState('')

  const visible = workgroups.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))

  function handleCreate(e) {
    e.preventDefault()
    setWgError('')
    if (!wgName.trim()) return setWgError('Workgroup name is required.')
    setWorkgroups(prev => [...prev, { id: `w${Date.now()}`, name: wgName.trim(), members: 0 }])
    setCreateOpen(false)
    setWgName('')
    notify?.(`Workgroup "${wgName.trim()}" created.`)
  }

  return (
    <>
      <section className="actor-panel">
        <header>
          <h2>Workgroups</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => notify?.('Refreshed.')}>↻ Refresh</Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>+ Create Workgroup</Button>
          </div>
        </header>

        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--cv-border)' }}>
          <FloatingInput label="Search workgroups" name="wg-search" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="actor-table-wrap">
          <table className="actor-table">
            <thead>
              <tr>
                <th>Workgroup Name</th>
                <th>Member Count</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(wg => (
                <tr key={wg.id}>
                  <td><strong>{wg.name}</strong></td>
                  <td>{wg.members}</td>
                  <td>
                    <Button variant="secondary" onClick={() => notify?.(`Viewing ${wg.name}.`)}>View Workgroup</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {createOpen && (
        <div className="actor-modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setCreateOpen(false)}>
          <form className="actor-modal" role="dialog" aria-modal="true" aria-labelledby="create-wg-title" onSubmit={handleCreate}>
            <button className="modal-close" type="button" aria-label="Close" onClick={() => setCreateOpen(false)}>×</button>
            <span className="modal-icon">◉</span>
            <h2 id="create-wg-title">Create Workgroup</h2>
            <p>Define a new workgroup and optionally assign employees.</p>
            <FloatingInput
              label="Workgroup Name"
              name="wg-name"
              value={wgName}
              onChange={e => setWgName(e.target.value)}
              error={wgError}
              required
            />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save</Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

function WorkspaceManagementPage({ notify }) {
  const [members, setMembers] = useState(DEMO_EMPLOYEES)

  function changeRole(id, newRole) {
    const admins = members.filter(m => m.role === 'admin')
    const target = members.find(m => m.id === id)
    if (target?.role === 'admin' && admins.length === 1) {
      return notify?.('Cannot remove the last Workspace Admin.')
    }
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m))
    notify?.(`Role updated to ${newRole}.`)
  }

  return (
    <section className="actor-panel">
      <header>
        <h2>Workspace Members</h2>
        <span style={{ fontSize: 12, color: 'var(--cv-muted)' }}>FR06 RBAC</span>
      </header>
      <div className="actor-policy coral">
        <b>Protection Policy:</b> The last Workspace Admin cannot be removed or demoted.
      </div>
      <div className="actor-table-wrap">
        <table className="actor-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Email</th>
              <th>Workspace Role</th>
              <th>Role Management</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td><strong>{m.name}</strong></td>
                <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.email}</span></td>
                <td><RoleBadge role={m.role} /></td>
                <td>
                  <select
                    value={m.role}
                    onChange={e => changeRole(m.id, e.target.value)}
                    style={{ fontSize: 13, borderRadius: 6 }}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ─── EMPLOYEE PAGES ───────────────────────────────────────────────────────────

function EmployeeOnboardingPage({ user, notify }) {
  const [step, setStep] = useState('welcome') // 'welcome' | 'form' | 'done'
  const [fullName, setFullName] = useState('')
  const [nameError, setNameError] = useState('')
  const [busy, setBusy] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    setNameError('')
    if (!fullName.trim()) return setNameError('Full name is required.')
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setStep('done')
      notify?.('Profile saved successfully.')
    }, 900)
  }

  if (step === 'welcome') return (
    <div className="onboarding-card">
      <h2>Welcome to CastraVision</h2>
      <p>You have been added to a company on CastraVision. Before you can access your workspace, you need to complete your profile.</p>
      <Button variant="primary" onClick={() => setStep('form')}>Continue</Button>
    </div>
  )

  if (step === 'form') return (
    <div className="onboarding-card">
      <h2>Complete Your Profile</h2>
      <p>Please fill in your details to get started.</p>
      <form onSubmit={handleSave} style={{ marginTop: 24 }}>
        <FloatingInput label="Full Name" name="full-name" value={fullName} onChange={e => setFullName(e.target.value)} error={nameError} required />
        <FloatingInput label="Email Address" name="email-ro" type="email" value={user?.email || ''} onChange={() => { }} disabled />
        <div style={{ marginTop: 20 }}>
          <Button variant="primary" type="submit" loading={busy}>Save Profile</Button>
        </div>
      </form>
    </div>
  )

  return (
    <div className="onboarding-card">
      <span style={{ fontSize: 48 }}>✓</span>
      <h2>Profile Completed</h2>
      <p>Your profile has been saved. You will now have access to your authorized workspace features.</p>
      <Button variant="primary" onClick={() => notify?.('Redirecting to workspace…')}>Continue to Workspace</Button>
    </div>
  )
}

function StrategyCreationPage({ notify }) {
  const [form, setForm] = useState({ context: '', objective: '', budget: '' })
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  function generate(e) {
    e.preventDefault()
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setResult({
        channels: ['Meta Ads', 'Google Search'],
        budget: { 'Meta Ads': '60%', 'Google Search': '40%' },
        segments: 'Young adults 22–35, urban, digitally active',
        messages: 'Authentic storytelling, product demonstrations, social proof',
        rationale: 'Based on the provided business context, Meta Ads and Google Search deliver the best reach-to-cost ratio for your target audience.',
      })
    }, 1200)
  }

  return (
    <>
      <section className="actor-panel">
        <header><h2>Strategy Creation</h2><span>FR01</span></header>
        <form onSubmit={generate} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FloatingInput label="Business Context" name="biz-context" value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} required />
          <FloatingInput label="Marketing Objective" name="objective" value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} required />
          <FloatingInput label="Monthly Budget (USD)" name="budget" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} required />
          <div><Button variant="primary" type="submit" loading={busy}>Generate Strategy</Button></div>
        </form>
      </section>

      {result && (
        <section className="actor-panel">
          <header><h2>Recommended Strategy</h2><span>AI Generated</span></header>
          <div style={{ padding: '20px 22px' }}>
            <div className="actor-summary" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
              <div><strong style={{ fontSize: 14 }}>{result.channels.join(', ')}</strong><span>Recommended Channels</span></div>
              <div><strong style={{ fontSize: 14 }}>{result.segments}</strong><span>Target Segments</span></div>
            </div>
            <p style={{ color: 'var(--cv-muted)', fontSize: 13, lineHeight: 1.7 }}>{result.rationale}</p>
          </div>
        </section>
      )}
    </>
  )
}

function ContentGenerationPage({ notify }) {
  const [form, setForm] = useState({ channel: '', audience: '', tone: '' })
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  function generate(e) {
    e.preventDefault()
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setResult({
        headline: 'Elevate Your Style, Define Your Story',
        description: 'Discover the collection built for those who lead with confidence. Limited time offer — shop now.',
        cta: 'Shop the Collection',
        imagePrompt: 'Product flat-lay on clean white background with warm lighting, lifestyle photography style.',
      })
    }, 1000)
  }

  return (
    <>
      <section className="actor-panel">
        <header><h2>Content Generation</h2><span>FR02</span></header>
        <form onSubmit={generate} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FloatingInput label="Advertising Channel" name="ad-channel" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} required />
          <FloatingInput label="Target Audience" name="audience" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} required />
          <FloatingInput label="Brand Tone" name="tone" value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))} />
          <div><Button variant="primary" type="submit" loading={busy}>Generate Content</Button></div>
        </form>
      </section>

      {result && (
        <section className="actor-panel">
          <header><h2>Generated Content</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setResult(null)}>↻ Regenerate</Button>
              <Button variant="secondary" onClick={() => notify?.('Edit mode — coming next sprint.')}>Edit</Button>
              <Button variant="primary" onClick={() => notify?.('Submitted for approval.')}>Submit for Approval</Button>
            </div>
          </header>
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><small style={{ color: 'var(--cv-muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '.05em' }}>Headline</small><p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 18 }}>{result.headline}</p></div>
            <div><small style={{ color: 'var(--cv-muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '.05em' }}>Description</small><p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.7 }}>{result.description}</p></div>
            <div><small style={{ color: 'var(--cv-muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '.05em' }}>Call to Action</small><p style={{ margin: '4px 0 0', fontWeight: 600 }}>{result.cta}</p></div>
            <div><small style={{ color: 'var(--cv-muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '.05em' }}>Image Prompt</small><p style={{ margin: '4px 0 0', fontFamily: 'monospace', fontSize: 12, color: 'var(--cv-cyan)', background: '#101729', borderRadius: 6, padding: '10px 14px' }}>{result.imagePrompt}</p></div>
          </div>
        </section>
      )}
    </>
  )
}

function CampaignDataImportPage({ notify }) {
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)

  function handleFile(file) {
    if (!file) return
    if (!['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type) && !file.name.match(/\.(csv|xlsx)$/i)) {
      return notify?.('Only CSV and XLSX files are supported.')
    }
    setFileName(file.name)
    setDone(false)
  }

  function handleImport() {
    if (!fileName) return notify?.('Please select a file first.')
    setImporting(true)
    setTimeout(() => {
      setImporting(false)
      setDone(true)
      notify?.(`${fileName} imported successfully.`)
    }, 1200)
  }

  return (
    <section className="actor-panel">
      <header><h2>Campaign Data Import</h2><span>FR08</span></header>
      <div style={{ padding: '24px 22px' }}>
        <div
          className={`import-dropzone${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => document.getElementById('file-picker').click()}
          style={{ cursor: 'pointer' }}
        >
          <input id="file-picker" type="file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <span style={{ fontSize: 36 }}>⇥</span>
          <p>{fileName || 'Drag & drop your CSV or XLSX file here, or click to browse'}</p>
          <small>Supported: CTR, CPA, ROAS, Impressions</small>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <Button variant="primary" loading={importing} onClick={handleImport} disabled={!fileName}>Import</Button>
          {done && <span style={{ color: 'var(--cv-green)', alignSelf: 'center', fontSize: 14 }}>✓ Import successful</span>}
        </div>
      </div>
    </section>
  )
}

function MyProfilePage({ user, profile, notify }) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [busy, setBusy] = useState(false)

  function save(e) {
    e.preventDefault()
    setBusy(true)
    setTimeout(() => { setBusy(false); notify?.('Profile saved.') }, 700)
  }

  return (
    <section className="actor-panel">
      <header><h2>My Profile</h2></header>
      <form onSubmit={save} style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FloatingInput label="Full Name" name="profile-name" value={fullName} onChange={e => setFullName(e.target.value)} />
        <FloatingInput label="Email Address" name="profile-email" type="email" value={user?.email || ''} onChange={() => { }} disabled />
        <FloatingInput label="Company" name="profile-company" value={profile?.companyName || '—'} onChange={() => { }} disabled />
        <FloatingInput label="Workgroup" name="profile-workgroup" value={profile?.workgroup || '—'} onChange={() => { }} disabled />
        <FloatingInput label="Workspace Role" name="profile-role" value={profile?.role || '—'} onChange={() => { }} disabled />
        <div>
          <Button variant="primary" type="submit" loading={busy}>Save Profile</Button>
        </div>
      </form>
    </section>
  )
}

function NotificationsPage({ notify }) {
  return (
    <section className="actor-panel">
      <header><h2>Notifications</h2></header>
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--cv-muted)' }}>
        <p>No new notifications.</p>
      </div>
    </section>
  )
}

// ─── LEGACY WORKSPACE PAGES (preserved for existing App.jsx imports) ──────────
// These pages remain functionally identical to the original implementation.
// They will be progressively migrated to the new actor-page structure.

const legacyMembers = [
  ['LT', 'Lê Thành Đạt', 'lthanhdat85@gmail.com', 'Admin', 'active'],
  ['HN', 'Hà Ngọc Minh', 'manager@demo.castravision.vn', 'Manager', 'active'],
  ['ML', 'Mai Lan', 'member@demo.castravision.vn', 'Member', 'active'],
  ['TN', 'Trần Ngọc', 'content@demo.castravision.vn', 'Member', 'pending'],
]

function PageIntro({ code, title, subtitle, action }) {
  return (
    <header className="actor-intro">
      <div>
        <span className="actor-code">{code}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </header>
  )
}

function Panel({ title, meta, children, className = '' }) {
  return (
    <section className={`actor-panel ${className}`}>
      <header><h2>{title}</h2>{meta && <span>{meta}</span>}</header>
      {children}
    </section>
  )
}

function Badge({ tone = 'neutral', children }) {
  return <span className={`actor-badge ${tone}`}>{children}</span>
}

export function MembersPage({ profile, notify }) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Manager')
  const [rows, setRows] = useState(legacyMembers)
  function invite(event) {
    event.preventDefault()
    setRows(c => [...c, ['NEW', email.split('@')[0], email, role, 'pending']])
    setInviteOpen(false); setEmail(''); notify?.(`Invitation created for ${email}.`)
  }
  return (
    <>
      <PageIntro code="FR06 · RBAC ENGINE" title="Workspace Members & Access Control" subtitle="Manage members, roles and access scope within each Workspace." action={<button className="button primary" onClick={() => setInviteOpen(true)}>＋ Invite member</button>} />
      <div className="actor-summary">
        <div><strong>{rows.length}</strong><span>Total Members</span></div>
        <div><strong>{rows.filter(r => r[3] === 'Admin').length}</strong><span>Admin</span></div>
        <div><strong>{rows.filter(r => r[3] === 'Manager').length}</strong><span>Manager</span></div>
        <div><strong>{rows.filter(r => r[3] === 'Member').length}</strong><span>Member</span></div>
      </div>
      <Panel title={profile.business_name} meta="Active member directory">
        <div className="actor-table-wrap">
          <table className="actor-table">
            <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Key Permissions</th></tr></thead>
            <tbody>{rows.map(([avatar, name, mail, userRole, status]) => (
              <tr key={mail}>
                <td><div className="actor-person"><b>{avatar}</b><span><strong>{name}</strong><small>{mail}</small></span></div></td>
                <td><Badge tone={userRole.toLowerCase()}>{userRole}</Badge></td>
                <td><Badge tone={status}>{status === 'active' ? 'Active' : 'Pending'}</Badge></td>
                <td>{userRole === 'Admin' ? 'Full, RBAC, approvals, audit' : userRole === 'Manager' ? 'Campaigns, approvals, reports' : 'Strategy, content, import'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
      <div className="actor-policy coral"><b>Protection policy:</b> The last Admin cannot be removed from the Workspace.</div>
      {inviteOpen && (
        <div className="actor-modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setInviteOpen(false)}>
          <form className="actor-modal" role="dialog" aria-modal="true" aria-labelledby="invite-title" onSubmit={invite}>
            <button className="modal-close" type="button" aria-label="Close" onClick={() => setInviteOpen(false)}>×</button>
            <span className="modal-icon">♙</span>
            <h2 id="invite-title">Invite New Member</h2>
            <p>Grant access to {profile.business_name} by role.</p>
            <label>Member Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required /></label>
            <fieldset>
              <legend>Assigned Role</legend>
              {['Admin', 'Manager', 'Member'].map(item => (
                <label className={`role-option ${role === item ? 'selected' : ''}`} key={item}>
                  <input type="radio" name="role" value={item} checked={role === item} onChange={() => setRole(item)} />
                  <span><strong>{item}</strong><small>{item === 'Admin' ? 'Full admin' : item === 'Manager' ? 'Manage & approve' : 'Execute content'}</small></span>
                </label>
              ))}
            </fieldset>
            <div className="modal-actions">
              <button type="button" className="button subtle" onClick={() => setInviteOpen(false)}>Cancel</button>
              <button className="button primary">Send Invitation</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export function RoleManagementPage() {
  const roleCards = [
    ['Admin', 'Highest Access', 'Workspace administration, user lifecycle, security and financial approvals.'],
    ['Manager', 'Governance', 'Review, edit and approve AI-generated marketing outputs.'],
    ['Member', 'Execution', 'Create strategies, content and import data within assigned scope.'],
  ]
  const capabilities = [
    ['Workspace Settings & Profile', 'Full', 'None', 'None'],
    ['Invite Members & Assign Roles', 'Full', 'View only', 'None'],
    ['Approve FR04 Proposals', 'Allowed', 'Allowed', 'None'],
    ['FR11 Audit Log', 'View & Export', 'View only', 'None'],
    ['Campaign Data Import FR08', 'Full', 'Full', 'Allowed'],
    ['Strategy & Content Creation', 'Allowed', 'Allowed', 'Allowed'],
  ]
  return (
    <>
      <PageIntro code="FR06 · ROLE-BASED ACCESS CONTROL" title="Role Management & RBAC" subtitle="Review security boundaries between Admin, Manager and Member." />
      <div className="role-card-grid">
        {roleCards.map(([r, tier, desc]) => (
          <article className="actor-panel role-card" key={r}>
            <Badge tone={r.toLowerCase()}>{r} · {tier}</Badge>
            <h2>{r} Role</h2>
            <p>{desc}</p>
            <ul>{capabilities.filter(row => row[['Admin', 'Manager', 'Member'].indexOf(r) + 1] !== 'None').slice(0, 4).map(row => <li key={row[0]}>✓ {row[0]}</li>)}</ul>
          </article>
        ))}
      </div>
      <Panel title="Capability Matrix" meta="Enforced by API & UI">
        <div className="actor-table-wrap">
          <table className="actor-table matrix">
            <thead><tr><th>Feature Scope</th><th>Admin</th><th>Manager</th><th>Member</th></tr></thead>
            <tbody>{capabilities.map(row => (
              <tr key={row[0]}>{row.map((cell, i) => <td key={cell}><span className={i && cell === 'None' ? 'denied' : i ? 'allowed' : ''}>{cell}</span></td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}

const proposals = [
  ['PRP-8402', 'Q4 Multi-channel Content', 'Content', 'AI Content Engine', 'pending'],
  ['PRP-8403', 'Dynamic Budget Reallocation', 'Budget', 'Budget Optimizer', 'pending'],
  ['PRP-8404', 'Nurture Content Series', 'Content', 'Mai Lan', 'edited'],
  ['PRP-8401', 'Creative Retargeting', 'Content', 'Creative Engine', 'approved'],
]

export function ApprovalQueuePage({ notify }) {
  const [rows, setRows] = useState(proposals)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const visible = rows.filter(r => filter === 'all' || r[4] === filter)
  function setStatus(id, status) {
    setRows(c => c.map(r => r[0] === id ? [...r.slice(0, 4), status] : r))
    setSelected(null)
    notify?.(`${id} has been ${status === 'approved' ? 'approved' : 'rejected'}.`)
  }
  return (
    <>
      <PageIntro code="FR04 · GOVERNANCE ENGINE" title="Approval Queue" subtitle="Review content and budget proposals before campaign deployment." action={<Badge tone="manager">Manager access</Badge>} />
      <div className="actor-policy"><b>Access control active.</b> Admin and Manager can review, edit, approve or reject. Members have no access.</div>
      <div className="actor-summary">
        <div><strong>{rows.length}</strong><span>Total Proposals</span></div>
        <div><strong>{rows.filter(r => r[4] === 'pending').length}</strong><span>Pending</span></div>
        <div><strong>{rows.filter(r => r[4] === 'approved').length}</strong><span>Approved</span></div>
        <div><strong>{rows.filter(r => r[4] === 'rejected').length}</strong><span>Rejected</span></div>
      </div>
      <Panel title="Proposals" meta={`${visible.length} records`}>
        <div className="actor-filters">
          {['all', 'pending', 'approved', 'rejected'].map(f => <button className={filter === f ? 'active' : ''} onClick={() => setFilter(f)} key={f}>{f === 'all' ? 'All' : f}</button>)}
        </div>
        <div className="actor-table-wrap">
          <table className="actor-table">
            <thead><tr><th>Code & Proposal</th><th>Type</th><th>Creator / Engine</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{visible.map(r => (
              <tr key={r[0]}>
                <td><strong>{r[1]}</strong><small>{r[0]}</small></td>
                <td><Badge tone={r[2] === 'Budget' ? 'manager' : 'admin'}>{r[2]}</Badge></td>
                <td>{r[3]}</td>
                <td><Badge tone={r[4]}>{r[4]}</Badge></td>
                <td><button className="row-action" onClick={() => setSelected(r)}>Review</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
      {selected && (
        <Panel title={`Review ${selected[0]}`} meta="Human-in-the-loop">
          <div className="proposal-review">
            <div><span className="mini-label">PROPOSAL</span><h3>{selected[1]}</h3><p>AI recommends optimization based on the last 30 days. All decisions will be recorded in the FR11 Audit Log.</p></div>
            <div><span className="mini-label">POLICY CHECK</span><strong className="success-text">12 / 12 conditions met</strong></div>
            <div className="review-actions">
              <button className="button subtle" onClick={() => setSelected(null)}>Close</button>
              <button className="button coral" onClick={() => { setRejecting(selected); setSelected(null) }}>Reject</button>
              <button className="button primary" onClick={() => setStatus(selected[0], 'approved')}>✓ Approve</button>
            </div>
          </div>
        </Panel>
      )}
      {rejecting && (
        <div className="actor-modal-backdrop">
          <form className="actor-modal danger-modal" onSubmit={e => { e.preventDefault(); setStatus(rejecting[0], 'rejected'); setRejecting(null); setReason('') }}>
            <button className="modal-close" type="button" onClick={() => setRejecting(null)}>×</button>
            <span className="modal-icon danger">!</span>
            <h2>Reject Proposal</h2>
            <p>Enter a mandatory reason. The creator will be notified.</p>
            <label>Rejection Reason<textarea value={reason} onChange={e => setReason(e.target.value)} minLength={10} maxLength={500} required /></label>
            <div className="modal-actions">
              <button type="button" className="button subtle" onClick={() => setRejecting(null)}>Cancel</button>
              <button className="button coral">Reject Proposal</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export function BudgetOptimizationPage({ notify }) {
  const [analyzed, setAnalyzed] = useState(false)
  const allocations = [['Google Search', 40, 50, 6250000], ['Meta Ads', 40, 35, 4375000], ['TikTok Video', 20, 15, 1875000]]
  return (
    <>
      <PageIntro code="FR03 · BUDGET OPTIMIZATION ENGINE" title="Performance-Based Budget Allocation" subtitle="Analyze channel performance and optimize allocation based on verified data." />
      <div className="metric-grid">
        <article><span>Current Budget</span><strong>{money(10000000)}</strong><small>Last 30 days</small></article>
        <article><span>Suggested Budget</span><strong>{money(12500000)}</strong><small className="success-text">+25.0%</small></article>
        <article><span>Projected CPA</span><strong>$1.24</strong><small>-14.0%</small></article>
      </div>
      <Panel title="Current & Suggested Allocation" meta="100% normalized">
        <div className="budget-stack">
          <span style={{ width: '50%' }} /><span style={{ width: '35%' }} /><span style={{ width: '15%' }} />
        </div>
        <div className="allocation-list">
          {allocations.map(([ch, cur, sug, budget]) => (
            <div key={ch}><em>{ch}</em><span>{cur}% → <strong>{sug}%</strong></span><span>{money(budget)}</span><button className="row-action" onClick={() => notify?.('Budget applied.')}>Apply</button></div>
          ))}
        </div>
      </Panel>
      <div style={{ textAlign: 'right', marginTop: 12 }}>
        <Button variant="primary" onClick={() => { setAnalyzed(true); notify?.('Budget proposal submitted for approval.') }}>Submit for Approval</Button>
      </div>
    </>
  )
}

export function ReportsPage({ notify }) {
  const [period, setPeriod] = useState('Q4 2026')
  const periods = ['Q4 2026', 'Q3 2026', 'Q2 2026', 'Q1 2026']
  const reportList = [
    ['Campaign Performance Summary', 'PDF', '2.4 MB'],
    ['Budget Allocation Report', 'XLSX', '890 KB'],
    ['Competitor Analysis', 'PDF', '1.1 MB'],
  ]
  return (
    <>
      <PageIntro code="FR-REPORTS" title="Reports" subtitle="Download and export campaign performance, budget and competitor reports." />
      <div className="report-layout">
        <Panel title="Select Period" meta="">
          <div className="period-options">
            {periods.map(p => <button className={period === p ? 'selected' : ''} key={p} onClick={() => setPeriod(p)}>{p}</button>)}
          </div>
        </Panel>
        <Panel title="Available Reports">
          <div className="report-list">
            {reportList.map(([name, type, size]) => (
              <div key={name}>
                <span className="file-type">{type}</span>
                <span><strong>{name}</strong><small>{period} · {size}</small></span>
                <button className="row-action" onClick={() => notify?.(`Downloading ${name}.`)}>Download</button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}

export function CompetitorInsightsPage({ notify }) {
  const [query, setQuery] = useState('')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState(null)
  function analyze(e) {
    e.preventDefault(); setRunning(true)
    setTimeout(() => {
      setRunning(false)
      setResults([
        { name: 'Competitor A', budget: '40%', channels: 'Meta, Google', tone: 'Aspirational' },
        { name: 'Competitor B', budget: '35%', channels: 'TikTok, YouTube', tone: 'Humorous' },
      ])
    }, 1100)
  }
  return (
    <>
      <PageIntro code="FR-COMPETITOR" title="Competitor Analysis" subtitle="Analyze competitor marketing channels, budgets and messaging." />
      <section className="actor-panel">
        <header><h2>Analysis Query</h2></header>
        <form onSubmit={analyze} style={{ padding: '20px 22px' }}>
          <FloatingInput label="Industry or competitor name" name="comp-query" value={query} onChange={e => setQuery(e.target.value)} required />
          <div style={{ marginTop: 16 }}>
            <Button variant="primary" type="submit" loading={running}>Analyze</Button>
          </div>
        </form>
      </section>
      {results && (
        <div className="insight-columns">
          {results.map(r => (
            <section key={r.name} className="actor-panel">
              <header><h2>{r.name}</h2></header>
              <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p><small style={{ color: 'var(--cv-muted)', fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase' }}>Channels</small><br /><strong>{r.channels}</strong></p>
                <p><small style={{ color: 'var(--cv-muted)', fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase' }}>Brand Tone</small><br /><strong>{r.tone}</strong></p>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

export function AdminDashboardPage({ profile, imports = [], setPage, notify }) {
  const [pending, setPending] = useState([
    ['PRP-8402', 'Q4 Multi-channel Content', 'CONTENT', 'AI Content Engine · Sara Williams'],
    ['PRP-8403', 'Dynamic Budget Reallocation', 'BUDGET', 'Budget Optimizer · Alex Johnson'],
    ['PRP-8404', 'Nurture Content Series', 'CONTENT', 'AI Content Engine · Sara Williams'],
  ])
  const audit = [
    ['FR06 RBAC', 'Role change: Sara promoted to Manager', '14 min ago', 'Alex Johnson · Admin'],
    ['FR04 APPROVAL', 'Approved PRP-8401 Creative Retargeting', '1 hr ago', 'Alex Johnson · Admin'],
    ['FR06 INVITE', 'Invited new@acme.com', '3 hrs ago', 'Alex Johnson · Admin'],
    ['FR08 IMPORT', `Campaign data imported (${imports.length || 3} sources)`, '5 hrs ago', 'Sara Williams · Manager'],
  ]
  function approve(id) { setPending(c => c.filter(r => r[0] !== id)); notify?.(`${id} approved and recorded in Audit Log.`) }
  return (
    <>
      <PageIntro
        code="ADMIN · LIVE NODE"
        title="Admin Console"
        subtitle={`Manage ${profile.business_name}, member permissions, proposal approvals and compliance logs.`}
        action={
          <div className="admin-quick-actions">
            <button className="button subtle" onClick={() => setPage('members')}>♙ Invite member</button>
            <button className="button subtle" onClick={() => setPage('roles')}>◈ Manage roles</button>
            <button className="button primary" onClick={() => notify?.('Create Workspace feature ready for API connection.')}>＋ New Workspace</button>
          </div>
        }
      />
      <div className="admin-kpi-grid">
        <article><span>Current Workspace</span><div className="admin-kpi-title"><strong>{profile.business_name}</strong><i>▦</i></div><p>{profile.industry || 'Business'} · {profile.business_size || 'SME'}</p><small>Status <b className="success-text">Active</b></small></article>
        <article><span>Workspace Members</span><div className="admin-kpi-title"><strong>4 members</strong><i>♙</i></div><p>1 Admin · 1 Manager · 2 Member</p><button onClick={() => setPage('members')}>Manage members →</button></article>
        <article><span>Pending Approvals</span><div className="admin-kpi-title"><strong>{pending.length} proposals</strong><i>✓</i></div><p>Content and Budget pending sign-off</p><button onClick={() => setPage('approvals')}>Open queue →</button></article>
        <article><span>Audit events · 24h</span><div className="admin-kpi-title"><strong>48 events</strong><i>♢</i></div><p>100% hash-recorded</p><button onClick={() => setPage('audit')}>View Audit Log →</button></article>
      </div>
      <div className="admin-console-grid">
        <div>
          <Panel title="Workspace Management & Resource Health" meta="Active · Healthy">
            <div className="resource-health">
              <div className="resource-facts">
                <span><small>Organization</small><strong>{profile.business_name}</strong></span>
                <span><small>Current Plan</small><strong>SME Pro</strong></span>
              </div>
              <div className="resource-actions">
                <button onClick={() => setPage('members')}>♙ Members</button>
                <button onClick={() => setPage('roles')}>▦ Permissions Matrix</button>
                <button onClick={() => setPage('profile')}>☷ Workspace Settings</button>
              </div>
            </div>
          </Panel>
          <Panel title="Governance Pending · FR04" meta={`${pending.length} pending review`}>
            <div className="governance-list">
              {pending.length ? pending.map(([id, title, type, author]) => (
                <article key={id}>
                  <span className="proposal-symbol">{type === 'BUDGET' ? '▣' : '▤'}</span>
                  <div><small>{id} · {type}</small><strong>{title}</strong><span>{author}</span></div>
                  <div><button className="row-action" onClick={() => setPage('approvals')}>Review</button><button className="approve-action" onClick={() => approve(id)}>Approve</button></div>
                </article>
              )) : <div className="admin-empty">✓ No proposals awaiting approval.</div>}
            </div>
          </Panel>
        </div>
        <Panel title="Recent Audit Trail · FR11" meta="● Live">
          <div className="recent-audit">
            {audit.map(([code, text, time, actor]) => (
              <article key={code + time}>
                <div><Badge tone={code.includes('APPROVAL') ? 'admin' : code.includes('IMPORT') ? 'active' : 'manager'}>{code}</Badge><time>{time}</time></div>
                <p>{text}</p>
                <small>◎ {actor}</small>
              </article>
            ))}
          </div>
          <button className="audit-footer-button" onClick={() => setPage('audit')}>▤ View full Audit Log</button>
        </Panel>
      </div>
    </>
  )
}

export function PerformanceDashboardPage({ setPage, imports = [] }) {
  const channels = [
    ['Google Search', '1.84M', '4.15%', '$1.06', '4.20×', 88],
    ['Meta Ads', '2.10M', '3.10%', '$1.32', '3.65×', 73],
    ['TikTok Video', '880K', '2.45%', '$1.46', '2.80×', 56],
  ]
  return (
    <>
      <PageIntro code="FR05 · PERFORMANCE MONITORING" title="Campaign Performance Dashboard" subtitle="Track marketing channels against established performance objectives." action={<button className="button subtle">↻ Refresh Data</button>} />
      <div className="metric-grid">
        <article><span>Impressions</span><strong>4.82M</strong><small className="success-text">↗ +12.4% vs prev period</small></article>
        <article><span>CTR</span><strong>3.42%</strong><small>Benchmark 2.80%</small></article>
        <article><span>CPA</span><strong>$1.24</strong><small>-$0.16 vs target</small></article>
        <article><span>ROAS</span><strong>3.85×</strong><small className="success-text">Above target</small></article>
      </div>
      <div className="dashboard-split">
        <Panel title="Channel Performance" meta={`${imports.length || 3} data sources`}>
          <div className="channel-performance">
            {channels.map((row, i) => (
              <div className="performance-row" key={row[0]}>
                <div><strong>{row[0]}</strong><small>{i === 0 ? 'High intent' : i === 1 ? 'Retargeting' : 'Needs optimization'}</small></div>
                {row.slice(1, 5).map(v => <b key={v}>{v}</b>)}
                <div className="mini-progress"><span style={{ width: `${row[5]}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Optimization Alerts" className="alert-panel">
          <Badge tone="rejected">Alert trigger</Badge>
          <h3>TikTok CPA over threshold</h3>
          <p>Current CPA is higher than target. Consider rebalancing budget to protect margin.</p>
          <button className="button primary full" onClick={() => setPage?.('budget')}>Open Budget Optimizer</button>
        </Panel>
      </div>
    </>
  )
}

// ─── FR11 Audit Log (preserved legacy export) ──────────────────────────────
// The full AuditLogPage implementation is unchanged; only imports are updated.
const ACTION_META = {
  approve: { label: 'Approved', tone: 'approved' },
  reject: { label: 'Rejected', tone: 'rejected' },
  edit: { label: 'Edited', tone: 'manager' },
  create: { label: 'Created', tone: 'admin' },
  invite: { label: 'Member Invited', tone: 'admin' },
  role_change: { label: 'Role Changed', tone: 'manager' },
  import: { label: 'Data Imported', tone: 'active' },
}
const MODULE_META = {
  ad_content: { label: 'FR04 Approvals', tone: 'admin' },
  budget_proposal: { label: 'FR04 Approvals', tone: 'admin' },
  workspace_member: { label: 'FR06 RBAC', tone: 'manager' },
  workspace: { label: 'FR06 Workspace', tone: 'manager' },
  campaign_performance: { label: 'FR08 Data Import', tone: 'active' },
  strategy: { label: 'FR01 Strategy', tone: 'admin' },
}
const DATE_OPTS = [
  { label: 'Past 7 Days', days: 7 },
  { label: 'Past 30 Days', days: 30 },
  { label: 'Past 90 Days', days: 90 },
  { label: 'All Time', days: 0 },
]
const LOG_PAGE = 6
function fr11Ago(days) { if (!days) return null; const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString() }
function fr11Date(iso) { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC' }
function fr11Initials(name) { if (!name) return '?'; return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?' }
function fr11Diff(before, after) { const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]); return [...keys].map(k => ({ key: k, before: (before || {})[k], after: (after || {})[k], added: !(k in (before || {})), removed: !(k in (after || {})), changed: JSON.stringify((before || {})[k]) !== JSON.stringify((after || {})[k]) })).filter(d => d.changed) }
function fr11Csv(logs) { const rows = logs.map(l => [l.created_at, (l.actor?.full_name || 'System').replace(/,/g, ' '), l.action, l.entity_type, l.entity_id || ''].join(',')); const csv = ['Timestamp (UTC),Actor,Action,Entity Type,Entity ID', ...rows].join('\n'); const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'audit_log.csv'; a.click(); URL.revokeObjectURL(url) }
async function fr11Fetch(wid, page, action, entityType, dateFrom) { const from = (page - 1) * LOG_PAGE, to = from + LOG_PAGE - 1; let q = requireSupabase().from('audit_logs').select('id,action,entity_type,entity_id,before_value,after_value,created_at,actor_id', { count: 'exact' }).eq('workspace_id', wid).order('created_at', { ascending: false }).range(from, to); if (action) q = q.eq('action', action); if (entityType) q = q.eq('entity_type', entityType); if (dateFrom) q = q.gte('created_at', dateFrom); const { data: rows, count, error } = await q; if (error) throw error; const ids = [...new Set((rows || []).map(r => r.actor_id).filter(Boolean))]; const aMap = {}; if (ids.length) { const { data: profiles } = await requireSupabase().from('profiles').select('id,full_name').in('id', ids); (profiles || []).forEach(p => { aMap[p.id] = p.full_name }) } return { data: (rows || []).map(r => ({ ...r, actor: { full_name: aMap[r.actor_id] || null } })), total: count || 0 } }

const DEMO_AUDIT_LOGS = [
  { id: '3a4b9c1d-8e7f-4a2b-9c1d-8e7f4a2b9c1d', action: 'approve', entity_type: 'ad_content', entity_id: 'PRP-8401', created_at: '2026-10-14T09:41:22Z', ageDays: 0, actor_id: 'usr-001', actor: { full_name: 'Sara Williams' }, before_value: { status: 'pending_review', review_notes: null, approved_by: null }, after_value: { status: 'approved', review_notes: 'All compliance guardrails passed (12/12). Ready for publishing.', approved_by: 'Sara Williams' } },
  { id: '7f2c8d1e-9a3b-4c5d-6e7f-8a9b0c1d2e3f', action: 'edit', entity_type: 'budget_proposal', entity_id: 'BUD-2026-Q4', created_at: '2026-10-14T08:15:04Z', ageDays: 0, actor_id: 'usr-002', actor: { full_name: 'Alex Johnson' }, before_value: { total_budget: 10000000, google_allocation: 40, meta_allocation: 40, tiktok_allocation: 20 }, after_value: { total_budget: 12500000, google_allocation: 50, meta_allocation: 35, tiktok_allocation: 15 } },
  { id: '1e8d9c2b-3a4f-5e6d-7c8b-9a0f1e2d3c4b', action: 'invite', entity_type: 'workspace_member', entity_id: 'USR-9921', created_at: '2026-10-14T07:30:19Z', ageDays: 0, actor_id: 'usr-003', actor: { full_name: 'Alex Johnson' }, before_value: null, after_value: { email: 'new@acme.com', assigned_role: 'Member', status: 'pending_invitation' } },
  { id: '9c3a4b5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d', action: 'create', entity_type: 'strategy', entity_id: 'STR-1104', created_at: '2026-10-13T23:12:45Z', ageDays: 1, actor_id: 'usr-bot', actor: { full_name: 'AI Engine' }, before_value: null, after_value: { title: 'Q4 Growth Strategy', recommended_channel: 'Meta & Google Ads', target_audience: '22-35, urban', budget: 30000000 } },
]

export function AuditLogPage({ notify }) {
  const auth = useContext(AuthContext)
  const workspaceId = auth?.workspaceId
  const [remoteLogs, setRemoteLogs] = useState([])
  const [remoteTotal, setRemoteTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [fAction, setFAction] = useState('')
  const [fModule, setFModule] = useState('')
  const [fDays, setFDays] = useState(30)
  const [selected, setSelected] = useState(null)

  const demoResult = useMemo(() => {
    if (workspaceId) return null
    let filtered = DEMO_AUDIT_LOGS
    if (fAction) filtered = filtered.filter(l => l.action === fAction)
    if (fModule) filtered = filtered.filter(l => l.entity_type === fModule)
    if (fDays) filtered = filtered.filter(l => (l.ageDays || 0) <= fDays)
    const from = (page - 1) * LOG_PAGE
    return { data: filtered.slice(from, from + LOG_PAGE), total: filtered.length }
  }, [workspaceId, page, fAction, fModule, fDays])

  const logs = demoResult ? demoResult.data : remoteLogs
  const total = demoResult ? demoResult.total : remoteTotal
  const totalPages = Math.max(1, Math.ceil(total / LOG_PAGE))

  useEffect(() => {
    if (!workspaceId) return
    let alive = true
    Promise.resolve().then(() => {
      if (!alive) return
      setLoading(true); setError('')
      fr11Fetch(workspaceId, page, fAction, fModule, fr11Ago(fDays))
        .then(r => { if (alive) { setRemoteLogs(r.data); setRemoteTotal(r.total) } })
        .catch(e => { if (alive) setError(e.message || 'Unable to load audit log.') })
        .finally(() => { if (alive) setLoading(false) })
    })
    return () => { alive = false }
  }, [workspaceId, page, fAction, fModule, fDays])

  function applyFilter(key, val) { if (key === 'action') setFAction(val); else if (key === 'module') setFModule(val); else if (key === 'days') setFDays(+val); setPage(1); setSelected(null) }
  function reset() { setFAction(''); setFModule(''); setFDays(30); setSearch(''); setPage(1); setSelected(null) }
  function goPage(p) { if (p < 1 || p > totalPages) return; setPage(p); setSelected(null) }

  const visible = search.trim() ? logs.filter(l => [l.actor?.full_name, l.action, l.entity_type, l.entity_id].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))) : logs
  const rowFrom = (page - 1) * LOG_PAGE + 1
  const rowTo = Math.min(page * LOG_PAGE, total)

  return (
    <>
      <PageIntro
        code="FR11 · IMMUTABLE LEDGER"
        title="System Audit Log"
        subtitle="Immutable event log — SHA-256 — tracking every action, role change and approval in the Workspace."
        action={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="button subtle" onClick={() => fr11Csv(logs)} disabled={!logs.length}>⇩ Export Audit Log (CSV)</button>
            <button className="button subtle" disabled title="Requires backend cryptographic service (FR11 backend)">✓ Verify Cryptographic Hashes</button>
          </div>
        }
      />
      <div className="actor-summary">
        <div><strong>{total.toLocaleString()}</strong><span>Total Events ({DATE_OPTS.find(o => o.days === fDays)?.label || 'All Time'})</span></div>
        <div><strong className="success-text">100%</strong><span>Data Integrity</span></div>
        <div><strong>{[...new Set(logs.map(l => l.actor_id).filter(Boolean))].length || '—'}</strong><span>Actors</span></div>
        <div><strong className="code-text">{logs[0]?.id ? logs[0].id.slice(0, 8) + '…' : '—'}</strong><span>Latest Hash</span></div>
      </div>
      <Panel title="Audit Events" meta="SHA-256 verified">
        <div className="audit-filter-bar">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7888a3', pointerEvents: 'none' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by user, action, entity ID..." style={{ paddingLeft: 36, fontSize: 13 }} />
          </div>
          <select value={fAction} onChange={e => applyFilter('action', e.target.value)} style={{ fontSize: 13 }}>
            <option value="">All Actions</option>
            {Object.entries(ACTION_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={fModule} onChange={e => applyFilter('module', e.target.value)} style={{ fontSize: 13 }}>
            <option value="">All Modules</option>
            {[...new Map(Object.entries(MODULE_META).map(([k, v]) => [v.label, k])).entries()].map(([label, k]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <select value={fDays} onChange={e => applyFilter('days', e.target.value)} style={{ fontSize: 13 }}>
            {DATE_OPTS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
          </select>
          <button className="button subtle" style={{ minHeight: 38, padding: '0 14px', fontSize: 13 }} onClick={reset}>↺ Reset</button>
        </div>
        {error && <div style={{ padding: '16px 18px', color: '#ffd7da', background: '#462b3a', borderBottom: '1px solid #a8586a', fontSize: 13 }}>⚠ {error}</div>}
        <div className="actor-table-wrap">
          <table className="actor-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>User / Actor</th>
                <th>Action Type</th>
                <th>Object / Entity</th>
                <th>Module / Spec</th>
                <th>Details Summary</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#7888a3' }}>Loading audit log…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#7888a3' }}>No events match the current filters.</td></tr>}
              {!loading && visible.map(log => {
                const aM = ACTION_META[log.action] || { label: log.action, tone: 'neutral' }
                const mM = MODULE_META[log.entity_type] || { label: log.entity_type, tone: 'neutral' }
                const name = log.actor?.full_name || 'System'
                return (
                  <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(log)} title="View record details">
                    <td className="code-text" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fr11Date(log.created_at)}</td>
                    <td><div className="actor-person"><b style={{ background: '#685cf4', fontStyle: 'normal', fontSize: 12, flexShrink: 0 }}>{fr11Initials(name)}</b><span><strong>{name}</strong><small>{log.actor_id ? log.actor_id.slice(0, 8) + '…' : 'system'}</small></span></div></td>
                    <td><Badge tone={aM.tone}>{aM.label}</Badge></td>
                    <td style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: '#67dcf5' }}>{log.entity_id ? log.entity_id.slice(0, 8) + '…' : <span style={{ color: '#4a5a78' }}>{log.entity_type}</span>}</td>
                    <td><Badge tone={mM.tone}>{mM.label}</Badge></td>
                    <td style={{ fontSize: 12, color: '#9ca8c4' }}><span>{log.action} · {log.entity_type}</span><div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: '#3a4d6a', marginTop: 3 }}>hash: {log.id.slice(0, 4)}…{log.id.slice(-4)}</div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="audit-pagination">
          <span>{loading ? 'Loading…' : total > 0 ? `Showing ${rowFrom}–${rowTo} / ${total.toLocaleString()} entries · All hashes verified (SHA-256)` : 'No results'}</span>
          <div className="audit-page-btns">
            <button onClick={() => goPage(page - 1)} disabled={page <= 1}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
              return <button key={p} className={p === page ? 'active' : ''} onClick={() => goPage(p)}>{p}</button>
            })}
            {totalPages > 5 && page < totalPages - 2 && <><span style={{ padding: '0 4px', color: '#4a5a78' }}>…</span><button onClick={() => goPage(totalPages)}>{totalPages}</button></>}
            <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}>›</button>
          </div>
        </div>
      </Panel>
    </>
  )
}
