import { useState } from 'react'
import { Button } from '@/components/ui/button'
import LeaderApprovalQueue from './screens/LeaderApprovalQueue'
import LeaderProposalReview from './components/LeaderProposalReview'
import WorkflowPanel from './components/WorkflowPanel'
import WorkflowNotifications from './screens/WorkflowNotifications'
import { useWorkflowQuery } from '../hooks/useLeaderWorkflow'

export default function WorkflowInbox({ mine = false, mode = 'proposals' }) {
  const [id, setId] = useState(null)
  const [revision, setRevision] = useState(0)
  const [tab, setTab] = useState(mode)
  const context = useWorkflowQuery('context')
  return <WorkflowPanel title="Đề xuất trong doanh nghiệp" query={context}>
    {context.data && <><Button variant="outline" onClick={() => { setId(null); setTab(t => t === 'notifications' ? 'proposals' : 'notifications') }}>{tab === 'notifications' ? 'Danh sách đề xuất' : 'Thông báo đề xuất'}</Button>{id ? <LeaderProposalReview key={id} id={id} context={context.data} onBack={() => setId(null)} onChanged={() => setRevision(n => n + 1)} /> : tab === 'notifications' ? <WorkflowNotifications revision={revision} onChanged={() => setRevision(n => n + 1)} onSelect={setId} /> : <LeaderApprovalQueue mine={mine || context.data.role === 'member'} canExport={context.data.role !== 'member'} revision={revision} onSelect={setId} />}</>}
  </WorkflowPanel>
}
