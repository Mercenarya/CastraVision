import PropTypes from 'prop-types'

export default function MiniLabel({ children }) {
  return <span className="block text-[11px] font-extrabold tracking-[0.08em] text-info">{children}</span>
}

MiniLabel.propTypes = { children: PropTypes.node }
