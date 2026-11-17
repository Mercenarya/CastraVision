import PropTypes from 'prop-types'

import PageIntro from '@/components/PageIntro'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const ROLE_CONTENT = {
  admin: {
    eyebrow: 'ADMIN · WORKSPACE OVERVIEW',
    title: 'Admin Console',
    subtitle: 'Quản lý hồ sơ và các đầu vào marketing được hỗ trợ trong Workspace.',
    intro: 'Điều phối hồ sơ doanh nghiệp, dữ liệu chiến dịch và chiến lược trước khi chia sẻ nội bộ.',
    actions: [
      ['profile', 'Hồ sơ doanh nghiệp', 'Cập nhật thông tin dùng để cá nhân hóa đề xuất.'],
      ['import', 'Nhập dữ liệu chiến dịch', 'Kiểm tra và lưu CSV/XLSX qua API hiện có.'],
      ['strategy', 'Tạo chiến lược', 'Sinh đề xuất từ hồ sơ và dữ liệu lịch sử.'],
      ['content', 'Content Studio', 'Biên tập bản nháp mẫu từ chiến lược hiện tại.'],
    ],
  },
  manager: {
    eyebrow: 'MANAGER · PERFORMANCE WORKSPACE',
    title: 'Dashboard hiệu suất',
    subtitle: 'Theo dõi đầu vào chiến dịch và xây dựng đề xuất marketing có thể hành động.',
    intro: 'Dữ liệu hiệu suất trực tiếp chưa được backend hiện tại cung cấp; hãy bắt đầu từ dữ liệu chiến dịch đã xác thực.',
    actions: [
      ['import', 'Nhập dữ liệu chiến dịch', 'Kiểm tra và lưu dữ liệu hiệu suất trước khi phân tích.'],
      ['strategy', 'Tạo chiến lược', 'Phân tích hồ sơ và tối đa 30 dòng lịch sử mới nhất.'],
      ['content', 'Content Studio', 'Rà soát bản nháp nội dung theo chiến lược.'],
      ['profile', 'Xem hồ sơ doanh nghiệp', 'Kiểm tra ngữ cảnh doanh nghiệp hiện tại.'],
    ],
  },
  member: {
    eyebrow: 'EMPLOYEE · CAMPAIGN WORKSPACE',
    title: 'Không gian làm việc',
    subtitle: 'Xem ngữ cảnh chung và biên tập nội dung trong phạm vi được hỗ trợ.',
    intro: 'Employee dùng chiến lược đã có và Content Studio; quyền nhập dữ liệu và tạo chiến lược không được hiển thị cho vai trò này.',
    actions: [
      ['import', 'Nhập dữ liệu chiến dịch', 'Kiểm tra và lưu dữ liệu CSV/XLSX qua API hiện có.'],
      ['content', 'Mở Content Studio', 'Rà soát và chỉnh sửa bản nháp nội dung.'],
      ['strategy', 'Xem chiến lược', 'Mở kết quả chiến lược hiện có khi phiên làm việc đã tạo dữ liệu.'],
      ['profile', 'Xem hồ sơ doanh nghiệp', 'Xem ngữ cảnh doanh nghiệp của Workspace.'],
    ],
  },
}

const ACTION_LABELS = {
  content: 'Mở Content Studio',
  import: 'Nhập dữ liệu chiến dịch',
  strategy: 'Mở chiến lược',
}

export default function RoleDashboardPage({ role, profile, imports, strategy, setPage }) {
  const content = ROLE_CONTENT[role] || ROLE_CONTENT.member
  const businessName = profile?.business_name || 'CastraVision Workspace'
  const importSummary = imports?.length
    ? `${imports[0].row_count} dòng đã nhập gần đây`
    : 'Chưa có dữ liệu chiến dịch được nhập'
  const strategySummary = strategy
    ? `Kênh đề xuất: ${strategy.strategy.recommended_channel}`
    : 'Chưa có chiến lược trong phiên hiện tại'

  return (
    <>
      <PageIntro code={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      <Card className="gap-3 p-6 sm:p-8">
        <span className="text-xs font-bold tracking-[0.08em] text-info uppercase">{businessName}</span>
        <h2 className="text-2xl font-bold">{content.intro}</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {role === 'manager' && !imports?.length ? importSummary : strategySummary}
        </p>
      </Card>

      <section className="mt-5 grid gap-4 md:grid-cols-2" aria-label="Role workflows">
        {content.actions.map(([page, title, description]) => (
          <Card key={page} className="gap-3 p-5">
            <span className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">{page}</span>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="min-h-10 text-sm text-muted-foreground">{description}</p>
            <Button type="button" variant="secondary" className="w-fit" onClick={() => setPage(page)}>
              {page === 'profile' ? 'Xem hồ sơ' : ACTION_LABELS[page]} →
            </Button>
          </Card>
        ))}
      </section>

      {role === 'manager' && !imports?.length && (
        <p className="mt-5 rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground" role="status">
          Không có dữ liệu hiệu suất trực tiếp từ API hiện tại.
        </p>
      )}
    </>
  )
}

RoleDashboardPage.propTypes = {
  role: PropTypes.oneOf(['admin', 'manager', 'member']).isRequired,
  profile: PropTypes.shape({ business_name: PropTypes.string }),
  imports: PropTypes.array,
  strategy: PropTypes.object,
  setPage: PropTypes.func.isRequired,
}
