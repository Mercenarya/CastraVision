import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from '../components/WorkflowPanel'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { downloadCsv, workflow } from '../../services/leaderWorkflow'
import { KIND_LABELS, STATUS_LABELS } from '../../services/leaderWorkflowContract'

export default function LeaderApprovalQueue({ mine = false, canExport = true, revision = 0, onSelect }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [kind, setKind] = useState('')
  const [page, setPage] = useState(0)
  const query = useWorkflowQuery('proposals', { mine, search, status, kind, limit: 10, offset: page * 10 }, revision)
  const exporter = useWorkflowAction()
  const field = 'rounded-lg border border-border bg-background p-2 text-sm'
  async function exportRows() {
    await exporter.run(async () => {
      const rows = []
      for (let offset = 0; ; offset += 100) {
        const batch = await workflow('proposals', { mine, search, status, kind, limit: 100, offset })
        rows.push(...batch.items)
        if (rows.length >= batch.total || !batch.items.length) break
      }
      downloadCsv('proposals.csv', ['ID', 'Title', 'Kind', 'Status', 'Author', 'Campaign', 'Version'], rows.map(p => [p.id, p.title, p.target_type, p.status, p.author_name, p.campaign_name, p.version]))
    })
  }
  return <div className="space-y-5 p-6"><header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{mine ? 'My Proposals' : 'Proposal Approval Queue'}</h1><div className="flex gap-2"><Button variant="outline" onClick={query.reload}>Refresh Pipeline</Button>{canExport && <Button variant="outline" disabled={exporter.busy} onClick={exportRows}>Export Queue (CSV)</Button>}</div></header>
    <WorkflowPanel title={mine ? 'Đề xuất của bạn' : 'Hàng chờ trong phạm vi được giao'} query={query} action={exporter}>
      <div className="flex flex-wrap gap-3"><input aria-label="Tìm đề xuất" placeholder="Tìm theo tiêu đề" className={field} value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} /><select aria-label="Loại đề xuất" className={field} value={kind} onChange={e => { setKind(e.target.value); setPage(0) }}><option value="">Tất cả loại</option>{Object.entries(KIND_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select aria-label="Trạng thái đề xuất" className={field} value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}><option value="">Tất cả trạng thái</option>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><Button variant="outline" onClick={() => { setSearch(''); setKind(''); setStatus(''); setPage(0) }}>Reset</Button></div>
      {!query.data?.items.length ? <p>Không có đề xuất phù hợp.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Proposal', 'Type', 'Campaign', 'Author', 'Status', 'Thao tác'].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{query.data.items.map(p => <tr key={p.id} className="border-t border-border"><td className="p-3 font-medium">{p.title}<p className="text-xs text-muted-foreground">v{p.version} · {new Date(p.created_at).toLocaleString('vi-VN')}</p></td><td>{KIND_LABELS[p.target_type]}</td><td>{p.campaign_name}</td><td>{p.author_name}</td><td>{STATUS_LABELS[p.status]}</td><td><Button variant="outline" onClick={() => onSelect(p.id)}>Review →</Button></td></tr>)}</tbody></table></div>}
      <div className="flex justify-between"><span>{query.data?.total || 0} đề xuất · Trang {page + 1}</span><div className="flex gap-2"><Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button><Button variant="outline" disabled={(page + 1) * 10 >= (query.data?.total || 0)} onClick={() => setPage(p => p + 1)}>Sau</Button></div></div>
    </WorkflowPanel></div>
}
