import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'
import { CHANNELS } from '@/utils/constants'

const GLYPH = { Meta: '∞', TikTok: '♪', 'Google Ads': 'G' }

export default function ChannelPicker({ channels, toggle }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {CHANNELS.map((channel) => {
        const selected = channels.includes(channel)
        return (
          <button
            type="button"
            key={channel}
            onClick={() => toggle(channel)}
            aria-pressed={selected}
            className={cn(
              'relative grid min-h-[104px] content-between justify-items-start rounded-[10px] border bg-muted p-3.5 text-left text-[#d5def4]',
              selected ? 'border-[#8582ff] bg-[#222b46]' : 'border-border',
            )}
          >
            <span className="text-2xl leading-none font-black text-info">{GLYPH[channel]}</span>
            <strong className="text-[13px]">{channel}</strong>
            <span
              className={cn(
                'absolute top-3 right-3 grid size-5 place-items-center rounded-[5px] border text-primary-foreground font-extrabold',
                selected ? 'border-primary bg-primary' : 'border-[#687998]',
              )}
            >
              {selected ? '✓' : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}

ChannelPicker.propTypes = {
  channels: PropTypes.arrayOf(PropTypes.string).isRequired,
  toggle: PropTypes.func.isRequired,
}
