import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/useLanguage'

export function MemberDashboardView({ data, loading, error, onRefresh, onOpenPage, onOpenProposal, onOpenTask }) {
  const { t, language } = useLanguage()
  if (loading) return <p role="status" className="p-6">{t('employeeLive.loading')}</p>
  if (error) return <div role="alert" className="p-6 text-destructive">{error}<Button variant="outline" onClick={onRefresh}>{t('common.refresh')}</Button></div>
  const { context, counts = {}, proposals, campaigns, tasks, tasksError } = data || {}
  return <div className="space-y-6 p-6 text-foreground">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold">{t('employeeLive.welcome', { name: context?.actor?.fullName || t('employeeLive.user') })}</h1><p className="text-muted-foreground">{context?.workspace?.name || 'Workspace'} · {context?.teams?.map(team => team.name).join(', ') || t('employeeLive.noTeam')}</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={onRefresh}>{t('common.refresh')}</Button><Button onClick={() => onOpenPage?.('content')}>{t('employeeLive.compose')}</Button></div>
    </header>
    <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5" aria-label={t('employeeLive.overview')}>
      {[['activeTasks', tasks?.summary.active], ['completedTasks', tasks?.summary.completed]].map(([label, value]) => <article className="rounded-xl border border-border bg-card p-5" key={label}><p className="text-sm text-muted-foreground">{t(`employeeLive.${label}`)}</p><p className="text-3xl font-bold">{value ?? '—'}</p></article>)}
      {[['pending', 'pending'], ['revision', 'revision_requested'], ['approved', 'approved']].map(([label, key]) => <article className="rounded-xl border border-border bg-card p-5" key={key}><p className="text-sm text-muted-foreground">{t(`employeeLive.${label}`)}</p><p className="text-3xl font-bold">{counts[key] ?? '—'}</p></article>)}
    </section>
    <section className="space-y-3 rounded-xl border border-border bg-card p-5"><div className="flex justify-between"><h2 className="font-semibold">{t('employeeLive.priorityTasks')}</h2><Button variant="outline" onClick={() => onOpenPage?.('tasks')}>{t('common.viewAll')}</Button></div>
      {tasksError && <p role="alert" className="text-destructive">{tasksError}<Button variant="outline" onClick={onRefresh}>{t('common.refresh')}</Button></p>}
      {!tasks && !tasksError && <p>{t('employeeLive.tasksUnavailable')}</p>}
      {tasks?.items?.length === 0 && <p>{t('employeeLive.noTasks')}</p>}
      {tasks?.items?.map(task => <article key={task.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"><div><h3 className="font-medium">{task.title}</h3><p className="text-sm text-muted-foreground">{task.campaign_name} · {t('employeeLive.assignedBy')}: {task.assigned_by_name} · {task.due_at ? new Date(task.due_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : t('employeeLive.noDeadline')}</p></div><Button variant="outline" onClick={() => onOpenTask?.(task.id)}>{t('employeeLive.openTask')}</Button></article>)}
    </section>
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-3 rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <div className="flex items-center justify-between"><h2 className="font-semibold">{t('employeeLive.recent')}</h2><Button variant="outline" onClick={() => onOpenPage?.('submissions')}>{t('common.viewAll')}</Button></div>
        {!proposals?.items?.length && <p className="text-muted-foreground">{t('employeeLive.emptyProposals')}</p>}
        {proposals?.items?.map(proposal => <article key={proposal.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"><div><h3 className="font-medium">{proposal.title}</h3><p className="text-sm text-muted-foreground">{proposal.campaign_name} · {t('employeeFlow.status.' + proposal.status)}</p>{proposal.reject_reason && <p className="text-sm">{t('employeeLive.feedback')}: {proposal.reject_reason}</p>}</div><Button variant="outline" onClick={() => onOpenProposal?.(proposal.id)}>{t(proposal.status === 'revision_requested' ? 'employeeLive.editResubmit' : 'employeeLive.viewProposal')}</Button></article>)}
      </section>
      <aside className="space-y-4">
        <section className="space-y-2 rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">{t('employeeLive.compose')}</h2><p className="text-sm text-muted-foreground">{t('employeeLive.composeDescription')}</p><Button variant="outline" onClick={() => onOpenPage?.('content')}>{t('employeeLive.openComposer')}</Button></section>
        <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">{t('employeeLive.sprint')}</h2><p className="text-sm text-muted-foreground">{t('employeeLive.noSprint')}</p></section>
        <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">{t('employeeLive.safety')}</h2><p className="text-sm text-muted-foreground">{t('brandSafety.dashboardDescription')}</p><Button variant="outline" onClick={() => onOpenPage?.('content')}>{t('brandSafety.openComposer')}</Button></section>
      </aside>
    </div>
    <section className="space-y-3 rounded-xl border border-border bg-card p-5"><div className="flex justify-between"><h2 className="font-semibold">{t('employeeLive.campaigns')}</h2><Button variant="outline" onClick={() => onOpenPage?.('assigned-campaigns')}>{t('common.viewAll')}</Button></div>{!campaigns?.items?.length && <p>{t('employeeLive.noCampaigns')}</p>}{campaigns?.items?.map(campaign => <article key={campaign.id} className="border-t border-border py-3"><h3>{campaign.name}</h3><p className="text-sm text-muted-foreground">{campaign.channels?.join(' · ')} · {t('employeeFlow.status.' + campaign.status)}</p></article>)}</section>
  </div>
}
