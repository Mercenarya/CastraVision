import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import WorkflowCampaignSelect from '../components/WorkflowCampaignSelect'
import WorkflowPanel from '../components/WorkflowPanel'
import WorkflowRecommendation from '../components/WorkflowRecommendation'
import WorkflowBudgetForm from '../components/WorkflowBudgetForm'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { downloadCsv } from '../../services/leaderWorkflow'
import { money } from '../../services/leaderWorkflowContract'

const field = 'rounded-lg border border-border bg-background p-3'

export default function WorkflowPerformance({ initialCampaign = '', revision, onCreated, overview = false, setPage }) {
  const [campaignId, setCampaignId] = useState(initialCampaign)
  const [from, setFrom] = useState(() => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10))
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const query = useWorkflowQuery('analytics', { campaignId: campaignId || undefined, from, to }, revision)
  const campaign = useWorkflowQuery('campaigns', { limit: 100 }, revision)
  const selected = campaign.data?.items.find(c => c.id === campaignId)
  const data = query.data
  const exporter = useWorkflowAction()
  return <div className="space-y-5 p-6"><WorkflowPanel title={overview ? 'Leader Overview' : 'Performance & Insights'} query={query} action={exporter}>
    <p className="text-muted-foreground">Dữ liệu quan sát đã nhập, trong Team được phân công. Mỗi báo cáo chỉ tổng hợp một đơn vị tiền tệ; dữ liệu cũ chưa rõ nguồn không được suy thành số liệu thực.</p>
    <div className="flex flex-wrap items-end gap-3"><WorkflowCampaignSelect value={campaignId} onChange={setCampaignId} revision={revision} /><label>Từ<input className={cn('block', field)} type="date" required value={from} onChange={e => setFrom(e.target.value)} /></label><label>Đến<input className={cn('block', field)} type="date" min={from} required value={to} onChange={e => setTo(e.target.value)} /></label></div>
    {data && <><p>{data.rowCount} bản ghi · {data.currency}</p>{data.rowCount === 0 ? <p>Chưa có dữ liệu hiệu suất trong khoảng ngày này. Nhập dữ liệu thật trước khi đánh giá.</p> : <><div className="grid gap-4 sm:grid-cols-4">{[['Chi tiêu', money(data.spend, data.currency)], ['Doanh thu', money(data.revenue, data.currency)], ['ROAS', data.roas == null ? '—' : Number(data.roas).toFixed(2)], ['CPA', money(data.cpa, data.currency)]].map(([label, value]) => <div className="rounded-lg border border-border p-4" key={label}><p>{label}</p><strong className="text-xl">{value}</strong></div>)}</div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Kênh', 'Chi tiêu', 'Doanh thu', 'Chuyển đổi', 'ROAS', 'CPA'].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{data.channels?.map(c => <tr key={c.channel} className="border-t border-border"><td className="py-3">{c.channel}</td><td>{money(c.spend, data.currency)}</td><td>{money(c.revenue, data.currency)}</td><td>{c.conversions}</td><td>{c.roas == null ? '—' : Number(c.roas).toFixed(2)}</td><td>{money(c.cpa, data.currency)}</td></tr>)}</tbody></table></div><Button variant="outline" disabled={exporter.busy} onClick={() => exporter.run(async () => { downloadCsv('performance.csv', ['Từ', 'Đến', 'Tiền tệ', 'Kênh', 'Chi tiêu', 'Doanh thu', 'Chuyển đổi', 'ROAS', 'CPA'], data.channels.map(c => [from, to, data.currency, c.channel, c.spend, c.revenue, c.conversions, c.roas, c.cpa])); return true })}>Export CSV</Button></>}
      {overview && <div className="flex flex-wrap gap-3"><Button onClick={() => setPage('approvals')}>Mở hàng đợi duyệt</Button><Button variant="outline" onClick={() => setPage('campaigns')}>Quản lý chiến dịch</Button><Button variant="outline" onClick={() => setPage('import')}>Nhập dữ liệu</Button></div>}
    </>}
  </WorkflowPanel>{selected && !overview && <><WorkflowBudgetForm key={`${selected.id}:${JSON.stringify(selected.allocations)}`} campaign={selected} onCreated={onCreated} /><WorkflowRecommendation key={`${selected.id}:${revision}:${data?.from}:${data?.to}`} campaign={selected} analytics={data} onCreated={onCreated} /></>}</div>
}
