import PropTypes from 'prop-types'
import { Check, X } from 'lucide-react'

export default function Toast({ message, clear }) {
  if (!message) return null
  return (
    <div
      role="status"
      className="fixed top-24 right-6 z-20 flex max-w-sm items-center gap-3 rounded-xl border-l-4 border-info bg-popover p-4 text-sm shadow-xl shadow-black/50"
    >
      <b className="grid size-6 shrink-0 place-items-center rounded-full bg-info text-[#0d3441]">
        <Check className="size-4" />
      </b>
      {message}
      <button type="button" onClick={clear} aria-label="Đóng thông báo" className="ml-auto text-muted-foreground">
        <X className="size-4" />
      </button>
    </div>
  )
}

Toast.propTypes = { message: PropTypes.string, clear: PropTypes.func.isRequired }
