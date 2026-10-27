import PropTypes from 'prop-types'

// Đầu trang của các màn quản trị: mã FR, tiêu đề, mô tả và hành động chính.
export default function PageIntro({ code, title, subtitle, action }) {
  return (
    <header className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div>
        <span className="inline-flex rounded-[5px] bg-[#242d41] px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] text-[#55d9fb]">{code}</span>
        <h1 className="my-2 text-[clamp(30px,4vw,44px)] leading-[1.05] font-extrabold">{title}</h1>
        <p className="max-w-[760px] text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </header>
  )
}

PageIntro.propTypes = {
  code: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  action: PropTypes.node,
}
