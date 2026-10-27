import { useState } from 'react'
import PropTypes from 'prop-types'
import { Check, ClipboardList, Eye, FileText, LayoutGrid, Plus, ScrollText, Settings, ShieldCheck, Users, Wallet } from 'lucide-react'
import PageIntro from '@/components/PageIntro'
import Panel from '@/components/Panel'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const INITIAL_PENDING = [
  ['PRP-8402', 'Nội dung đa kênh Q4', 'CONTENT', 'AI Content Engine · Mai Lan'],
  ['PRP-8403', 'Tái phân bổ ngân sách động', 'BUDGET', 'Budget Optimizer · Hà Ngọc Minh'],
  ['PRP-8404', 'Chuỗi nội dung nuôi dưỡng', 'CONTENT', 'AI Content Engine · Mai Lan'],
]

function KpiCard({ label, title, icon: Icon, text, link, onClick, children }) {
  return (
    <Card className="min-h-[164px] gap-0 p-[18px]">
      <span className="text-[11px] font-extrabold tracking-[0.05em] text-muted-foreground uppercase">{label}</span>
      <div className="mt-2.5 flex items-center justify-between gap-2.5">
        <strong className="font-serif text-lg">{title}</strong>
        <i className="grid size-[34px] place-items-center rounded-md bg-[#202a40] text-info"><Icon className="size-4" /></i>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{text}</p>
      {children}
      {link && <button type="button" className="mt-auto w-fit text-left text-xs text-[#b8b0ff]" onClick={onClick}>{link}</button>}
    </Card>
  )
}

KpiCard.propTypes = {
  label: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  text: PropTypes.string.isRequired,
  link: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
}

