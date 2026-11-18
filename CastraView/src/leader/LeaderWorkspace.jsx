import { useState } from 'react'
import LeaderLayout from './LeaderLayout'
import LeaderApprovalQueue from './screens/LeaderApprovalQueue'
import LeaderCampaigns from './screens/LeaderCampaigns'
import LeaderProposalReview from './components/LeaderProposalReview'
import WorkflowPanel from './components/WorkflowPanel'
import WorkflowComposer from './screens/WorkflowComposer'
import WorkflowAccount from './screens/WorkflowAccount'
import WorkflowImport from './screens/WorkflowImport'
import WorkflowNotifications from './screens/WorkflowNotifications'
import WorkflowPerformance from './screens/WorkflowPerformance'
import { useWorkflowQuery } from '../hooks/useLeaderWorkflow'

export default function LeaderWorkspace({ logout }) {
  const [page, setPage] = useState('overview')
  const [revision, setRevision] = useState(0)
  const [proposalId, setProposalId] = useState(null)
  const [campaignId, setCampaignId] = useState('')
  const context = useWorkflowQuery('context', {}, revision)
  const notifications = useWorkflowQuery('notifications', { limit: 1 }, revision)
  const summary = useWorkflowQuery('analytics', {}, revision)
  const changed = () => setRevision(n => n + 1)
  function navigate(key, campaign = '') { setPage(key); setProposalId(null); setCampaignId(campaign) }
  function select(id) { setProposalId(id); setPage('proposal') }
  if (!context.data) return <div className="p-6"><WorkflowPanel title="Leader Workspace" query={context} /><button type="button" className="mt-4 underline" onClick={logout}>Đăng xuất</button></div>
  const value = context.data
  return <LeaderLayout user={{ email: value.actor.email, full_name: value.actor.fullName }} profile={{ business_name: value.workspace.name, workspace_id: value.workspace.id }} notificationCount={notifications.data?.unreadCount} approvalCount={summary.data?.pendingCount} page={page} setPage={navigate} logout={logout}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3 text-sm"><p>Team: {value.teams.map(t => t.name).join(', ') || 'Chưa được phân công'}</p><button type="button" className="rounded-lg border border-border px-3 py-2" onClick={changed}>Sync Squad Data</button></div>
    {context.error && <p role="alert" className="p-4 text-destructive">{context.error}</p>}
    {page === 'proposal' && <LeaderProposalReview key={proposalId} id={proposalId} context={value} onBack={() => navigate('approvals')} onChanged={changed} />}
    {(page === 'overview' || page === 'performance') && <WorkflowPerformance key={`${page}:${campaignId}`} initialCampaign={campaignId} overview={page === 'overview'} setPage={navigate} revision={revision} onCreated={id => { changed(); select(id) }} />}
    {(page === 'approvals' || page === 'my-proposals') && <LeaderApprovalQueue key={page} mine={page === 'my-proposals'} revision={revision} onSelect={select} />}
    {page === 'campaigns' && <LeaderCampaigns context={value} revision={revision} onChanged={changed} setPage={navigate} />}
    {(page === 'strategy' || page === 'content') && <WorkflowComposer key={page} kind={page} revision={revision} onCreated={id => { changed(); select(id) }} />}
    {page === 'profile' && <WorkflowAccount context={value} onChanged={changed} />}
    {page === 'import' && <WorkflowImport revision={revision} onChanged={changed} />}
    {page === 'notifications' && <WorkflowNotifications revision={revision} onChanged={changed} onSelect={select} />}
  </LeaderLayout>
}
