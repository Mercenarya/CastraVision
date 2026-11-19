import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from '../components/WorkflowPanel'
import { useWorkflowAction } from '../../hooks/useLeaderWorkflow'
import { workflow } from '../../services/leaderWorkflow'
import SettingsPage from '../../pages/SettingsPage'

export default function WorkflowAccount({ context, onChanged }) {
  const [fullName, setFullName] = useState(context.actor.fullName || '')
  const [avatarUrl, setAvatarUrl] = useState(context.actor.avatarUrl || '')
  const [saved, setSaved] = useState(false)
  const action = useWorkflowAction(onChanged)
  async function save(event) {
    event.preventDefault(); setSaved(false)
    if (await action.run(() => workflow('save_profile', { fullName, avatarUrl }))) setSaved(true)
  }
  return <div className="p-6"><SettingsPage user={{ id: context.actor.id, email: context.actor.email, full_name: context.actor.fullName }} actorRole="leader" membership={{ workspaceId: context.workspace.id, role: context.role }} accountContent={<WorkflowPanel title="Account Settings" action={action}>
    <p>{context.actor.email} · Leader · {context.workspace.name}</p>
    <p className="text-sm text-muted-foreground">Chỉ cập nhật hồ sơ cá nhân. Vai trò, Team và cấu hình doanh nghiệp do người có quyền quản lý.</p>
    <form className="space-y-4" onSubmit={save}>
      <label className="block">Họ tên<input className="block w-full rounded-lg border border-border bg-background p-3" required maxLength={100} value={fullName} onChange={e => setFullName(e.target.value)} /></label>
      <label className="block">URL ảnh đại diện (HTTPS)<input className="block w-full rounded-lg border border-border bg-background p-3" type="url" pattern="https://.*" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} /></label>
      <Button disabled={action.busy}>Lưu hồ sơ</Button>{saved && <p role="status" className="text-success">Đã lưu hồ sơ.</p>}
    </form>
  </WorkflowPanel>} /></div>
}