function HealthMeter({ label, value, percent, green }) {
  return (
    <div className="my-3.5">
      <span className="flex justify-between text-xs"><b>{label}</b><em className="text-muted-foreground not-italic">{value}</em></span>
      <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-background">
        <i className={cn('block h-full', green ? 'bg-[#26c96b]' : 'bg-[#4ed8f5]')} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

HealthMeter.propTypes = { label: PropTypes.string, value: PropTypes.string, percent: PropTypes.number, green: PropTypes.bool }

export default function AdminDashboardPage({ profile, imports = [], setPage, notify }) {
  const [pending, setPending] = useState(INITIAL_PENDING)
  const audit = [
    ['FR06 RBAC', 'Đổi vai trò: Mai Lan được nâng lên Manager', '14 phút trước', 'Lê Thành Đạt · Admin'],
    ['FR04 APPROVAL', 'Đã phê duyệt PRP-8401 Creative Retargeting', '1 giờ trước', 'Hà Ngọc Minh · Manager'],
    ['FR06 INVITE', 'Đã mời content@demo.castravision.vn', '3 giờ trước', 'Lê Thành Đạt · Admin'],
    ['FR08 IMPORT', `Đã nhập dữ liệu chiến dịch (${imports.length || 3} nguồn)`, '5 giờ trước', 'Hà Ngọc Minh · Manager'],
  ]

  function approve(id) {
    setPending((current) => current.filter((row) => row[0] !== id))
    notify?.(`${id} đã được phê duyệt và ghi vào Audit Log.`)
  }

  return (
    <>
      <PageIntro
        code="ADMIN · LIVE NODE"
        title="Admin Console"
        subtitle={`Quản trị ${profile.business_name}, phân quyền thành viên, phê duyệt đề xuất và giám sát nhật ký tuân thủ.`}
        action={
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button type="button" variant="secondary" onClick={() => setPage('members')}><Users /> Mời thành viên</Button>
            <Button type="button" variant="secondary" onClick={() => setPage('roles')}><ShieldCheck /> Quản lý vai trò</Button>
            <Button type="button" onClick={() => notify?.('Tính năng tạo Workspace mới đã sẵn sàng để kết nối API.')}><Plus /> Tạo Workspace</Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Workspace hiện tại" title={profile.business_name} icon={LayoutGrid} text={`${profile.industry || 'Doanh nghiệp'} · ${profile.business_size || 'SME'}`}>
          <small className="mt-1 text-xs text-muted-foreground">Trạng thái <b className="text-success">Active</b></small>
        </KpiCard>
        <KpiCard label="Thành viên Workspace" title="4 thành viên" icon={Users} text="1 Admin · 1 Manager · 2 Member" link="Quản lý thành viên →" onClick={() => setPage('members')} />
        <KpiCard label="Đang chờ phê duyệt" title={`${pending.length} đề xuất`} icon={Check} text="Content và Budget cần ký duyệt" link="Mở hàng chờ →" onClick={() => setPage('approvals')} />
        <KpiCard label="Audit events · 24h" title="48 sự kiện" icon={ScrollText} text="100% được ghi nhận bằng hash" link="Xem Audit Log →" onClick={() => setPage('audit')} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
        <div>
          <Panel title="Quản lý Workspace & sức khỏe tài nguyên" meta="Active · Healthy">
            <div className="p-5">
              <div className="mb-[18px] grid gap-3 sm:grid-cols-2">
                <span className="rounded-[7px] bg-[#1a2336] p-3"><small className="mb-1 block text-muted-foreground">Đơn vị tổ chức</small><strong>{profile.business_name}</strong></span>
                <span className="rounded-[7px] bg-[#1a2336] p-3"><small className="mb-1 block text-muted-foreground">Gói đang dùng</small><strong>SME Pro</strong></span>
              </div>
              <HealthMeter label="AI Engine orchestration" value="68% capacity" percent={68} />
              <HealthMeter label="Audit ledger throughput" value="Optimal · 0,24ms" percent={92} green />
              <div className="mt-5 flex flex-wrap gap-2">
                <Button type="button" size="sm" className="rounded-full bg-[#6f63ea] text-white hover:bg-[#6f63ea]/90" onClick={() => setPage('members')}><Users /> Thành viên</Button>
                <Button type="button" size="sm" className="rounded-full bg-[#6f63ea] text-white hover:bg-[#6f63ea]/90" onClick={() => setPage('roles')}><LayoutGrid /> Ma trận quyền</Button>
                <Button type="button" size="sm" className="rounded-full bg-[#6f63ea] text-white hover:bg-[#6f63ea]/90" onClick={() => setPage('profile')}><Settings /> Cài đặt Workspace</Button>
              </div>
            </div>
          </Panel>
          <Panel title="Governance đang chờ phê duyệt · FR04" meta={`${pending.length} pending review`}>
            <div className="px-4 pt-2.5 pb-4">
              {pending.length ? (
                pending.map(([id, title, type, author]) => (
                  <article key={id} className="flex flex-wrap items-center gap-3 border-b px-2 py-3 last:border-b-0">
                    <span className="grid size-9 place-items-center rounded-md bg-[#202b40] text-[#54dbf7]">{type === 'BUDGET' ? <Wallet className="size-4" /> : <FileText className="size-4" />}</span>
                    <div className="grid min-w-0 flex-1">
                      <small className="text-[11px] text-muted-foreground">{id} · {type}</small>
                      <strong>{title}</strong>
                      <span className="text-[11px] text-muted-foreground">{author}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setPage('approvals')}><Eye /> Xem xét</Button>
                      <Button type="button" size="sm" className="bg-[#25ad64] text-white hover:bg-[#25ad64]/90" onClick={() => approve(id)}>Phê duyệt</Button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="p-7 text-center text-[#5ee59a]">✓ Không còn đề xuất chờ phê duyệt.</div>
              )}
            </div>
          </Panel>
        </div>

        <Panel title="Audit Trail gần đây · FR11" meta="● Live">
          <div className="px-3.5 py-2.5">
            {audit.map(([code, text, time, actor]) => (
              <article key={code + time} className="border-b py-3 last:border-b-0">
                <div className="flex items-center justify-between">
                  <StatusBadge tone={code.includes('APPROVAL') ? 'admin' : code.includes('IMPORT') ? 'active' : 'manager'}>{code}</StatusBadge>
                  <time className="text-[11px] text-muted-foreground">{time}</time>
                </div>
                <p className="my-2 text-[13px]">{text}</p>
                <small className="text-[11px] text-muted-foreground">◎ {actor}</small>
              </article>
            ))}
          </div>
          <Button type="button" variant="secondary" className="mx-3.5 mb-3.5 w-[calc(100%-28px)]" onClick={() => setPage('audit')}>
            <ClipboardList /> Xem toàn bộ Audit Log
          </Button>
        </Panel>
      </div>
    </>
  )
}

AdminDashboardPage.propTypes = {
  profile: PropTypes.shape({ business_name: PropTypes.string, industry: PropTypes.string, business_size: PropTypes.string }).isRequired,
  imports: PropTypes.array,
  setPage: PropTypes.func.isRequired,
  notify: PropTypes.func,
}
