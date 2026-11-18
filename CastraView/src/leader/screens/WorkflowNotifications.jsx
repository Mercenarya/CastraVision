import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from '../components/WorkflowPanel'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { workflow } from '../../services/leaderWorkflow'

export default function WorkflowNotifications({ revision, onChanged, onSelect }) {
  const [page, setPage] = useState(0)
  const query = useWorkflowQuery('notifications', { limit: 20, offset: page * 20 }, revision)
  const action = useWorkflowAction(() => { query.reload(); onChanged() })
  return <div className="p-6"><WorkflowPanel title="Notifications" query={query} action={action}>
    <p>{query.data?.unreadCount ?? '—'} thông báo chưa đọc</p>
    {query.data?.items?.length === 0 && <p>Chưa có thông báo.</p>}
    {query.data?.items?.map(n => <article className="space-y-2 rounded-lg border border-border p-3" key={n.id}>
      <p className={n.is_read ? 'text-muted-foreground' : 'font-bold'}>{n.message}</p><p className="text-xs">{new Date(n.created_at).toLocaleString('vi-VN')}</p>
      <div className="flex gap-2">{!n.is_read && <Button variant="outline" disabled={action.busy} onClick={() => action.run(() => workflow('read_notification', { id: n.id }))}>Đánh dấu đã đọc</Button>}{n.entity_type === 'approval' && n.entity_id && <Button onClick={() => onSelect(n.entity_id)}>Mở đề xuất</Button>}</div>
    </article>)}
    <div className="flex gap-3"><Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button><span>Trang {page + 1}</span><Button variant="outline" disabled={query.data?.items?.length !== 20} onClick={() => setPage(p => p + 1)}>Sau</Button></div>
  </WorkflowPanel></div>
}
