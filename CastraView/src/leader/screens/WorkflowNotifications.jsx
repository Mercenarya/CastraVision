import { useLanguage } from '@/hooks/useLanguage'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from '../components/WorkflowPanel'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { workflow } from '../../services/leaderWorkflow'

export default function WorkflowNotifications({ revision, onChanged, onSelect, onSelectTask }) {
  const { t, language } = useLanguage()
  const [page, setPage] = useState(0)
  const query = useWorkflowQuery('notifications', { limit: 20, offset: page * 20 }, revision)
  const action = useWorkflowAction(() => { query.reload(); onChanged() })
  return <div className="p-6"><WorkflowPanel title={t('employeeFlow.notifications')} query={query} action={action}>
    <p>{t('employeeFlow.unread', {count: query.data?.unreadCount ?? '—'})}</p>
    {query.data?.items?.length === 0 && <p>{t('employeeFlow.noNotifications')}</p>}
    {query.data?.items?.map(n => <article className="space-y-2 rounded-lg border border-border p-3" key={n.id}>
      <p className={n.is_read ? 'text-muted-foreground' : 'font-bold'}>{n.message}</p><p className="text-xs">{new Date(n.created_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</p>
      <div className="flex gap-2">{!n.is_read && <Button variant="outline" disabled={action.busy} onClick={() => action.run(() => workflow('read_notification', { id: n.id }))}>{t('employeeFlow.markRead')}</Button>}{n.entity_type === 'approval' && n.entity_id && <Button onClick={() => onSelect(n.entity_id)}>{t('employeeFlow.openProposal')}</Button>}{n.entity_type === 'workspace_task' && n.entity_id && onSelectTask && <Button onClick={() => onSelectTask(n.entity_id)}>{t('employeeFlow.openTask')}</Button>}</div>
    </article>)}
    <div className="flex gap-3"><Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>{t('employeeFlow.previous')}</Button><span>{t('employeeFlow.page', {page: page + 1})}</span><Button variant="outline" disabled={query.data?.items?.length !== 20} onClick={() => setPage(p => p + 1)}>{t('employeeFlow.next')}</Button></div>
  </WorkflowPanel></div>
}
