import { useLanguage } from '@/hooks/useLanguage'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '../auth/AuthContext'
import { useEmployeeTasks } from '../hooks/useEmployeeTasks'
import { useWorkflowQuery } from '../hooks/useLeaderWorkflow'
import WorkflowPanel from '../leader/components/WorkflowPanel'
import TaskAssignmentForm from './components/TaskAssignmentForm'
import TaskDetail from './components/TaskDetail'
import { TASK_LABELS } from '../services/employeeTasks'

function TaskBoardBody({ operator = false, campaignId = '', initialId = null, onOpenProposal }) {
  const { t, language } = useLanguage()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [campaign, setCampaign] = useState(campaignId)
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [selected, setSelected] = useState(initialId)
  const [creating, setCreating] = useState(false)
  const campaigns = useWorkflowQuery('campaigns', { limit: 100 })
  const query = useEmployeeTasks('list', { search, status, campaignId: campaign, limit: 10, offset: page * 10 }, revision)
  const changed = () => setRevision(value => value + 1)
  if (selected) return <TaskDetail key={selected} id={selected} operator={operator} onBack={() => { setSelected(null); changed() }} onChanged={changed} onOpenProposal={onOpenProposal} />
  if (creating) return <TaskAssignmentForm campaignId={campaign} campaigns={campaigns.data?.items || []} onCreated={id => { setCreating(false); setSelected(id); changed() }} onCancel={() => setCreating(false)} />
  return <div className="space-y-4"><header className="flex items-center justify-between gap-3"><h1 className="text-xl font-bold">{operator ? t('employeeFlow.assignInTeam') : t('employeeFlow.taskTitle')}</h1>{operator && <Button disabled={!campaigns.data?.items?.length} onClick={() => setCreating(true)}>{t('employeeFlow.assignTask')}</Button>}</header>
    <div className="flex flex-wrap gap-3"><label>{t('employeeFlow.searchTask')}<input className="block rounded border border-border bg-background p-2" value={search} onChange={event => { setSearch(event.target.value); setPage(0) }} /></label><label>{t('employeeFlow.filterStatus')}<select className="block rounded border border-border bg-background p-2" value={status} onChange={event => { setStatus(event.target.value); setPage(0) }}><option value="">{t('employeeFlow.allStatuses')}</option>{Object.keys(TASK_LABELS).map(value => <option key={value} value={value}>{t('employeeFlow.status.' + value)}</option>)}</select></label><label>{t('employeeFlow.filterCampaign')}<select className="block rounded border border-border bg-background p-2" value={campaign} onChange={event => { setCampaign(event.target.value); setPage(0) }}><option value="">{t('employeeFlow.allCampaigns')}</option>{campaigns.data?.items?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><Button variant="outline" onClick={changed}>{t('employeeFlow.refreshTasks')}</Button></div>
    {campaigns.error && <p role="alert">{campaigns.error}<Button variant="outline" onClick={campaigns.reload}>{t('employeeFlow.retry')}</Button></p>}
    {campaigns.data?.total > 100 && <p className="text-sm text-muted-foreground">{t('employeeFlow.campaignLimit')}</p>}
    <WorkflowPanel query={query}>{!query.data?.items?.length && <p>{t('employeeFlow.noTasks')}</p>}{query.data?.items?.map(task => <article key={task.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"><div><h2 className="font-semibold">{task.title}</h2><p>{t('employeeFlow.status.' + task.status)} · {task.campaign_name}</p><p className="text-sm text-muted-foreground">{task.assignee_name} · {task.due_at ? new Date(task.due_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : t('employeeFlow.noDeadline')}</p></div><Button variant="outline" onClick={() => setSelected(task.id)}>{t('employeeFlow.openTask')}</Button></article>)}<div className="flex items-center justify-between"><span>{t('employeeFlow.taskTotal', { total: query.data?.total ?? 0, page: page + 1 })}</span><div className="flex gap-2"><Button variant="outline" disabled={!page} onClick={() => setPage(value => value - 1)}>{t('employeeFlow.previous')}</Button><Button variant="outline" disabled={(page + 1) * 10 >= (query.data?.total ?? 0)} onClick={() => setPage(value => value + 1)}>{t('employeeFlow.next')}</Button></div></div></WorkflowPanel>
  </div>
}

export default function TaskBoard(props) {
  const auth = useAuth()
  return <TaskBoardBody key={`${auth.user?.id}:${auth.workspaceId}`} {...props} />
}
