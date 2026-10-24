import './leader.css'

const channels = [
  ['Google Search', '1.84M', '4.15%', '$1.06', '4.20×', 88, 'High intent'],
  ['Meta Ads', '2.10M', '3.10%', '$1.32', '3.65×', 73, 'Retargeting'],
  ['TikTok Video', '880K', '2.45%', '$1.46', '2.80×', 56, 'Needs optimization'],
]

export function LeaderDashboardView({ importCount, onOpenBudget, onRefresh }) {
  return (
    <>
      <header className="leader-dashboard-intro">
        <div>
          <span className="leader-dashboard-code">LEADER · PERFORMANCE MONITORING</span>
          <h1>Dashboard hiệu suất chiến dịch</h1>
          <p>Theo dõi hiệu quả các kênh marketing so với mục tiêu đã thiết lập.</p>
        </div>
        <button type="button" className="button subtle" onClick={onRefresh}>↻ Làm mới dữ liệu</button>
      </header>

      <section className="leader-dashboard-metrics" aria-label="Campaign performance summary">
        <article><span>Impressions</span><strong>4,82M</strong><small className="success-text">↗ +12.4% so với kỳ trước</small></article>
        <article><span>CTR</span><strong>3.42%</strong><small>Benchmark 2.80%</small></article>
        <article><span>CPA</span><strong>$1.24</strong><small>-$0.16 so với mục tiêu</small></article>
        <article><span>ROAS</span><strong>3.85×</strong><small className="success-text">Trên mục tiêu</small></article>
      </section>

      <div className="leader-dashboard-split">
        <section className="leader-dashboard-panel">
          <header><h2>Hiệu suất theo kênh</h2><span>{importCount || 3} nguồn dữ liệu</span></header>
          <div className="leader-channel-list">
            {channels.map(([name, impressions, ctr, cpa, roas, progress, note]) => (
              <article className="leader-channel-row" key={name}>
                <div><strong>{name}</strong><small>{note}</small></div>
                <b>{impressions}</b><b>{ctr}</b><b>{cpa}</b><b>{roas}</b>
                <div className="leader-progress" aria-label={`${name} performance ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
              </article>
            ))}
          </div>
        </section>

        <section className="leader-dashboard-panel leader-alert-panel">
          <header><h2>Cảnh báo tối ưu</h2><span>Action required</span></header>
          <div className="leader-alert-body">
            <span className="actor-badge rejected">Alert trigger</span>
            <h3>TikTok CPA vượt ngưỡng</h3>
            <p>CPA hiện tại cao hơn mục tiêu. Hãy cân nhắc phân bổ lại ngân sách để bảo vệ biên lợi nhuận.</p>
            <button type="button" className="button primary full" onClick={onOpenBudget}>Mở trình tối ưu ngân sách</button>
          </div>
        </section>
      </div>
    </>
  )
}
