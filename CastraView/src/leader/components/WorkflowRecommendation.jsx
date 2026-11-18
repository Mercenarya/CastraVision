import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from './WorkflowPanel'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { workflow } from '../../services/leaderWorkflow'
import { money } from '../../services/leaderWorkflowContract'

const names = { facebook: 'Meta', google: 'Google Ads', tiktok: 'TikTok' }

export default function WorkflowRecommendation({ campaign, analytics, onCreated }) {
  const [variantId, setVariantId] = useState('')
  const [note, setNote] = useState('')
  const [recommendRequestId] = useState(() => crypto.randomUUID())
  const [pauseRequestId, setPauseRequestId] = useState(() => crypto.randomUUID())
  const action = useWorkflowAction()
  function changeVariant(value) { setVariantId(value); setPauseRequestId(crypto.randomUUID()) }
  function changeNote(value) { setNote(value); setPauseRequestId(crypto.randomUUID()) }
  const variants = useWorkflowQuery('proposals', { kind: 'ad_content', status: 'approved', limit: 100 })
  const measured = (analytics?.channels || []).filter(c => Number(c.spend) > 0 && campaign.channels.includes(names[c.channel])).sort((a, b) => Number(a.roas) - Number(b.roas))
  const worst = measured[0]
  const best = measured.at(-1)
  const amount = worst ? Math.floor(Number(campaign.allocations[names[worst.channel]]) * 0.1 * 100) / 100 : 0
  const canRecommend = measured.length > 1 && Number(best.roas) > Number(worst.roas) && amount > 0
  async function recommend() {
    const allocations = campaign.channels.map(channel => ({ channel, current: Number(campaign.allocations[channel]), proposed: Math.round((Number(campaign.allocations[channel]) + (channel === names[best.channel] ? amount : channel === names[worst.channel] ? -amount : 0)) * 100) / 100 }))
    const result = await action.run(() => workflow('submit', { campaignId: campaign.id, kind: 'budget_proposal', title: `Đề xuất theo ROAS ${campaign.name}`.slice(0, 120), payload: { totalBudget: Number(campaign.budget), allocations, source: 'rule_based', from: analytics.from, to: analytics.to }, requestId: recommendRequestId, submit: true }))
    if (result) onCreated(result.id)
  }
  async function pause(event) {
    event.preventDefault()
    const variant = variants.data.items.find(p => p.target_id === variantId)
    const result = await action.run(() => workflow('submit', { campaignId: campaign.id, kind: 'pause_variant', title: `Yêu cầu tạm dừng ${variant.title}`.slice(0, 120), payload: { variantId, reason: note }, requestId: pauseRequestId, submit: true }))
    if (result) onCreated(result.id)
  }
  return <WorkflowPanel title="Insights & yêu cầu xử lý" action={action}>
    <p className="text-muted-foreground">Nguồn: quy tắc trên số liệu đã nhập, không phải dự đoán AI. Chỉ tạo đề xuất nội bộ; không đổi ngân sách hoặc tạm dừng quảng cáo thật.</p>
    {canRecommend ? <><p>Chuyển {money(amount, campaign.currency)} từ {names[worst.channel]} sang {names[best.channel]} (10% phân bổ nền kênh ROAS thấp hơn trong khoảng ngày đang xem).</p><Button disabled={action.busy} onClick={recommend}>Apply Recommendation</Button></> : <p>Chưa đủ hai kênh có ROAS khác nhau và phân bổ hợp lệ để tạo khuyến nghị.</p>}
    <form onSubmit={pause} className="space-y-3 border-t border-border pt-4"><label className="block">Biến thể đã được duyệt<select required className="block w-full rounded-lg border border-border bg-background p-3" value={variantId} onChange={e => changeVariant(e.target.value)}><option value="">Chọn nội dung thuộc chiến dịch</option>{variants.data?.items.filter(p => p.campaign_id === campaign.id).map(p => <option key={p.id} value={p.target_id}>{p.title}</option>)}</select></label>{variants.error && <p role="alert">{variants.error}</p>}<label className="block">Lý do yêu cầu<input required minLength={3} maxLength={2000} className="block w-full rounded-lg border border-border bg-background p-3" value={note} onChange={e => changeNote(e.target.value)} /></label><Button variant="outline" disabled={!variantId || action.busy}>Yêu cầu Pause Variant</Button></form>
  </WorkflowPanel>
}
