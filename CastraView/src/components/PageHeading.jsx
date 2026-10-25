import PropTypes from 'prop-types'

export default function PageHeading({ eyebrow, title, subtitle, children }) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.09em] text-info">
          <i className="size-2 shrink-0 rounded-full bg-info" /> {eyebrow}
        </div>
        <h1 className="mt-3 mb-1.5 text-[clamp(30px,3.2vw,47px)] leading-[1.12] font-extrabold tracking-tight">{title}</h1>
        <p className="text-base leading-normal text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

PageHeading.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  children: PropTypes.node,
}
