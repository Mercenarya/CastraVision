import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import WorkflowPanel from '../components/WorkflowPanel'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { workflow, downloadCsv } from '../../services/leaderWorkflow'
import { money } from '../../services/leaderWorkflowContract'

const field = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm'

export default function LeaderCampaigns({ context, revision = 0, onChanged, setPage }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPageNumber] = useState(0)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState({ name: '', budget: '', currency: 'VND', channels: ['Meta'], teamId: context.teams[0]?.id || '' })
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const query = useWorkflowQuery('campaigns', { search, status, limit: 10, offset: page * 10 }, revision)
  const action = useWorkflowAction(async () => { query.reload(); await onChanged?.() })
  const exporter = useWorkflowAction()
  function change(key, value) { setDraft(d => ({ ...d, [key]: value })); setRequestId(crypto.randomUUID()) }
  async function create(event) {
    event.preventDefault()
    const result = await action.run(() => workflow('create_campaign', { ...draft, budget: Number(draft.budget), requestId }))
    if (result) { setCreating(false); setDraft(d => ({ ...d, name: '', budget: '' })); setRequestId(crypto.randomUUID()) }
  }
  async function exportRows() {
    await exporter.run(async () => {
      const rows = []
      for (let offset = 0; ; offset += 100) {
        const batch = await workflow('campaigns', { search, status, limit: 100, offset })
        rows.push(...batch.items)
        if (rows.length >= batch.total || !batch.items.length) break
      }
      downloadCsv('campaigns.csv', ['ID', 'Campaign', 'Team', 'Budget', 'Currency', 'Status'], rows.map(c => [c.id, c.name, c.team_name, c.budget, c.currency, c.status]))
    })
  }
  return <div className="space-y-6 p-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Campaign Management</h1><p className="text-sm text-muted-foreground">Chiến dịch thuộc các nhóm được giao.</p></div><Button onClick={() => setCreating(true)} disabled={!context.teams.length}>Create Campaign</Button></header>
    <WorkflowPanel title="All Squad Campaigns" query={query} action={action}>
      <div className="flex flex-wrap gap-3"><input aria-label="Tìm chiến dịch" placeholder="Search campaigns..." className={cn(field, 'max-w-sm')} value={search} onChange={e => { setSearch(e.target.value); setPageNumber(0) }} /><select aria-label="Trạng thái chiến dịch" className={cn(field, 'max-w-xs')} value={status} onChange={e => { setStatus(e.target.value); setPageNumber(0) }}><option value="">Tất cả trạng thái</option>{['draft', 'active', 'paused', 'completed'].map(s => <option key={s} value={s}>{s}</option>)}</select><Button variant="outline" disabled={exporter.busy} onClick={exportRows}>Export CSV</Button></div>
      {exporter.error && <p role="alert" className="text-destructive">{exporter.error}</p>}
      {!query.data?.items.length ? <p>Chưa có chiến dịch trong phạm vi hoặc bộ lọc hiện tại.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Campaign', 'Team', 'Budget', 'Status', 'Thao tác'].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{query.data.items.map(c => <tr key={c.id} className="border-t border-border"><td className="p-3 font-medium">{c.name}<p className="text-xs text-muted-foreground">{c.channels.join(' · ')}</p></td><td>{c.team_name}</td><td>{money(c.budget, c.currency)}</td><td>{c.status}</td><td><Button variant="outline" onClick={() => setSelected(c)}>Details</Button></td></tr>)}</tbody></table></div>}
      <div className="flex items-center justify-between"><span>{query.data?.total || 0} chiến dịch · Trang {page + 1}</span><div className="flex gap-2"><Button variant="outline" disabled={page === 0} onClick={() => setPageNumber(p => p - 1)}>Trước</Button><Button variant="outline" disabled={(page + 1) * 10 >= (query.data?.total || 0)} onClick={() => setPageNumber(p => p + 1)}>Sau</Button></div></div>
    </WorkflowPanel>
    {!context.teams.length && <p role="status">Chưa được phân công Team. Liên hệ Marketing Manager.</p>}
    {creating && <div role="dialog" aria-modal="true" aria-label="Create New Campaign" className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4"><form onSubmit={create} className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Create New Campaign (Draft)</h2>
      <label className="block">Campaign Name<input required maxLength={120} className={field} value={draft.name} onChange={e => change('name', e.target.value)} /></label>
      <label className="block">Planned Budget<input required type="number" min="1" max="1000000000" step="0.01" className={field} value={draft.budget} onChange={e => change('budget', e.target.value)} /></label>
      <label className="block">Currency<select className={field} value={draft.currency} onChange={e => change('currency', e.target.value)}><option>VND</option><option>USD</option></select></label>
      <label className="block">Assigned Team<select required className={field} value={draft.teamId} onChange={e => change('teamId', e.target.value)}>{context.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <fieldset><legend>Channels</legend>{['Meta', 'Google Ads', 'TikTok'].map(channel => <label key={channel} className="mr-4 inline-flex gap-2"><input type="checkbox" checked={draft.channels.includes(channel)} onChange={e => change('channels', e.target.checked ? [...draft.channels, channel] : draft.channels.filter(c => c !== channel))} />{channel}</label>)}</fieldset>
      <p className="text-sm text-muted-foreground">Phân bổ kế hoạch ban đầu chia đều giữa các kênh đã chọn; đây là ngân sách kế hoạch, không phải chi tiêu thực tế. Thay đổi sau đó cần đề xuất và duyệt.</p>
      {action.error && <p role="alert" className="text-destructive">{action.error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={action.busy} onClick={() => setCreating(false)}>Cancel</Button><Button disabled={action.busy || !draft.channels.length}>Save Draft</Button></div>
    </form></div>}
    {selected && <div role="dialog" aria-modal="true" aria-label="Campaign Details" className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4"><WorkflowPanel title={selected.name}><p>Nhóm: {selected.team_name}</p><p>Ngân sách: {money(selected.budget, selected.currency)}</p><p>Trạng thái: {selected.status}</p><p>Kênh: {selected.channels.join(', ')}</p><div className="flex gap-2"><Button onClick={() => { setPage?.('performance', selected.id); setSelected(null) }}>View Analytics</Button><Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button></div></WorkflowPanel></div>}
  </div>
}
