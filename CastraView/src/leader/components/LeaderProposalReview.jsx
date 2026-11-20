import { useLanguage } from '@/hooks/useLanguage'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from './WorkflowPanel'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { workflow } from '../../services/leaderWorkflow'
import { budgetExceedsLimit, money } from '../../services/leaderWorkflowContract'

const field = 'w-full rounded-lg border border-border bg-background p-3 text-sm'

export default function LeaderProposalReview({ id, onBack, onChanged, context }) {
  const { t, language } = useLanguage()
  const query = useWorkflowQuery('proposal', { id })
  const [editedDraft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [history, setHistory] = useState(false)
  const [decision, setDecision] = useState('')
  const [note, setNote] = useState('')
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const action = useWorkflowAction(async () => { query.reload(); await onChanged?.() })
  const proposal = query.data
  const draft = editedDraft || proposal?.payload
  const own = proposal?.created_by === context.actor.id
  const reviewer = context.role === 'admin' || context.role === 'manager'
  const reviewable = proposal && ['pending', 'escalated'].includes(proposal.status) && (proposal.status !== 'escalated' || context.role === 'admin')
  const threshold = proposal?.target_type === 'budget_proposal' && budgetExceedsLimit(proposal.payload.allocations)
  const canApprove = reviewable && reviewer && (!own || context.role === 'admin' && proposal.target_type === 'strategy') && !(threshold && context.role === 'manager')
  const canEdit = proposal && ['draft', 'pending', 'revision_requested'].includes(proposal.status) && (own || reviewer) && (proposal.status !== 'revision_requested' || own || context.role === 'admin')
  async function save(event) {
    event.preventDefault()
    const result = await action.run(() => workflow('revise', { id, payload: draft, expectedVersion: proposal.version, note: t('employeeFlow.reviseNote') }))
    if (result) { setEditing(false); setDraft(null) }
  }
  async function decide(event) {
    event.preventDefault()
    const result = await action.run(() => workflow('decide', { id, decision, expectedVersion: proposal.version, note, requestId }))
    if (result) { setDecision(''); setNote(''); setDraft(null); setRequestId(crypto.randomUUID()) }
  }
  function choose(value) { setDecision(value); setNote(''); setRequestId(crypto.randomUUID()); action.clearError() }
  function change(key, value) { setDraft({ ...draft, [key]: value }) }
  return <div className="space-y-5 p-6">
    <Button variant="outline" onClick={onBack}>{t('employeeFlow.backQueue')}</Button>
    <WorkflowPanel title={t('employeeFlow.reviewTitle')} query={query} action={action}>
      {proposal && draft && <>
        <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{proposal.title}</h1><p>{t('employeeFlow.kind.' + proposal.target_type)} · {t('employeeFlow.status.' + proposal.status)} · v{proposal.version}</p><p className="text-xs text-muted-foreground">{proposal.id}</p></div><Button variant="outline" onClick={() => setHistory(x => !x)}>{t('employeeFlow.history')}</Button></header>
        {history && <div className="space-y-3 rounded-lg border border-border p-4"><h2 className="font-bold">{t('employeeFlow.versionHistory')}</h2>{proposal.history.map(r => <article key={r.id} className="border-t border-border pt-2"><p>v{r.version} · {r.operation} · {r.actor_name} · {new Date(r.created_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</p><p className="text-sm text-muted-foreground">{r.note}</p><details><summary>{t('employeeFlow.versionContent')}</summary><pre className="overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify(r.payload, null, 2)}</pre></details></article>)}</div>}
        {threshold && <p role="status" className="rounded-lg bg-warning/15 p-3 text-warning">{t('employeeFlow.budgetThreshold')}</p>}
        <form onSubmit={save} className="space-y-4">
          {proposal.target_type === 'ad_content' && <>{[['hook', t('employeeFlow.hook'), 500], ['headline', t('employeeFlow.headline'), 60], ['body', t('employeeFlow.body'), 4000], ['cta', t('employeeFlow.cta'), 80]].map(([key, label, max]) => <label className="block" key={key}>{label}{editing ? <textarea required minLength={key === 'hook' ? 10 : 1} maxLength={max} className={field} value={draft[key] || ''} onChange={e => change(key, e.target.value)} /> : <p className="mt-1 whitespace-pre-wrap rounded-lg border border-border p-3">{draft[key]}</p>}</label>)}<p>{t('employeeFlow.channels')}: {draft.channel}</p><p className="text-sm text-muted-foreground">{t('employeeFlow.contentSource')}: {draft.source === 'template' ? t('employeeFlow.templateSource') : t('employeeFlow.manualSource')}</p></>}
          {proposal.target_type === 'budget_proposal' && <><h2 className="font-bold">{t('employeeFlow.monthlyBudget')}: {money(draft.totalBudget, proposal.campaign?.currency, language === 'vi' ? 'vi-VN' : 'en-US')}</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>{t('employeeFlow.channels')}</th><th>{t('employeeFlow.current')}</th><th>{t('employeeFlow.proposed')}</th></tr></thead><tbody>{draft.allocations?.map((a, i) => <tr key={a.channel} className="border-t border-border"><td className="py-3">{a.channel}</td><td>{money(a.current, proposal.campaign?.currency, language === 'vi' ? 'vi-VN' : 'en-US')}</td><td>{editing ? <input aria-label={t('employeeFlow.allocation') + ' ' + a.channel} required type="number" min="0" max="1000000000" step="0.01" className={field} value={a.proposed} onChange={e => change('allocations', draft.allocations.map((x, n) => n === i ? { ...x, proposed: Number(e.target.value) } : x))} /> : money(a.proposed, proposal.campaign?.currency, language === 'vi' ? 'vi-VN' : 'en-US')}</td></tr>)}</tbody></table></div><p>{t('employeeFlow.proposedTotal')}: {money(draft.allocations?.reduce((n, a) => n + Number(a.proposed), 0), proposal.campaign?.currency, language === 'vi' ? 'vi-VN' : 'en-US')}</p></>}
          {proposal.target_type === 'strategy' && <><p className="rounded-lg bg-info/10 p-3 text-info">{t('employeeFlow.source')}: {draft.provider === 'openai' ? t('employeeFlow.aiProvider') : t('employeeFlow.fallback')} · {draft.warning || t('employeeFlow.noProviderWarning')}</p><p>{draft.strategy?.message}</p><p>{draft.strategy?.rationale}</p>{draft.strategy?.budget_allocation?.map(a => <p key={a.channel}>{a.channel}: {a.percentage}%</p>)}</>}
          {proposal.target_type === 'pause_variant' && <p>{t('employeeFlow.pauseNotice', {id: draft.variantId})}</p>}
          {canEdit && proposal.target_type !== 'strategy' && proposal.target_type !== 'pause_variant' && <div className="flex gap-2">{editing ? <><Button disabled={action.busy}>{t('employeeFlow.saveChanges')}</Button><Button type="button" variant="outline" onClick={() => { setDraft(structuredClone(proposal.payload)); setEditing(false) }}>{t('employeeFlow.cancelEdit')}</Button></> : <Button type="button" variant="outline" onClick={() => setEditing(true)}>{proposal.target_type === 'budget_proposal' ? t('employeeFlow.editAllocation') : t('employeeFlow.editCopy')}</Button>}</div>}
        </form>
        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          {own && ['draft', 'revision_requested'].includes(proposal.status) && <Button disabled={action.busy} onClick={() => choose('submit')}>{t('employeeFlow.submitReview')}</Button>}
          {reviewable && reviewer && <><Button disabled={action.busy || !canApprove} onClick={() => choose('approve')}>{t('employeeFlow.approve')}</Button><Button variant="outline" disabled={action.busy} onClick={() => choose('revision')}>{t('employeeFlow.requestRevision')}</Button><Button variant="destructive" disabled={action.busy} onClick={() => choose('reject')}>{t('employeeFlow.reject')}</Button>{context.role === 'manager' && <Button variant="outline" disabled={action.busy} onClick={() => choose('escalate')}>{t('employeeFlow.escalate')}</Button>}</>}
        </div>
        {own && reviewer && <p className="text-sm text-muted-foreground">{t('employeeFlow.selfApprovalNotice')}</p>}
        <p className="text-sm text-muted-foreground">{t('employeeFlow.approvalNotice')}</p>
      </>}
    </WorkflowPanel>
    {decision && <div role="dialog" aria-modal="true" aria-label={t('employeeFlow.confirmDecision')} className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4"><form onSubmit={decide} className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-6"><h2 className="text-xl font-bold">{t('employeeFlow.confirm')}: {t('employeeFlow.' + ({submit:'submitReview',approve:'approve',revision:'requestRevision',reject:'reject',escalate:'escalate'}[decision] || 'confirm'))}</h2>{!['approve', 'submit'].includes(decision) && <label className="block">{t('employeeFlow.reason')}<textarea required minLength={3} maxLength={2000} className={field} value={note} onChange={e => setNote(e.target.value)} /></label>}{action.error && <p role="alert" className="text-destructive">{action.error}</p>}<div className="flex gap-3"><Button disabled={action.busy}>{t('employeeFlow.confirm')}</Button><Button type="button" variant="outline" disabled={action.busy} onClick={() => setDecision('')}>{t('employeeFlow.cancel')}</Button></div></form></div>}
  </div>
}
