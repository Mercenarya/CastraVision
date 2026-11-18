import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from './components/WorkflowPanel'
import LeaderProposalReview from './components/LeaderProposalReview'
import WorkflowComposer from './screens/WorkflowComposer'
import LeaderApprovalQueue from './screens/LeaderApprovalQueue'
import { useWorkflowQuery } from '../hooks/useLeaderWorkflow'

export default function WorkflowStudio({ kind }) {
  const [id, setId] = useState(null)
  const [list, setList] = useState(false)
  const [revision, setRevision] = useState(0)
  const context = useWorkflowQuery('context')
  return <WorkflowPanel query={context}>
    {context.data && <><Button variant="outline" onClick={() => { setId(null); setList(x => !x) }}>{list ? 'Tạo bản nháp' : 'Đề xuất của tôi'}</Button>{id ? <LeaderProposalReview key={id} id={id} context={context.data} onBack={() => setId(null)} onChanged={() => setRevision(n => n + 1)} /> : list ? <LeaderApprovalQueue mine canExport={context.data.role !== 'member'} revision={revision} onSelect={setId} /> : <WorkflowComposer kind={kind} revision={revision} onCreated={value => { setId(value); setRevision(n => n + 1) }} />}</>}
  </WorkflowPanel>
}
