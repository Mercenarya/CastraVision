import PropTypes from 'prop-types'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Card cảnh báo chẩn đoán tự động (FR05).
export default function AlertPanel({ code, label, title, body, cta, onAction }) {
  return (
    <Card className="gap-3 border-l-4 border-l-coral p-5 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between gap-3 text-[11px] font-bold tracking-wider uppercase">
        <span className="text-coral">{code}</span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <h3 className="text-xl leading-snug font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      {cta && (
        <Button type="button" className="w-full" onClick={onAction}>
          <ArrowUpRight /> {cta}
        </Button>
      )}
    </Card>
  )
}

AlertPanel.propTypes = {
  code: PropTypes.string,
  label: PropTypes.string,
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  cta: PropTypes.string,
  onAction: PropTypes.func,
}
