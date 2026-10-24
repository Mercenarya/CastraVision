import { useState } from 'react'
import PropTypes from 'prop-types'
import { TriangleAlert } from 'lucide-react'
import Field from '@/components/Field'
import MiniLabel from '@/components/MiniLabel'
import PageIntro from '@/components/PageIntro'
import Panel from '@/components/Panel'
import PolicyBanner from '@/components/PolicyBanner'
import StatusBadge from '@/components/StatusBadge'
import SummaryGrid from '@/components/SummaryGrid'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const INITIAL_PROPOSALS = [
  { id: 'PRP-8402', title: 'Nội dung đa kênh Q4', type: 'Content', author: 'AI Content Engine', status: 'pending' },
  { id: 'PRP-8403', title: 'Tái phân bổ ngân sách động', type: 'Budget', author: 'Budget Optimizer', status: 'pending' },
  { id: 'PRP-8404', title: 'Chuỗi nội dung nuôi dưỡng khách hàng', type: 'Content', author: 'Mai Lan', status: 'edited' },
  { id: 'PRP-8401', title: 'Creative Retargeting', type: 'Content', author: 'Creative Engine', status: 'approved' },
]
const FILTERS = ['all', 'pending', 'approved', 'rejected']

export default function ApprovalQueuePage({ notify }) {
  const [rows, setRows] = useState(INITIAL_PROPOSALS)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const visible = rows.filter((row) => filter === 'all' || row.status === filter)
  const countOf = (status) => rows.filter((row) => row.status === status).length

  function setStatus(id, status) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)))
    setSelected(null)
    notify?.(`${id} đã được ${status === 'approved' ? 'phê duyệt' : 'từ chối'}.`)
  }

  function reject(event) {
    event.preventDefault()
    setStatus(rejecting.id, 'rejected')
    setRejecting(null)
    setReason('')
  }

  return (
    <>
      <PageIntro
        code="FR04 · GOVERNANCE ENGINE"
        title="Hàng chờ phê duyệt"
        subtitle="Rà soát đề xuất nội dung và ngân sách trước khi triển khai chiến dịch."
        action={<StatusBadge tone="manager">Manager access</StatusBadge>}
      />
      <PolicyBanner>
        <span><b>Kiểm soát truy cập đang hoạt động.</b> Admin và Manager có thể rà soát, chỉnh sửa, phê duyệt hoặc từ chối. Member không có quyền truy cập.</span>
      </PolicyBanner>
      <SummaryGrid
        items={[
          { value: rows.length, label: 'Tổng đề xuất' },
          { value: countOf('pending'), label: 'Chờ duyệt' },
          { value: countOf('approved'), label: 'Đã duyệt' },
          { value: countOf('rejected'), label: 'Từ chối' },
        ]}
      />
      <Panel title="Danh sách đề xuất" meta={`${visible.length} bản ghi`}>
        <div className="flex gap-1.5 px-4 py-3.5">
          {FILTERS.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setFilter(item)}
              className={cn('rounded-md bg-[#222b3f] px-3 py-2 text-[#bdc6dc]', filter === item && 'bg-[#7569ed] text-white')}
            >
              {item === 'all' ? 'Tất cả' : item}
            </button>
          ))}
        </div>
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-background/60 hover:bg-background/60">
              {['Mã & đề xuất', 'Loại', 'Người tạo / Engine', 'Trạng thái', 'Thao tác'].map((h) => <TableHead key={h} className="px-4 text-[11px] tracking-wider uppercase">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-3.5"><strong className="block">{row.title}</strong><small className="text-muted-foreground">{row.id}</small></TableCell>
                <TableCell className="px-4"><StatusBadge tone={row.type === 'Budget' ? 'manager' : 'admin'}>{row.type}</StatusBadge></TableCell>
                <TableCell className="px-4">{row.author}</TableCell>
                <TableCell className="px-4"><StatusBadge tone={row.status}>{row.status}</StatusBadge></TableCell>
                <TableCell className="px-4"><Button type="button" variant="outline" size="sm" onClick={() => setSelected(row)}>Xem xét</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      {selected && (
        <Panel title={`Đánh giá ${selected.id}`} meta="Human-in-the-loop">
          <div className="grid gap-5 p-5 md:grid-cols-[2fr_1fr]">
            <div>
              <MiniLabel>ĐỀ XUẤT</MiniLabel>
              <h3 className="my-2 text-lg font-semibold">{selected.title}</h3>
              <p className="text-muted-foreground">Mô hình đề xuất tối ưu theo dữ liệu 30 ngày gần nhất. Mọi quyết định sẽ được ghi vào FR11 Audit Log.</p>
            </div>
            <div>
              <MiniLabel>POLICY CHECK</MiniLabel>
              <strong className="mt-2 block text-success">12 / 12 điều kiện đạt</strong>
            </div>
            <div className="flex flex-wrap justify-end gap-2.5 md:col-span-full">
              <Button type="button" variant="secondary" onClick={() => setSelected(null)}>Đóng</Button>
              <Button type="button" variant="coral" onClick={() => { setRejecting(selected); setSelected(null) }}>Từ chối</Button>
              <Button type="button" onClick={() => setStatus(selected.id, 'approved')}>✓ Phê duyệt</Button>
            </div>
          </div>
        </Panel>
      )}

      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent className="max-w-[560px] gap-0 p-6">
          <form onSubmit={reject}>
            <DialogHeader>
              <span className="grid size-11 place-items-center rounded-lg bg-[#ba1730]"><TriangleAlert /></span>
              <DialogTitle className="mt-3 text-2xl">Từ chối đề xuất</DialogTitle>
              <DialogDescription>Nhập lý do bắt buộc. Người tạo sẽ được thông báo.</DialogDescription>
            </DialogHeader>
            <Field label="Lý do từ chối" className="my-4">
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} required />
            </Field>
            <div className="flex justify-end gap-2.5">
              <Button type="button" variant="secondary" onClick={() => setRejecting(null)}>Hủy</Button>
              <Button type="submit" variant="coral">Từ chối đề xuất</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

ApprovalQueuePage.propTypes = { notify: PropTypes.func }
