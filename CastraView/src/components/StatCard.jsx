import PropTypes from 'prop-types'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const TONE_CLASS = {
  healthy: 'bg-success/15 text-success',
  optimized: 'bg-success/15 text-success',
  'above-target': 'bg-info/15 text-info',
  outperforming: 'bg-primary/15 text-primary',
  'needs-opt': 'bg-destructive/15 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
}

// Thẻ KPI của Performance Dashboard (FR05).
export default function StatCard({ label, value, delta, deltaPositive, benchmark, status, statusTone }) {
  return (
    <Card className="gap-2 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
        {status && (
          <Badge className={cn('uppercase', TONE_CLASS[statusTone] || TONE_CLASS.neutral)}>{status}</Badge>
        )}
      </div>
      <strong className="text-[clamp(26px,3vw,36px)] leading-tight font-extrabold">{value}</strong>
      {delta && (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[13px]',
            deltaPositive ? 'text-success' : 'text-destructive',
          )}
        >
          {deltaPositive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
          {delta}
        </span>
      )}
      {benchmark && !delta && <span className="text-xs text-muted-foreground">{benchmark}</span>}
    </Card>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  delta: PropTypes.string,
  deltaPositive: PropTypes.bool,
  benchmark: PropTypes.string,
  status: PropTypes.string,
  statusTone: PropTypes.oneOf(Object.keys(TONE_CLASS)),
}
