import { useMemo, useState } from 'react'
import { MailPlus, RefreshCw, Search, Users, UserCheck, Clock3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Badge } from '@/components/ui/badge'
import { membershipService } from '@/services/membership'
import { ROLE_NAMES, STATUS_NAMES } from '@/services/membershipContract'
import { useMembershipWorkspace } from '@/hooks/useMembershipWorkspace'
import JoinRequestReviewDialog from './JoinRequestReviewDialog'
import MembershipInviteDialog from './MembershipInviteDialog'
import MemberAssignmentDialog from './MemberAssignmentDialog'
import RecruitmentSettingsPanel from './RecruitmentSettingsPanel'
import MutationDialog from './MutationDialog'
import TaskBoard from '../../member/TaskBoard'

const tabs = [{ id: 'members', label: 'Thành viên', icon: Users }, { id: 'requests', label: 'Chờ duyệt', icon: UserCheck }, { id: 'invitations', label: 'Lời mời', icon: MailPlus }]
const date = value => value ? new Date(value).toLocaleString('vi-VN') : '—'

export default function PersonnelPage({ workspaceId, userId, service = membershipService, notify, openInvite = false, onInviteClose = () => {}, initialTab = 'members', initialSearch = '' }) {
  const [showTasks, setShowTasks] = useState(false)
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState(initialSearch)
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [teamId, setTeamId] = useState('')
  const [offset, setOffset] = useState(0)
  const [action, setAction] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')
  const query = useMemo(() => ({ tab, search, role, status, teamId, sort: 'newest', limit: 20, offset }), [tab, search, role, status, teamId, offset])
  const { data, loading, error: loadError, refresh } = useMembershipWorkspace({ workspaceId, userId, service, query })
  const saved = async message => { await refresh(); notify?.(message) }
  function filter(setter, value) { setter(value); setOffset(0) }
  async function resend(id) {
    setError('')
    try {
      const result = await service.resendInvitation(id)
      await refresh()
      if (result.deliveryStatus !== 'sent') throw new Error('Email chưa gửi thành công. Lời mời vẫn được giữ để thử lại.')
      notify?.('Đã yêu cầu gửi lại email lời mời.')
    } catch (cause) { setError(cause.message) }
  }
  const close = () => { setAction(null); onInviteClose() }
  return <section className="min-h-full space-y-6 bg-background p-4 text-foreground md:p-8" aria-label="Quản lý nhân sự">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-info">FR06 · NHÂN SỰ VÀ QUYỀN TRUY CẬP</p><h1 className="text-2xl font-bold md:text-3xl">Thành viên & yêu cầu gia nhập</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Mời người dùng, xét duyệt và phân công trong Workspace đang chọn.</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => refresh()} aria-label="Làm mới nhân sự"><RefreshCw className="size-4" />Làm mới</Button><Button onClick={() => setAction({ kind: 'invite' })}><MailPlus className="size-4" />Mời nhân sự</Button></div>
    </header>
    <div className="rounded-xl border border-info/30 bg-info/10 p-4 text-sm">Xác thực email không tự cấp quyền. Yêu cầu chỉ có hiệu lực sau khi Marketing Manager duyệt; không thể cấp System Admin hoặc Marketing Manager tại đây.</div>
    <div className="flex flex-wrap gap-2 border-b border-border pb-3" role="tablist" aria-label="Danh sách nhân sự">
      {tabs.map(({ id, label, icon: Icon }) => <Button key={id} role="tab" aria-selected={tab === id} variant={tab === id ? 'default' : 'outline'} onClick={() => { setTab(id); setStatus(''); setOffset(0) }}><Icon className="size-4" />{label}</Button>)}
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="relative"><span className="sr-only">Tìm theo tên hoặc email</span><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={search} onChange={e => filter(setSearch, e.target.value)} className="pl-9" placeholder="Tìm tên hoặc email…" /></label>
      <label><span className="sr-only">Lọc vai trò</span><NativeSelect value={role} onChange={e => filter(setRole, e.target.value)}><option value="">Mọi vai trò</option><option value="admin">Marketing Manager</option><option value="manager">Leader</option><option value="member">Employee</option></NativeSelect></label>
      <label><span className="sr-only">Lọc nhóm</span><NativeSelect value={teamId} onChange={e => filter(setTeamId, e.target.value)}><option value="">Mọi nhóm</option>{data?.teams.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</NativeSelect></label>
      <label><span className="sr-only">Lọc trạng thái</span><NativeSelect value={status} disabled={tab === 'members'} onChange={e => filter(setStatus, e.target.value)}><option value="">Mọi trạng thái</option>{(tab === 'requests' ? ['pending', 'approved', 'rejected', 'cancelled'] : ['pending', 'accepted', 'revoked', 'expired']).map(x => <option key={x} value={x}>{STATUS_NAMES[x]}</option>)}</NativeSelect></label>
    </div>
    {(error || loadError) && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error || loadError}<Button variant="outline" className="ml-3" onClick={() => refresh()}>Thử lại</Button></div>}
    {loading ? <p role="status" className="p-8 text-center text-muted-foreground">Đang tải dữ liệu nhân sự…</p> : data && <>
      <div className="overflow-x-auto rounded-xl border border-border bg-card" role="tabpanel">
        <table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground"><tr><th className="p-4">Nhân sự / email</th><th className="p-4">Vai trò / trạng thái</th><th className="p-4">Thời điểm</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>
          {data.personnel.items.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-muted-foreground"><Clock3 className="mx-auto mb-3 size-7" />Không có dữ liệu phù hợp. Thử xóa bộ lọc hoặc mời nhân sự mới.</td></tr>}
          {data.personnel.items.map(item => <tr key={item.id || item.userId} className="border-b border-border last:border-0">
            <td className="max-w-xs p-4"><p className="font-medium">{item.name || item.applicantName || item.email || item.applicantEmail}</p><p className="break-all text-xs text-muted-foreground">{item.email || item.applicantEmail}</p>{item.message && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>}{item.rejectionReason && <p className="mt-2 text-xs text-destructive">{item.rejectionReason}</p>}</td>
            <td className="p-4"><Badge variant="outline">{tab === 'members' ? ROLE_NAMES[item.role] : STATUS_NAMES[item.status] || item.status}</Badge>{tab === 'invitations' && <><p className="mt-2 text-xs">{ROLE_NAMES[item.role]}</p><p className="text-xs text-muted-foreground">{item.deliveryStatus === 'sent' ? 'Đã yêu cầu gửi email' : item.deliveryStatus === 'failed' ? 'Lỗi gửi email' : 'Chưa gửi email'}</p></>}</td>
            <td className="p-4 text-xs text-muted-foreground">{date(item.joinedAt || item.requestedAt || item.lastSentAt)}{item.expiresAt && <p className="mt-1">Hạn: {date(item.expiresAt)}</p>}</td>
            <td className="p-4"><div className="flex justify-end gap-2">
              {tab === 'members' && (item.role === 'admin' ? <span className="text-xs text-muted-foreground">Cấp qua người vận hành</span> : <><Button size="sm" variant="outline" onClick={() => setAction({ kind: 'assign', item })}>Phân công</Button><Button size="sm" variant="outline" onClick={() => setAction({ kind: 'remove', item })}>Thu hồi</Button></>)}
              {tab === 'requests' && item.status === 'pending' && <><Button size="sm" onClick={() => setAction({ kind: 'review', decision: 'approve', item })}>Duyệt</Button><Button size="sm" variant="outline" onClick={() => setAction({ kind: 'review', decision: 'reject', item })}>Từ chối</Button></>}
              {tab === 'invitations' && item.status === 'pending' && <><Button size="sm" variant="outline" onClick={() => resend(item.id)}>Gửi lại</Button><Button size="sm" variant="outline" onClick={() => setAction({ kind: 'revoke', item })}>Thu hồi</Button></>}
            </div></td>
          </tr>)}
        </tbody></table>
        <footer className="flex items-center justify-between gap-3 p-4 text-sm"><span className="text-muted-foreground">{data.personnel.total} bản ghi · Trang {Math.floor(offset / 20) + 1}</span><div className="flex gap-2"><Button variant="outline" disabled={!offset} onClick={() => setOffset(x => Math.max(0, x - 20))}>Trước</Button><Button variant="outline" disabled={offset + 20 >= data.personnel.total} onClick={() => setOffset(x => x + 20)}>Sau</Button></div></footer>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-2"><RecruitmentSettingsPanel key={JSON.stringify(data.recruitment)} settings={data.recruitment} service={service} onSaved={saved} /><div className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Nhóm làm việc</h2><p className="my-3 text-sm text-muted-foreground">{data.teams.length ? data.teams.map(x => x.name).join(' · ') : 'Chưa có nhóm. Bạn vẫn có thể duyệt ở cấp Workspace.'}</p><Button variant="outline" onClick={() => { setTeamName(''); setAction({ kind: 'team' }) }}>Tạo nhóm</Button></div></div>
      <div className="space-y-4"><Button variant="outline" onClick={() => setShowTasks(value => !value)}>{showTasks ? 'Đóng giao việc' : 'Giao nhiệm vụ theo chiến dịch'}</Button>{showTasks && <TaskBoard operator />}</div>
      {(openInvite || action?.kind === 'invite') && <MembershipInviteDialog teams={data.teams} service={service} onClose={close} onSaved={saved} />}
      {action?.kind === 'review' && <JoinRequestReviewDialog request={action.item} decision={action.decision} teams={data.teams} service={service} onClose={close} onSaved={saved} />}
      {['assign', 'remove'].includes(action?.kind) && <MemberAssignmentDialog member={action.item} remove={action.kind === 'remove'} teams={data.teams} service={service} onClose={close} onSaved={saved} />}
      {action?.kind === 'revoke' && <MutationDialog title="Thu hồi lời mời" description={action.item.email} destructive onClose={close} submitLabel="Thu hồi" onSubmit={async () => { await service.revokeInvitation(action.item.id); await saved('Đã thu hồi lời mời.') }}><p className="text-sm">Liên kết này sẽ không còn cấp membership.</p></MutationDialog>}
      {action?.kind === 'team' && <MutationDialog title="Tạo nhóm làm việc" description="Nhóm chỉ thuộc Workspace hiện tại." onClose={close} onSubmit={async () => { await service.createTeam({ name: teamName }); await saved('Đã tạo nhóm.') }}><label className="grid gap-2 text-sm">Tên nhóm<Input required maxLength={80} value={teamName} onChange={e => setTeamName(e.target.value)} /></label></MutationDialog>}
    </>}
  </section>
}
