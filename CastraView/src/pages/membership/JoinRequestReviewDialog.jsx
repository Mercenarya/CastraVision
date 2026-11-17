import { useState } from 'react'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import MutationDialog from './MutationDialog'

export default function JoinRequestReviewDialog({ request, decision, teams, service, onClose, onSaved }) {
  const [teamId, setTeamId] = useState('')
  const [reason, setReason] = useState('')
  const approve = decision === 'approve'
  return <MutationDialog title={approve ? 'Duyệt gia nhập công ty' : 'Từ chối yêu cầu'} description={`${request.applicantName || 'Người đăng ký'} · ${request.applicantEmail}`} onClose={onClose} destructive={!approve} submitLabel={approve ? 'Duyệt và cấp Employee' : 'Xác nhận từ chối'} onSubmit={async () => {
    await service.reviewJoinRequest(request.id, { decision, teamId: teamId || null, reason })
    await onSaved(approve ? 'Đã cấp quyền Employee.' : 'Đã từ chối yêu cầu.')
  }}>
    {approve ? <><p className="text-sm text-muted-foreground">Chỉ sau khi duyệt, người dùng mới có quyền truy cập Workspace này.</p><label className="grid gap-2 text-sm">Nhóm làm việc<NativeSelect value={teamId} onChange={e => setTeamId(e.target.value)}><option value="">Chưa phân nhóm</option>{teams.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</NativeSelect></label></> :
      <label className="grid gap-2 text-sm">Lý do từ chối<Textarea required maxLength={500} value={reason} onChange={e => setReason(e.target.value)} placeholder="Giải thích để người đăng ký biết cần bổ sung điều gì…" /></label>}
  </MutationDialog>
}
