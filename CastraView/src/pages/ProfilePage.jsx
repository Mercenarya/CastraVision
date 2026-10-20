import { useState } from 'react'
import PropTypes from 'prop-types'
import ChannelPicker from '@/components/ChannelPicker'
import Field from '@/components/Field'
import Notice from '@/components/Notice'
import PageHeading from '@/components/PageHeading'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { SIZES } from '@/utils/constants'

const EMPTY_PROFILE = {
  business_name: '', industry: '', business_size: '', target_customers: '', primary_goal: '',
  product_service: '', preferred_channels: [], monthly_budget: '', currency: 'VND',
}

function Step({ index, active, done, children, className }) {
  return (
    <div className={cn('font-medium', active || done ? 'font-bold text-foreground' : 'text-[#929fba]', className)}>
      <b className={cn('mr-2 inline-grid size-7 place-items-center rounded-full text-[13px]', active || done ? 'bg-primary text-primary-foreground' : 'bg-[#303b55]')}>
        {index}
      </b>
      {children}
    </div>
  )
}

export default function ProfilePage({ profile, onboarding, saveProfile, busy, error, cancel }) {
  const [draft, setDraft] = useState(profile || EMPTY_PROFILE)
  const [step, setStep] = useState(1)
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const toggle = (channel) =>
    setDraft((current) => ({
      ...current,
      preferred_channels: current.preferred_channels.includes(channel)
        ? current.preferred_channels.filter((item) => item !== channel)
        : [...current.preferred_channels, channel],
    }))

  function submit(event) {
    event.preventDefault()
    if (step === 1) setStep(2)
    else saveProfile(draft)
  }

  return (
    <>
      <PageHeading
        eyebrow={onboarding ? 'NEW ACCOUNT SETUP' : 'BUSINESS SETTINGS'}
        title={onboarding ? 'Thiết lập doanh nghiệp' : 'Hồ sơ doanh nghiệp'}
        subtitle="Cho CastraVision biết về doanh nghiệp để cá nhân hóa đề xuất."
      />
      <div className="relative mb-7 grid grid-cols-2 gap-4 rounded-xl bg-card px-5 pt-5 pb-7 text-sm">
        <Step index={1} active={step === 1} done={step === 2}>Thông tin doanh nghiệp</Step>
        <Step index={2} active={step === 2} className="text-right">Mục tiêu & kênh</Step>
        <div className="absolute right-5 bottom-4 left-5 h-1 rounded-full bg-[#343f58]">
          <span className="block h-full rounded-full bg-primary transition-[width]" style={{ width: step === 1 ? '50%' : '100%' }} />
        </div>
      </div>

      <Card className="max-w-[1000px] p-5 sm:p-10">
        <form onSubmit={submit}>
          {step === 1 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Tên doanh nghiệp *" className="sm:col-span-2">
                <Input value={draft.business_name} onChange={(e) => set('business_name', e.target.value)} minLength={2} maxLength={120} required placeholder="Ví dụ: SneakerX Việt Nam" />
              </Field>
              <Field label="Ngành hàng *">
                <Input value={draft.industry} onChange={(e) => set('industry', e.target.value)} minLength={2} maxLength={120} required placeholder="Ví dụ: Thời trang & phụ kiện" />
              </Field>
              <Field label="Quy mô doanh nghiệp *">
                <NativeSelect value={draft.business_size} onChange={(e) => set('business_size', e.target.value)} required>
                  <option value="">Chọn quy mô</option>
                  {Object.entries(SIZES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Khách hàng mục tiêu *" className="sm:col-span-2">
                <Textarea value={draft.target_customers} onChange={(e) => set('target_customers', e.target.value)} minLength={3} maxLength={500} required placeholder="Nhóm tuổi, khu vực, sở thích và nhu cầu..." />
              </Field>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Sản phẩm / dịch vụ chính" className="sm:col-span-2">
                <Input value={draft.product_service} onChange={(e) => set('product_service', e.target.value)} maxLength={500} placeholder="Sản phẩm hoặc dịch vụ sẽ quảng bá" />
              </Field>
              <Field label="Mục tiêu chính" className="sm:col-span-2">
                <Input value={draft.primary_goal} onChange={(e) => set('primary_goal', e.target.value)} maxLength={300} placeholder="Ví dụ: Tăng doanh số trực tuyến" />
              </Field>
              <Field label="Ngân sách mỗi tháng">
                <Input type="number" min="0" max="1000000000" value={draft.monthly_budget} onChange={(e) => set('monthly_budget', e.target.value)} placeholder="30000000" />
              </Field>
              <Field label="Đơn vị tiền">
                <NativeSelect value={draft.currency} onChange={(e) => set('currency', e.target.value)}>
                  <option>VND</option>
                  <option>USD</option>
                </NativeSelect>
              </Field>
              <div className="sm:col-span-2">
                <div className="mb-3 text-[13px] font-bold text-[#d1daef]">Kênh ưu tiên</div>
                <ChannelPicker channels={draft.preferred_channels} toggle={toggle} />
              </div>
            </div>
          )}
          {error && <Notice>{error}</Notice>}
          <div className="mt-9 flex justify-between gap-4">
            <Button type="button" variant="coral" size="lg" onClick={step === 2 ? () => setStep(1) : cancel}>
              {step === 2 ? '← Quay lại' : 'Hủy'}
            </Button>
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? 'Đang lưu…' : step === 1 ? 'Tiếp tục →' : 'Lưu hồ sơ ✓'}
            </Button>
          </div>
        </form>
      </Card>
      <div className="mx-1 my-6 flex max-w-[1000px] flex-col justify-between gap-2 text-xs text-[#8c9bb6] sm:flex-row">
        <span>◈ Hồ sơ có thể cập nhật sau trong phần cài đặt.</span>
        <span>Dữ liệu gắn với tài khoản của bạn</span>
      </div>
    </>
  )
}

ProfilePage.propTypes = {
  profile: PropTypes.object,
  onboarding: PropTypes.bool,
  saveProfile: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  error: PropTypes.string,
  cancel: PropTypes.func.isRequired,
}
