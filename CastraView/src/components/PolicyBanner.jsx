import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'

const TONE_CLASS = {
  default: 'border-[#303a52] bg-[#20283b] text-[#bfc8dd]',
  coral: 'border-[#303a52] border-l-4 border-l-coral bg-[#20283b] text-[#bfc8dd]',
  success: 'border-[#1d8354] bg-[#20283b] text-[#75eba9]',
}

export default function PolicyBanner({ tone = 'default', children }) {
  return (
    <div className={cn('mb-5 flex flex-col justify-between gap-4 rounded-[10px] border px-5 py-4 sm:flex-row sm:items-center', TONE_CLASS[tone])}>
      {children}
    </div>
  )
}

PolicyBanner.propTypes = { tone: PropTypes.oneOf(Object.keys(TONE_CLASS)), children: PropTypes.node }
