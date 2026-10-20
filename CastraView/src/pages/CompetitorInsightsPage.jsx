import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Activity, RefreshCw, Zap } from 'lucide-react'
import PageIntro from '@/components/PageIntro'
import Panel from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const competitorRows = [
  ['Strider Athletics', 'Activewear & Marathon Running Series', '$45k – $60k', '142 ads', 'Meta 55% · Google 35% · TikTok 10%', 'Lightweight Breathability', 'Direct Rival'],
  ['Apex Footwear Co.', 'Endurance footwear & cross-country trainers', '$25k – $35k', '88 ads', 'Google 60% · Meta 30% · TikTok 10%', 'Durability & Cushioning', 'Trail & Utility'],
  ['Urban Pace Brand', 'Lifestyle athletic apparel & commuter gear', '$15k – $25k', '46 ads', 'TikTok 50% · Meta 40% · Google 10%', 'Streetwear Lifestyle', 'Fast Growing'],
]

function CompetitorCard({ row, index }) {
  const [name, category, spend, ads, allocation, angle, badge] = row
  return <article className="rounded-lg bg-muted/60 p-4"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-lg bg-muted text-lg font-bold text-primary">{name[0]}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong>{name}</strong><small className={cn('rounded px-2 py-1 text-[10px]', index === 0 ? 'text-info' : 'text-primary')}>{badge}</small></div><small className="block text-xs text-muted-foreground">{category}</small></div><div className="hidden text-right sm:block"><small className="block text-[10px] text-muted-foreground">EST. MONTHLY SPEND</small><b>{spend}</b><small className="ml-6 text-[10px] text-muted-foreground">ACTIVE AD COUNT</small><b className="ml-2 text-primary">{ads}</b></div></div><div className="mt-4 grid items-center gap-3 text-xs sm:grid-cols-[1fr_auto]"><div><div className="flex justify-between text-muted-foreground"><span>Channel Allocation</span><span>{allocation}</span></div><div className="mt-2 flex h-2 overflow-hidden rounded-full"><span className={cn(index === 0 ? 'w-[55%]' : index === 1 ? 'w-[60%]' : 'w-[10%]', 'bg-violet')} /><span className={cn(index === 0 ? 'w-[35%]' : index === 1 ? 'w-[30%]' : 'w-[50%]', 'bg-info')} /><span className={cn(index === 0 ? 'w-[10%]' : index === 1 ? 'w-[10%]' : 'w-[40%]', 'bg-violet')} /></div></div><div className="border-l border-border pl-4 text-muted-foreground">TOP CREATIVE ANGLE<br /><b className="text-foreground">“{angle}”</b></div></div></article>
}
CompetitorCard.propTypes = { row: PropTypes.arrayOf(PropTypes.string).isRequired, index: PropTypes.number.isRequired }

