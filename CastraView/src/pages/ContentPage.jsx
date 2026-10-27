import { useState } from 'react'
import PropTypes from 'prop-types'
import MiniLabel from '@/components/MiniLabel'
import PageHeading from '@/components/PageHeading'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { CHANNELS } from '@/utils/constants'

const TONES = ['Năng động & táo bạo', 'Thân thiện & gần gũi', 'Chuyên nghiệp & rõ ràng']
const FORMAT = {
  Meta: ['Facebook Feed', '1080 × 1080'],
  'Google Ads': ['Google Search Ads', 'RSA'],
  TikTok: ['TikTok / Reels', '9:16'],
}
const STEPS = ['Chiến lược', 'Kênh', 'Đối tượng', 'Tạo nháp', 'Rà soát']

function buildDrafts(profile, message, version) {
  const product = profile.product_service || profile.business_name
  return {
    Meta: {
      title: `${profile.business_name} — Khám phá điều khác biệt`,
      body: version % 2 ? `Một lựa chọn mới cho bạn. ${message}` : `${message} Khám phá ngay và tìm cảm hứng cho hành trình tiếp theo.`,
      cta: 'Tìm hiểu thêm',
    },
    'Google Ads': {
      title: `${profile.business_name} | ${profile.industry} phù hợp với bạn`,
      body: `${product}. Xem giải pháp cho ${profile.target_customers}.`,
      cta: 'Truy cập website',
    },
    TikTok: {
      title: `Hook 0–3s · ${profile.business_name}`,
      body: version % 2
        ? `Mở đầu bằng câu hỏi của ${profile.target_customers}. Chuyển cảnh nhanh sang giải pháp: ${product}.`
        : `Bắt đầu bằng tình huống gần gũi với ${profile.target_customers}. Giới thiệu lợi ích chính và kết bằng lời mời tìm hiểu thêm.`,
      cta: 'Xem ngay',
    },
  }
}

