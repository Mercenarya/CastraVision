import { useRef, useState } from 'react'
import { companySlug, validateCompany } from '../companyValidation'

const empty = () => ({ name:'', accountEmail:'', legalEntity:'', domain:'', slug:'', status:'Active', notes:'' })
export function CreateCompanyScreen({ existingCompanies=[], onNavigate, onCreateCompany }) {
  const [form,setForm] = useState(empty)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const requestId = useRef(crypto.randomUUID())
  const slugEdited = useRef(false)
  const domainEdited = useRef(false)
  const validation = form.name || form.accountEmail ? validateCompany(form,existingCompanies) : null
  function change(field,value) {
    if (field==='slug') slugEdited.current=true
    if (field==='domain') domainEdited.current=true
    setForm(previous => ({ ...previous, [field]:value,
      ...(field==='name'&&!slugEdited.current ? { slug:companySlug(value) } : {}),
      ...(field==='accountEmail'&&!domainEdited.current ? { domain:value.split('@')[1] || '' } : {}),
    }))
  }
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const failure=validateCompany(form,existingCompanies)
    if (failure) { setError(failure.message); window.alert(failure.message); return }
    setBusy(true);setError('')
    try { await onCreateCompany({ ...form, legalEntity:form.legalEntity.trim()||form.name.trim(), name:form.name.trim(), accountEmail:form.accountEmail.trim().toLowerCase(), slug:form.slug.trim().toLowerCase(), requestId:requestId.current }) }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <section className="sa-page-container space-y-5"><header className="sa-page-header"><h1 className="sa-page-title">Create Company Account</h1><button className="sa-btn" onClick={() => onNavigate('sa-company-mgmt')}>Company Management</button></header>
    <p>Tạo doanh nghiệp và lời mời Marketing Manager. Người nhận xác thực email, đặt mật khẩu và chấp nhận trước khi có quyền quản trị.</p>
    {(error||validation) && <p role="alert" className="rounded border border-destructive p-3 text-destructive">{error||validation.message}</p>}
    <form id="create-company-form" onSubmit={submit} className="sa-card grid gap-4 p-6">
      {[['name','Tên doanh nghiệp','Apex Logistics Global',120],['accountEmail','Email Marketing Manager','admin@apexlogistics.io',254],['legalEntity','Pháp nhân','Tên pháp nhân',120],['domain','Domain','apexlogistics.io',253],['slug','Slug duy nhất','apex-logistics',63]].map(([field,label,placeholder,max]) => <label key={field} className="grid gap-2">{label}<input type={field==='accountEmail'?'email':'text'} className="sa-form-input" required={['name','accountEmail','slug'].includes(field)} disabled={busy} placeholder={placeholder} maxLength={max} value={form[field]} onChange={event => change(field,event.target.value)} /></label>)}
      <label className="grid gap-2">Trạng thái<select className="sa-form-input" value={form.status} disabled={busy} onChange={event => change('status',event.target.value)}><option>Active</option><option>Inactive</option></select></label>
      <label className="grid gap-2">Ghi chú<textarea className="sa-form-input" placeholder="Initial enterprise pilot provisioning." maxLength={2000} disabled={busy} value={form.notes} onChange={event => change('notes',event.target.value)} /></label>
      <p>Gmail được phép. Domain có thể dùng chung; slug phải duy nhất. Inactive khóa doanh nghiệp và ngăn chấp nhận lời mời.</p>
      <div className="flex gap-3"><button className="sa-btn sa-btn-primary" disabled={busy}>{busy?'Đang lưu…':'Create Account'}</button><button type="button" className="sa-btn" disabled={busy} onClick={() => { setForm(empty());setError('');slugEdited.current=false;domainEdited.current=false;requestId.current=crypto.randomUUID() }}>Reset Fields</button><button type="button" className="sa-btn" disabled={busy} onClick={() => onNavigate('sa-company-mgmt')}>Cancel</button></div>
    </form>
  </section>
}
