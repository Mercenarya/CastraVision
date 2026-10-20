import PropTypes from 'prop-types'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Nhãn + ô nhập; control được bọc trong <label> nên getByLabelText hoạt động.
export default function Field({ label, className, children }) {
  return (
    <Label className={cn('grid gap-2 text-[13px] font-semibold text-[#cbd4eb]', className)}>
      {label}
      {children}
    </Label>
  )
}

Field.propTypes = { label: PropTypes.node.isRequired, className: PropTypes.string, children: PropTypes.node }
