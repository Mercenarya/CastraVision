import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { addCompetitor, listCompetitors } from '../services/managerTools'
import { useManagerQuery } from '../hooks/useManagerQuery'

export default function LiveManagerCompetitors({ workspaceId }) {
  const [offset, setOffset] = useState(0)
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const load = useCallback(signal => listCompetitors(offset, signal), [offset])
  const query = useManagerQuery(`${workspaceId}:${offset}`, load)
  async function save(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try { await addCompetitor(keyword); setOpen(false); setKeyword(''); setOffset(0); query.reload() } catch (cause) { setError(cause.message) } finally { setBusy(false) }
  }
  return <section className="space-y-5"><div className="flex justify-between"><h1 className="text-3xl font-semibold">Đối thủ & thông tin thị trường</h1><Button onClick={() => setOpen(true)}>Thêm đối thủ</Button></div><p role="status" className="rounded-xl border border-warning p-4">{query.data?.analysisMessage || 'Chưa cấu hình nguồn phân tích đối thủ. Không hiển thị chỉ số quảng cáo hoặc xu hướng giả.'}</p><div className="flex gap-3"><label>Lọc trang hiện tại<input className="block rounded border border-border bg-background p-2" value={search} onChange={e => setSearch(e.target.value)} /></label><Button variant="outline" onClick={query.reload}>Làm mới</Button></div>{query.loading && <p>Đang tải danh sách…</p>}{(query.error || error) && <p role="alert">{query.error || error}</p>}
    {open && <form aria-label="Thêm đối thủ" className="space-y-3 rounded-xl border border-border bg-card p-5" onSubmit={save}><label>Tên thương hiệu hoặc domain<input required minLength={2} maxLength={160} className="block rounded border border-border bg-background p-3" value={keyword} onChange={e => setKeyword(e.target.value)} /></label><Button disabled={busy}>Lưu đối thủ</Button><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button></form>}
    {query.data?.items.filter(item => item.keyword.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(item => <article key={item.id} className="space-y-2 rounded-xl border border-border bg-card p-5"><h2 className="text-xl font-semibold">{item.keyword}</h2><p className="text-muted-foreground">Đã theo dõi từ {new Date(item.created_at).toLocaleString('vi-VN')}</p><p>{item.summary ? 'Có bản ghi tổng hợp cũ nhưng chưa xác minh nguồn; chưa dùng làm tín hiệu phân tích.' : 'Chưa có dữ liệu phân tích có nguồn.'}</p></article>)}{query.data && !query.data.items.length && <p>Chưa theo dõi đối thủ nào.</p>}<div className="flex gap-3"><Button disabled={!offset} onClick={() => setOffset(n => n - 20)}>Trước</Button><Button disabled={!query.data?.hasMore} onClick={() => setOffset(n => n + 20)}>Sau</Button></div>
  </section>
}
