import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'

const initialCompetitors = [
  {
    id: 'aa',
    initials: 'AA',
    name: 'AeroAthletics Co.',
    category: 'Athleisure • Direct Competitor',
    classification: 'Monitored (Direct)',
    status: 'Active',
    statusTone: 'text-[#4cd7f6] bg-[#262a35]',
    avatarTone: 'text-[#4cd7f6] bg-[#262a35]',
    shareOfVoice: '32%',
    sovTone: 'text-[#4cd7f6]',
    channels: ['Meta Ads', 'TikTok', 'Google PMax'],
    recentActivity: 'Increased discount promo frequency on Reels',
    lastPulse: '2 days ago',
  },
  {
    id: 'sg',
    initials: 'SG',
    name: 'StrataSport Gear',
    category: 'Performance Wear • Direct Competitor',
    classification: 'Monitored (Direct)',
    status: 'Moderate',
    statusTone: 'text-[#8083ff] bg-[#262a35]',
    avatarTone: 'text-[#8083ff] bg-[#262a35]',
    shareOfVoice: '24%',
    sovTone: 'text-[#8083ff]',
    channels: ['Google Search', 'YouTube'],
    recentActivity: 'Bidding heavily on brand retargeting keywords',
    lastPulse: '4 days ago',
  },
  {
    id: 'vm',
    initials: 'VM',
    name: 'VeloMotion Urban',
    category: 'Lifestyle Apparel • Market Challenger',
    classification: 'System Discovered',
    status: 'Rising',
    statusTone: 'text-[#03b5d3] bg-[#262a35]',
    avatarTone: 'text-[#03b5d3] bg-[#262a35]',
    shareOfVoice: '18%',
    sovTone: 'text-[#03b5d3]',
    channels: ['TikTok Spark Ads', 'Creator Collabs'],
    recentActivity: 'Surging influencer UGC collaborations',
    lastPulse: 'Yesterday',
  },
]

