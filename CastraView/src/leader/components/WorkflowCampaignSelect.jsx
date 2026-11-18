import { useWorkflowQuery } from '../../hooks/useLeaderWorkflow'

export default function WorkflowCampaignSelect({ value, onChange, revision = 0 }) {
  const query = useWorkflowQuery('campaigns', { limit: 100 }, revision)
  return <label className="block space-y-2">Chiến dịch
    <select required className="w-full rounded-lg border border-border bg-background p-3" value={value} onChange={e => onChange(e.target.value)} disabled={query.loading}>
      <option value="">Chọn chiến dịch được phân công</option>
      {query.data?.items?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>)}
    </select>
    {query.error && <span role="alert" className="text-destructive">{query.error} <button type="button" onClick={query.reload}>Thử lại</button></span>}
    {query.data?.total > 100 && <span className="text-warning">Hiển thị 100 chiến dịch đầu tiên. Mở Campaigns để tìm chiến dịch khác.</span>}
  </label>
}
