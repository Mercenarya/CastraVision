import PageIntro from '@/components/PageIntro'
import Panel from '@/components/Panel'
import StatusBadge from '@/components/StatusBadge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const ROLES = ['Admin', 'Manager', 'Member']
const CAPABILITIES = [
  ['Cài đặt Workspace & hồ sơ', 'Toàn quyền', 'Không có', 'Không có'],
  ['Mời thành viên & gán vai trò', 'Toàn quyền', 'Chỉ xem', 'Không có'],
  ['Phê duyệt đề xuất FR04', 'Được phép', 'Được phép', 'Không có'],
  ['Nhật ký kiểm toán FR11', 'Xem & xuất', 'Chỉ xem', 'Không có'],
  ['Nhập dữ liệu chiến dịch FR08', 'Toàn quyền', 'Toàn quyền', 'Được phép'],
  ['Tạo nội dung & chiến lược', 'Được phép', 'Được phép', 'Được phép'],
]
const ROLE_CARDS = [
  ['Admin', 'Quyền cao nhất', 'Quản trị Workspace, vòng đời người dùng, bảo mật và phê duyệt tài chính.'],
  ['Manager', 'Governance', 'Rà soát, chỉnh sửa và phê duyệt các đầu ra marketing do AI tạo.'],
  ['Member', 'Execution', 'Tạo chiến lược, nội dung và nhập dữ liệu trong phạm vi được giao.'],
]

export default function RoleManagementPage() {
  return (
    <>
      <PageIntro
        code="FR06 · ROLE-BASED ACCESS CONTROL"
        title="Quản lý vai trò & quyền RBAC"
        subtitle="Rà soát ranh giới bảo mật giữa Admin, Manager và Member."
      />
      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        {ROLE_CARDS.map(([role, tier, description]) => (
          <Card key={role} className="gap-3 p-5">
            <div><StatusBadge tone={role.toLowerCase()}>{role} · {tier}</StatusBadge></div>
            <h2 className="font-serif text-2xl">{role} Role</h2>
            <p className="min-h-16 text-muted-foreground">{description}</p>
            <ul className="space-y-3 text-[#cbd3e7]">
              {CAPABILITIES.filter((row) => row[ROLES.indexOf(role) + 1] !== 'Không có').slice(0, 4).map((row) => <li key={row[0]}>✓ {row[0]}</li>)}
            </ul>
          </Card>
        ))}
      </div>
      <Panel title="Ma trận năng lực chi tiết" meta="Enforced by API & UI">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-background/60 hover:bg-background/60">
              {['Phạm vi chức năng', ...ROLES].map((h) => <TableHead key={h} className="px-4 text-[11px] tracking-wider uppercase">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {CAPABILITIES.map((row) => (
              <TableRow key={row[0]}>
                {row.map((cell, index) => (
                  <TableCell key={index} className={cn('px-4 py-3.5', index > 0 && (cell === 'Không có' ? 'text-[#ff9898]' : 'text-[#59ddf8]'))}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  )
}
