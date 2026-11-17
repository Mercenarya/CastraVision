import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function MutationDialog({ title, description, onClose, onSubmit, submitLabel = 'Lưu thay đổi', children, destructive = false }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try { await onSubmit(); onClose() }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}>
    <DialogContent showCloseButton={!busy} className="max-h-[90dvh] overflow-y-auto bg-card text-card-foreground" onEscapeKeyDown={event => { if (busy) event.preventDefault() }}>
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="grid gap-5">
        <fieldset disabled={busy} className="grid gap-4">{children}</fieldset>
        {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button><Button type="submit" variant={destructive ? 'destructive' : 'default'} disabled={busy}>{busy ? 'Đang xử lý…' : submitLabel}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
