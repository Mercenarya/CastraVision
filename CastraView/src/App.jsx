import { useEffect, useState } from 'react'
import Brand from '@/components/Brand'
import Notice from '@/components/Notice'
import Toast from '@/components/Toast'
import AppShell from '@/layouts/AppShell'
import AuthPage from '@/pages/AuthPage'
import ContentPage from '@/pages/ContentPage'
import ImportPage from '@/pages/ImportPage'
import OverviewPage from '@/pages/OverviewPage'
import ProfilePage from '@/pages/ProfilePage'
import StrategyPage from '@/pages/StrategyPage'
import BudgetOptimizationPage from '@/pages/BudgetOptimizationPage'
import CompetitorInsightsPage from '@/pages/CompetitorInsightsPage'
import RecommendationReviewPage from '@/pages/RecommendationReviewPage'
import ReportsPage from '@/pages/ReportsPage'
import ManagerDashboard from '@/pages/dashboards/ManagerDashboard'
import { api } from '@/services/api'

function App() {
  const [ready, setReady] = useState(false)
  const [backendError, setBackendError] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('overview')
  const [imports, setImports] = useState([])
  const [latestRows, setLatestRows] = useState([])
  const [strategy, setStrategy] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  async function refreshData() {
    const [business, history] = await Promise.all([api('business-profile/'), api('campaign-imports/')])
    setProfile(business.profile)
    setImports(history.imports)
    setLatestRows(history.latest_rows)
    setPage(business.profile ? 'overview' : 'onboarding')
  }

  useEffect(() => {
    async function boot() {
      try {
        await api('auth/csrf/')
        const session = await api('auth/session/')
        if (session.user) {
          setUser(session.user)
          await refreshData()
        }
      } catch (cause) {
        setBackendError(cause.message)
      } finally {
        setReady(true)
      }
    }
    boot()
  }, [])

  async function handleAuth(account) {
    setUser(account)
    setBackendError('')
    try {
      await refreshData()
    } catch (cause) {
      setBackendError(cause.message)
    }
  }

  async function saveProfile(draft) {
    setBusy(true)
    setError('')
    try {
      const data = await api('business-profile/', { method: 'PUT', body: JSON.stringify(draft) })
      setProfile(data.profile)
      setPage('overview')
      setToast('Hồ sơ doanh nghiệp đã được lưu.')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    try {
      await api('auth/logout/', { method: 'POST' })
    } finally {
      setUser(null)
      setProfile(null)
      setStrategy(null)
      setPage('overview')
    }
  }

  async function onImported() {
    const data = await api('campaign-imports/')
    setImports(data.imports)
    setLatestRows(data.latest_rows)
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-content-center justify-items-center gap-6 text-center text-muted-foreground">
        <Brand />
        <span>Đang kết nối không gian làm việc…</span>
      </div>
    )
  }
  if (!user) return <AuthPage mode={authMode} setMode={setAuthMode} onAuth={handleAuth} backendError={backendError} />

  const showProfile = !profile || page === 'onboarding' || page === 'profile'
  return (
    <AppShell user={user} profile={profile} page={page} setPage={setPage} logout={logout}>
      {backendError && <Notice>{backendError}</Notice>}
      {showProfile && (
        <ProfilePage
          profile={profile}
          onboarding={!profile}
          saveProfile={saveProfile}
          busy={busy}
          error={error}
          cancel={profile ? () => setPage('overview') : logout}
        />
      )}
      {profile && page === 'overview' && <ManagerDashboard setPage={setPage} imports={imports} />}
      {profile && page === 'budget' && <BudgetOptimizationPage notify={setToast} setPage={setPage} />}
      {profile && page === 'budget-review' && <RecommendationReviewPage setPage={setPage} notify={setToast} />}
      {profile && page === 'reports' && <ReportsPage profile={profile} notify={setToast} />}
      {profile && page === 'insights' && <CompetitorInsightsPage notify={setToast} />}
      {profile && page === 'import' && <ImportPage imports={imports} onImported={onImported} notify={setToast} />}
      {profile && page === 'strategy' && (
        <StrategyPage profile={profile} latestRows={latestRows} result={strategy} setResult={setStrategy} notify={setToast} />
      )}
      {profile && page === 'content' && <ContentPage result={strategy} profile={profile} setPage={setPage} notify={setToast} />}
      {profile && page === 'old-overview' && <OverviewPage profile={profile} imports={imports} strategy={strategy} setPage={setPage} />}
      <Toast message={toast} clear={() => setToast('')} />
    </AppShell>
  )
}

export default App
