import { useEffect, useState } from 'react'

export function PlatformNotifications({ service }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open) return undefined
    let active = true
    service.notifications().then(data => { if (active) { setItems(data.items); setError('') } }).catch(cause => { if (active) setError(cause.message) })
    return () => { active = false }
  }, [open, service])
  async function read(id) {
    try { const data = await service.readNotification(id); setItems(data.items); setError('') }
    catch (cause) { setError(cause.message) }
  }
  return <div className="relative">
    <button type="button" className="sa-icon-btn" aria-label="Thông báo nền tảng" aria-expanded={open} onClick={() => setOpen(value => !value)}>♧</button>
    {open && <section aria-label="Thông báo nền tảng" className="absolute right-0 z-50 max-h-96 w-80 overflow-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg">
      <h2 className="font-semibold">Hoạt động nền tảng</h2>
      {error && <p role="alert">{error}</p>}
      {!items && !error && <p role="status">Đang tải…</p>}
      {items?.length === 0 && <p>Chưa có hoạt động.</p>}
      {items?.map(item => <article key={item.id} className="my-2 border-b border-border py-2"><p>{item.action}</p><time>{new Date(item.createdAt).toLocaleString()}</time>{!item.isRead && <button type="button" className="sa-btn" onClick={() => read(item.id)}>Đánh dấu đã đọc</button>}</article>)}
    </section>}
  </div>
}
