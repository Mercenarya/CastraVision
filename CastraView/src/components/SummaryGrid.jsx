import PropTypes from 'prop-types'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Hàng thẻ số liệu: mỗi item là { value, label, valueClass? }.
export default function SummaryGrid({ items }) {
  return (
    <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ value, label, valueClass }) => (
        <Card key={label} className="gap-1 p-5">
          <strong className={cn('block text-[28px]', valueClass)}>{value}</strong>
          <span className="text-xs text-muted-foreground">{label}</span>
        </Card>
      ))}
    </div>
  )
}

SummaryGrid.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.node.isRequired, label: PropTypes.string.isRequired, valueClass: PropTypes.string }),
  ).isRequired,
}