export default function CompetitorInsightsPage({ notify }) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPeriod] = useState('Last 30 Days (Aug 1 - Aug 30, 2025)')

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      notify?.('Competitor intelligence signals updated.')
    }, 600)
  }

  const handleAddCompetitor = () => {
    notify?.('Add Competitor drawer opened.')
  }

  const filteredCompetitors = initialCompetitors.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1c1f2a] border border-[#464554] text-[#4cd7f6] text-[11px] font-semibold tracking-wider uppercase font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse" />
              Market Intelligence • Active
            </span>
            <span className="text-[12px] text-[#c7c4d7] flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#908fa0]" />
              Updated 15 mins ago
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#dfe2f1] tracking-tight">
            Competitor Analysis &amp; Market Trends
          </h1>
          <p className="text-sm text-[#c7c4d7] max-w-3xl">
            Monitor competitor activity, track market movements, and evaluate actionable marketing opportunities.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => notify?.('Date range selector opened.')}
            className="h-9 px-3 bg-[#1c1f2a] border border-[#464554] text-[#dfe2f1] rounded-lg text-xs font-mono flex items-center gap-2 hover:bg-[#262a35] transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#4cd7f6]" />
            <span>{selectedPeriod}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#908fa0]" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="h-9 px-3 bg-[#1c1f2a] border border-[#464554] text-[#dfe2f1] hover:bg-[#262a35] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#8083ff] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <button
            type="button"
            onClick={handleAddCompetitor}
            className="h-9 px-3.5 bg-[#8083ff] hover:bg-[#6f72f0] text-[#0a0e18] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Competitor</span>
          </button>
        </div>
      </div>

      {/* GROUP 1: MARKET OVERVIEW (4 CLEAN KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#c7c4d7]">
              Competitors Monitored
            </span>
            <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#4cd7f6] text-[11px] font-mono font-semibold">
              6 Active
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-[#dfe2f1] tracking-tight">6 Total</div>
            <p className="text-xs text-[#c7c4d7] mt-1 font-mono">3 Direct • 3 Discovered</p>
          </div>
          <div className="w-full bg-[#0a0e18] h-1.5 rounded-full mt-4 overflow-hidden flex">
            <div className="bg-[#4cd7f6] h-full" style={{ width: '50%' }} />
            <div className="bg-[#a078ff] h-full" style={{ width: '50%' }} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#c7c4d7]">
              Market Ad Activity
            </span>
            <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#8083ff] text-[11px] font-mono font-semibold">
              +18% Vol
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#dfe2f1] tracking-tight">High</div>
            <p className="text-xs text-[#c7c4d7] mt-1 font-mono">+18% ad frequency vs prev month</p>
          </div>
          <div className="w-full bg-[#0a0e18] h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#8083ff] h-full" style={{ width: '78%' }} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#c7c4d7]">
              Emerging Trends
            </span>
            <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#dfe2f1] text-[11px] font-mono font-semibold">
              New Angles
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-[#dfe2f1] tracking-tight">5 Detected</div>
            <p className="text-xs text-[#c7c4d7] mt-1">Focus: Short-form video &amp; lifestyle angles</p>
          </div>
          <div className="w-full bg-[#0a0e18] h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#4cd7f6] h-full" style={{ width: '60%' }} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#c7c4d7]">
              Estimated Opportunities
            </span>
            <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#4cd7f6] text-[11px] font-mono font-semibold">
              High Impact
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-[#4cd7f6] tracking-tight">8 Identified</div>
            <p className="text-xs text-[#c7c4d7] mt-1 font-mono">Estimated $14.2k conversion potential</p>
          </div>
          <div className="w-full bg-[#0a0e18] h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#4cd7f6] h-full" style={{ width: '72%' }} />
          </div>
        </div>
      </div>

      {/* GROUP 2: COMPETITOR COMPARISON (3 CARDS) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#dfe2f1]">Monitored vs. Discovered Competitors</h2>
            <span className="text-[11px] font-mono text-[#c7c4d7] px-2 py-0.5 rounded bg-[#1c1f2a] border border-[#464554]">
              {filteredCompetitors.length} Displayed of {initialCompetitors.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-2.5 top-2 text-[#908fa0] w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search competitors..."
                className="h-8 pl-8 pr-3 w-full bg-[#1c1f2a] border border-[#464554] text-[#dfe2f1] placeholder:text-[#908fa0] text-xs font-mono rounded-lg focus:outline-none focus:border-[#8083ff]"
              />
            </div>
            <button
              type="button"
              onClick={() => notify?.('Manage Competitor Targets dialog opened.')}
              className="h-8 px-3 rounded bg-[#1c1f2a] border border-[#464554] hover:bg-[#262a35] text-[#dfe2f1] text-xs font-mono transition-colors cursor-pointer"
            >
              Manage Targets
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompetitors.map((comp) => (
            <div
              key={comp.id}
              className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${comp.avatarTone}`}>
                      {comp.initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#dfe2f1] leading-snug">{comp.name}</h3>
                      <p className="text-xs text-[#c7c4d7]">{comp.category}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${comp.statusTone}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {comp.status}
                  </span>
                </div>

                {/* Classification & SOV Box */}
                <div className="mt-3.5 flex items-center justify-between p-2.5 rounded bg-[#171b26] border border-[#464554]/60">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#908fa0] block">Classification</span>
                    <span className="text-xs text-[#dfe2f1] font-semibold mt-0.5 block">{comp.classification}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#908fa0] block">Share of Voice</span>
                    <span className={`text-xs font-mono font-bold mt-0.5 block ${comp.sovTone}`}>{comp.shareOfVoice}</span>
                  </div>
                </div>

                {/* Channels */}
                <div className="mt-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#908fa0] block font-semibold">Channels</span>
                  <div className="flex flex-wrap gap-1.5">
                    {comp.channels.map((ch) => (
                      <span key={ch} className="px-2 py-0.5 rounded bg-[#262a35] text-[#dfe2f1] text-[11px] font-mono">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-3 space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#908fa0] block font-semibold">Recent Activity</span>
                  <p className="text-xs text-[#dfe2f1] leading-relaxed">{comp.recentActivity}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#464554]/60 flex items-center justify-between text-xs">
                <span className="text-[#c7c4d7] font-mono text-[11px]">Last pulse: {comp.lastPulse}</span>
                <button
                  type="button"
                  onClick={() => notify?.(`Opening dossier for ${comp.name}`)}
                  className="text-xs font-mono font-semibold text-[#8083ff] hover:text-[#c0c1ff] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View Overview
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GROUP 3: INSIGHTS & OPPORTUNITIES (SPLIT 7-COL / 5-COL) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Market Activity & Share Trends */}
        <div className="xl:col-span-7 bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h2 className="text-base font-bold text-[#dfe2f1]">Market Activity &amp; Share Trends</h2>
                <p className="text-xs text-[#c7c4d7]">Comparative 30-day competitor impression share trajectory</p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]" />
                  <span className="text-[#c7c4d7]">AeroAthletics</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8083ff]" />
                  <span className="text-[#c7c4d7]">StrataSport</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#03b5d3]" />
                  <span className="text-[#c7c4d7]">VeloMotion</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-[#dfe2f1] border-t border-dashed border-[#dfe2f1]" />
                  <span className="text-[#dfe2f1] font-semibold">Acme Corp (You)</span>
                </div>
              </div>
            </div>

            {/* Time-Series SVG Line Chart */}
            <div className="relative w-full h-56 pt-2 select-none">
              <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 220">
                {/* Horizontal Grid Lines */}
                <line stroke="#313540" strokeDasharray="4 4" strokeWidth="1" x1="50" x2="980" y1="20" y2="20" />
                <line stroke="#313540" strokeDasharray="4 4" strokeWidth="1" x1="50" x2="980" y1="65" y2="65" />
                <line stroke="#313540" strokeDasharray="4 4" strokeWidth="1" x1="50" x2="980" y1="110" y2="110" />
                <line stroke="#313540" strokeDasharray="4 4" strokeWidth="1" x1="50" x2="980" y1="155" y2="155" />
                <line stroke="#313540" strokeWidth="1" x1="50" x2="980" y1="195" y2="195" />

                {/* Y-Axis Labels */}
                <text fill="#908fa0" fontFamily="monospace" fontSize="10" textAnchor="end" x="38" y="24">100%</text>
                <text fill="#908fa0" fontFamily="monospace" fontSize="10" textAnchor="end" x="38" y="69">75%</text>
                <text fill="#908fa0" fontFamily="monospace" fontSize="10" textAnchor="end" x="38" y="114">50%</text>
                <text fill="#908fa0" fontFamily="monospace" fontSize="10" textAnchor="end" x="38" y="159">25%</text>
                <text fill="#908fa0" fontFamily="monospace" fontSize="10" textAnchor="end" x="38" y="199">0%</text>

                {/* Line 1: AeroAthletics (Cyan #4cd7f6) */}
                <polyline fill="none" points="80,120 260,110 440,105 620,35 800,68 960,60" stroke="#4cd7f6" strokeWidth="2.5" />
                <circle cx="80" cy="120" fill="#4cd7f6" r="3" />
                <circle cx="260" cy="110" fill="#4cd7f6" r="3" />
                <circle cx="440" cy="105" fill="#4cd7f6" r="3" />
                <circle cx="620" cy="35" fill="#4cd7f6" r="4.5" stroke="#0f131d" strokeWidth="2" />
                <circle cx="800" cy="68" fill="#4cd7f6" r="3" />
                <circle cx="960" cy="60" fill="#4cd7f6" r="3" />

                {/* Line 2: StrataSport (Indigo #8083ff) */}
                <polyline fill="none" points="80,95 260,85 440,100 620,92 800,88 960,95" stroke="#8083ff" strokeWidth="2" />
                <circle cx="80" cy="95" fill="#8083ff" r="3" />
                <circle cx="260" cy="85" fill="#8083ff" r="3" />
                <circle cx="440" cy="100" fill="#8083ff" r="3" />
                <circle cx="620" cy="92" fill="#8083ff" r="3" />
                <circle cx="800" cy="88" fill="#8083ff" r="3" />
                <circle cx="960" cy="95" fill="#8083ff" r="3" />

                {/* Line 3: VeloMotion (Teal #03b5d3) */}
                <polyline fill="none" points="80,150 260,145 440,132 620,120 800,102 960,85" stroke="#03b5d3" strokeWidth="2" />
                <circle cx="80" cy="150" fill="#03b5d3" r="3" />
                <circle cx="260" cy="145" fill="#03b5d3" r="3" />
                <circle cx="440" cy="132" fill="#03b5d3" r="3" />
                <circle cx="620" cy="120" fill="#03b5d3" r="3" />
                <circle cx="800" cy="102" fill="#03b5d3" r="3" />
                <circle cx="960" cy="85" fill="#03b5d3" r="3" />

                {/* Baseline: Acme Corp (Dashed White) */}
                <polyline fill="none" points="80,75 260,72 440,74 620,68 800,70 960,67" stroke="#dfe2f1" strokeDasharray="6 4" strokeWidth="2" />
                <circle cx="80" cy="75" fill="#dfe2f1" r="3" />
                <circle cx="260" cy="72" fill="#dfe2f1" r="3" />
                <circle cx="440" cy="74" fill="#dfe2f1" r="3" />
                <circle cx="620" cy="68" fill="#dfe2f1" r="3" />
                <circle cx="800" cy="70" fill="#dfe2f1" r="3" />
                <circle cx="960" cy="67" fill="#dfe2f1" r="3" />
              </svg>

              {/* X-Axis Labels */}
              <div className="flex justify-between px-12 pt-2 text-[#c7c4d7] font-mono text-[11px]">
                <span>Aug 01</span>
                <span>Aug 07</span>
                <span>Aug 14</span>
                <span className="text-[#4cd7f6] font-semibold">Aug 21 (Promo Spike)</span>
                <span>Aug 28</span>
                <span>Aug 30</span>
              </div>
            </div>
          </div>

          {/* Plain-language caption below chart */}
          <div className="pt-3 border-t border-[#464554]/60 flex items-center justify-between text-xs text-[#c7c4d7]">
            <span>Impression share trend over the last 30 days based on monitored channel signals.</span>
            <span className="text-[#dfe2f1] font-semibold font-mono">Normalized Index</span>
          </div>
        </div>

        {/* Right Column (5 cols): Recommended Opportunities & Activity Feed */}
        <div className="xl:col-span-5 bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#464554]/60">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#dfe2f1]">Recommended Opportunities</h2>
                <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#4cd7f6] text-[11px] font-mono font-semibold">
                  2 Actionable
                </span>
              </div>
              <span className="text-[11px] text-[#c7c4d7] font-mono">Prioritized for Manager</span>
            </div>

            {/* Opp 1: High Impact */}
            <div className="p-3.5 rounded-lg bg-[#171b26] border border-[#464554]/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#4cd7f6] text-[10px] font-mono font-semibold tracking-wide uppercase">
                  High Impact
                </span>
                <span className="text-[#4cd7f6] text-[11px] font-mono font-semibold">Est. +14.5% Lift</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#dfe2f1]">Counter Weekend Promo Campaign</h3>
                <p className="text-xs text-[#c7c4d7] mt-1 leading-relaxed">
                  AeroAthletics is promoting a 20% flash sale on Meta. Opportunity to highlight premium durability value messaging.
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#908fa0] font-mono">Channel: Meta Ads</span>
                <button
                  type="button"
                  onClick={() => notify?.('Opened Content Studio to draft response creative.')}
                  className="h-7 px-3 bg-[#8083ff] hover:bg-[#6f72f0] text-[#0a0e18] text-xs font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Review in Content Studio
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Opp 2: Medium Impact */}
            <div className="p-3.5 rounded-lg bg-[#171b26] border border-[#464554]/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#8083ff] text-[10px] font-mono font-semibold tracking-wide uppercase">
                  Medium Impact
                </span>
                <span className="text-[#8083ff] text-[11px] font-mono font-semibold">Protect Core Search</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#dfe2f1]">Protect Branded Search Terms</h3>
                <p className="text-xs text-[#c7c4d7] mt-1 leading-relaxed">
                  StrataSport increased bid density on shared athletic search terms. Consider reinforcing exact-match search budget.
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#908fa0] font-mono">Channel: Google Search</span>
                <button
                  type="button"
                  onClick={() => notify?.('Navigating to Budget & ROAS reallocation.')}
                  className="h-7 px-3 bg-[#262a35] hover:bg-[#353944] text-[#dfe2f1] text-xs font-mono font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Adjust Budget in ROAS
                </button>
              </div>
            </div>

            {/* Recent Notable Activity Summary */}
            <div className="pt-1 space-y-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#908fa0] block">
                Recent Notable Activity
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2 text-[#c7c4d7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] mt-1.5 shrink-0" />
                  <span><strong>AeroAthletics:</strong> Launched &apos;Weekend Flash Sale&apos; carousel creative set on Instagram.</span>
                </div>
                <div className="flex items-start gap-2 text-[#c7c4d7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#03b5d3] mt-1.5 shrink-0" />
                  <span><strong>VeloMotion:</strong> Onboarded 12 fitness creators for short-form video hooks on TikTok.</span>
                </div>
                <div className="flex items-start gap-2 text-[#c7c4d7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8083ff] mt-1.5 shrink-0" />
                  <span><strong>StrataSport:</strong> Increased search bid floors on target keywords by ~15%.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

CompetitorInsightsPage.propTypes = {
  notify: PropTypes.func,
}
