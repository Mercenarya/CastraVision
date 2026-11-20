import { useLanguage } from '@/hooks/useLanguage'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useEmployeeTasks } from '../../hooks/useEmployeeTasks'
import { useWorkflowAction } from '../../hooks/useLeaderWorkflow'
import { employeeTasks } from '../../services/employeeTasks'
import WorkflowPanel from '../../leader/components/WorkflowPanel'

const field = 'block w-full rounded-lg border border-border bg-background p-2'
export default function TaskAssignmentForm({ campaigns, campaignId, onCreated, onCancel }) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState({ campaignId: campaignId || '', assigneeId: '', title: '', description: '', dueAt: '' })
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const candidates = useEmployeeTasks('candidates', { campaignId: draft.campaignId }, 0, Boolean(draft.campaignId))
  const action = useWorkflowAction()
  function change(key, value) { setDraft(current => ({ ...current, [key]: value, ...(key === 'campaignId' ? { assigneeId: '' } : {}) })); setRequestId(crypto.randomUUID()) }
  async function submit(event) {
    event.preventDefault()
    const result = await action.run(() => employeeTasks('create', { ...draft, dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null, requestId }))
    if (result) onCreated(result.id)
  }
  return <WorkflowPanel title={t('employeeFlow.assignTask')} action={action}><form className="space-y-3" onSubmit={submit}>
    <label className="block">{t('employeeFlow.assignCampaign')}<select className={field} required disabled={action.busy} value={draft.campaignId} onChange={event => change('campaignId', event.target.value)}><option value="">{t('employeeFlow.chooseCampaign')}</option>{campaigns.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    {candidates.loading && <p role="status">{t('employeeFlow.loadingAssignees')}</p>}{candidates.error && <p role="alert">{candidates.error}<Button type="button" variant="outline" onClick={candidates.reload}>{t('employeeFlow.retry')}</Button></p>}
    <label className="block">{t('employeeFlow.assignee')}<select className={field} required disabled={action.busy || candidates.loading || !draft.campaignId} value={draft.assigneeId} onChange={event => change('assigneeId', event.target.value)}><option value="">{t('employeeFlow.chooseEmployee')}</option>{candidates.data?.items?.map(item => <option key={item.id} value={item.id}>{item.name} · {item.id.slice(0, 8)}</option>)}</select></label>
    {draft.campaignId && candidates.data?.items?.length === 0 && <p>{t('employeeFlow.noAssignee')}</p>}
    <label className="block">{t('employeeFlow.taskName')}<input className={field} required maxLength={120} value={draft.title} onChange={event => change('title', event.target.value)} /></label>
    <label className="block">{t('employeeFlow.description')}<textarea className={field} maxLength={4000} value={draft.description} onChange={event => change('description', event.target.value)} /></label>
    <label className="block">{t('employeeFlow.deadlineOptional')}<input className={field} type="datetime-local" value={draft.dueAt} onChange={event => change('dueAt', event.target.value)} /></label>
    <p className="text-sm text-muted-foreground">{t('employeeFlow.taskApprovalNotice')}</p>
    <div className="flex gap-3"><Button disabled={action.busy || !draft.assigneeId}>{t('employeeFlow.assign')}</Button><Button type="button" variant="outline" disabled={action.busy} onClick={onCancel}>{t('employeeFlow.cancel')}</Button></div>
  </form></WorkflowPanel>
}
