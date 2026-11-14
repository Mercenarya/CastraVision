import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Brain,
  Layers,
  TrendingUp,
  Rocket,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  PlusCircle,
  Filter,
  MoreVertical,
  Activity,
  Check,
  X,
  ExternalLink,
} from 'lucide-react'

const INITIAL_PIPELINES = [
  {
    id: 'ST-882',
    name: 'Summer 2025 Acceleration',
    engine: 'Meta & TikTok Cross-Engine • Squad Alpha',
    status: 'Active',
    statusVariant: 'cyan',
    confidence: 94,
    updated: 'Updated 4m ago',
    actionText: 'View Details',
    hasRisk: false,
  },
  {
    id: 'ST-904',
    name: 'Q4 High-Intent Retargeting',
    engine: 'Google Search & Klaviyo • Retention Team',
    status: 'Pending Review',
    statusVariant: 'purple',
    confidence: 88,
    updated: 'Awaiting Leader sign-off',
    actionText: 'Evaluate',
    hasRisk: false,
  },
  {
    id: 'ST-719',
    name: 'Gen Z Influencer Push',
    engine: 'TikTok UGC & Spark Network • Creative Squad',
    status: 'Risk Flagged',
    statusVariant: 'coral',
    confidence: 62,
    updated: 'High variance alert',
    actionText: 'Inspect Model',
    hasRisk: true,
  },
]

const INITIAL_DIRECTIVES = [
  {
    id: 'DIR-101',
    name: 'TikTok Spark Ads Heavy Allocation',
    channels: 'Meta / TikTok',
    budgetDelta: 'Budget Shift +$42,000',
    author: 'Alex Rivera',
    authorRole: 'Growth Lead (Paid)',
    initials: 'AR',
    version: 'v3.2',
    riskLevel: 'Medium (14% Volatility)',
    riskVariant: 'purple',
    status: 'pending',
  },
  {
    id: 'DIR-102',
    name: 'Aggressive Q3 Markdown',
    channels: 'Omni-Channel',
    budgetDelta: 'Dynamic Catalog Discount',
    author: 'Maya Lin',
    authorRole: 'Commercial Ops',
    initials: 'ML',
    version: 'v3.1',
    riskLevel: 'High (Risk Flagged)',
    riskVariant: 'coral',
    status: 'pending',
  },
]

const TACTICAL_ALLOCATION = [
  {
    channel: 'Meta Ads',
    targetCpa: '$24.50',
    volumeCap: '$65,000 / mo',
    confidence: '95%',
    accentColor: '#03b5d3',
    share: '45%',
  },
  {
    channel: 'Google Ads',
    targetCpa: '$18.20',
    volumeCap: '$45,000 / mo',
    confidence: '92%',
    accentColor: '#8083ff',
    share: '35%',
  },
  {
    channel: 'TikTok Ads',
    targetCpa: '$28.00',
    volumeCap: '$30,000 / mo',
    confidence: '86%',
    accentColor: '#a078ff',
    share: '20%',
  },
]

/**
 * LeaderStrategyStudio
 * Translates the approved Google Stitch specification:
 * docs/Leader FORM/stitch_castravision_core_workflows_ui/leader_workspace_strategy_studio/leader_workspace_strategy_studio.html
 */
