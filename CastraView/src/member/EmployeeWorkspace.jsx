import { useState } from 'react'
import MemberLayout from './MemberLayout'
import { MemberDashboardView } from './ui/MemberDashboardView'
import EmployeeCampaigns from './screens/EmployeeCampaigns'
import EmployeeReferences from './screens/EmployeeReferences'
import WorkflowStudio from '../leader/WorkflowStudio'
import WorkflowInbox from '../leader/WorkflowInbox'
import SettingsPage from '../pages/SettingsPage'
import { useEmployeeOverview } from '../hooks/useEmployeeOverview'
import { useAuth } from '../auth/AuthContext'
import TaskBoard from './TaskBoard'

export default function EmployeeWorkspace({ user, profile, page, setPage, logout }) {
  const auth = useAuth()
  const query = useEmployeeOverview(`${user.id}:${auth.workspaceId}`)
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  function navigate(next) { setSelectedProposal(null); setSelectedTask(null); setPage(next) }
  function openProposal(id) { setSelectedProposal(id); setPage('submissions') }
  function openTask(id) { setSelectedTask(id); setPage('tasks') }
  return <MemberLayout user={user} profile={profile} workspaceId={auth.workspaceId} page={page} setPage={navigate} logout={logout} unreadCount={query.data?.notifications?.unreadCount} taskCount={query.data?.tasks?.summary.active}>
    <main className="space-y-5 p-4 text-foreground md:p-6">
      {page === 'overview' && <MemberDashboardView {...query} onRefresh={query.refresh} onOpenPage={navigate} onOpenProposal={openProposal} onOpenTask={openTask} />}
      {(page === 'tasks' || page === 'emp-tasks') && <TaskBoard key={selectedTask || 'tasks'} initialId={selectedTask} onOpenProposal={openProposal} />}
      {(page === 'assigned-campaigns' || page === 'campaigns') && <EmployeeCampaigns />}
      {(page === 'submissions' || page === 'reports') && <WorkflowInbox key={selectedProposal || 'list'} initialId={selectedProposal} mine />}
      {page === 'content' && <WorkflowStudio kind="content" />}
      {page === 'strategy' && <EmployeeReferences />}
      {page === 'notifications' && <WorkflowInbox key="notifications" mine mode="notifications" onSelectTask={openTask} />}
      {page === 'profile' && <SettingsPage user={user} actorRole="member" membership={auth.membership} profile={profile} />}
    </main>
  </MemberLayout>
}
