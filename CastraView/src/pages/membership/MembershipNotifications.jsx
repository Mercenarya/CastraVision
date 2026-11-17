import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMembershipNotifications } from '@/hooks/useMembershipNotifications'
import { membershipService } from '@/services/membership'

const labels = {
  join_requested: 'Có yêu cầu gia nhập cần duyệt', join_approved: 'Yêu cầu gia nhập đã được duyệt',
  join_rejected: 'Yêu cầu gia nhập đã bị từ chối', invitation_created: 'Bạn nhận được lời mời vào công ty',
  invitation_accepted: 'Lời mời đã được chấp nhận', membership_removed: 'Quyền vào Workspace đã được thu hồi',
  membership_updated: 'Vai trò hoặc nhóm làm việc đã được cập nhật',
}
export default function MembershipNotifications({ userId, service = membershipService, onOpenResource }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const { items, unreadCount, error: loadError, markRead, refresh } = useMembershipNotifications({ userId, service })
  return <><Button variant="ghost" className="relative shrink-0" onClick={() => { setOpen(true); void refresh() }} aria-label={`Thông báo nhân sự, ${unreadCount} chưa đọc`}><Bell className="size-5" />{unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-info px-1 text-xs font-bold text-info-foreground">{unreadCount > 99 ? '99+' : unreadCount}</span>}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto bg-card text-foreground"><DialogHeader><DialogTitle>Thông báo nhân sự</DialogTitle><DialogDescription>{unreadCount} thông báo chưa đọc. Đánh dấu đã đọc không thay đổi kết quả duyệt.</DialogDescription></DialogHeader>
      {(error || loadError) && <p role="alert" className="text-sm text-destructive">{error || loadError}</p>}
      {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Chưa có thông báo.</p>}
      <div className="grid gap-3">{items.map(item => <article key={item.id} className="rounded-lg border border-border p-4"><h3 className="text-sm font-semibold">{labels[item.eventType] || 'Cập nhật nhân sự'}</h3><p className="mt-1 text-xs text-muted-foreground">{item.companyName} · {new Date(item.createdAt).toLocaleString('vi-VN')}</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={async () => { try { await onOpenResource?.(item); if (!item.readAt) await markRead(item.id); setOpen(false) } catch (cause) { setError(cause.message) } }}>Xem chi tiết</Button>{!item.readAt && <Button size="sm" variant="ghost" onClick={async () => { try { await markRead(item.id) } catch (cause) { setError(cause.message) } }}>Đánh dấu đã đọc</Button>}</div></article>)}</div>
    </DialogContent></Dialog>
  </>
}
