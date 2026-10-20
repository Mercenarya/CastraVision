import { useState } from 'react'
import PropTypes from 'prop-types'
import { Activity, ChartNoAxesCombined, Copy, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react'
import PageIntro from '@/components/PageIntro'
import Panel from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const allocations = [
  ['Google Search', 'High purchase intent; headroom for bid expansion', '$4,000', '(40%)', '$6,250', '(50%)', '+$2,250 (+25%)', 'SCALING CANDIDATE', 'text-info'],
  ['Meta Ads', 'Stable conversion rates, minor share adjustment', '$4,000', '(40%)', '$4,375', '(35%)', '+$375 (-5% Share)', 'MAINTAINED', 'text-primary'],
  ['TikTok Video', 'Rising CPA fatigue; reallocation to Google Search', '$2,000', '(20%)', '$1,875', '(15%)', '-$125 (-5% Share)', 'CAPPED / DEPRIORITIZED', 'text-coral'],
]

export default function BudgetOptimizationPage({ notify, setPage }) {
  const [analyzed, setAnalyzed] = useState(false)

  return (
    <>
      <PageIntro
        code="FR03 // BUDGET OPTIMIZATION ENGINE"
        title="Performance-Based Budget Allocation"
        subtitle="Analyze channel efficiency and optimize budget distribution based on verified performance metrics."
        action={<Button variant="coral" type="button"><RotateCcw /> Reset Constraints</Button>}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          ['CURRENT TOTAL BUDGET', '$10,000.00', '/ month', 'Baseline Window', 'Trailing 30 Days', Copy],
          ['OPTIMIZED TARGET BUDGET', '$12,500.00', '/ month', 'Reallocation Variance', '↑ +$2,500.00 (+25.0%)', ChartNoAxesCombined],
          ['PROJECTED CPA IMPACT', '$24.80', 'avg cost / acq', 'Projected Efficiency', '◉ -14.0% CPA Reduction', Activity],
        ].map(([label, value, suffix, note, noteValue, Icon]) => (
          <article key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between"><span className="text-[11px] font-bold tracking-wider text-muted-foreground">{label}</span><span className="grid size-9 place-items-center rounded-lg bg-muted text-info"><Icon className="size-4" /></span></div>
            <div className="mt-2 flex items-baseline gap-1"><strong className="text-[29px] leading-none">{value}</strong><small className="text-xs text-muted-foreground">{suffix}</small></div>
            <div className="mt-5 flex justify-between gap-2 text-xs"><span className="text-muted-foreground">{note}</span><b className="text-info">{noteValue}</b></div>
          </article>
        ))}
      </div>

      <Panel title="☷  Active Algorithmic Constraints" meta="Parameters restrict algorithmic allocation boundaries">
        <div className="grid gap-3 p-5 md:grid-cols-3">
          <div className="rounded-lg bg-muted/60 p-3"><span className="block text-[11px] text-muted-foreground">Maximum Monthly Spend Ceiling</span><strong>$15,000</strong></div>
          <div className="rounded-lg bg-muted/60 p-3"><span className="block text-[11px] text-muted-foreground">Target Maximum CPA Threshold</span><strong>$26.00</strong></div>
          <div className="rounded-lg bg-muted/60 p-3"><span className="block text-[11px] text-muted-foreground">Optimization Goal</span><strong>Maximize ROAS &amp; Direct Conversions⌄</strong></div>
        </div>
      </Panel>

      <Panel title="Current Allocation vs Proposed Rebalancing" meta="Recommended Distribution   100% Normalized">
        <div className="border-b border-border p-5">
          <p className="text-xs text-muted-foreground">Calculated using 90-day marginal return elasticity curves across verified tracking pixels.</p>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full"><span className="w-1/2 bg-info" /><span className="w-[35%] bg-violet" /><span className="w-[15%] bg-violet" /></div>
          <div className="mt-2 flex flex-wrap gap-5 text-xs text-muted-foreground"><span>● Google (50%)</span><span>● Meta (35%)</span><span>● TikTok (15%)</span></div>
        </div>
        <div className="grid gap-2 p-5">
          {allocations.map(([name, description, current, currentPercent, proposed, proposedPercent, delta, status, tone], index) => (
            <article key={name} className="grid items-center gap-4 rounded-lg bg-muted/60 p-4 lg:grid-cols-[minmax(240px,1.8fr)_1fr_1fr_1fr_minmax(130px,1fr)]">
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-muted text-info">{index === 0 ? <ChartNoAxesCombined className="size-5" /> : index === 1 ? <SlidersHorizontal className="size-5" /> : <Sparkles className="size-5" />}</span><span><strong className="block">{name} <small className={cn('ml-1 rounded px-1.5 py-1 text-[9px] font-bold', tone)}>{status}</small></strong><small className="text-xs text-muted-foreground">{description}</small></span></div>
              <span className="text-xs"><small className="block text-muted-foreground">Current Spend</small><b>{current}</b> {currentPercent}</span>
              <span className="text-xs"><small className="block text-muted-foreground">Recommended</small><b className="text-info">{proposed}</b> {proposedPercent}</span>
              <span className="text-xs"><small className="block text-muted-foreground">Net Rebalancing</small><b className={tone}>{delta}</b></span>
              <div><small className="text-xs text-muted-foreground">Share {proposedPercent}</small><div className="mt-2 h-2 overflow-hidden rounded-full bg-border"><span className={cn('block h-full', index === 0 ? 'w-1/2 bg-info' : index === 1 ? 'w-[35%] bg-violet' : 'w-[15%] bg-violet')} /></div></div>
            </article>
          ))}
        </div>
      </Panel>

      <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div><strong className="block">◉ Optimization Governance &amp; Compliance Protocol</strong><p className="mt-1 max-w-[580px] text-sm text-muted-foreground">Governance Notice: Automated direct ad publishing is disabled. Recommended reallocations require formal approval via the FR04 Approval Workflow.</p></div>
        <div className="flex shrink-0 gap-2"><Button type="button" variant="secondary" onClick={() => { setAnalyzed(true); notify?.('Analysis complete: 3 guardrails passed.') }}>↻ Run Analysis</Button><Button type="button" onClick={() => setPage?.('budget-review')}>Review Recommendation</Button></div>
      </div>
      {analyzed && <div className="mt-4 rounded-lg border border-info/30 bg-card p-4 text-sm text-info">✓ Analysis complete: 3 guardrails passed, total allocation equals 100%.</div>}
    </>
  )
}

BudgetOptimizationPage.propTypes = { notify: PropTypes.func, setPage: PropTypes.func }
