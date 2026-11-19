import { useState } from 'react'
import WorkflowPerformance from '../leader/screens/WorkflowPerformance'
import WorkflowInbox from '../leader/WorkflowInbox'
import { workflow } from '../services/leaderWorkflow'
import { Button } from '@/components/ui/button'

export default function LiveManagerBudget() {
  const [proposal, setProposal] = useState(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  async function created(id) {
    try {
      const saved = await workflow('proposal', { id })
      if (!saved || saved.id !== id) throw new Error('Chưa xác nhận được đề xuất đã lưu. Hãy kiểm tra hàng đợi trước khi thử lại.')
      setProposal(id); setError(''); setRevision(n => n + 1)
      window.dispatchEvent(new Event('castra:workflow-changed'))
    } catch (cause) { setError(cause.message) }
  }
  return <section className="space-y-4"><h1 className="text-3xl font-semibold">Ngân sách & ROAS</h1>{error && <p role="alert">{error}</p>}{proposal ? <><p role="status">Đã lưu đề xuất {proposal}. Ngân sách chưa tự động áp dụng.</p><Button variant="outline" onClick={() => setProposal(null)}>Quay lại ngân sách</Button><WorkflowInbox key={proposal} initialId={proposal} /></> : <WorkflowPerformance revision={revision} onCreated={created} />}</section>
}
