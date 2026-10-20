import { useState } from 'react'
import PropTypes from 'prop-types'
import { ArrowLeft, Check, CircleHelp, Info, Search, Send, ShieldCheck, Video } from 'lucide-react'
import PageIntro from '@/components/PageIntro'
import Panel from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const allocations = [
  { name: 'Google Search', description: 'Intent harvest & high intent queries', current: '$4,000.00', proposed: '$6,250.00', delta: '+56.2% (+$2,250)', icon: Search, tone: 'bg-violet text-primary-foreground', positive: true },
  { name: 'Meta Ads', description: 'Lookalike retargeting & catalog feed', current: '$4,000.00', proposed: '$4,375.00', delta: '+9.3% (+$375)', icon: CircleHelp, tone: 'bg-info text-primary-foreground', positive: true },
  { name: 'TikTok Video', description: 'Top-funnel discovery campaigns', current: '$2,000.00', proposed: '$1,875.00', delta: '-6.2% (-$125)', icon: Video, tone: 'bg-muted text-primary', positive: false },
]

const guardrails = [
  ['High Search Intent Dominance', 'Google Search demonstrates highest incremental ROAS (4.2x) across mid-market enterprise queries. Model reallocates surplus to capture unfilled impression share.'],
  ['Creative Saturation Mitigation', 'TikTok creative fatigue index surpassed 68%, recommending budget hold pending creative refresh to avoid elevated CPM penalties.'],
  ['Budget Constraints Compliant', 'Total proposed spending stays within defined maximum ceiling of $15,000.00 with $2,500.00 remaining risk-buffer capacity.'],
]

