import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Download,
  Wallet,
  TrendingUp,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Zap,
  ArrowRight,
  PauseCircle,
  Search,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'

const TEAM_MEMBERS = [
  {
    id: 'm1',
    name: 'Elena Rostova',
    email: 'e.rostova@acmecorp.com',
    initials: 'ER',
    avatarBg: 'bg-[#03b5d3]/15 border-[#03b5d3]/30 text-[#03b5d3]',
    role: 'Specialist',
    submissions: 18,
    approvalRate: 94,
    avgReviewTime: '1.4 hrs',
    status: 'Active • High Performance',
    statusColor: 'bg-[#03b5d3]/15 text-[#03b5d3]',
  },
  {
    id: 'm2',
    name: 'Alex Mercer',
    email: 'a.mercer@acmecorp.com',
    initials: 'AM',
    avatarBg: 'bg-[#8083ff]/15 border-[#8083ff]/30 text-[#8083ff]',
    role: 'Copywriter',
    submissions: 14,
    approvalRate: 89,
    avgReviewTime: '2.1 hrs',
    status: 'Active • Standard',
    statusColor: 'bg-[#262a35] text-[#dfe2f1] border border-[#464554]',
  },
  {
    id: 'm3',
    name: 'Maya Lin',
    email: 'm.lin@acmecorp.com',
    initials: 'ML',
    avatarBg: 'bg-[#ec4899]/15 border-[#ec4899]/30 text-[#ec4899]',
    role: 'Creative Lead',
    submissions: 22,
    approvalRate: 96,
    avgReviewTime: '1.1 hrs',
    status: 'Top Performer',
    statusColor: 'bg-[#03b5d3]/15 text-[#03b5d3]',
  },
  {
    id: 'm4',
    name: 'Liam Patel',
    email: 'l.patel@acmecorp.com',
    initials: 'LP',
    avatarBg: 'bg-[#3b82f6]/15 border-[#3b82f6]/30 text-[#3b82f6]',
    role: 'Media Buyer',
    submissions: 11,
    approvalRate: 84,
    avgReviewTime: '2.8 hrs',
    status: 'Active • Standard',
    statusColor: 'bg-[#262a35] text-[#dfe2f1] border border-[#464554]',
  },
]

