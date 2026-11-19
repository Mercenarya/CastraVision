import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useWorkflowQuery } from '../hooks/useLeaderWorkflow'
import { useManagerQuery } from '../hooks/useManagerQuery'
import { createReport, downloadReport, getReportFile, reportHistory } from '../services/managerTools'

const metrics = { spend: 'Chi tiêu', revenue: 'Doanh thu', conversions: 'Chuyển đổi', clicks: 'Lượt nhấp', impressions: 'Lượt hiển thị', roas: 'ROAS', cpa: 'CPA', ctr: 'CTR (%)' }
export default function LiveManagerReports({ workspaceId }) {
  const campaigns = useWorkflowQuery('campaigns', { limit: 100 })
  const [selected, setSelected] = useState([])
  const [chosen, setChosen] = useState(Object.keys(metrics))
  const [from, setFrom] = useState(() => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10))
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [offset, setOffset] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState('')
  const running = useRef(false)
  const request = useRef({ fingerprint: '', id: '' })
  const loadHistory = useCallback(signal => reportHistory(offset, signal), [offset])
  const history = useManagerQuery(`${workspaceId}:${offset}`, loadHistory)
  async function exportReport(format) {
    if (running.current) return
    running.current = true; setBusy(true); setError(''); setCreated('')
    const data = { from, to, campaignIds: [...selected].sort(), metrics: chosen, format }
    const fingerprint = JSON.stringify(data)
    if (request.current.fingerprint !== fingerprint) request.current = { fingerprint, id: crypto.randomUUID() }
    try {
      const result = await createReport({ ...data, requestId: request.current.id })
      downloadReport(result)
      setCreated(`Đã lưu báo cáo ${result.id}.`)
      history.reload()
    } catch (cause) { setError(cause.message) } finally { running.current = false; setBusy(false) }
  }
  async function download(id) {
    if (running.current) return
    running.current = true; setBusy(true); setError('')
    try { downloadReport(await getReportFile(id)) } catch (cause) { setError(cause.message) } finally { running.current = false; setBusy(false) }
  }
  const toggle = (values, value) => values.includes(value) ? values.filter(item => item !== value) : [...values, value]
  return <section className="space-y-6"><h1 className="text-3xl font-semibold">Xuất báo cáo hiệu suất</h1><p className="text-muted-foreground">Dữ liệu quan sát đã nhập, theo ngày UTC. Chọn tối đa 30 chiến dịch cùng tiền tệ. File được lưu riêng trong database và tải qua API có kiểm tra quyền; không có URL công khai.</p>
    {(error || campaigns.error) && <p role="alert">{error || campaigns.error}</p>}{created && <p role="status">{created}</p>}
    <div className="grid gap-5 lg:grid-cols-2"><article className="space-y-4 rounded-xl border border-border bg-card p-5"><h2 className="text-xl">Kỳ báo cáo & chiến dịch</h2><div className="flex gap-3"><label>Từ ngày<input className="block rounded border border-border bg-background p-2" type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>Đến ngày<input className="block rounded border border-border bg-background p-2" type="date" min={from} value={to} onChange={e => setTo(e.target.value)} /></label></div>{campaigns.loading && <p>Đang tải chiến dịch…</p>}{campaigns.error && <Button onClick={campaigns.reload}>Thử lại</Button>}{campaigns.data?.items.map(c => <label key={c.id} className="flex gap-3"><input type="checkbox" checked={selected.includes(c.id)} onChange={() => setSelected(values => toggle(values, c.id))} />{c.name} ({c.currency})</label>)}{campaigns.data && !campaigns.data.items.length && <p>Chưa có chiến dịch.</p>}{campaigns.data?.total > 100 && <p role="alert">Chỉ hiển thị 100 chiến dịch đầu. Cần thu hẹp danh sách trước khi xuất các chiến dịch khác.</p>}</article>
    <article className="space-y-4 rounded-xl border border-border bg-card p-5"><h2 className="text-xl">Chỉ số</h2>{Object.entries(metrics).map(([key, title]) => <label key={key} className="flex gap-3"><input type="checkbox" checked={chosen.includes(key)} onChange={() => setChosen(values => toggle(values, key))} />{title}</label>)}<div className="flex gap-3">{['csv', 'pdf'].map(format => <Button key={format} disabled={busy || !selected.length || selected.length > 30 || !chosen.length || !from || !to || to < from} onClick={() => exportReport(format)}>Xuất {format.toUpperCase()}</Button>)}</div></article></div>
    <article className="space-y-3 rounded-xl border border-border bg-card p-5"><h2 className="text-xl">Lịch sử báo cáo đã lưu</h2><Button variant="outline" onClick={history.reload}>Làm mới</Button>{history.loading && <p>Đang tải lịch sử…</p>}{history.error && <p role="alert">{history.error}</p>}{history.data?.items.map(item => <div key={item.id} className="flex flex-wrap justify-between gap-3 border-b border-border py-3"><span>{item.format.toUpperCase()} · {item.from} → {item.to} · {item.currency} · {item.status} · {new Date(item.created_at).toLocaleString('vi-VN')}</span><Button disabled={busy || item.status !== 'ready'} onClick={() => download(item.id)}>Tải {item.id.slice(0, 8)}</Button></div>)}{history.data && !history.data.items.length && <p>Chưa có báo cáo được tạo bằng luồng này.</p>}<div className="flex gap-3"><Button disabled={!offset} onClick={() => setOffset(n => n - 20)}>Trước</Button><Button disabled={!history.data?.hasMore} onClick={() => setOffset(n => n + 20)}>Sau</Button></div></article>
  </section>
}
