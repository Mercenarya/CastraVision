import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { listAudit } from '../../services/marketingManager'
import { downloadCsv } from '../../services/leaderWorkflow'
import { useManagerQuery } from '../../hooks/useManagerQuery'

export default function LiveAuditLog({ workspaceId }) {
  const [filters, setFilters] = useState({ action: '', entity: '', from: '', to: '' })
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const load = useCallback(signal => listAudit(workspaceId, { ...filters, offset }, signal), [workspaceId, filters, offset])
  const result = useManagerQuery(JSON.stringify([workspaceId, filters, offset]), load)
  function change(key, value) { setFilters(f => ({ ...f, [key]: value })); setOffset(0); setSelected(null) }
  async function exportLogs() {
    setExporting(true); setExportError('')
    try {
      const rows = []
      // Bounded export: refuse truncation instead of silently exporting only the visible page.
      for (let cursor = 0; ; cursor += 500) {
        const batch = await listAudit(workspaceId, { ...filters, offset: cursor, limit: 500 })
        if (batch.total > 10000) throw new Error('Bộ lọc vượt 10.000 sự kiện. Hãy thu hẹp khoảng ngày trước khi xuất.')
        rows.push(...batch.items)
        if (rows.length >= batch.total || !batch.items.length) break
      }
      downloadCsv('audit-log.csv', ['ID', 'Thời điểm UTC', 'Hành động', 'Bảng', 'ID bản ghi', 'ID người thực hiện'], rows.map(row => [row.id, row.created_at, row.action, row.entity_type, row.entity_id, row.actor_id]))
    } catch (error) { setExportError(error.message) } finally { setExporting(false) }
  }
  return <section className="space-y-5"><div className="flex justify-between"><h1 className="text-3xl font-semibold">Nhật ký hoạt động</h1><Button disabled={exporting || result.loading || !!result.error} onClick={exportLogs}>{exporting ? 'Đang xuất…' : 'Xuất CSV'}</Button></div><p className="text-muted-foreground">Chỉ đọc sự kiện trong doanh nghiệp hiện tại. Chi tiết và file xuất chỉ chứa metadata, không đưa payload nhạy cảm ra giao diện.</p>
    <div className="flex flex-wrap gap-3">{[['action', 'Hành động'], ['entity', 'Tên bảng']].map(([key, name]) => <label key={key}>{name}<input className="block rounded border border-border bg-background p-2" value={filters[key]} onChange={e => change(key, e.target.value)} /></label>)}{[['from', 'Từ ngày UTC'], ['to', 'Đến ngày UTC']].map(([key, label]) => <label key={key}>{label}<input className="block rounded border border-border bg-background p-2" type="date" value={filters[key]} min={key === 'to' ? filters.from : undefined} onChange={e => change(key, e.target.value)} /></label>)}<Button variant="outline" onClick={result.reload}>Làm mới</Button></div>
    {(result.error || exportError) && <p role="alert">{result.error || exportError}</p>}{result.loading && <p role="status">Đang tải nhật ký…</p>}
    {result.data && <><p>{result.data.total} sự kiện phù hợp</p><div className="overflow-auto rounded-xl border border-border bg-card"><table className="w-full text-left"><thead><tr>{['Thời điểm', 'Hành động', 'Bảng', 'Chi tiết'].map(x => <th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{result.data.items.map(log => <tr key={log.id} className="border-t border-border"><td className="p-3">{new Date(log.created_at).toLocaleString('vi-VN')}</td><td>{log.action}</td><td>{log.entity_type}</td><td><Button variant="ghost" onClick={() => setSelected(log)}>Xem {log.id.slice(0, 8)}</Button></td></tr>)}</tbody></table>{!result.data.items.length && <p className="p-4">Không có sự kiện phù hợp.</p>}</div><div className="flex gap-3"><Button disabled={!offset} onClick={() => setOffset(n => n - 20)}>Trước</Button><span>Trang {offset / 20 + 1}</span><Button disabled={offset + 20 >= result.data.total} onClick={() => setOffset(n => n + 20)}>Sau</Button></div></>}
    {selected && <article className="rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">Chi tiết sự kiện</h2><dl>{Object.entries(selected).map(([key, value]) => <div key={key} className="flex flex-wrap gap-3"><dt>{key}</dt><dd className="break-all">{String(value ?? '—')}</dd></div>)}</dl><Button onClick={() => setSelected(null)}>Đóng</Button></article>}
  </section>
}
