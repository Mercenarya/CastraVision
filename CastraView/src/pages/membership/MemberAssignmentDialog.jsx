import { useState } from 'react'
import { NativeSelect } from '@/components/ui/native-select'
import MutationDialog from './MutationDialog'

export default function MemberAssignmentDialog({ member, teams, service, onClose, onSaved, remove = false }) {
  const [role, setRole] = useState(member.role)
  const [teamId, setTeamId] = useState(member.teamIds?.[0] || '')
  const [confirmed, setConfirmed] = useState(false)
  return <MutationDialog title={remove ? 'Thu hồi quyền vào công ty' : 'Vai trò và nhóm làm việc'} description={member.email} destructive={remove} onClose={onClose} submitLabel={remove ? 'Thu hồi membership' : 'Lưu phân công'} onSubmit={async () => {
    if (remove) { if (!confirmed) throw new Error('Cần xác nhận thu hồi quyền.'); await service.removeMember(member.userId) }
    else await service.updateMember(member.userId, { role, teamIds: teamId ? [teamId] : [] })
    await onSaved(remove ? 'Đã thu hồi quyền trong Workspace.' : 'Đã lưu phân công.')
  }}>
    {remove ? <label className="flex items-start gap-3 text-sm"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />Tôi xác nhận người này sẽ mất quyền vào Workspace; tài khoản đăng nhập vẫn được giữ.</label> : <>
      <label className="grid gap-2 text-sm">Vai trò<NativeSelect value={role} onChange={e => setRole(e.target.value)}><option value="member">Employee</option><option value="manager">Leader</option></NativeSelect></label>
      <label className="grid gap-2 text-sm">Nhóm<NativeSelect value={teamId} onChange={e => setTeamId(e.target.value)}><option value="">Chưa phân nhóm</option>{teams.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</NativeSelect></label>
    </>}
  </MutationDialog>
}
