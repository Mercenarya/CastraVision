import PropTypes from 'prop-types'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const KIND_CLASS = {
  error: 'border-destructive/60 bg-destructive/15 text-red-200',
  warning: 'border-warning/50 bg-warning/10 text-amber-100',
}

export default function Notice({ kind = 'error', children }) {
  return (
    <Alert role={kind === 'error' ? 'alert' : 'status'} className={cn('my-3.5 block', KIND_CLASS[kind])}>
      {children}
    </Alert>
  )
}

Notice.propTypes = { kind: PropTypes.oneOf(['error', 'warning']), children: PropTypes.node }
