import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from './WorkflowPanel'
import { useWorkflowAction } from '../../hooks/useLeaderWorkflow'
import { workflow } from '../../services/leaderWorkflow'
import { budgetExceedsLimit, money } from '../../services/leaderWorkflowContract'

const field = 'rounded-lg border border-border bg-background p-3'

export default function WorkflowBudgetForm({ campaign, onCreated }) {
  const [allocations, setAllocations] = useState(() => campaign.channels.map(channel => ({ channel, current: Number(campaign.allocations[channel]), proposed: Number(campaign.allocations[channel]) })))
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const action = useWorkflowAction()
  const total = allocations.reduce((n, a) => n + a.proposed, 0)
  async function submit(event) {
    event.preventDefault()
    const result = await action.run(() => workflow('submit', { campaignId: campaign.id, kind: 'budget_proposal', title: `Phân bổ ngân sách ${campaign.name}`.slice(0, 120), payload: { totalBudget: Number(campaign.budget), allocations }, requestId, submit: true }))
    if (result) onCreated(result.id)
  }
  return <WorkflowPanel title="Đề xuất phân bổ ngân sách" action={action}>
    <p>Ngân sách kế hoạch: {money(campaign.budget, campaign.currency)}. Phân bổ nền lấy từ chiến dịch; đây không phải chi tiêu thực tế.</p>
    <form onSubmit={submit} className="space-y-3">{allocations.map((a, i) => <label key={a.channel} className="flex flex-wrap items-center gap-3"><span>{a.channel} · nền {money(a.current, campaign.currency)}</span><input aria-label={`Ngân sách ${a.channel}`} className={field} type="number" required min="0" max="1000000000" step="0.01" value={a.proposed} onChange={e => { setAllocations(items => items.map((x, n) => n === i ? { ...x, proposed: Number(e.target.value) } : x)); setRequestId(crypto.randomUUID()) }} /></label>)}
      <p>Tổng: {money(total, campaign.currency)}</p>{budgetExceedsLimit(allocations) && <p className="text-warning">Vượt 20%: cần Marketing Manager duyệt.</p>}
      <Button disabled={action.busy || Math.abs(total - Number(campaign.budget)) > 0.005}>Gửi đề xuất</Button>
    </form>
  </WorkflowPanel>
}