export default function LeaderPerformance({ setPage, notify }) {
  const [timeRange, setTimeRange] = useState('30d')
  const [memberFilter, setMemberFilter] = useState('')
  const [strategyApplied, setStrategyApplied] = useState(false)
  const [variantPaused, setVariantPaused] = useState(false)

  const filteredMembers = useMemo(() => {
    if (!memberFilter.trim()) return TEAM_MEMBERS
    const q = memberFilter.toLowerCase()
    return TEAM_MEMBERS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    )
  }, [memberFilter])

  const handleExport = () => {
    const csv = [
      'Member,Role,Submissions,ApprovalRate,AvgReviewTime,Status',
      ...TEAM_MEMBERS.map(
        (m) =>
          `"${m.name}","${m.role}",${m.submissions},${m.approvalRate}%,"${m.avgReviewTime}","${m.status}"`
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Squad_Performance_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    notify?.('Performance report exported successfully (CSV)')
  }

  const handleApplyStrategy = () => {
    setStrategyApplied(true)
    notify?.('Created proposal: Reallocate $2,000 from Google Search to TikTok Reels')
    setTimeout(() => {
      setPage?.('budget-review-detail')
    }, 800)
  }

  const handlePauseVariant = () => {
    setVariantPaused(true)
    notify?.('Paused Ad Variant B in Autumn Campaign')
  }

  return (
    <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1]">
      <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-12">
        {/* Page Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#03b5d3]">
                Performance Diagnostics
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#03b5d3]" />
              <span className="text-[11px] font-mono text-[#c7c4d7]/70">NODE-ALPHA-90</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#dfe2f1] tracking-tight">
              Squad Performance &amp; AI Insights
            </h1>
            <p className="text-xs md:text-sm text-[#c7c4d7] mt-0.5">
              Cross-channel campaign analytics and deliverable throughput for Growth Squad Alpha.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time range selector */}
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-[#1c1f2a] border border-[#464554] text-[#dfe2f1] px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:border-[#8083ff] transition-colors shadow-sm cursor-pointer outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="14d">Last 14 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Export button */}
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 border border-[#464554] text-[#dfe2f1] px-4 py-2 rounded-lg hover:bg-[#1c1f2a] text-xs md:text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#c7c4d7]" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* TOP ROW: 4 KPI Cards in a grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Squad Spend */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between text-[#c7c4d7]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Total Squad Spend
                </span>
                <Wallet className="w-5 h-5 text-[#8083ff]" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#dfe2f1] mt-2 tracking-tight">
                $42,500
              </div>
            </div>
            <div className="mt-4 pt-2">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-[#c7c4d7]">85% of monthly budget</span>
                <span className="text-[#dfe2f1] font-mono font-medium">85%</span>
              </div>
              <div className="w-full bg-[#262a35] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#8083ff] h-full rounded-full w-[85%]" />
              </div>
            </div>
          </div>

          {/* Card 2: Blended ROAS */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between text-[#c7c4d7]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Blended ROAS
                </span>
                <TrendingUp className="w-5 h-5 text-[#03b5d3]" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#dfe2f1] mt-2 tracking-tight">
                4.2x
              </div>
            </div>
            <div className="mt-4 pt-2 flex items-center">
              <span className="inline-flex items-center gap-1 bg-[#03b5d3]/15 text-[#03b5d3] px-2 py-0.5 rounded text-xs font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +12% vs last month
              </span>
            </div>
          </div>

          {/* Card 3: Average CPA */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between text-[#c7c4d7]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Average CPA
                </span>
                <Trophy className="w-5 h-5 text-[#ffb4ab]" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#dfe2f1] mt-2 tracking-tight">
                $3.15
              </div>
            </div>
            <div className="mt-4 pt-2 flex items-center">
              <span className="inline-flex items-center gap-1 bg-[#ffb4ab]/15 text-[#ffb4ab] px-2 py-0.5 rounded text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                +$0.20 over target cap
              </span>
            </div>
          </div>

          {/* Card 4: Team Approval Rate */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between text-[#c7c4d7]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Squad Approval Rate
                </span>
                <CheckCircle2 className="w-5 h-5 text-[#03b5d3]" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#dfe2f1] mt-2 tracking-tight">
                92%
              </div>
            </div>
            <div className="mt-4 pt-2 flex items-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#03b5d3]">
                <CheckCircle2 className="w-4 h-4 text-[#03b5d3]" />
                High-quality submissions
              </span>
            </div>
          </div>
        </section>

        {/* MIDDLE ROW: Split Layout (8 cols vs 4 cols) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Card (8 cols) - Cross-Channel Performance Chart */}
          <div className="lg:col-span-8 bg-[#1c1f2a] border border-[#464554] rounded-lg p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#464554]">
                <div>
                  <h2 className="text-base md:text-lg font-bold text-[#dfe2f1]">
                    Cross-Channel Performance
                  </h2>
                  <p className="text-xs text-[#c7c4d7] mt-0.5">
                    Spend vs ROAS comparison across Meta, Google, and TikTok.
                  </p>
                </div>
                {/* Legends */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-[#262a35] border border-[#464554] px-2.5 py-1 rounded text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#8083ff]" />
                    <span className="text-[#dfe2f1] font-medium">Spend ($)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#262a35] border border-[#464554] px-2.5 py-1 rounded text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#03b5d3]" />
                    <span className="text-[#dfe2f1] font-medium">ROAS Multiplier</span>
                  </div>
                </div>
              </div>

              {/* Channels Breakdown Visual Bars */}
              <div className="space-y-5 mt-5">
                {/* Channel 1: Meta Ads */}
                <div className="group">
                  <div className="flex justify-between items-baseline mb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8083ff]" />
                      <span className="text-[#dfe2f1] font-semibold text-sm">Meta Ads</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-[#c7c4d7]">
                        Spend: <strong className="text-[#dfe2f1] font-semibold">$21,400</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#03b5d3]/15 text-[#03b5d3] font-semibold">
                        4.6x ROAS
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-9 bg-[#262a35] rounded-lg h-5 overflow-hidden p-0.5 flex">
                      <div className="bg-[#8083ff] h-full rounded transition-all duration-500 w-[78%]" />
                    </div>
                    <div className="col-span-3 bg-[#262a35] rounded-lg h-5 overflow-hidden p-0.5 flex">
                      <div className="bg-[#03b5d3] h-full rounded transition-all duration-500 w-[92%]" />
                    </div>
                  </div>
                </div>

                {/* Channel 2: Google Search & P-Max */}
                <div className="group">
                  <div className="flex justify-between items-baseline mb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#03b5d3]" />
                      <span className="text-[#dfe2f1] font-semibold text-sm">
                        Google Search &amp; P-Max
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-[#c7c4d7]">
                        Spend: <strong className="text-[#dfe2f1] font-semibold">$14,200</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#03b5d3]/15 text-[#03b5d3] font-semibold">
                        3.8x ROAS
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-9 bg-[#262a35] rounded-lg h-5 overflow-hidden p-0.5 flex">
                      <div className="bg-[#03b5d3] h-full rounded transition-all duration-500 w-[52%]" />
                    </div>
                    <div className="col-span-3 bg-[#262a35] rounded-lg h-5 overflow-hidden p-0.5 flex">
                      <div className="bg-[#03b5d3] h-full rounded transition-all duration-500 w-[76%]" />
                    </div>
                  </div>
                </div>

                {/* Channel 3: TikTok Ads */}
                <div className="group">
                  <div className="flex justify-between items-baseline mb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />
                      <span className="text-[#dfe2f1] font-semibold text-sm">TikTok Ads</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-[#c7c4d7]">
                        Spend: <strong className="text-[#dfe2f1] font-semibold">$6,900</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#03b5d3]/15 text-[#03b5d3] font-semibold">
                        4.1x ROAS
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-9 bg-[#262a35] rounded-lg h-5 overflow-hidden p-0.5 flex">
                      <div className="bg-[#a78bfa] h-full rounded transition-all duration-500 w-[25%]" />
                    </div>
                    <div className="col-span-3 bg-[#262a35] rounded-lg h-5 overflow-hidden p-0.5 flex">
                      <div className="bg-[#03b5d3] h-full rounded transition-all duration-500 w-[82%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend SVG with Grid lines */}
              <div className="mt-6 pt-4 border-t border-[#464554]/50">
                <div className="flex items-center justify-between text-[11px] text-[#c7c4d7] font-mono mb-2">
                  <span>CHANNEL VELOCITY OVER TIME</span>
                  <span className="text-[#03b5d3]">EFFICIENCY CURVE</span>
                </div>
                <div className="relative w-full h-20 bg-[#262a35]/40 rounded border border-[#464554]/60 p-2 overflow-hidden">
                  <svg
                    className="w-full h-full"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 600 70"
                  >
                    <line
                      stroke="#464554"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                      x1="0"
                      x2="600"
                      y1="18"
                      y2="18"
                    />
                    <line
                      stroke="#464554"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                      x1="0"
                      x2="600"
                      y1="42"
                      y2="42"
                    />
                    <path
                      d="M0,52 Q120,60 220,34 T420,26 T600,14"
                      stroke="#03b5d3"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M0,60 Q130,44 260,48 T480,30 T600,38"
                      stroke="#8083ff"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#464554]/50 flex items-center justify-between text-xs text-[#c7c4d7]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#03b5d3]" />
                <span>Meta Ads currently generates 50.3% of total campaign revenue</span>
              </div>
              <span className="font-mono text-[#dfe2f1] text-[11px] bg-[#262a35] px-2 py-0.5 rounded border border-[#464554]">
                Auto-synced
              </span>
            </div>
          </div>

          {/* Right Card (4 cols) - AI Recommendations */}
          <div className="lg:col-span-4 bg-[#1c1f2a] border border-[#464554] rounded-lg p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#464554]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#8083ff]/15 border border-[#8083ff]/30 flex items-center justify-center text-[#8083ff]">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#dfe2f1] leading-tight">
                      AI Insights &amp; Recommendations
                    </h2>
                    <span className="text-[10px] text-[#8083ff] font-mono tracking-wider font-semibold">
                      INFERENCE ENGINE
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#8083ff]/15 border border-[#8083ff]/30 text-[#8083ff] text-xs font-bold font-mono">
                  2 ACTIVE
                </span>
              </div>

              {/* Recommendation Item 1: Budget allocation */}
              <div className="py-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold tracking-wider text-[#8083ff] uppercase font-mono">
                    BUDGET ALLOCATION
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#03b5d3]/15 text-[#03b5d3] font-mono text-[11px] font-semibold">
                    Projected +0.3x ROAS
                  </span>
                </div>
                <p className="text-xs text-[#dfe2f1] leading-relaxed">
                  Shift $2,000 from Google Search to TikTok Reels to capitalize on declining CPA and
                  saturated search volume.
                </p>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={strategyApplied}
                    onClick={handleApplyStrategy}
                    className="bg-[#8083ff] hover:opacity-90 disabled:opacity-50 text-[#0d0096] font-semibold text-xs px-4 py-2 rounded-lg transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>{strategyApplied ? 'Applied' : 'Apply Recommendation'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-[#464554]" />

              {/* Recommendation Item 2: Creative fatigue */}
              <div className="py-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold tracking-wider text-[#ffb4ab] uppercase font-mono">
                    CREATIVE FATIGUE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#ffb4ab]/15 text-[#ffb4ab] font-mono text-[11px] font-semibold">
                    CTR dropped -34% in 48h
                  </span>
                </div>
                <p className="text-xs text-[#dfe2f1] leading-relaxed">
                  Pause Ad Variant B in Autumn Campaign due to audience frequency saturation.
                </p>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={variantPaused}
                    onClick={handlePauseVariant}
                    className="border border-[#464554] text-[#dfe2f1] px-4 py-2 rounded-lg hover:bg-[#262a35] disabled:opacity-50 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <PauseCircle className="w-3.5 h-3.5 text-[#ffb4ab]" />
                    <span>{variantPaused ? 'Paused' : 'Pause Variant'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#464554] flex items-center gap-2 text-xs text-[#c7c4d7]">
              <Zap className="w-4 h-4 text-[#8083ff]" />
              <span>Forecast based on 1.4M internal bidding signals</span>
            </div>
          </div>
        </section>

        {/* BOTTOM ROW: Full Width Data Table Card */}
        <section className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#464554]">
            <div>
              <h2 className="text-base md:text-lg font-bold text-[#dfe2f1]">
                Team Output &amp; Quality
              </h2>
              <p className="text-xs text-[#c7c4d7] mt-0.5">
                Execution volume, approval rates, and average review times per team member.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#c7c4d7]" />
                <input
                  type="text"
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  placeholder="Filter squad members..."
                  className="bg-[#262a35] border border-[#464554] text-[#dfe2f1] placeholder:text-[#c7c4d7]/60 text-xs pl-8 pr-3 py-1.5 rounded-lg outline-none w-56 focus:border-[#8083ff] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#464554] text-[#c7c4d7] uppercase font-mono tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">TEAM MEMBER</th>
                  <th className="py-3 px-4 font-semibold">ROLE</th>
                  <th className="py-3 px-4 font-semibold">SUBMISSIONS</th>
                  <th className="py-3 px-4 font-semibold">APPROVAL RATE</th>
                  <th className="py-3 px-4 font-semibold">AVG REVIEW TIME</th>
                  <th className="py-3 px-4 font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#464554]/60">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-[#262a35]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${m.avatarBg}`}
                        >
                          {m.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#dfe2f1]">{m.name}</div>
                          <div className="text-[11px] text-[#c7c4d7]/70 font-mono truncate">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded bg-[#262a35] border border-[#464554] text-[#dfe2f1] text-[11px] font-medium">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-[#dfe2f1]">
                      {m.submissions} submissions
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#03b5d3] text-sm">
                          {m.approvalRate}%
                        </span>
                        <div className="w-16 bg-[#262a35] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#03b5d3] h-full rounded-full"
                            style={{ width: `${m.approvalRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#dfe2f1]">{m.avgReviewTime}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${m.statusColor}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

LeaderPerformance.propTypes = {
  setPage: PropTypes.func,
  notify: PropTypes.func,
}
