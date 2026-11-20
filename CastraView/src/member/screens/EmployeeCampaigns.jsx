import { useLanguage } from '@/hooks/useLanguage'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from '../../leader/components/WorkflowPanel'
import { useWorkflowQuery } from '../../hooks/useLeaderWorkflow'

function CampaignDetail({ id, onBack }) {
  const { t } = useLanguage()
  const query = useWorkflowQuery('campaign', { id })
  return <WorkflowPanel title={t('employeeFlow.campaignDetail')} query={query}><Button variant="outline" onClick={onBack}>{t('employeeFlow.back')}</Button>{query.data && <><h2 className="text-xl font-bold">{query.data.name}</h2><p>{t('employeeFlow.team')}: {query.data.team_name}</p><p>{t('employeeFlow.statusLabel')}: {t('employeeFlow.status.' + query.data.status)}</p><p>{t('employeeFlow.channels')}: {query.data.channels?.join(' · ')}</p><p className="text-sm text-muted-foreground">{t('employeeFlow.campaignReadOnly')}</p></>}</WorkflowPanel>
}

export default function EmployeeCampaigns() {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const query = useWorkflowQuery('campaigns', { search, status, limit: 10, offset: page * 10 })
  if (selected) return <CampaignDetail key={selected} id={selected} onBack={() => { setSelected(null); query.reload() }} />
  return <WorkflowPanel title={t('employeeFlow.assignedCampaigns')} query={query}>
    <div className="flex flex-wrap gap-3"><label>{t('employeeFlow.searchCampaign')}<input className="block rounded border border-border bg-background p-2" value={search} onChange={event => { setSearch(event.target.value); setPage(0) }} /></label><label>{t('employeeFlow.statusLabel')}<select className="block rounded border border-border bg-background p-2" value={status} onChange={event => { setStatus(event.target.value); setPage(0) }}><option value="">{t('employeeFlow.all')}</option>{['draft', 'active', 'paused', 'completed'].map(value => <option key={value} value={value}>{t('employeeFlow.status.' + value)}</option>)}</select></label><Button variant="outline" onClick={() => { setSelected(null); query.reload() }}>{t('employeeFlow.refresh')}</Button></div>
    {!query.data?.items?.length && <p>{t('employeeFlow.noCampaigns')}</p>}
    {query.data?.items?.map(campaign => <article key={campaign.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"><div><h2 className="font-semibold">{campaign.name}</h2><p>{campaign.team_name} · {t('employeeFlow.status.' + campaign.status)}</p></div><Button variant="outline" onClick={() => setSelected(campaign.id)}>{t('employeeFlow.viewDetail')}</Button></article>)}
    <div className="flex items-center justify-between"><span>{t('employeeFlow.campaignTotal', { total: query.data?.total ?? 0, page: page + 1 })}</span><div className="flex gap-2"><Button variant="outline" disabled={!page} onClick={() => setPage(value => value - 1)}>{t('employeeFlow.previous')}</Button><Button variant="outline" disabled={(page + 1) * 10 >= (query.data?.total ?? 0)} onClick={() => setPage(value => value + 1)}>{t('employeeFlow.next')}</Button></div></div>
  </WorkflowPanel>
}
