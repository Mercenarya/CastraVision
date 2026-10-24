import PropTypes from 'prop-types'
import PageHeading from '@/components/PageHeading'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { SIZES } from '@/utils/constants'

function FeatureCard({ number, icon, tone, title, text, link, onClick }) {
  return (
    <Card className="p-0">
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-60 flex-col items-start rounded-[inherit] p-6 text-left hover:ring-1 hover:ring-[#6c72c0]"
      >
        <span className="text-[11px] font-extrabold tracking-widest text-[#97a4bd]">{number}</span>
        <span
          className={cn(
            'mt-5 mb-3 grid size-12 place-items-center rounded-xl text-[26px]',
            tone === 'cyan' ? 'bg-[#1b4058] text-info' : 'bg-[#34385e] text-primary',
          )}
        >
          {icon}
        </span>
        <strong className="text-lg">{title}</strong>
        <p className="mt-2 mb-auto text-[13px] text-muted-foreground">{text}</p>
        <span className="mt-4 text-[13px] font-bold text-primary">{link} →</span>
      </button>
    </Card>
  )
}

FeatureCard.propTypes = {
  number: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(['violet', 'cyan']).isRequired,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
}

export default function OverviewPage({ profile, imports, strategy, setPage }) {
  return (
    <>
      <PageHeading
        eyebrow="CAMPAIGN WORKSPACE"
        title={`Xin chào, ${profile.business_name}`}
        subtitle="Từ dữ liệu doanh nghiệp đến chiến lược marketing có thể hành động."
      />
      <Card className="flex-row items-center justify-between gap-8 overflow-hidden bg-[radial-gradient(circle_at_80%_50%,#2a2d6c_0,transparent_28%),linear-gradient(120deg,#191f3f,#151e32_65%)] px-6 py-9 sm:px-10">
        <div>
          <span className="block text-[11px] font-extrabold tracking-[0.08em] text-[#a9abff]">SPRINT 1 · MARKETING INTELLIGENCE</span>
          <h2 className="my-3 max-w-[600px] text-[clamp(25px,3vw,38px)] leading-[1.15] font-bold tracking-tight">
            Một quy trình rõ ràng cho chiến lược tốt hơn.
          </h2>
          <p className="text-muted-foreground">Ba khối tính năng cốt lõi đã được nối thành một luồng làm việc.</p>
        </div>
        <span
          className="hidden size-[142px] shrink-0 place-items-center rounded-full border border-violet/50 text-[90px] text-info shadow-[0_0_0_17px_#7777f618,0_0_0_33px_#7777f60d] md:grid"
          aria-hidden="true"
        >
          ✣
        </span>
      </Card>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <FeatureCard
          number="01 / FR12" icon="▣" tone="violet" title="Hồ sơ doanh nghiệp"
          text={`${profile.industry} · ${SIZES[profile.business_size] || profile.business_size}`}
          link="Xem hồ sơ" onClick={() => setPage('profile')}
        />
        <FeatureCard
          number="02 / FR08" icon="⇥" tone="cyan" title="Nhập dữ liệu chiến dịch"
          text={imports.length ? `${imports[0].row_count} dòng dữ liệu đã nhập` : 'CSV / XLSX · kiểm tra & chuẩn hóa'}
          link={imports.length ? 'Xem dữ liệu' : 'Bắt đầu nhập'} onClick={() => setPage('import')}
        />
        <FeatureCard
          number="03 / FR01" icon="◈" tone="violet" title="Tạo chiến lược AI"
          text={strategy ? `Kênh đề xuất: ${strategy.strategy.recommended_channel}` : 'Kết hợp hồ sơ và lịch sử chiến dịch'}
          link={strategy ? 'Xem đề xuất' : 'Tạo chiến lược'} onClick={() => setPage('strategy')}
        />
      </div>

      <Card className="mt-5 flex-col items-start gap-4 px-6 py-5 sm:flex-row sm:items-center">
        <span className="text-2xl text-info">ⓘ</span>
        <div>
          <strong className="mb-1 block">Về Content Studio</strong>
          <p className="text-[13px] leading-normal text-muted-foreground">
            Màn hình Figma được đưa vào dưới dạng bản nháp nội dung từ chiến lược. Sinh nội dung AI chuyên biệt nằm ngoài phạm vi Sprint 1.
          </p>
        </div>
        <Button type="button" variant="secondary" size="lg" className="sm:ml-auto" onClick={() => setPage('content')}>
          Xem màn hình →
        </Button>
      </Card>
    </>
  )
}

OverviewPage.propTypes = {
  profile: PropTypes.object.isRequired,
  imports: PropTypes.array.isRequired,
  strategy: PropTypes.object,
  setPage: PropTypes.func.isRequired,
}
