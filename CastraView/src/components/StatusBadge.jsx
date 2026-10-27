import PropTypes from 'prop-types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TONE_CLASS = {
  neutral: 'bg-[#30384b] text-[#d7def1]',
  admin: 'bg-[#7065ee] text-white',
  pending: 'bg-[#7065ee] text-white',
  manager: 'bg-[#0aabc7] text-[#071524]',
  edited: 'bg-[#0aabc7] text-[#071524]',
  member: 'bg-[#47566f] text-white',
  active: 'bg-[#20c96b] text-[#061a11]',
  approved: 'bg-[#20c96b] text-[#061a11]',
  rejected: 'bg-[#b91d2e] text-white',
}

export default function StatusBadge({ tone = 'neutral', children }) {
  return <Badge className={cn('rounded-[5px] font-extrabold uppercase', TONE_CLASS[tone] || TONE_CLASS.neutral)}>{children}</Badge>
}

StatusBadge.propTypes = { tone: PropTypes.oneOf(Object.keys(TONE_CLASS)), children: PropTypes.node }