export default function RecommendationReviewPage({ setPage, notify }) {
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    setSubmitted(true)
    notify?.('Proposal submitted to the approval queue.')
  }

  return (
    <>
      <PageIntro
        code="BUDGET OPTIMIZATION  /  RECOMMENDATION REVIEW"
        title="Review Budget Allocation Proposal"
        subtitle="Inspect model rationale and projected performance before advancing to the approval queue."
        action={<div className="flex items-center gap-2"><span className="rounded-md border border-border bg-card px-3 py-2 text-xs"><i className="mr-2 inline-block size-2 rounded-full bg-info" />Proposal Draft · Pending Submission</span><span className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">FR03 → FR04</span></div>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.15fr)_310px]">
        <div>
          <Panel title="▥  Comprehensive Budget Shift Summary" meta="MODEL: CASTRA-MARKOV V4.2">
            <div className="grid gap-3 p-5 md:grid-cols-3">
              {[
                ['TOTAL ALLOCATION', '$12,500.00', 'Baseline: $10,000.00', '+25%'],
                ['BLENDED ACQUISITION (CPA)', '$24.80', 'Current: $28.90', '-14.2%'],
                ['PROJECTED MONTHLY ROAS', '3.4×', 'Hist. Mean: 2.7x', '+0.7x gain'],
              ].map(([label, value, note, change]) => (
                <article key={label} className="rounded-lg bg-muted/60 p-4">
                  <span className="text-[11px] font-bold tracking-wider text-muted-foreground">{label}</span>
                  <strong className="mt-3 block text-[28px] leading-none text-foreground">{value}</strong>
                  <div className="mt-5 flex justify-between gap-2 text-xs text-muted-foreground"><span>{note}</span><b className="text-info">{change}</b></div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="◯  Channel-Level Reallocation Plan" meta="100% Volume Accounted">
            <div className="p-5">
              <div className="flex justify-between text-[11px] font-bold tracking-wider text-muted-foreground"><span>PROPOSED ALLOCATION SHARE</span><span>TOTAL: $12,500.00</span></div>
              <div className="mt-2 flex h-4 overflow-hidden rounded-full"><span className="w-1/2 bg-primary" /><span className="w-[35%] bg-info" /><span className="w-[15%] bg-violet" /></div>
              <div className="mt-3 flex flex-wrap gap-5 text-xs"><span><i className="mr-2 inline-block size-3 rounded-sm bg-primary" />Google Search (50%)</span><span><i className="mr-2 inline-block size-3 rounded-sm bg-info" />Meta Ads (35%)</span><span><i className="mr-2 inline-block size-3 rounded-sm bg-violet" />TikTok Video (15%)</span></div>
              <div className="mt-5 grid gap-2">
                {allocations.map(({ name, description, current, proposed, delta, icon: Icon, tone, positive }) => (
                  <article key={name} className="grid items-center gap-4 rounded-lg bg-muted/60 p-4 md:grid-cols-[minmax(190px,1.5fr)_1fr_1fr_1fr]">
                    <div className="flex items-center gap-3"><span className={cn('grid size-10 place-items-center rounded-lg', tone)}><Icon className="size-5" /></span><span><strong className="block">{name}</strong><small className="text-xs text-muted-foreground">{description}</small></span></div>
                    <span className="text-xs"><small className="block text-muted-foreground">CURRENT</small>{current}</span>
                    <span className="text-xs"><small className="block text-muted-foreground">PROPOSED</small><b>{proposed}</b></span>
                    <span className={cn('text-right text-xs', positive ? 'text-info' : 'text-coral')}><small className="block text-muted-foreground">DELTA</small>{delta}</span>
                  </article>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="◉  Optimization Rationale & Guardrail Verification" meta="3 Guardrails Passed">
            <div className="grid gap-3 p-5">
              {guardrails.map(([title, body]) => <article key={title} className="flex gap-4 rounded-lg bg-muted/60 p-4"><span className="grid size-6 shrink-0 place-items-center rounded bg-info text-primary-foreground"><Check className="size-4" /></span><div><strong>{title}</strong><p className="mt-1 max-w-[560px] text-sm leading-relaxed text-muted-foreground">{body}</p></div></article>)}
            </div>
          </Panel>
        </div>

        <Panel title="▣  Proposal Governance" meta="FR04 TRANSITION">
          <div className="p-5">
            <div className="rounded-lg bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground"><Info className="mb-2 size-5 text-primary" /><p>Submitting moves this proposal directly to the FR04 Approval Queue for Manager/Admin sign-off. The budget will NOT be applied until formal approval is granted.</p></div>
            <label className="mt-5 block text-[11px] font-bold tracking-wider text-muted-foreground">PROPOSAL TITLE<input className="mt-2" defaultValue="Q4 Omnichannel Search Uplift & TikTok Rebalance" /></label>
            <label className="mt-5 block text-[11px] font-bold tracking-wider text-muted-foreground">SUBMISSION NOTE FOR APPROVER<textarea className="mt-2 min-h-[125px]" defaultValue="Reallocating $2,250 into Google Search based on 30-day ROAS outperformance. Keeping total spend under $15k ceiling." /></label>
            <dl className="mt-5 grid gap-3 rounded-lg bg-muted/60 p-4 text-xs"><div className="flex justify-between"><dt className="text-muted-foreground">Initiator Role:</dt><dd>Marketing Lead</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Designated Sign-off:</dt><dd>VP Marketing / FinOps</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">SLA Queue Limit:</dt><dd>24 Hours</dd></div></dl>
            <Button type="button" className="mt-5 w-full" onClick={submit} disabled={submitted}><Send />{submitted ? 'Submitted to Approval Queue' : 'Submit to Approval Queue'}</Button>
            <Button type="button" variant="secondary" className="mt-2 w-full" onClick={() => setPage('budget')}><ArrowLeft /> Back to Optimization</Button>
          </div>
        </Panel>
      </div>
      <div className="mt-1 flex items-center gap-3 rounded-lg border border-info/30 bg-card px-5 py-4 text-sm"><ShieldCheck className="size-5 text-info" />{submitted ? 'Proposal submitted successfully and awaiting approval.' : 'Validation passed: All channel allocations sum to 100%.'}</div>
    </>
  )
}

RecommendationReviewPage.propTypes = { setPage: PropTypes.func.isRequired, notify: PropTypes.func }