export default function CompetitorInsightsPage({ notify }) {
  const [processing, setProcessing] = useState(false)
  const [competitors, setCompetitors] = useState('Strider Athletics, Apex Footwear')
  const entities = useMemo(() => competitors.split(',').map((item) => item.trim()).filter(Boolean), [competitors])

  function analyze() {
    setProcessing(true)
    window.setTimeout(() => { setProcessing(false); notify?.('Market signals refreshed.') }, 600)
  }

  return (
    <>
      <PageIntro code="FR09 // MARKET INTELLIGENCE" title="Competitor Analysis & Market Trends" subtitle="Strategic benchmarks, competitor ad frequency, and category CPM/CPA market trends across enterprise direct-to-consumer cohorts." action={<div className="flex gap-2"><select className="w-[225px]" aria-label="Category scope"><option>Retail &amp; E-commerce Activewear</option><option>All categories</option></select><Button variant="secondary" type="button" onClick={analyze}><RefreshCw /> Refresh Signals</Button></div>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['CATEGORY AVG CTR', '2.15%', 'vs Category', 'Acme Corp: 3.42% (+1.27% advantage)', 'Leading'],
          ['INDUSTRY BENCHMARK CPA', '$32.40', 'Median', 'Acme Corp: $24.80 ($7.60 lower cost)', 'Cost Efficient'],
          ['MARKET AD FREQUENCY', '+18.2%', 'QoQ', 'Increased competitor activity in Q4', 'Surging'],
          ['DOMINANT CATEGORY CHANNEL', 'Search', 'Google Ads', '52% aggregate competitor budget share', 'High Volume'],
        ].map(([label, value, suffix, detail, badge]) => <article key={label} className="rounded-xl border border-border bg-card p-4"><div className="flex justify-between gap-2"><span className="text-[11px] font-bold tracking-wider text-muted-foreground">{label}</span><span className="rounded bg-violet/20 px-2 py-1 text-[10px] text-primary">{badge}</span></div><div className="mt-8 flex items-baseline gap-2"><strong className="text-[31px] leading-none">{value}</strong><small className="text-xs text-info">{suffix}</small></div><p className="mt-3 text-xs text-muted-foreground">↗ {detail}</p></article>)}
      </div>
      {processing && <div className="mb-4 flex items-center gap-2 text-sm text-info"><Activity className="size-4 animate-pulse" /> Collecting real-time market signals…</div>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.15fr)_310px]">
        <div>
          <Panel title="◎  Tracked Competitors & Channel Footprint" meta={`${entities.length || 3} DETECTED`}><div className="grid gap-3 p-4">{competitorRows.map((row, index) => <CompetitorCard key={row[0]} row={row} index={index} />)}</div></Panel>
          <Panel title="14-Day Category Impression Surge Profile" meta="● Google Ads   ● Meta Ads   ● TikTok Ads"><div className="p-5"><div className="relative h-36 border-b border-border"><svg className="h-full w-full" viewBox="0 0 700 130" preserveAspectRatio="none" aria-label="Impression surge trend chart" role="img"><polyline points="0,96 70,88 140,84 210,78 280,62 350,61 420,55 490,52 560,38 630,29 700,22" fill="none" stroke="var(--info)" strokeWidth="3" /><polyline points="0,74 70,70 140,76 210,64 280,56 350,38 420,42 490,29 560,18 630,27 700,14" fill="none" stroke="var(--primary)" strokeWidth="3" /><polyline points="0,112 70,108 140,105 210,101 280,91 350,76 420,47 490,36 560,44 630,31 700,27" fill="none" stroke="var(--violet)" strokeWidth="3" /></svg></div><div className="mt-3 flex justify-between text-[11px] text-muted-foreground"><span>Day -14</span><span>Day -10</span><span>Day -7</span><span>Day -3</span><span>Today (Peak Volume)</span></div></div></Panel>
        </div>
        <div className="grid content-start gap-5"><Panel title="✦  Intelligence & Tactics" meta="Machine synthesized auction responses."><div className="p-4"><div className="rounded-lg bg-muted/60 p-4"><span className="text-xs text-coral">△ Category Trend Alert</span><h3 className="mt-3 font-semibold">Competitor creative volume on TikTok increased by <b className="text-info">42%</b> over the last 14 days, driving up ad auction CPMs by <b className="text-coral">14%</b>.</h3><small className="text-muted-foreground">Observed across 19 direct competitor accounts in North American tier-1 markets.</small></div></div></Panel><Panel title="☼  Recommended Tactical Response" meta="Castra Engine v4"><div className="grid gap-3 p-4">{[['Search Arbitrage Opportunity', 'Capitalize on Google Search queries where competitor bids remain fragmented. Shift $6.4k ad allocation from short-form video into high-intent trail runner keywords.'], ['Creative Positioning Pivot', 'Differentiate messaging on Meta Ads around verified shoe endurance rather than discount discounting.']].map(([title, body], index) => <article key={title} className="rounded-lg bg-muted/60 p-3"><span className="mr-2 inline-grid size-6 place-items-center rounded bg-violet text-xs">{index + 1}</span><strong>{title}</strong><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p></article>)}<Button type="button" className="w-full" onClick={() => notify?.('Tactical response incorporated into Strategy.')}><Zap /> Incorporate into Strategy (FR02)</Button></div></Panel><Panel title="FEED LOG"><div className="grid gap-2 p-4 text-xs text-muted-foreground"><span>Strider added 8 Meta carousel variants <small className="float-right">18m ago</small></span><span>Apex CPC bid elevated by +6.8% <small className="float-right">1h ago</small></span><span>Urban Pace test landing page detected <small className="float-right">3h ago</small></span></div></Panel></div>
      </div>
    </>
  )
}

CompetitorInsightsPage.propTypes = { notify: PropTypes.func }
