import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'

export default function Brand({ className, size = 'md' }) {
  const large = size === 'lg'
  return (
    <div className={cn('flex items-center gap-2.5 font-extrabold tracking-tight whitespace-nowrap', large ? 'text-[26px]' : 'text-xl', className)}>
      <span
        className={cn(
          'grid place-items-center rounded-[9px] border-2 border-info text-info leading-none',
          large ? 'size-9 text-[26px]' : 'size-[31px] text-[23px]',
        )}
        aria-hidden="true"
      >
        ✣
      </span>
      <span>CastraVision</span>
    </div>
  )
}

Brand.propTypes = { className: PropTypes.string, size: PropTypes.oneOf(['md', 'lg']) }
