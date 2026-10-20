import { useState } from 'react'
import PropTypes from 'prop-types'
import ChannelPicker from '@/components/ChannelPicker'
import Field from '@/components/Field'
import Notice from '@/components/Notice'
import MiniLabel from '@/components/MiniLabel'
import PageHeading from '@/components/PageHeading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/services/api'
import { CHANNELS } from '@/utils/constants'

const ALLOCATION_COLORS = ['#bfc0ff', '#36c2e4', '#d4b1fb']
const color = (index) => ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]

function InsightBox({ children }) {
  return <div className="mb-4 rounded-[11px] bg-[#1b253b] p-5">{children}</div>
}
InsightBox.propTypes = { children: PropTypes.node }

export default function StrategyPage({ profile, latestRows, result, setResult, notify }) {
  const initial = () => ({
    campaign_goal: profile.primary_goal || '',
    target_audience: profile.target_customers || '',
    budget: profile.monthly_budget || '',
    preferred_channels: profile.preferred_channels.length ? profile.preferred_channels : CHANNELS,
  })
  const [draft, setDraft] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const toggle = (channel) =>
    set(
      'preferred_channels',
      draft.preferred_channels.includes(channel)
        ? draft.preferred_channels.filter((item) => item !== channel)
        : [...draft.preferred_channels, channel],
    )

  async function generate(event) {
    event?.preventDefault()
    setBusy(true)
    setError('')
    try {
      const historical_data = latestRows.slice(0, 30).map((row) => ({
        channel: CHANNELS.includes(row.channel) ? row.channel : 'Other',
        period: row.period,
        ctr: row.impressions ? +((row.clicks / row.impressions) * 100).toFixed(2) : 0,
        cpa: row.conversions ? +(row.spend / row.conversions).toFixed(2) : 0,
        roas: row.spend ? +(row.revenue / row.spend).toFixed(2) : 0,
      }))
      const payload = {
        business_name: profile.business_name,
        industry: profile.industry,
        business_size: profile.business_size,
        product_service: profile.product_service || profile.business_name,
        target_audience: draft.target_audience,
        campaign_goal: draft.campaign_goal,
        budget: Number(draft.budget),
        currency: profile.currency,
        preferred_channels: draft.preferred_channels,
        historical_data,
      }
      const data = await api('strategies/generate/', { method: 'POST', body: JSON.stringify(payload) })
      setResult(data)
      notify('Chiến lược đã được tạo. Hãy xem lại trước khi sử dụng.')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  const money = (percentage) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: profile.currency, maximumFractionDigits: 0 }).format(
      (Number(draft.budget) * percentage) / 100,
    )

  return (
    <>
      <PageHeading eyebrow="STRATEGY ENGINE" title="Tạo chiến lược" subtitle="Đặt mục tiêu và đối tượng để xây dựng đề xuất marketing dựa trên dữ liệu.">
        {latestRows.length > 0 && (
          <Badge className="border border-[#2d6a83] bg-[#1c3544] px-3 py-2 text-xs font-bold text-info">
            ✓ {latestRows.length} dòng lịch sử được sử dụng
          </Badge>
        )}
      </PageHeading>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="p-7">
          <form onSubmit={generate} className="grid gap-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <h2 className="text-[21px] font-bold tracking-tight">
                <i className="mr-2 mb-0.5 inline-block size-2.5 rounded-full bg-primary" /> Thiết lập chiến dịch
              </h2>
              <span className="rounded-[5px] bg-[#1e2840] px-2 py-1 text-[11px] whitespace-nowrap text-[#bdc7e0]">FR01 · Sprint 1</span>
            </div>
            <Field label="Mục tiêu chiến dịch">
              <Input value={draft.campaign_goal} onChange={(e) => set('campaign_goal', e.target.value)} minLength={3} required placeholder="Ví dụ: Tăng doanh số mùa hè" />
            </Field>
            <Field label="Khách hàng mục tiêu">
              <Input value={draft.target_audience} onChange={(e) => set('target_audience', e.target.value)} minLength={3} required placeholder="Ví dụ: Người trẻ 18–28 tuổi" />
            </Field>
            <Field label={`Ngân sách tháng (${profile.currency})`}>
              <Input type="number" min="1" value={draft.budget} onChange={(e) => set('budget', e.target.value)} required placeholder="30000000" />
            </Field>
            <div>
              <div className="mb-3 text-[13px] font-bold text-[#d1daef]">Kênh dự kiến</div>
              <ChannelPicker channels={draft.preferred_channels} toggle={toggle} />
            </div>
            {error && <Notice>{error}</Notice>}
            <div className="mt-3 flex justify-between gap-4">
              <Button type="button" variant="coral" size="lg" onClick={() => setDraft(initial())}>↻ Đặt lại</Button>
              <Button type="submit" size="lg" disabled={busy || !draft.preferred_channels.length}>
                {busy ? 'Đang phân tích…' : 'ϟ Tạo chiến lược'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-7">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[21px] font-bold tracking-tight">Đề xuất chiến lược AI</h2>
              <p className="mt-1 text-xs text-muted-foreground">Dựa trên hồ sơ và dữ liệu lịch sử của bạn</p>
            </div>
            {result && <Badge className="rounded-md bg-[#00bdd9] px-2.5 py-1.5 text-[11px] font-extrabold text-[#0d3a48]">{result.strategy.confidence}% tin cậy</Badge>}
          </div>

          {!result ? (
            <div className="flex min-h-[410px] flex-col items-center justify-center text-center">
              <span className="grid size-[84px] place-items-center rounded-full bg-[#272b54] text-[46px] text-primary">◈</span>
              <h3 className="mt-5 mb-1 text-[23px] font-semibold">Chưa có đề xuất</h3>
              <p className="max-w-[370px] leading-relaxed text-muted-foreground">
                Hoàn thành biểu mẫu và nhấn “Tạo chiến lược” để xem kênh, thông điệp và phân bổ ngân sách.
              </p>
            </div>
          ) : (
            <>
              <InsightBox>
                <MiniLabel>TRỌNG TÂM CHIẾN LƯỢC</MiniLabel>
                <p className="mt-2 text-sm leading-relaxed">{result.strategy.rationale}</p>
              </InsightBox>
              <InsightBox>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <MiniLabel>PHÂN BỔ ĐỀ XUẤT</MiniLabel>
                  <span>{money(100)} tổng</span>
                </div>
                <div className="my-3.5 flex h-3.5 w-full overflow-hidden rounded-full">
                  {result.strategy.budget_allocation.map((item, index) => (
                    <span key={index} style={{ width: `${item.percentage}%`, background: color(index) }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {result.strategy.budget_allocation.map((item, index) => (
                    <div key={index} className="grid grid-cols-[10px_1fr] gap-x-1.5 gap-y-0.5 text-xs">
                      <i className="mt-0.5 block size-2.5 rounded-full" style={{ background: color(index) }} />
                      <strong>{item.channel}</strong>
                      <small className="col-start-2 text-muted-foreground">{item.percentage}% · {money(item.percentage)}</small>
                    </div>
                  ))}
                </div>
              </InsightBox>
              <InsightBox>
                <MiniLabel>THÔNG ĐIỆP & PHÂN KHÚC</MiniLabel>
                <p className="mt-2 text-sm leading-relaxed">“{result.strategy.message}”</p>
                <small className="text-muted-foreground">{result.strategy.segment}</small>
              </InsightBox>
              <InsightBox>
                <MiniLabel>HÀNH ĐỘNG TIẾP THEO</MiniLabel>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-normal text-[#c9d2e6]">
                  {result.strategy.actions.map((action, index) => <li key={index}>{action}</li>)}
                </ol>
              </InsightBox>
              <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <span>{result.provider === 'openai' ? 'OpenAI' : 'Bản dự phòng có quy tắc'} · {result.context_sources.length} nguồn tham chiếu</span>
                <Button type="button" variant="secondary" onClick={generate} disabled={busy}>↻ Phân tích lại</Button>
              </div>
              {result.warning && <Notice kind="warning">{result.warning}</Notice>}
            </>
          )}
        </Card>
      </div>
    </>
  )
}

StrategyPage.propTypes = {
  profile: PropTypes.object.isRequired,
  latestRows: PropTypes.array.isRequired,
  result: PropTypes.object,
  setResult: PropTypes.func.isRequired,
  notify: PropTypes.func.isRequired,
}
