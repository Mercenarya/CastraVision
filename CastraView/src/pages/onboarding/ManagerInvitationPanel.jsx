import { useEffect, useState } from 'react'
import { platformService } from '../../services/platform'

export default function ManagerInvitationPanel({ auth, service=platformService }) {
  const [items,setItems]=useState(null)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  useEffect(() => {
    let active=true
    service.myInvitations().then(data => { if(active)setItems(data.items) }).catch(cause => { if(active)setError(cause.message) })
    return () => { active=false }
  },[service,auth.user.id])
  async function accept(id) {
    if(busy)return
    setBusy(true);setError('')
    try { await service.acceptInvitation(id); await auth.refreshMembership();const data=await service.myInvitations();setItems(data.items) }
    catch(cause){setError(cause.message)}
    finally{setBusy(false)}
  }
  const requested=new URLSearchParams(window.location.search).has('platformInvitationId')
  if(items?.length===0&&!error&&!requested)return null
  return <section className="space-y-4 rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Lời mời quản trị doanh nghiệp</h2>
    {error&&<p role="alert">{error}</p>}
    {!items&&!error&&<p role="status">Đang kiểm tra lời mời quản trị…</p>}
    {items?.length===0&&!error&&<p>Không có lời mời quản trị hợp lệ cho email này. Lời mời có thể đã hết hạn, bị thu hồi hoặc doanh nghiệp đang tạm khóa; hãy liên hệ người vận hành.</p>}
    {items?.map(item=><article key={item.id} className="rounded-lg border border-border p-4"><h3>{item.companyName}</h3><p>Marketing Manager · {item.status}</p>{item.status==='pending'&&<button className="mt-2 rounded bg-primary p-2 text-primary-foreground" disabled={busy} onClick={()=>accept(item.id)}>Chấp nhận quản trị doanh nghiệp</button>}</article>)}
  </section>
}
