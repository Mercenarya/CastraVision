import { useState } from 'react'
import PropTypes from 'prop-types'
import { UserPlus, Users } from 'lucide-react'
import Field from '@/components/Field'
import PageIntro from '@/components/PageIntro'
import Panel from '@/components/Panel'
import PolicyBanner from '@/components/PolicyBanner'
import StatusBadge from '@/components/StatusBadge'
import SummaryGrid from '@/components/SummaryGrid'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const INITIAL_MEMBERS = [
  { avatar: 'LT', name: 'Lê Thành Đạt', email: 'lthanhdat85@gmail.com', role: 'Admin', status: 'active' },
  { avatar: 'HN', name: 'Hà Ngọc Minh', email: 'manager@demo.castravision.vn', role: 'Manager', status: 'active' },
  { avatar: 'ML', name: 'Mai Lan', email: 'member@demo.castravision.vn', role: 'Member', status: 'active' },
  { avatar: 'TN', name: 'Trần Ngọc', email: 'content@demo.castravision.vn', role: 'Member', status: 'pending' },
]
const ROLE_NOTE = { Admin: 'Toàn quyền quản trị', Manager: 'Điều hành và phê duyệt', Member: 'Thực thi nội dung' }
const ROLE_SCOPE = {
  Admin: 'Toàn quyền, RBAC, phê duyệt, audit',
  Manager: 'Chiến dịch, phê duyệt, báo cáo',
  Member: 'Chiến lược, nội dung, nhập dữ liệu',
}

export default function MembersPage({ profile, notify }) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Manager')
  const [rows, setRows] = useState(INITIAL_MEMBERS)
  const countOf = (value) => rows.filter((row) => row.role === value).length

  function invite(event) {
    event.preventDefault()
    setRows((current) => [...current, { avatar: 'NEW', name: email.split('@')[0], email, role, status: 'pending' }])
    setInviteOpen(false)
    setEmail('')
    notify?.(`Đã tạo lời mời cho ${email}.`)
  }

  return (
    <>
      <PageIntro
        code="FR06 · RBAC ENGINE"
        title="Thành viên Workspace & kiểm soát truy cập"
        subtitle="Quản lý thành viên, vai trò và phạm vi quyền trong từng Workspace."
        action={<Button type="button" size="lg" onClick={() => setInviteOpen(true)}><UserPlus /> Mời thành viên</Button>}
      />
      <SummaryGrid
        items={[
          { value: rows.length, label: 'Tổng thành viên' },
          { value: countOf('Admin'), label: 'Admin' },
          { value: countOf('Manager'), label: 'Manager' },
          { value: countOf('Member'), label: 'Member' },
        ]}
      />
      <Panel title={profile.business_name} meta="Active member directory">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-background/60 hover:bg-background/60">
              {['Thành viên', 'Vai trò', 'Trạng thái', 'Quyền chính'].map((h) => <TableHead key={h} className="px-4 text-[11px] tracking-wider uppercase">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.email}>
                <TableCell className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <b className="grid size-9 place-items-center rounded-[7px] bg-[#685cf4] text-xs">{row.avatar}</b>
                    <span className="grid"><strong>{row.name}</strong><small className="text-muted-foreground">{row.email}</small></span>
                  </div>
                </TableCell>
                <TableCell className="px-4"><StatusBadge tone={row.role.toLowerCase()}>{row.role}</StatusBadge></TableCell>
                <TableCell className="px-4"><StatusBadge tone={row.status}>{row.status === 'active' ? 'Đang hoạt động' : 'Chờ đăng ký'}</StatusBadge></TableCell>
                <TableCell className="px-4 text-[13px]">{ROLE_SCOPE[row.role]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <PolicyBanner tone="coral"><span><b>Chính sách bảo vệ:</b> Không thể xóa Admin cuối cùng khỏi Workspace.</span></PolicyBanner>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-[560px] gap-0 p-6">
          <form onSubmit={invite}>
            <DialogHeader>
              <span className="grid size-11 place-items-center rounded-lg bg-[#685cf4]"><Users /></span>
              <DialogTitle className="mt-3 text-2xl">Mời thành viên mới</DialogTitle>
              <DialogDescription>Cấp quyền truy cập vào {profile.business_name} theo vai trò.</DialogDescription>
            </DialogHeader>
            <Field label="Email thành viên" className="mt-4">
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required />
            </Field>
            <fieldset className="my-4">
              <legend className="text-xs font-bold text-[#cbd3e7]">Vai trò được cấp</legend>
              {Object.keys(ROLE_NOTE).map((item) => (
                <label key={item} className={cn('mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-[#34415d] p-3', role === item && 'border-[#776cff] bg-[#182444]')}>
                  <input type="radio" name="role" value={item} checked={role === item} onChange={() => setRole(item)} />
                  <span className="flex flex-col"><strong>{item}</strong><small className="text-muted-foreground">{ROLE_NOTE[item]}</small></span>
                </label>
              ))}
            </fieldset>
            <div className="flex justify-end gap-2.5">
              <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Hủy</Button>
              <Button type="submit">Gửi lời mời</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

MembersPage.propTypes = { profile: PropTypes.shape({ business_name: PropTypes.string }).isRequired, notify: PropTypes.func }
