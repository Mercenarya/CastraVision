import PropTypes from 'prop-types'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Khối nội dung có tiêu đề và chú thích phải.
export default function Panel({ title, meta, children, className }) {
  return (
    <Card className={cn('mb-5 gap-0 overflow-hidden py-0', className)}>
      <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
      </header>
        {children}
    </Card>
  )
}

Panel.propTypes = {
  title: PropTypes.string.isRequired,
  meta: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
}
