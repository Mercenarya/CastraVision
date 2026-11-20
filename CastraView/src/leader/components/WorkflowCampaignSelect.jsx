import { useLanguage } from '@/hooks/useLanguage'
import { useWorkflowQuery } from '../../hooks/useLeaderWorkflow'

export default function WorkflowCampaignSelect({ value, onChange, revision = 0 }) {
  const { t } = useLanguage()
  const query = useWorkflowQuery('campaigns', { limit: 100 }, revision)
  return <label className="block space-y-2">{t('employeeFlow.campaign')}<select required className="w-full rounded-lg border border-border bg-background p-3" value={value} onChange={e => onChange(e.target.value)} disabled={query.loading}>
      <option value="">{t('employeeFlow.chooseAssignedCampaign')}</option>
      {query.data?.items?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>)}
    </select>
    {query.error && <span role="alert" className="text-destructive">{query.error} <button type="button" onClick={query.reload}>{t('employeeFlow.retry')}</button></span>}
    {query.data?.total > 100 && <span className="text-warning">{t('employeeFlow.firstCampaigns')}</span>}
  </label>
}
