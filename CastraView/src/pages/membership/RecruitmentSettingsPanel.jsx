import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function RecruitmentSettingsPanel({ settings, service, onSaved }) {
  const [accepting, setAccepting] = useState(settings.acceptingJoinRequests)
  const [description, setDescription] = useState(settings.publicDescription || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('')
    try { await service.saveRecruitmentSettings({ acceptingJoinRequests: accepting, publicDescription: description }); await onSaved('Đã lưu cấu hình nhận yêu cầu.') }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <form className="grid gap-3 rounded-xl border border-border bg-card p-5" onSubmit={save}>
    <label className="flex items-center gap-3 font-medium"><input type="checkbox" checked={accepting} onChange={e => setAccepting(e.target.checked)} disabled={busy} />Cho phép tìm công ty và gửi yêu cầu gia nhập</label>
    <p className="text-xs text-muted-foreground">Chỉ công khai tên và mô tả bên dưới. Không công khai danh sách nhân viên hoặc dữ liệu chiến dịch.</p>
    <label className="grid gap-2 text-sm">Mô tả công khai<Textarea maxLength={300} value={description} onChange={e => setDescription(e.target.value)} disabled={busy} /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={busy} className="justify-self-start">{busy ? 'Đang lưu…' : 'Lưu cấu hình'}</Button>
  </form>
}
