import { useLanguage } from '@/hooks/useLanguage'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from '../../leader/components/WorkflowPanel'
import { useEmployeeTasks } from '../../hooks/useEmployeeTasks'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { employeeTasks, TASK_STATUSES } from '../../services/employeeTasks'

const field = 'block w-full rounded-lg border border-border bg-background p-2'
function TaskEditor({ task, operator, onSaved, onOpenProposal }) {
  const { t, language } = useLanguage()
  const [status, setStatus] = useState(task.status)
  const [proposalId, setProposalId] = useState(task.proposal_id || '')
  const proposals = useWorkflowQuery('proposals', { mine: true, limit: 100 })
  const action = useWorkflowAction()
  const options = [...TASK_STATUSES, ...(operator ? ['cancelled'] : [])].filter(value => task.status !== 'completed' || ['completed', 'in_progress', 'cancelled'].includes(value))
  async function submit(event) {
    event.preventDefault()
    const result = await action.run(() => employeeTasks('update', { id: task.id, expectedVersion: task.version, status, ...(!operator && proposalId !== (task.proposal_id || '') ? { proposalId: proposalId || null } : {}) }))
    if (result) onSaved()
  }
  return <WorkflowPanel action={action}><form className="space-y-4" onSubmit={submit}>
    <p>{t('employeeFlow.employee')}: {task.assignee_name} · {t('employeeFlow.assignedBy')}: {task.assigned_by_name}</p><p>{t('employeeFlow.campaign')}: {task.campaign_name} · {t('employeeFlow.team')}: {task.team_name}</p><p className="whitespace-pre-wrap">{task.description}</p><p>{t('employeeFlow.deadline')}: {task.due_at ? new Date(task.due_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : t('employeeFlow.noDeadline')}</p>
    <label>{t('employeeFlow.taskStatus')}<select className={field} value={status} disabled={action.busy || task.status === 'cancelled'} onChange={event => setStatus(event.target.value)}>{task.status === 'cancelled' ? <option value="cancelled">{t('employeeFlow.status.cancelled')}</option> : options.map(value => <option key={value} value={value}>{t('employeeFlow.status.' + value)}</option>)}</select></label>
    {!operator && <label>{t('employeeFlow.linkProposal')}<select aria-label={t('employeeFlow.linkProposal')} className={field} value={proposalId} disabled={action.busy || task.status === 'cancelled'} onChange={event => setProposalId(event.target.value)}><option value="">{t('employeeFlow.noLink')}</option>{task.proposal_id && !proposals.data?.items?.some(item => item.id === task.proposal_id) && <option value={task.proposal_id}>{t('employeeFlow.existingLink')}</option>}{proposals.data?.items?.filter(item => item.campaign_id === task.campaign_id).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>{proposals.error && <span role="alert">{proposals.error}</span>}<span className="text-sm text-muted-foreground">{t('employeeFlow.proposalLimit')}</span></label>}
    {task.proposal_id && onOpenProposal && <Button type="button" variant="outline" onClick={() => onOpenProposal(task.proposal_id)}>{t('employeeFlow.openLinked')}</Button>}
    <p className="text-sm text-muted-foreground">{t('employeeFlow.taskNotApproval')}</p>
    <Button disabled={action.busy || task.status === 'cancelled'}>{t('employeeFlow.saveTask')}</Button>
  </form></WorkflowPanel>
}

export default function TaskDetail({ id, operator, onBack, onChanged, onOpenProposal }) {
  const { t } = useLanguage()
  const query = useEmployeeTasks('task', { id })
  return <WorkflowPanel title={query.data?.title || t('employeeFlow.taskDetail')} query={query}><div className="flex gap-3"><Button variant="outline" onClick={onBack}>{t('employeeFlow.backList')}</Button><Button variant="outline" onClick={query.reload}>{t('employeeFlow.reload')}</Button></div>{query.data && <TaskEditor key={`${query.data.id}:${query.data.version}`} task={query.data} operator={operator} onSaved={() => { query.reload(); onChanged() }} onOpenProposal={onOpenProposal} />}</WorkflowPanel>
}
