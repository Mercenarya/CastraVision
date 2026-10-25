import PropTypes from 'prop-types'
import { Bell, ChevronDown, Search, UserRound } from 'lucide-react'
import Brand from '@/components/Brand'
import { cn } from '@/lib/utils'
import { NAV } from '@/utils/constants'

function Dot({ className = 'bg-info' }) {
  return <i className={cn('inline-block size-2 shrink-0 rounded-full', className)} />
}

export default function AppShell({ user, profile, page, setPage, logout, children }) {
  const activePage = page === 'budget-review' ? 'budget' : page
  const current = NAV.find(([key]) => key === activePage)?.[2] || 'Dashboard'
  const workspace = profile?.business_name || 'Acme Corp'

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[255px_minmax(0,1fr)]">
      <aside className="flex flex-col border-r border-border bg-card md:sticky md:top-0 md:h-screen">
        <div className="flex min-h-[63px] items-center justify-between border-b border-border px-4">
          <Brand className="text-[17px]" />
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold text-info">ENT</span>
        </div>
        <div className="mx-2 mt-10 hidden border-t border-transparent px-2 text-[11px] font-bold tracking-[0.08em] text-muted-foreground md:block">
          MARKETING &amp; INTELLIGENCE
        </div>
        <nav aria-label="Primary navigation" className="flex gap-1.5 overflow-x-auto p-2 md:grid md:gap-1 md:overflow-visible md:px-2 md:py-1">
          {NAV.map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPage(key)}
              aria-current={activePage === key ? 'page' : undefined}
              className={cn(
                'flex min-h-[38px] items-center gap-3 rounded-lg px-3 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-primary md:min-h-[44px] md:w-full md:text-[15px]',
                activePage === key && 'bg-muted font-semibold text-primary',
              )}
            >
              <span aria-hidden="true" className="w-5 text-center text-[19px] leading-none text-muted-foreground">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="mx-4 mt-auto mb-4 hidden rounded-lg border border-border bg-muted p-3 md:block">
          <button type="button" onClick={() => setPage('overview')} className="flex w-full items-center justify-between text-left">
            <span>
              <strong className="block text-sm">{workspace}</strong>
              <small className="text-[11px] text-muted-foreground">Enterprise Workspace</small>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </div>
      </aside>

      <div className="min-w-0 bg-background">
        <header className="flex min-h-[63px] items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
          <span className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            CastraVision <span>/</span> {workspace} <span>/</span> <strong className="text-foreground">Marketing Suite</strong>
          </span>
          <div className="hidden min-w-0 flex-1 items-center rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground md:flex md:max-w-[335px]">
            <Search className="mr-2 size-4 shrink-0" />
            <input aria-label="Search campaigns, insights, metrics" className="min-w-0 border-0 bg-transparent p-0 text-xs outline-none" placeholder="Search campaigns, insights, metrics..." />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-[11px] font-semibold text-muted-foreground sm:flex"><Dot /> All systems nominal</span>
            <button type="button" aria-label="Notifications" className="relative text-muted-foreground hover:text-foreground"><Bell className="size-[18px]" /><Dot className="absolute -right-1 -top-1 bg-coral" /></button>
            <button type="button" onClick={logout} className="flex items-center gap-2 text-left" title={`Sign out ${user.email}`}>
              <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><UserRound className="size-4" /></span>
              <span className="hidden text-xs sm:block"><strong className="block">Alex Morgan</strong><small className="text-muted-foreground">Marketing Lead</small></span>
            </button>
          </div>
        </header>
        <div className="mx-auto min-h-[calc(100vh-63px)] w-full max-w-[1400px] px-4 pt-6 pb-14 sm:px-6 lg:px-6 lg:pt-6">
          <div className="sr-only" aria-live="polite">Current section: {current}</div>
          {children}
        </div>
      </div>
    </div>
  )
}

AppShell.propTypes = {
  user: PropTypes.shape({ email: PropTypes.string.isRequired }).isRequired,
  profile: PropTypes.shape({ business_name: PropTypes.string }),
  page: PropTypes.string.isRequired,
  setPage: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  children: PropTypes.node,
}
