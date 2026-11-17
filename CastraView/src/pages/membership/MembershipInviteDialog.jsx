import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import MutationDialog from './MutationDialog'

export default function MembershipInviteDialog({ teams, service, onClose, onSaved }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [teamId, setTeamId] = useState('')
  return <MutationDialog title="Mời nhân sự" description="Người nhận tự xác thực email và đặt mật khẩu. Bạn không cần biết mật khẩu của họ." submitLabel="Lưu và gửi lời mời" onClose={onClose} onSubmit={async () => {
    const invitation = await service.createInvitation({ email, role, teamId: teamId || null })
    if (invitation.deliveryStatus !== 'sent') { await onSaved('Lời mời đã lưu; email chưa gửi thành công.'); throw new Error('Lời mời đã lưu nhưng email chưa gửi thành công. Hãy kiểm tra tab Lời mời để gửi lại.') }
    await onSaved('Đã gửi yêu cầu chuyển email mời. Người nhận cần chấp nhận trước khi vào công ty.')
  }}>
    <label className="grid gap-2 text-sm">Email nhân sự<Input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="nhanvien@gmail.com" /></label>
    <label className="grid gap-2 text-sm">Vai trò<NativeSelect value={role} onChange={e => setRole(e.target.value)}><option value="member">Employee</option><option value="manager">Leader</option></NativeSelect></label>
    <label className="grid gap-2 text-sm">Nhóm<NativeSelect value={teamId} onChange={e => setTeamId(e.target.value)}><option value="">Chưa phân nhóm</option>{teams.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</NativeSelect></label>
  </MutationDialog>
}
