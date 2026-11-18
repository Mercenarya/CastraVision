import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from '../components/WorkflowPanel'
import WorkflowCampaignSelect from '../components/WorkflowCampaignSelect'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { workflow } from '../../services/leaderWorkflow'

const field = 'w-full rounded-lg border border-border bg-background p-3'

export default function WorkflowComposer({ kind, onCreated, revision }) {
  const [campaignId, setCampaignId] = useState('')
  const [title, setTitle] = useState('')
  const [audience, setAudience] = useState('')
  const [strategyId, setStrategyId] = useState('')
  const strategies = useWorkflowQuery('proposals', { kind: 'strategy', status: 'approved', limit: 100 }, revision)
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const [payload, setPayload] = useState({ hook: '', headline: '', body: '', cta: '', channel: 'Meta', source: 'manual' })
  const action = useWorkflowAction()
  async function useStrategy() {
    const result = await action.run(() => workflow('proposal', { id: strategyId }))
    if (!result) return
    const strategy = result.payload.strategy
    setCampaignId(result.campaign_id)
    setTitle(`Nội dung từ ${result.title}`.slice(0, 120))
    setPayload({ hook: strategy.message.slice(0, 500), headline: strategy.message.slice(0, 60), body: strategy.rationale.slice(0, 4000), cta: 'Tìm hiểu thêm', channel: 'Meta', source: 'template', strategyId })
    setRequestId(crypto.randomUUID())
  }
  function change(setter, value) { setter(value); setRequestId(crypto.randomUUID()); action.clearError() }
  async function submit(event) {
    event.preventDefault()
    const result = await action.run(() => kind === 'strategy'
      ? workflow('generate', { campaignId, objective: title, audience, requestId })
      : workflow('submit', { campaignId, kind: 'ad_content', title, payload, requestId, submit: false }))
    if (result) onCreated(result.id)
  }
  return <div className="p-6"><WorkflowPanel title={kind === 'strategy' ? 'Strategy Studio' : 'Content Gen'} action={action}>
    <p className="text-muted-foreground">{kind === 'strategy' ? 'Tạo và lưu bản nháp chiến lược bằng backend. Kết quả ghi rõ provider và cảnh báo fallback; bạn cần gửi duyệt sau khi kiểm tra.' : 'Soạn nội dung thực và lưu bản nháp để gửi duyệt. Nội dung này do bạn nhập; chưa gọi dịch vụ sinh nội dung AI.'}</p>
    {kind === 'content' && <div className="space-y-3 rounded-lg border border-border p-3"><label className="block">Chiến lược đã duyệt<select className={field} value={strategyId} onChange={e => setStrategyId(e.target.value)}><option value="">Chọn chiến lược</option>{strategies.data?.items.map(s => <option value={s.id} key={s.id}>{s.title} · {s.campaign_name}</option>)}</select></label>{strategies.error && <p role="alert">{strategies.error}</p>}<Button variant="outline" disabled={!strategyId || action.busy} onClick={useStrategy}>Tạo template từ chiến lược</Button><p className="text-xs text-muted-foreground">Template dùng thông điệp và lý do của chiến lược đã lưu; không phải lời gọi AI sinh nội dung độc lập. Bạn cần chỉnh sửa trước khi gửi.</p></div>}
    <form className="space-y-4" onSubmit={submit}>
      <WorkflowCampaignSelect value={campaignId} onChange={v => change(setCampaignId, v)} revision={revision} />
      <label className="block">{kind === 'strategy' ? 'Mục tiêu chiến lược' : 'Tên đề xuất'}<input required minLength={3} maxLength={120} className={field} value={title} onChange={e => change(setTitle, e.target.value)} /></label>
      {kind === 'strategy' ? <label className="block">Khách hàng mục tiêu<textarea required maxLength={2000} className={field} value={audience} onChange={e => change(setAudience, e.target.value)} /></label> : <>
        <label className="block">Kênh<select className={field} value={payload.channel} onChange={e => change(setPayload, { ...payload, channel: e.target.value })}>{['Meta', 'Google Ads', 'TikTok'].map(x => <option key={x}>{x}</option>)}</select></label>
        {[['hook', 'Hook (0–3s)', 500], ['headline', 'Headline', 60], ['body', 'Body Copy', 4000], ['cta', 'CTA', 80]].map(([key, label, max]) => <label className="block" key={key}>{label}<textarea required minLength={key === 'hook' ? 10 : 1} maxLength={max} className={field} value={payload[key]} onChange={e => change(setPayload, { ...payload, [key]: e.target.value })} /><span className="text-xs text-muted-foreground">{payload[key].length}/{max}</span></label>)}
        <Button type="button" variant="outline" disabled={action.busy} onClick={() => action.run(async () => { await navigator.clipboard.writeText([payload.hook, payload.headline, payload.body, payload.cta].join('\n')); return true })}>Sao chép nội dung</Button>
      </>}
      <div><Button disabled={action.busy || !campaignId}>{action.busy ? 'Đang xử lý…' : kind === 'strategy' ? 'Tạo và lưu chiến lược' : 'Lưu bản nháp'}</Button></div>
    </form>
  </WorkflowPanel></div>
}
