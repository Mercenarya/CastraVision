import { Download } from 'lucide-react'
import PageIntro from '@/components/PageIntro'
import Panel from '@/components/Panel'
import StatusBadge from '@/components/StatusBadge'
import SummaryGrid from '@/components/SummaryGrid'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const EVENTS = [
  ['14:48:22', 'Hà Ngọc Minh', 'Đã phê duyệt', 'PRP-8402', 'FR04 Approvals'],
  ['14:38:10', 'Hà Ngọc Minh', 'Đã chỉnh sửa', 'PRP-8402', 'FR04 Approvals'],
  ['13:15:00', 'Lê Thành Đạt', 'Đổi vai trò', 'Mai Lan', 'FR06 RBAC'],
  ['11:05:44', 'Lê Thành Đạt', 'Mời thành viên', 'content@demo.castravision.vn', 'FR06 Workspace'],
  ['10:12:00', 'Hà Ngọc Minh', 'Nhập dữ liệu', 'campaign_q4.xlsx', 'FR08 Import'],
]

export default function AuditLogPage() {
  return (
    <>
      <PageIntro
        code="FR11 · IMMUTABLE LEDGER"
        title="Nhật ký kiểm toán hệ thống"
        subtitle="Theo dõi hành động, thay đổi vai trò và quyết định phê duyệt trong Workspace."
        action={<Button type="button" variant="secondary" size="lg"><Download /> Xuất CSV</Button>}
      />
      <SummaryGrid
        items={[
          { value: '1.482', label: 'Sự kiện 30 ngày' },
          { value: '100%', label: 'Toàn vẹn dữ liệu', valueClass: 'text-success' },
          { value: '3', label: 'Người vận hành' },
          { value: '9b4f…aa03', label: 'Hash cuối', valueClass: 'font-mono text-info' },
        ]}
      />
      <Panel title="Audit events" meta="SHA-256 verified">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-background/60 hover:bg-background/60">
              {['Thời gian', 'Actor', 'Hành động', 'Đối tượng', 'Module'].map((h) => <TableHead key={h} className="px-4 text-[11px] tracking-wider uppercase">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {EVENTS.map(([time, actor, action, target, module]) => (
              <TableRow key={`${time}-${target}`}>
                <TableCell className="px-4 py-3.5 font-mono text-info">{time} UTC</TableCell>
                <TableCell className="px-4">{actor}</TableCell>
                <TableCell className="px-4"><StatusBadge tone={action.includes('phê') ? 'approved' : 'manager'}>{action}</StatusBadge></TableCell>
                <TableCell className="px-4">{target}</TableCell>
                <TableCell className="px-4">{module}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <footer className="flex justify-between px-4 py-3.5 text-xs text-[#48db83]">
          <span>● Tất cả hash đã xác minh</span>
          <span>Retention: 7 năm</span>
        </footer>
      </Panel>
    </>
  )
}
