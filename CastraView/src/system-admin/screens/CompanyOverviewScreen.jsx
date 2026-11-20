import { useEffect, useState } from 'react'

export function CompanyOverviewScreen({ company, error, onNavigate, onUpdateCompany, onRefresh, onSendInvitation, onRevokeInvitation,onIssueInvitation }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [managerEmail,setManagerEmail]=useState('')
  const [suspensionConfirmed,setSuspensionConfirmed]=useState(false)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])
  if (!company) return <section className="sa-page-container"><p role={error ? 'alert' : 'status'}>{error || 'Đang tải thông tin doanh nghiệp…'}</p><button className="sa-btn" onClick={() => onNavigate('sa-company-mgmt')}>Back to Company Management</button></section>
  const values = form || company
  const change = (field, value) => {
    if(field==='status')setSuspensionConfirmed(false)
    setForm(previous => ({ ...company, ...previous, [field]: value }))
  }
  async function perform(action, success) {
    if (busy) return
    setBusy(true); setMessage('')
    try { const result = await action(); setEditing(false); setForm(null); setMessage(result?.deliveryStatus === 'failed' ? 'Doanh nghiệp đã lưu nhưng gửi email thất bại. Vui lòng thử gửi lại.' : success) }
    catch (cause) { setMessage(cause.message) }
    finally { setBusy(false) }
  }
  function save(event) {
    event.preventDefault()
    if(values.status==='Inactive'&&company.status!=='Inactive'&&!suspensionConfirmed){setMessage('Cần xác nhận tác động khóa doanh nghiệp trước khi lưu.');return}
    void perform(() => onUpdateCompany(company.id, { version: company.version, name: values.name, legalEntity: values.legalEntity, domain: values.domain, notes: values.notes, status: values.status }), 'Đã lưu và đọc lại dữ liệu từ máy chủ.')
  }
  return <section className="sa-page-container space-y-5">
    <button type="button" className="sa-btn" onClick={() => onNavigate('sa-company-mgmt')}>Back to Company Management</button>
    <header className="sa-page-header"><h1 className="sa-page-title">{company.name}</h1><button className="sa-btn" onClick={onRefresh} disabled={busy}>Refresh Status</button></header>
    {message && <p role="status" className="rounded border border-border p-3">{message}</p>}
    <div className="grid gap-4 md:grid-cols-3"><div className="sa-card p-5">Thành viên: {company.employeeCount}</div><div className="sa-card p-5">Trạng thái: {company.status}</div><div className="sa-card p-5">Quota / telemetry: Chưa cấu hình</div></div>
    <form className="sa-card grid gap-4 p-5" onSubmit={save}>
      <h2 className="font-semibold">Thông tin doanh nghiệp</h2>
      {[['name','Tên doanh nghiệp',120],['legalEntity','Pháp nhân',120],['domain','Domain',253],['notes','Ghi chú',2000]].map(([field,label,max]) => <label key={field} className="grid gap-2">{label}<input className="sa-form-input" required={field==='name'||field==='legalEntity'} maxLength={max} disabled={!editing||busy} value={values[field] || ''} onChange={event => change(field,event.target.value)} /></label>)}
      <label className="grid gap-2">Trạng thái<select className="sa-form-input" disabled={!editing||busy} value={values.status} onChange={event => change('status',event.target.value)}><option>Active</option><option>Inactive</option></select></label>
      <p className="text-sm text-muted-foreground">Inactive khóa quyền sử dụng doanh nghiệp, bao gồm phiên đã đăng nhập. Không xóa tài khoản hoặc dữ liệu.</p>
      {editing&&values.status==='Inactive'&&company.status!=='Inactive'&&<label className="flex items-center gap-2"><input type="checkbox" required checked={suspensionConfirmed} onChange={event=>setSuspensionConfirmed(event.target.checked)} />Tôi xác nhận khóa quyền sử dụng doanh nghiệp của các thành viên.</label>}
      {!editing ? <button type="button" className="sa-btn sa-btn-primary" onClick={() => setEditing(true)}>Edit Organization Details</button> : <div className="flex gap-3"><button disabled={busy} className="sa-btn sa-btn-primary">Save Changes</button><button type="button" disabled={busy} className="sa-btn" onClick={() => { setEditing(false); setForm(null) }}>Cancel</button></div>}
    </form>
    {company.invitation && <section className="sa-card space-y-3 p-5"><h2 className="font-semibold">Lời mời Marketing Manager</h2><p>{company.accountEmail}</p><p>{company.invitation.status} · Email: {company.invitation.deliveryStatus}</p><p>Hạn: {new Date(company.invitation.expiresAt).toLocaleString()}</p>{company.invitation.status==='pending' && <div className="flex gap-3"><button className="sa-btn sa-btn-primary" disabled={busy||company.status!=='Active'} onClick={() => perform(() => onSendInvitation(company.invitation.id),'Đã gửi email mời.')}>Gửi / gửi lại email</button><button className="sa-btn" disabled={busy} onClick={() => perform(() => onRevokeInvitation(company.invitation.id),'Đã thu hồi lời mời.')}>Thu hồi lời mời</button></div>}</section>}
    <section className="sa-card p-5"><h2 className="font-semibold">Lịch sử quản trị nền tảng</h2>{company.history?.length ? company.history.map(event => <article className="border-b border-border py-3" key={event.id}><p>{event.action}</p><time>{new Date(event.createdAt).toLocaleString()}</time></article>) : <p>Chưa có hoạt động.</p>}</section>
    {(!company.invitation || company.invitation.status!=='pending' || Date.parse(company.invitation.expiresAt)<=now) && <form className="sa-card grid gap-3 p-5" onSubmit={event=>{event.preventDefault();void perform(()=>onIssueInvitation(managerEmail),'Đã tạo lời mời mới, chờ gửi email.')}}><h2 className="font-semibold">Mời Marketing Manager</h2><label className="grid gap-2">Email Marketing Manager<input className="sa-form-input" type="email" required maxLength={254} value={managerEmail} disabled={busy} onChange={event=>setManagerEmail(event.target.value)}/></label><p>Không xóa hoặc hạ quyền các quản lý hiện có.</p><button className="sa-btn sa-btn-primary" disabled={busy}>Tạo lời mời mới</button></form>}
  </section>
}
