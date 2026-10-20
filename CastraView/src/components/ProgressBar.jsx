import PropTypes from 'prop-types'
import { Progress } from '@/components/ui/progress'

// Thanh tiến độ có vạch mục tiêu (goal) tùy chọn; color là màu CSS của thanh.
export default function ProgressBar({ value, max = 5, goal, color = 'var(--primary)', label, meta }) {
  const pct = Math.min(100, (value / max) * 100)
  const goalPct = goal ? Math.min(100, (goal / max) * 100) : null

  return (
    <div className="flex flex-col gap-2">
      {(label || meta) && (
        <div className="flex items-baseline justify-between gap-3 text-[13px]">
          <span className="font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground">{meta}</span>
        </div>
      )}
      <div className="relative">
        <Progress
          value={pct}
          aria-label={label}
          className="h-2 bg-background [&>*]:bg-(--bar-color)"
          style={{ '--bar-color': color }}
        />
        {goalPct !== null && (
          <div
            className="absolute -top-1 h-4 w-0.5 rounded bg-foreground/70"
            style={{ left: `${goalPct}%` }}
            title={`Goal: ${goal}`}
          />
        )}
      </div>
    </div>
  )
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  goal: PropTypes.number,
  color: PropTypes.string,
  label: PropTypes.string,
  meta: PropTypes.string,
}