export default function LeaderStrategyStudio({ setPage, notify }) {
  // Global Inference Constraint Toggles
  const [brandSafety, setBrandSafety] = useState(true)
  const [budgetRealloc, setBudgetRealloc] = useState(false)
  const [leaderApproval, setLeaderApproval] = useState(true)

  // Directives State
  const [directives, setDirectives] = useState(INITIAL_DIRECTIVES)
  const [filterActive, setFilterActive] = useState('all')
  const [inspectingModel, setInspectingModel] = useState(null)

  const pendingCount = directives.filter((d) => d.status === 'pending').length

  const handleApproveDirective = (id, name) => {
    setDirectives((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'approved' } : d))
    )
    notify?.(`Strategy directive "${name}" approved under FR04 Human-in-the-Loop governance.`)
  }

  const handleToggle = (key) => {
    if (key === 'brand') {
      const next = !brandSafety
      setBrandSafety(next)
      notify?.(`Global Brand Safety Enforcement set to ${next ? 'ACTIVE' : 'DISABLED'}.`)
    } else if (key === 'budget') {
      const next = !budgetRealloc
      setBudgetRealloc(next)
      notify?.(`Autonomous Budget Reallocation policy set to ${next ? 'PERMITTED' : 'RESTRICTED'}.`)
    } else if (key === 'approval') {
      const next = !leaderApproval
      setLeaderApproval(next)
      notify?.(`Leader Approval requirement for Audience Expansion set to ${next ? 'ENFORCED' : 'BYPASSED'}.`)
    }
  }

  const filteredDirectives = directives.filter((d) => {
    if (filterActive === 'pending') return d.status === 'pending'
    if (filterActive === 'approved') return d.status === 'approved'
    return true
  })

  return (
    <div className="w-full bg-[#0f131d] text-[#dfe2f1] font-sans min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1440px] w-full mx-auto flex flex-col gap-6">

        {/* ─── SECTION 1: Page Header & Global Actions Bar Card ───────────── */}
        <div className="w-full bg-[#1c1f2a] border border-[#464554] rounded-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8083ff] shadow-sm shadow-[#8083ff]/50" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#c7c4d7] font-semibold">
                  Autonomous Architecture Control
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#dfe2f1] tracking-tight m-0">
                Macro Strategy Overview &amp; AI Governance
              </h1>
              <p className="text-xs sm:text-sm text-[#c7c4d7] m-0">
                Review AI-generated macro marketing strategies, evaluate risk matrices, and enforce global inference guardrails across growth squads.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#464554] text-[#dfe2f1] text-[13px] font-semibold hover:bg-[#262a35] transition-colors"
                onClick={() => notify?.('New Global Strategy optimization cycle initialized.')}
              >
                <PlusCircle className="w-4 h-4 text-[#8083ff]" />
                <span>New Global Strategy</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#464554] text-[#dfe2f1] text-[13px] font-semibold hover:bg-[#262a35] transition-colors"
                onClick={() => notify?.('Supervised Governance parameters: Tier-1 inference policies active.')}
              >
                <Sliders className="w-4 h-4 text-[#03b5d3]" />
                <span>Governance Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: Top KPI Metric Strip (Stitch Canonical Values) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#c7c4d7]">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                Aggregate Strategy Confidence
              </span>
              <Brain className="w-4 h-4 text-[#03b5d3]" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-[#dfe2f1] font-mono">
                94.2%
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#03b5d3] bg-[#03b5d3]/15 px-2 py-0.5 rounded border border-[#03b5d3]/30">
                <TrendingUp className="w-3 h-3" />
                +2.8%
              </span>
            </div>
            <span className="text-[11px] text-[#c7c4d7] mt-1">Multi-channel cross-validation</span>
          </div>

          {/* KPI 2 */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#c7c4d7]">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                Active Algorithmic Directives
              </span>
              <Layers className="w-4 h-4 text-[#8083ff]" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-[#dfe2f1] font-mono">
                12 Rules
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8083ff] bg-[#8083ff]/15 px-2 py-0.5 rounded border border-[#8083ff]/30">
                <CheckCircle2 className="w-3 h-3" />
                100% Enforced
              </span>
            </div>
            <span className="text-[11px] text-[#c7c4d7] mt-1">Supervised squad guardrails</span>
          </div>

          {/* KPI 3 */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#c7c4d7]">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                Monthly Pacing Efficiency
              </span>
              <Activity className="w-4 h-4 text-[#10b981]" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-[#10b981] font-mono">
                +18.4%
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30">
                Outperforming
              </span>
            </div>
            <span className="text-[11px] text-[#c7c4d7] mt-1">Ad budget burn velocity nominal</span>
          </div>

          {/* KPI 4 */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#c7c4d7]">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                Projected Cross-Channel ROAS
              </span>
              <Rocket className="w-4 h-4 text-[#a078ff]" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-[#dfe2f1] font-mono">
                4.85x
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#a078ff] bg-[#a078ff]/15 px-2 py-0.5 rounded border border-[#a078ff]/30">
                Target 4.2x
              </span>
            </div>
            <span className="text-[11px] text-[#c7c4d7] mt-1">Simulated blended target</span>
          </div>
        </div>

        {/* ─── SECTION 3: Active Strategy Engine Banner ───────────────────── */}
        <div className="w-full bg-gradient-to-r from-[#171b26] via-[#1c1f2a] to-[#262a35] border border-[#464554] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#8083ff]/15 border border-[#8083ff]/30 flex items-center justify-center text-[#8083ff] shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#dfe2f1]">
                  Active Strategy Engine: Neural Allocation Matrix v4.2
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-semibold">
                  LIVE INFERENCE
                </span>
              </div>
              <span className="text-[12px] text-[#c7c4d7] mt-0.5">
                Monte Carlo stochastic simulation active • 10,000 distributed cycles/hour • Low-variance frontier locked
              </span>
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-[#8083ff] text-[#8083ff] text-[13px] font-semibold hover:bg-[#8083ff]/10 transition-colors shrink-0 flex items-center gap-1.5 self-start md:self-auto"
            onClick={() => setInspectingModel({
              version: 'Neural Allocation Matrix v4.2',
              modelType: 'Multi-Task Bayesian Optimization & Gaussian Process Regressor',
              confidenceThreshold: '85% Minimum Gate',
              explorationRate: '0.12 (Low Variance Exploitation)',
              lossFunction: 'Blended Cross-Channel ROAS Penalty Adjusted',
            })}
          >
            <Activity className="w-4 h-4" />
            <span>Inspect Model</span>
          </button>
        </div>

        {/* ─── SECTION 4: Active Strategy Pipelines (3 Distinct Cards) ───── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_PIPELINES.map((pipe) => {
            const isCyan = pipe.statusVariant === 'cyan'
            const isPurple = pipe.statusVariant === 'purple'
            const isCoral = pipe.statusVariant === 'coral'

            const badgeBg = isCyan
              ? 'bg-[#03b5d3]/15 border-[#03b5d3]/30 text-[#03b5d3]'
              : isPurple
              ? 'bg-[#a078ff]/15 border-[#a078ff]/30 text-[#a078ff]'
              : 'bg-[#ffb4ab]/15 border-[#ffb4ab]/30 text-[#ffb4ab]'

            const dotColor = isCyan ? 'bg-[#03b5d3]' : isPurple ? 'bg-[#a078ff]' : 'bg-[#ffb4ab]'
            const barColor = isCyan ? 'bg-[#03b5d3]' : isPurple ? 'bg-[#a078ff]' : 'bg-[#ffb4ab]'

            return (
              <div
                key={pipe.id}
                className="w-full bg-[#1c1f2a] border border-[#464554] rounded-lg p-6 flex flex-col justify-between"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-[#c7c4d7] tracking-wider font-semibold">
                      Pipeline #{pipe.id}
                    </span>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold ${badgeBg}`}>
                      {pipe.hasRisk ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#ffb4ab]" />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      )}
                      <span>{pipe.status}</span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-[16px] font-semibold text-[#dfe2f1] m-0">
                      {pipe.name}
                    </h2>
                    <p className="text-[12px] text-[#c7c4d7] mt-1 m-0">
                      {pipe.engine}
                    </p>
                  </div>

                  <div className="bg-[#141E33] border border-[#464554] rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#c7c4d7]">Confidence Score</span>
                      <span className={`text-[13px] font-bold ${isCyan ? 'text-[#03b5d3]' : isPurple ? 'text-[#a078ff]' : 'text-[#ffb4ab]'}`}>
                        {pipe.confidence}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#313540] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pipe.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-[#464554] flex items-center justify-between">
                  <span className={`text-[12px] ${pipe.hasRisk ? 'text-[#ffb4ab]' : 'text-[#c7c4d7]'}`}>
                    {pipe.updated}
                  </span>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                      isPurple
                        ? 'bg-[#8083ff] text-[#0d0096] hover:bg-[#9a9cff]'
                        : isCoral
                        ? 'border border-[#ffb4ab] text-[#ffb4ab] hover:bg-[#ffb4ab]/10'
                        : 'border border-[#464554] text-[#dfe2f1] hover:bg-[#262a35]'
                    }`}
                    onClick={() => {
                      if (pipe.actionText === 'Inspect Model') {
                        setInspectingModel({
                          version: `Pipeline #${pipe.id} - ${pipe.name}`,
                          modelType: 'TikTok UGC Feature Vector & Volatility Extrapolator',
                          confidenceThreshold: '62% (Triggered High Variance Alert)',
                          explorationRate: '0.45 (High Variance Spike)',
                          lossFunction: 'Stochastic ROAS Lower Bound Violation',
                        })
                      } else if (pipe.actionText === 'Evaluate' && setPage) {
                        setPage('approvals')
                        notify?.(`Opening Approvals queue to evaluate ${pipe.name}.`)
                      } else {
                        notify?.(`Pipeline #${pipe.id} details: ${pipe.name} loaded.`)
                      }
                    }}
                  >
                    {pipe.actionText}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* ─── SECTION 5: Middle Split Section (60% Left Chart, 40% Right) ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Card (7 Cols): Strategy Comparison Chart (Monte Carlo) */}
          <div className="lg:col-span-7 bg-[#1c1f2a] border border-[#464554] rounded-lg p-6 flex flex-col justify-between">
            <div className="flex flex-col gap-1 pb-4 border-b border-[#464554]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[16px] font-bold text-[#dfe2f1] m-0">
                  Projected ROAS vs. Risk Exposure (Active Strategies)
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#262a35] text-[#dfe2f1] border border-[#464554] font-bold">
                  SIMULATION RUN
                </span>
              </div>
              <p className="text-[12px] text-[#c7c4d7] m-0">
                Simulated Monte Carlo distribution across 10,000 algorithmic cycles
              </p>
            </div>

            {/* Inline SVG Scatter Plot Matrix (Preserving Stitch Coordinates) */}
            <div className="py-6 flex flex-col">
              <div className="relative w-full h-[280px]">
                <svg
                  className="w-full h-full"
                  fill="none"
                  viewBox="0 0 540 280"
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Monte Carlo ROAS vs Risk Exposure Chart"
                >
                  {/* Y Axis Grid Lines & Ticks (ROAS: 1.0x to 6.0x) */}
                  <line stroke="#464554" strokeDasharray="3 3" strokeOpacity="0.35" x1="50" x2="520" y1="20" y2="20" />
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="end" x="42" y="24">6.0x</text>

                  <line stroke="#464554" strokeDasharray="3 3" strokeOpacity="0.35" x1="50" x2="520" y1="65" y2="65" />
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="end" x="42" y="69">5.0x</text>

                  <line stroke="#464554" strokeDasharray="3 3" strokeOpacity="0.35" x1="50" x2="520" y1="110" y2="110" />
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="end" x="42" y="114">4.0x</text>

                  <line stroke="#464554" strokeDasharray="3 3" strokeOpacity="0.35" x1="50" x2="520" y1="155" y2="155" />
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="end" x="42" y="159">3.0x</text>

                  <line stroke="#464554" strokeDasharray="3 3" strokeOpacity="0.35" x1="50" x2="520" y1="200" y2="200" />
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="end" x="42" y="204">2.0x</text>

                  <line stroke="#464554" strokeOpacity="0.7" x1="50" x2="520" y1="240" y2="240" />
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="end" x="42" y="244">1.0x</text>

                  {/* X Axis Grid Lines & Ticks (Risk: 0% to 100%) */}
                  <line stroke="#464554" strokeOpacity="0.7" x1="50" x2="50" y1="20" y2="240" />
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="middle" x="50" y="256">0%</text>

                  <line stroke="#464554" strokeDasharray="3 3" strokeOpacity="0.3" x1="167" x2="167" y1="20" y2="240" />
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="middle" x="167" y="256">25%</text>

                  <line stroke="#464554" strokeDasharray="3 3" strokeOpacity="0.3" x1="285" x2="285" y1="20" y2="240" />
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="middle" x="285" y="256">50%</text>

                  <line stroke="#464554" strokeDasharray="3 3" strokeOpacity="0.3" x1="402" x2="402" y1="20" y2="240" />
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="middle" x="402" y="256">75%</text>
                  <text className="text-[10px] font-sans" fill="#c7c4d7" textAnchor="middle" x="515" y="256">100%</text>

                  {/* Safe/Efficient Frontier Region */}
                  <path d="M 50 120 Q 200 80 520 40 L 520 20 L 50 20 Z" fill="#03b5d3" fillOpacity="0.05" />

                  {/* Bubble 1: Summer 2025 (Risk 22%, ROAS 4.8x) */}
                  <circle cx="153" cy="73" fill="#03b5d3" fillOpacity="0.2" r="16" stroke="#03b5d3" strokeWidth="2" />
                  <circle cx="153" cy="73" fill="#03b5d3" r="5" />
                  <text className="text-[11px] font-semibold" fill="#03b5d3" x="175" y="70">Summer 2025</text>
                  <text className="text-[9px]" fill="#c7c4d7" x="175" y="82">4.8x ROAS / 22% Vol</text>

                  {/* Bubble 2: Q4 Retargeting (Risk 38%, ROAS 4.1x) */}
                  <circle cx="229" cy="104" fill="#a078ff" fillOpacity="0.2" r="14" stroke="#a078ff" strokeWidth="2" />
                  <circle cx="229" cy="104" fill="#a078ff" r="5" />
                  <text className="text-[11px] font-semibold" fill="#a078ff" x="249" y="101">Q4 Retargeting</text>
                  <text className="text-[9px]" fill="#c7c4d7" x="249" y="113">4.1x ROAS / 38% Vol</text>

                  {/* Bubble 3: Omni-Channel Blitz (Risk 45%, ROAS 3.9x) */}
                  <circle cx="262" cy="112" fill="#8083ff" fillOpacity="0.2" r="12" stroke="#8083ff" strokeWidth="2" />
                  <circle cx="262" cy="112" fill="#8083ff" r="4" />
                  <text className="text-[11px] font-semibold" fill="#dfe2f1" x="280" y="132">Omni Blitz</text>
                  <text className="text-[9px]" fill="#c7c4d7" x="280" y="144">3.9x ROAS / 45% Vol</text>

                  {/* Bubble 4: Gen Z Influencer (Risk 78%, ROAS 3.2x) */}
                  <circle cx="417" cy="143" fill="#ffb4ab" fillOpacity="0.2" r="15" stroke="#ffb4ab" strokeWidth="2" />
                  <circle cx="417" cy="143" fill="#ffb4ab" r="5" />
                  <text className="text-[11px] font-semibold" fill="#ffb4ab" textAnchor="middle" x="390" y="172">Gen Z Influencer</text>
                  <text className="text-[9px]" fill="#c7c4d7" textAnchor="middle" x="390" y="184">3.2x ROAS / 78% Vol</text>
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#c7c4d7] px-2 pt-2">
                <span>Risk Exposure (Volatility Index 0 - 100%)</span>
                <span>Target Axis: Projected ROAS</span>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="pt-4 border-t border-[#464554] flex flex-wrap items-center gap-4 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#03b5d3]" />
                <span className="text-[#dfe2f1]">Low Risk / Validated</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#a078ff]" />
                <span className="text-[#dfe2f1]">Under Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#8083ff]" />
                <span className="text-[#dfe2f1]">Active Candidate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ffb4ab]" />
                <span className="text-[#dfe2f1]">High Variance Outlier</span>
              </div>
            </div>
          </div>

          {/* Right Card (5 Cols): Global Inference Constraints & Channel Breakdown */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Constraints Card */}
            <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-6 flex flex-col justify-between">
              <div className="flex flex-col gap-1 pb-4 border-b border-[#464554]">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-bold text-[#dfe2f1] m-0">
                    Global Inference Constraints
                  </h2>
                  <ShieldCheck className="w-5 h-5 text-[#8083ff]" />
                </div>
                <p className="text-[12px] text-[#c7c4d7] m-0">
                  Supervised inference policies enforced across all connected squad agents
                </p>
              </div>

              {/* Governance Toggle List */}
              <div className="flex flex-col divide-y divide-[#464554] my-2">
                {/* Toggle 1 */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[13px] text-[#dfe2f1] font-semibold">
                      Enforce Strict Brand Safety
                    </span>
                    <p className="text-[11px] text-[#c7c4d7] m-0 mt-0.5">
                      Restrict generative prompt parameters to Tier-1 compliance vocabulary.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-checked={brandSafety}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
                      brandSafety ? 'bg-[#8083ff]' : 'bg-[#353944]'
                    }`}
                    onClick={() => handleToggle('brand')}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ${
                        brandSafety ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2 */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[13px] text-[#dfe2f1] font-semibold">
                      Aggressive Budget Reallocation
                    </span>
                    <p className="text-[11px] text-[#c7c4d7] m-0 mt-0.5">
                      Permit autonomous micro-shifts up to 15% without Leader sign-off.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-checked={budgetRealloc}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
                      budgetRealloc ? 'bg-[#8083ff]' : 'bg-[#353944]'
                    }`}
                    onClick={() => handleToggle('budget')}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ${
                        budgetRealloc ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3 */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[13px] text-[#dfe2f1] font-semibold">
                      Require Leader Approval for Target Audiences
                    </span>
                    <p className="text-[11px] text-[#c7c4d7] m-0 mt-0.5">
                      Lock audience clustering expansions until manual Leader review.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-checked={leaderApproval}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
                      leaderApproval ? 'bg-[#8083ff]' : 'bg-[#353944]'
                    }`}
                    onClick={() => handleToggle('approval')}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ${
                        leaderApproval ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Policy Footer */}
              <div className="pt-4 border-t border-[#464554] flex items-center justify-between text-[11px] text-[#c7c4d7]">
                <span>Engine Policy Version: v4.18 • Last synced 12m ago</span>
                <span className="text-[#03b5d3] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Active
                </span>
              </div>
            </div>

            {/* Tactical Channel Allocation Breakdown */}
            <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#464554]">
                <h3 className="text-[14px] font-bold text-[#dfe2f1] m-0">
                  Tactical Channel Allocation
                </h3>
                <span className="text-[10px] font-mono text-[#03b5d3] uppercase font-semibold">
                  Tri-Engine Pacing
                </span>
              </div>
              <div className="space-y-3 mt-3">
                {TACTICAL_ALLOCATION.map((item) => (
                  <div
                    key={item.channel}
                    className="p-3 rounded-lg bg-[#141E33] border border-[#464554] flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.accentColor }}
                        />
                        <span className="text-[13px] font-bold text-[#dfe2f1]">
                          {item.channel}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#262a35] text-[#c7c4d7]">
                          {item.share}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#c7c4d7] mt-1">
                        Target CPA: <strong className="text-[#dfe2f1]">{item.targetCpa}</strong> • Cap: {item.volumeCap}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] font-bold text-[#03b5d3] block font-mono">
                        {item.confidence}
                      </span>
                      <span className="text-[10px] text-[#c7c4d7]">Algo Conf</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ─── SECTION 6: Bottom Proposals Table (Directives Review) ────── */}
        <div className="w-full bg-[#1c1f2a] border border-[#464554] rounded-lg p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#464554]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h2 className="text-[16px] font-bold text-[#dfe2f1] m-0">
                  Pending Strategy Directives for Review
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-[#a078ff]/15 text-[#a078ff] border border-[#a078ff]/30">
                  {pendingCount} Awaiting Approval
                </span>
              </div>
              <p className="text-[12px] text-[#c7c4d7] m-0">
                Algorithmic proposals submitted by growth squad specialists requiring Leader authorization under FR04 Human-in-the-Loop governance.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="inline-flex rounded-lg border border-[#464554] p-0.5 bg-[#171b26]">
                <button
                  type="button"
                  className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${
                    filterActive === 'all'
                      ? 'bg-[#262a35] text-[#dfe2f1]'
                      : 'text-[#c7c4d7] hover:text-[#dfe2f1]'
                  }`}
                  onClick={() => setFilterActive('all')}
                >
                  All ({directives.length})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${
                    filterActive === 'pending'
                      ? 'bg-[#262a35] text-[#dfe2f1]'
                      : 'text-[#c7c4d7] hover:text-[#dfe2f1]'
                  }`}
                  onClick={() => setFilterActive('pending')}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${
                    filterActive === 'approved'
                      ? 'bg-[#262a35] text-[#dfe2f1]'
                      : 'text-[#c7c4d7] hover:text-[#dfe2f1]'
                  }`}
                  onClick={() => setFilterActive('approved')}
                >
                  Approved
                </button>
              </div>

              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-[#464554] text-[#dfe2f1] text-[12px] font-medium hover:bg-[#262a35] transition-colors flex items-center gap-1.5"
                onClick={() => notify?.('Filters: Model version v3.1+ active.')}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#464554]">
                  <th className="pb-3 text-[#c7c4d7] text-[11px] font-mono uppercase tracking-wider font-semibold" scope="col">
                    Strategy Name
                  </th>
                  <th className="pb-3 text-[#c7c4d7] text-[11px] font-mono uppercase tracking-wider font-semibold" scope="col">
                    Proposed By
                  </th>
                  <th className="pb-3 text-[#c7c4d7] text-[11px] font-mono uppercase tracking-wider font-semibold" scope="col">
                    Model Version
                  </th>
                  <th className="pb-3 text-[#c7c4d7] text-[11px] font-mono uppercase tracking-wider font-semibold" scope="col">
                    Risk Level
                  </th>
                  <th className="pb-3 text-[#c7c4d7] text-[11px] font-mono uppercase tracking-wider font-semibold text-right" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#464554]">
                {filteredDirectives.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#c7c4d7] text-sm">
                      No strategy directives match current filter.
                    </td>
                  </tr>
                ) : (
                  filteredDirectives.map((item) => {
                    const isPurpleRisk = item.riskVariant === 'purple'
                    const isApproved = item.status === 'approved'

                    return (
                      <tr key={item.id} className="hover:bg-[#262a35]/40 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[13px] text-[#dfe2f1] font-semibold">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-[#141E33] text-[#c7c4d7] border border-[#464554]">
                                {item.channels}
                              </span>
                              <span className="text-[12px] text-[#c7c4d7]">
                                {item.budgetDelta}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#313540] border border-[#464554] text-[#dfe2f1] text-[11px] font-bold flex items-center justify-center shrink-0">
                              {item.initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] text-[#dfe2f1] font-medium">
                                {item.author}
                              </span>
                              <span className="text-[11px] text-[#c7c4d7]">
                                {item.authorRole}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 pr-4">
                          <span className="inline-block px-2.5 py-1 rounded bg-[#262a35] border border-[#464554] font-mono text-[12px] text-[#dfe2f1]">
                            {item.version}
                          </span>
                        </td>

                        <td className="py-4 pr-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                              isPurpleRisk
                                ? 'bg-[#a078ff]/15 text-[#a078ff] border-[#a078ff]/30'
                                : 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30'
                            }`}
                          >
                            {isPurpleRisk ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#a078ff]" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#ffb4ab]" />
                            )}
                            {item.riskLevel}
                          </span>
                        </td>

                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[12px] font-semibold">
                                <Check className="w-3.5 h-3.5" />
                                Approved (FR04)
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="px-4 py-1.5 rounded-lg bg-[#8083ff] text-[#0d0096] text-[13px] font-semibold hover:bg-[#9a9cff] transition-colors shadow-sm"
                                onClick={() => handleApproveDirective(item.id, item.name)}
                              >
                                Review &amp; Approve
                              </button>
                            )}
                            <button
                              type="button"
                              className="p-1.5 rounded-lg border border-[#464554] text-[#dfe2f1] hover:bg-[#262a35] transition-colors"
                              aria-label="More directive options"
                              onClick={() => notify?.(`Audit record for ${item.id} logged under FR11.`)}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Note */}
          <div className="pt-3 border-t border-[#464554] flex flex-wrap items-center justify-between text-[12px] text-[#c7c4d7] gap-2">
            <span>
              Displaying {filteredDirectives.length} of {directives.length} pending strategy directives • All actions logged under Audit FR11
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#03b5d3]" />
              <span className="text-[#dfe2f1] text-[12px] font-mono">Ledger Sync: Real-Time</span>
            </div>
          </div>
        </div>

      </div>

      {/* ─── MODEL INSPECTION MODAL ─────────────────────────────────────── */}
      {inspectingModel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#1c1f2a] border border-[#464554] rounded-xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#464554]">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#8083ff]" />
                <h3 className="text-base font-bold text-[#dfe2f1] m-0">
                  Model Hyperparameters &amp; Architecture
                </h3>
              </div>
              <button
                type="button"
                className="p-1 rounded-lg border border-[#464554] text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35]"
                onClick={() => setInspectingModel(null)}
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-[#141E33] border border-[#464554]">
                <span className="text-xs font-mono text-[#03b5d3] uppercase block font-semibold">Model Pipeline</span>
                <span className="text-sm font-semibold text-[#dfe2f1] mt-0.5 block">{inspectingModel.version}</span>
                <span className="text-xs text-[#c7c4d7] mt-1 block">{inspectingModel.modelType}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#141E33] border border-[#464554]">
                  <span className="text-[11px] font-mono text-[#c7c4d7] uppercase block">Confidence Gate</span>
                  <span className="text-xs font-bold text-[#8083ff] mt-1 block font-mono">{inspectingModel.confidenceThreshold}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#141E33] border border-[#464554]">
                  <span className="text-[11px] font-mono text-[#c7c4d7] uppercase block">Exploration Rate</span>
                  <span className="text-xs font-bold text-[#dfe2f1] mt-1 block font-mono">{inspectingModel.explorationRate}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#141E33] border border-[#464554]">
                <span className="text-[11px] font-mono text-[#c7c4d7] uppercase block">Loss Objective</span>
                <span className="text-xs text-[#c7c4d7] mt-1 block font-mono">{inspectingModel.lossFunction}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#464554]">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-[#464554] text-[#dfe2f1] text-xs font-semibold hover:bg-[#262a35]"
                onClick={() => setInspectingModel(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-[#8083ff] text-[#0d0096] text-xs font-semibold hover:bg-[#9a9cff] flex items-center gap-1.5"
                onClick={() => {
                  setInspectingModel(null)
                  notify?.('Audit trace export initiated under FR11.')
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Export Telemetry</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

LeaderStrategyStudio.propTypes = {
  setPage: PropTypes.func,
  notify: PropTypes.func,
}
