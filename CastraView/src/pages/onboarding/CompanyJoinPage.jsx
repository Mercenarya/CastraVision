import { useCallback, useEffect, useRef, useState } from 'react'
import { Building2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { membershipService } from '@/services/membership'
import { STATUS_NAMES, ROLE_NAMES } from '@/services/membershipContract'
import MembershipNotifications from '@/pages/membership/MembershipNotifications'
import ManagerInvitationPanel from './ManagerInvitationPanel'

export default function CompanyJoinPage({ auth, service = membershipService, onBack }) {
  const [search, setSearch] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [message, setMessage] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [offset, setOffset] = useState(0)
  const invitationId = new URLSearchParams(window.location.search).get('invitationId')
  const authRef = useRef(auth)
  useEffect(() => { authRef.current = auth }, [auth])
  const refresh = useCallback(async signal => {
    try {
      const [companies, requests, invitations] = await Promise.all([
        service.listCompanies({ search, offset, limit: 20 }, { signal }), service.listMyRequests({}, { signal }), service.listMyInvitations({}, { signal }),
      ])
      if (!signal?.aborted) { setData({ companies, requests, invitations }); setError('') }
      if (!signal?.aborted && requests.items.some(x => x.status === 'approved')) await authRef.current.refreshMembership()
    } catch (cause) { if (cause.name !== 'AbortError' && !signal?.aborted) setError(cause.message) }
  }, [service, search, offset])
  useEffect(() => {
    const controller = new AbortController()
    const update = () => { if (document.visibilityState === 'visible') void refresh(controller.signal) }
    queueMicrotask(update)
    const timer = setInterval(update, 30000)
    window.addEventListener('focus', update)
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener('focus', update) }
  }, [refresh])
  async function perform(action, text) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { await action(); await refresh(); await auth.refreshMembership(); setNotice(text) }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-background p-4 text-foreground md:p-8"><div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold tracking-widest text-info">CASTRAVISION · GIA NHẬP DOANH NGHIỆP</p><h1 className="mt-2 text-2xl font-bold">Chọn công ty bạn muốn làm việc</h1><p className="mt-2 text-sm text-muted-foreground">{auth.user.email} · Chờ quản lý duyệt trước khi truy cập dữ liệu doanh nghiệp.</p></div><div className="flex gap-2"><MembershipNotifications userId={auth.user.id} service={service} onOpenResource={() => refresh()} /><Button variant="outline" onClick={() => auth.signOut()}>Đăng xuất</Button></div></header>
    {onBack && <Button variant="outline" onClick={onBack}>Quay lại Workspace</Button>}
    <ManagerInvitationPanel auth={auth} />
    {auth.suspendedWorkspaces?.length>0 && <p role="status" className="rounded-lg border border-warning p-4">Doanh nghiệp đang bị tạm khóa: {auth.suspendedWorkspaces.map(item=>item.name).join(', ')}. Bạn không cần đăng ký lại; liên hệ người vận hành để được hỗ trợ.</p>}
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm">{notice}</p>}
    {!data ? <p role="status" className="py-8 text-center text-muted-foreground">Đang tải công ty và yêu cầu của bạn…</p> : <>
      <section className="space-y-4 rounded-xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-semibold"><Building2 className="size-5 text-info" />Công ty đang nhận yêu cầu</h2><Input aria-label="Tìm công ty" placeholder="Tìm công ty theo tên…" value={search} onChange={e => { setSearch(e.target.value); setOffset(0) }} />
        {data.companies.items.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có công ty phù hợp đang mở nhận đơn. Bạn có thể liên hệ quản lý để nhận lời mời.</p> : <form className="grid gap-4" onSubmit={event => { event.preventDefault(); void perform(() => service.submitJoinRequest({ workspaceId: companyId, message }), 'Đã gửi yêu cầu. Marketing Manager của công ty sẽ nhận thông báo.') }}>
          <label className="grid gap-2 text-sm">Công ty<NativeSelect required value={companyId} onChange={e => setCompanyId(e.target.value)}><option value="">Chọn một công ty…</option>{data.companies.items.map(company => <option value={company.id} key={company.id}>{company.name}</option>)}</NativeSelect></label>
          {data.companies.items.find(x => x.id === companyId)?.publicDescription && <p className="text-sm text-muted-foreground">{data.companies.items.find(x => x.id === companyId).publicDescription}</p>}
          <label className="grid gap-2 text-sm">Lời giới thiệu<Textarea maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Giới thiệu ngắn để quản lý xác định yêu cầu của bạn…" /></label><Button className="justify-self-start" disabled={busy || !companyId}>{busy ? 'Đang gửi…' : 'Gửi yêu cầu gia nhập với quyền Employee'}</Button>
        </form>}
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={!offset} onClick={() => setOffset(x => Math.max(0, x - 20))}>Trước</Button><Button variant="outline" disabled={offset + 20 >= data.companies.total} onClick={() => setOffset(x => x + 20)}>Sau</Button></div>
      </section>
      <section className="space-y-4 rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Yêu cầu của tôi</h2><Button variant="outline" onClick={() => perform(() => auth.refreshMembership(), 'Đã cập nhật quyền truy cập.')} disabled={busy}><RefreshCw className="size-4" />Cập nhật trạng thái</Button></div>
        {!data.requests.items.length && <p className="text-sm text-muted-foreground">Bạn chưa gửi yêu cầu nào.</p>}{data.requests.items.map(item => <article className="rounded-lg border border-border p-4" key={item.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-medium">{item.companyName}</h3><p className="mt-1 text-sm text-muted-foreground">{STATUS_NAMES[item.status]} · {new Date(item.requestedAt).toLocaleString('vi-VN')}</p>{item.rejectionReason && <p className="mt-2 text-sm text-destructive">Lý do: {item.rejectionReason}</p>}</div>{item.status === 'pending' && <Button disabled={busy} variant="outline" onClick={() => perform(() => service.cancelJoinRequest(item.id), 'Đã hủy yêu cầu của bạn.')}>Hủy yêu cầu</Button>}{item.status === 'approved' && <Button disabled={busy} onClick={() => perform(() => auth.refreshMembership(), 'Đã cập nhật membership.')}>Vào Workspace đã được cấp</Button>}</div></article>)}
      </section>
      <section className="space-y-4 rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Lời mời dành cho bạn</h2>{!data.invitations.items.length && <p className="text-sm text-muted-foreground">{invitationId ? 'Lời mời không thuộc email này hoặc không còn hiệu lực. Hãy kiểm tra lại email nhận thư.' : 'Chưa có lời mời.'}</p>}{data.invitations.items.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"><div><h3 className="font-medium">{item.companyName}</h3><p className="text-sm text-muted-foreground">{ROLE_NAMES[item.role]} · {STATUS_NAMES[item.status]}</p></div>{item.status === 'pending' && <Button disabled={busy} onClick={() => perform(() => service.acceptInvitation(item.id), 'Đã chấp nhận lời mời.')}>Chấp nhận vào công ty</Button>}</article>)}</section>
    </>}
  </div></main>
}
