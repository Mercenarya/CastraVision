import { useLanguage } from '@/hooks/useLanguage'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from '../../leader/components/WorkflowPanel'
import WorkflowStudio from '../../leader/WorkflowStudio'
import { useWorkflowQuery } from '../../hooks/useLeaderWorkflow'

function ReferenceDetail({ id, onBack }) {
  const { t } = useLanguage()
  const query = useWorkflowQuery('proposal', { id })
  const approved = query.data?.status === 'approved' && query.data?.target_type === 'strategy'
  return <WorkflowPanel title={t('employeeFlow.referenceTitle')} query={query}><Button variant="outline" onClick={onBack}>{t('employeeFlow.back')}</Button>{query.data && (approved ? <><h2 className="text-xl font-bold">{query.data.title}</h2><p>{query.data.payload?.strategy?.message}</p><p>{query.data.payload?.strategy?.rationale}</p><p>{t('employeeFlow.source')}: {query.data.payload?.provider}</p>{query.data.payload?.warning && <p className="text-warning">{query.data.payload.warning}</p>}</> : <p role="alert">{t('employeeFlow.referenceUnavailable')}</p>)}</WorkflowPanel>
}

export default function EmployeeReferences() {
  const { t } = useLanguage()
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(0)
  const query = useWorkflowQuery('proposals', { kind: 'strategy', status: 'approved', limit: 10, offset: page * 10 })
  if (creating) return <div className="space-y-3"><Button variant="outline" onClick={() => { setCreating(false); query.reload() }}>{t('employeeFlow.backReferences')}</Button><WorkflowStudio kind="strategy" /></div>
  if (selected) return <ReferenceDetail key={selected} id={selected} onBack={() => { setSelected(null); query.reload() }} />
  return <WorkflowPanel title={t('employeeFlow.approvedStrategies')} query={query}><p className="text-muted-foreground">{t('employeeFlow.referenceReadOnly')}</p><div className="flex gap-3"><Button variant="outline" onClick={query.reload}>{t('employeeFlow.refresh')}</Button><Button onClick={() => setCreating(true)}>{t('employeeFlow.draftStrategy')}</Button></div>{!query.data?.items?.length && <p>{t('employeeFlow.noStrategies')}</p>}{query.data?.items?.map(item => <article key={item.id} className="flex items-center justify-between gap-3 border-t border-border py-3"><div><h2>{item.title}</h2><p className="text-sm text-muted-foreground">{item.campaign_name}</p></div><Button variant="outline" onClick={() => setSelected(item.id)}>{t('employeeFlow.readStrategy')}</Button></article>)}<div className="flex gap-3"><Button variant="outline" disabled={!page} onClick={() => setPage(value => value - 1)}>{t('employeeFlow.previous')}</Button><span>{t('employeeFlow.page', {page: page + 1})}</span><Button variant="outline" disabled={(page + 1) * 10 >= (query.data?.total ?? 0)} onClick={() => setPage(value => value + 1)}>{t('employeeFlow.next')}</Button></div></WorkflowPanel>
}