export default function ContentPage({ result, profile, setPage, notify }) {
  const [channels, setChannels] = useState(CHANNELS)
  const [tone, setTone] = useState(TONES[0])
  const [version, setVersion] = useState(0)
  const [edits, setEdits] = useState({})
  const [editing, setEditing] = useState(null)
  const drafts = buildDrafts(profile, result?.strategy.message || '', version)
  const toggle = (channel) =>
    setChannels((current) => (current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]))

  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value)
      notify('Đã sao chép nội dung.')
    } catch {
      notify('Không thể sao chép trên trình duyệt này.')
    }
  }

  return (
    <>
      <PageHeading eyebrow="CAMPAIGN ORCHESTRATION › CONTENT STUDIO" title="Tạo nội dung" subtitle="Phác thảo nội dung đa kênh từ chiến lược vừa tạo." />
      <div className="mb-6 flex items-start gap-3 rounded-[10px] border border-[#347089] bg-[#172d42] px-4 py-3.5 text-[13px] text-[#c1dce9]">
        <span className="text-xl text-info">ⓘ</span>
        <p className="mt-0.5 leading-normal">
          Đây là bản nháp nội dung theo mẫu, chưa phải hệ thống sinh nội dung AI chuyên biệt. Hãy biên tập và kiểm tra trước khi đăng.
        </p>
      </div>

      {!result ? (
        <Card className="min-h-[380px] items-center justify-center p-8 text-center">
          <span className="text-[52px] text-violet">✦</span>
          <h2 className="mt-3 text-2xl font-bold">Hãy tạo chiến lược trước</h2>
          <p className="text-muted-foreground">Content Studio sử dụng phân khúc và thông điệp từ đề xuất chiến lược của bạn.</p>
          <Button type="button" size="lg" onClick={() => setPage('strategy')}>Đến màn hình chiến lược →</Button>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-2.5 rounded-xl bg-card px-5 py-4 sm:grid-cols-5">
            {STEPS.map((step, index) => (
              <div key={step} className={cn('flex items-center gap-2 text-xs font-bold', index === STEPS.length - 1 ? 'text-info' : 'text-[#c0c6ff]')}>
                <b className={cn('grid size-6 shrink-0 place-items-center rounded-full text-[#131448]', index === STEPS.length - 1 ? 'bg-info' : 'bg-violet')}>{index + 1}</b>
                {step}
              </div>
            ))}
          </div>

          <Card className="grid items-center gap-5 p-6 md:grid-cols-2 xl:grid-cols-[1fr_1.4fr_1fr_1fr]">
            <div className="min-w-0">
              <MiniLabel>CHIẾN LƯỢC</MiniLabel>
              <strong className="mt-2 block text-[13px] leading-snug">{profile.business_name}</strong>
            </div>
            <div className="min-w-0">
              <MiniLabel>KÊNH MỤC TIÊU</MiniLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CHANNELS.map((channel) => {
                  const selected = channels.includes(channel)
                  return (
                    <button
                      type="button"
                      key={channel}
                      onClick={() => toggle(channel)}
                      aria-pressed={selected}
                      className={cn('rounded-md border px-2 py-1.5 text-[11px]', selected ? 'border-violet bg-[#263149] text-[#d4d3ff]' : 'border-[#263149] bg-[#263149] text-[#aab7d0]')}
                    >
                      {channel} {selected && '✓'}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="min-w-0">
              <MiniLabel>KHÁCH HÀNG</MiniLabel>
              <strong className="mt-2 block text-[13px] leading-snug">{result.strategy.segment}</strong>
            </div>
            <label className="grid min-w-0 gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-info">
              GIỌNG ĐIỆU
              <NativeSelect value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((item) => <option key={item}>{item}</option>)}
              </NativeSelect>
            </label>
            <div className="flex justify-end gap-2.5 md:col-span-full">
              <Button type="button" variant="coral" size="lg" onClick={() => { setChannels(CHANNELS); setTone(TONES[0]); setEdits({}) }}>↻ Đặt lại</Button>
              <Button type="button" size="lg" onClick={() => { setVersion(version + 1); setEdits({}); notify('Đã làm mới bản nháp nội dung.') }}>✦ Tạo bản nháp</Button>
            </div>
          </Card>

          <div className="mt-8 mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Bản nháp theo kênh{' '}
              <span className="ml-1 rounded-2xl bg-[#28344b] px-2 py-1.5 align-middle text-[11px] font-medium tracking-normal text-info">{channels.length} kênh</span>
            </h2>
            <small className="text-muted-foreground">Giọng điệu: {tone}</small>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {channels.map((channel) => {
              const item = drafts[channel]
              const value = edits[channel] ?? item.body
              const [formatName, size] = FORMAT[channel]
              return (
                <Card key={channel} className="min-h-[405px] gap-0 p-6">
                  <div className="mb-6 flex items-center justify-between gap-2 text-xs">
                    <span className="rounded-[5px] bg-[#253149] px-2 py-1.5">{formatName}</span>
                    <small className="text-muted-foreground">{size}</small>
                  </div>
                  <MiniLabel>TIÊU ĐỀ / HOOK</MiniLabel>
                  <h3 className="mt-2 mb-6 text-[17px] leading-snug font-semibold">{item.title}</h3>
                  <MiniLabel>NỘI DUNG CHÍNH</MiniLabel>
                  {editing === channel ? (
                    <Textarea className="mt-2.5" value={value} onChange={(e) => setEdits({ ...edits, [channel]: e.target.value })} rows={7} />
                  ) : (
                    <p className="mt-2 text-[13px] leading-relaxed text-[#cbd3e8]">{value}</p>
                  )}
                  <div className="mt-auto grid gap-1 rounded-[9px] bg-[#0b1429] p-3.5 text-xs text-[#cdd4eb]">
                    <span>{channel === 'TikTok' ? '0s Hook · 8s Lợi ích · 15s CTA' : item.cta}</span>
                    <strong className="text-[11px] text-info">{channel === 'Google Ads' ? '✓ Thông điệp nhất quán' : '✦ Bản nháp sẵn để rà soát'}</strong>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(editing === channel ? null : channel)}>
                      {editing === channel ? '✓ Xong' : '✎ Sửa'}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => copy(`${item.title}\n\n${value}\n\n${item.cta}`)}>⧉ Sao chép</Button>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="mt-5 flex-col items-start gap-2 p-5 text-[13px] sm:flex-row sm:items-center sm:gap-5">
            <strong>{channels.length} / 3 kênh được chọn</strong>
            <span className="text-muted-foreground">Rà soát nội dung và tuân thủ chính sách quảng cáo trước khi xuất bản.</span>
          </Card>
        </>
      )}
    </>
  )
}

ContentPage.propTypes = {
  result: PropTypes.object,
  profile: PropTypes.object.isRequired,
  setPage: PropTypes.func.isRequired,
  notify: PropTypes.func.isRequired,
}
