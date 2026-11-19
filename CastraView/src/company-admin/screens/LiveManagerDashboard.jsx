import { Button } from '@/components/ui/button'

export default function LiveManagerDashboard({ query, membership, user, onNavigate, onInvite }) {
  const { data, loading, error, reload } = query
  return <section className="space-y-6">
    <div className="flex flex-wrap justify-between gap-4"><div><p className="text-info text-sm">QUẢN TRỊ DOANH NGHIỆP</p><h1 className="text-3xl font-semibold">Marketing Manager Dashboard</h1><p>{membership.workspaceName}</p></div><div className="flex gap-2"><Button onClick={onInvite}>Mời nhân sự</Button><Button variant="outline" onClick={() => onNavigate('profile')}>Cài đặt doanh nghiệp</Button><Button variant="outline" onClick={reload}>Làm mới</Button></div></div>
    {loading && <p role="status">Đang tải dữ liệu doanh nghiệp…</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {data && <><div className="grid gap-4 md:grid-cols-4">{[
      ['Doanh nghiệp hiện tại', membership.workspaceName],
      ['Thành viên hiện có', data.admins + data.leaders + data.employees],
      ['Đề xuất đang chờ duyệt', data.pending],
      ['Sự kiện nhật ký 30 ngày UTC', data.recent.total],
    ].map(([label, value]) => <article key={label} className="rounded-xl border border-border bg-card p-5"><p className="text-muted-foreground text-sm">{label}</p><strong className="text-2xl">{value}</strong></article>)}</div>
      <article className="rounded-xl border border-border bg-card p-5 space-y-3"><h2 className="text-xl font-semibold">Thành viên & phạm vi hoạt động</h2><p>{data.admins} Marketing Manager · {data.leaders} Leader · {data.employees} Employee</p><p>Người đang đăng nhập: {user.full_name || user.email}</p><p className="text-muted-foreground">Số thành viên là membership hiện có, không suy ra trạng thái online. Đề xuất chờ duyệt tính theo trạng thái pending hiện tại.</p><div className="flex gap-2"><Button onClick={() => onNavigate('members')}>Quản lý nhân sự</Button><Button onClick={() => onNavigate('approvals')}>Hàng đợi duyệt</Button></div></article>
      <article className="rounded-xl border border-border bg-card p-5 space-y-3"><h2 className="text-xl font-semibold">Nhật ký gần đây</h2>{data.recent.items.length ? data.recent.items.map(log => <p key={log.id}>{new Date(log.created_at).toLocaleString('vi-VN')} · {log.action} · {log.entity_type}</p>) : <p>Chưa có sự kiện trong khoảng thời gian này.</p>}<Button variant="outline" onClick={() => onNavigate('audit')}>Xem nhật ký</Button></article>
    </>}
  </section>
}
