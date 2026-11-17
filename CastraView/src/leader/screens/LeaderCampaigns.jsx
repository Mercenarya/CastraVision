import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Search,
  Plus,
  Rocket,
  Wallet,
  TrendingUp,
  Download,
  ArrowUpRight,
  Layers,
  X,
} from 'lucide-react'

const INITIAL_CAMPAIGNS = [
  {
    id: 'CMP-8821',
    name: 'Summer Streetwear Gen Z Launch 2025',
    channels: ['Meta Ads', 'TikTok Ads'],
    tag: 'Q3 Sneaker Drop',
    status: 'Active',
    squad: 'Growth Squad Alpha',
    squadSymbol: 'α',
    squadColor: 'text-[#8083ff]',
    spent: 38400,
    budget: 45000,
    roas: '4.6x',
    roasVal: 4.6,
  },
  {
    id: 'CMP-8819',
    name: "Men's Athletic Footwear Performance Max",
    channels: ['Google Search', 'P-Max'],
    tag: 'Evergreen Catalog',
    status: 'Active',
    squad: 'Growth Squad Alpha',
    squadSymbol: 'α',
    squadColor: 'text-[#8083ff]',
    spent: 28900,
    budget: 35000,
    roas: '4.2x',
    roasVal: 4.2,
  },
  {
    id: 'CMP-8815',
    name: 'Autumn Activewear Retargeting Pool',
    channels: ['Multi-Channel'],
    tag: 'Audience Refresh Pending',
    status: 'Draft',
    squad: 'Content Studio Beta',
    squadSymbol: 'β',
    squadColor: 'text-[#03b5d3]',
    spent: 0,
    budget: 15000,
    roas: '—',
    roasVal: 0,
  },
  {
    id: 'CMP-8811',
    name: 'Q3 Influencer UGC & Spark Ads Push',
    channels: ['TikTok UGC'],
    tag: 'Creator Roster V2',
    status: 'Active',
    squad: 'Growth Squad Alpha',
    squadSymbol: 'α',
    squadColor: 'text-[#8083ff]',
    spent: 14200,
    budget: 20000,
    roas: '3.9x',
    roasVal: 3.9,
  },
  {
    id: 'CMP-8802',
    name: 'Cart Abandonment Dynamic Re-engagement',
    channels: ['Klaviyo CRM', 'Meta Ads'],
    tag: 'Phase 2 Concluded',
    status: 'Completed',
    squad: 'Performance Delta',
    squadSymbol: 'Δ',
    squadColor: 'text-[#ffc107]',
    spent: 12500,
    budget: 12500,
    roas: '5.1x',
    roasVal: 5.1,
  },
  {
    id: 'CMP-8795',
    name: 'Black Friday Warm-up & Teaser Sequence',
    channels: ['Meta Ads', 'TikTok Ads'],
    tag: 'Early Bird VIP Funnel',
    status: 'Draft',
    squad: 'Growth Squad Alpha',
    squadSymbol: 'α',
    squadColor: 'text-[#8083ff]',
    spent: 0,
    budget: 25000,
    roas: '—',
    roasVal: 0,
  },
  {
    id: 'CMP-8788',
    name: 'TikTok TopView Brand Awareness Burst',
    channels: ['TikTok Ads'],
    tag: 'Gen Z Viral Challenge',
    status: 'Active',
    squad: 'Content Studio Beta',
    squadSymbol: 'β',
    squadColor: 'text-[#03b5d3]',
    spent: 18400,
    budget: 22000,
    roas: '3.7x',
    roasVal: 3.7,
  },
  {
    id: 'CMP-8770',
    name: 'Google Discovery & YouTube Action Ads',
    channels: ['Google Ads', 'YouTube'],
    tag: 'Mid-Funnel Video Action',
    status: 'Active',
    squad: 'Growth Squad Alpha',
    squadSymbol: 'α',
    squadColor: 'text-[#8083ff]',
    spent: 9800,
    budget: 12000,
    roas: '4.4x',
    roasVal: 4.4,
  },
]

export default function LeaderCampaigns({ setPage, notify }) {
  const [campaigns] = useState(INITIAL_CAMPAIGNS)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [statusTab, setStatusTab] = useState('ALL')
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignBudget, setNewCampaignBudget] = useState('20000')
  const [newCampaignSquad, setNewCampaignSquad] = useState('Growth Squad Alpha')

  // Filter logic
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Status tab
      if (statusTab !== 'ALL' && c.status.toLowerCase() !== statusTab.toLowerCase()) {
        return false
      }
      // Channel filter
      if (channelFilter !== 'ALL') {
        const matchesChannel = c.channels.some((ch) =>
          ch.toLowerCase().includes(channelFilter.toLowerCase())
        )
        if (!matchesChannel) return false
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = c.name.toLowerCase().includes(q)
        const matchId = c.id.toLowerCase().includes(q)
        const matchSquad = c.squad.toLowerCase().includes(q)
        const matchTag = c.tag.toLowerCase().includes(q)
        if (!matchName && !matchId && !matchSquad && !matchTag) return false
      }
      return true
    })
  }, [campaigns, statusTab, channelFilter, searchQuery])

  // Count per status
  const counts = useMemo(() => {
    return {
      all: campaigns.length,
      active: campaigns.filter((c) => c.status === 'Active').length,
      draft: campaigns.filter((c) => c.status === 'Draft').length,
      completed: campaigns.filter((c) => c.status === 'Completed').length,
    }
  }, [campaigns])

  const handleExportCSV = () => {
    const headers = 'ID,Name,Status,Squad,Spent,Budget,ROAS\n'
    const rows = filteredCampaigns
      .map(
        (c) =>
          `"${c.id}","${c.name}","${c.status}","${c.squad}",$${c.spent},$${c.budget},"${c.roas}"`
      )
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Squad_Campaigns_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    notify?.('Campaign registry exported successfully (CSV)')
  }

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (!newCampaignName.trim()) return
    notify?.(`New campaign draft created: "${newCampaignName}"`)
    setIsCreateModalOpen(false)
    setNewCampaignName('')
  }

  return (
    <div className="flex-1 bg-[#0f131d] overflow-y-auto p-6 md:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1]">
      <div className="max-w-[1400px] w-full mx-auto space-y-6 pb-12">
        {/* TOP BAR: Page Action Header Container */}
        <section className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-[#dfe2f1] tracking-tight">
                  Campaign Management
                </h1>
                <span className="px-2 py-0.5 rounded bg-[#262a35] border border-[#464554] text-[#8083ff] font-mono text-[11px] font-semibold tracking-wide">
                  LEADER WORKSPACE
                </span>
              </div>
              <p className="text-sm text-[#c7c4d7] mt-1">
                Monitor, coordinate, and allocate budget across Squad multi-channel growth campaigns.
              </p>
            </div>

            {/* Action Group */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[240px] sm:min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#c7c4d7]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaigns, squad, channel..."
                  className="w-full bg-[#141e33] border border-[#464554] rounded-lg pl-9 pr-3 py-2 text-xs md:text-sm text-[#dfe2f1] placeholder-[#c7c4d7]/60 focus:outline-none focus:border-[#8083ff] transition-colors"
                />
              </div>

              {/* Filter Channel */}
              <div className="relative">
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="bg-[#262a35] border border-[#464554] text-[#dfe2f1] text-xs md:text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#313540] transition-colors cursor-pointer outline-none"
                >
                  <option value="ALL">All Channels</option>
                  <option value="Meta">Meta Ads</option>
                  <option value="Google">Google Ads / P-Max</option>
                  <option value="TikTok">TikTok Ads / UGC</option>
                </select>
              </div>

              {/* Primary CTA */}
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#8083ff] hover:bg-[#6c70f0] text-[#0d0096] text-xs md:text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Campaign</span>
              </button>
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS: 3 Metric Bento Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Active Campaigns */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#464554]/60">
              <span className="text-xs uppercase tracking-wider text-[#c7c4d7] font-semibold">
                Active Campaigns
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#262a35] border border-[#464554] flex items-center justify-center text-[#8083ff]">
                <Rocket className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl md:text-3xl font-bold text-[#dfe2f1] tracking-tight">
                  8 Active
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#03b5d3]/15 border border-[#03b5d3]/30 text-[#03b5d3] text-xs font-semibold">
                  On Track to Target
                </span>
              </div>
              <p className="text-xs text-[#c7c4d7]">
                12 campaigns initiated this quarter across 3 marketing squads
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-[#464554]/40 flex items-center justify-between text-xs text-[#c7c4d7]">
              <span>Sync: Daily 09:00</span>
              <span className="text-[#03b5d3] font-medium">99.4% Uptime</span>
            </div>
          </div>

          {/* Card 2: Total Budget Allocated */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#464554]/60">
              <span className="text-xs uppercase tracking-wider text-[#c7c4d7] font-semibold">
                Total Allocated Budget
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#262a35] border border-[#464554] flex items-center justify-center text-[#8083ff]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl md:text-3xl font-bold text-[#dfe2f1] tracking-tight">
                  $124,500
                </span>
                <span className="font-mono text-xs text-[#8083ff] font-semibold">
                  69.2% utilized
                </span>
              </div>
              <p className="text-xs text-[#c7c4d7]">
                $86,240 spent • $38,260 reserve budget available
              </p>
              {/* Progress Bar */}
              <div className="w-full bg-[#141e33] border border-[#464554]/80 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-[#8083ff] h-full rounded-full transition-all duration-500"
                  style={{ width: '69.2%' }}
                />
              </div>
            </div>
            <div className="pt-4 mt-3 border-t border-[#464554]/40 flex items-center justify-between text-xs text-[#c7c4d7]">
              <span>Budget replenishment cycle</span>
              <span className="font-mono text-[#dfe2f1]">14 Days Left</span>
            </div>
          </div>

          {/* Card 3: Overall Blended ROAS */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#464554]/60">
              <span className="text-xs uppercase tracking-wider text-[#c7c4d7] font-semibold">
                Blended ROAS
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#262a35] border border-[#464554] flex items-center justify-center text-[#03b5d3]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl md:text-3xl font-bold text-[#dfe2f1] tracking-tight">
                  4.35x
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#03b5d3]/15 border border-[#03b5d3]/30 text-[#03b5d3] text-xs font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +0.45x vs target
                </span>
              </div>
              <p className="text-xs text-[#c7c4d7]">
                Benchmark target: 3.90x across Paid Social & Search
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-[#464554]/40 flex items-center justify-between text-xs text-[#c7c4d7]">
              <span>Attribution Model: 7-Day Click / 1-Day View</span>
              <span className="text-[#03b5d3] font-mono">Peak: 5.1x</span>
            </div>
          </div>
        </section>

        {/* MAIN CAMPAIGN LIST CONTAINER */}
        <section className="bg-[#1c1f2a] border border-[#464554] rounded-lg shadow-sm flex flex-col overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-5 border-b border-[#464554] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base md:text-lg font-semibold text-[#dfe2f1]">
                All Squad Campaigns
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#262a35] border border-[#464554] text-[#8083ff] font-mono font-bold text-xs">
                {filteredCampaigns.length} Campaigns
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Tabs */}
              <div className="inline-flex rounded-lg bg-[#141e33] border border-[#464554] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusTab('ALL')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    statusTab === 'ALL'
                      ? 'bg-[#262a35] text-[#dfe2f1] font-semibold'
                      : 'text-[#c7c4d7] hover:text-[#dfe2f1]'
                  }`}
                >
                  All ({counts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('Active')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    statusTab === 'Active'
                      ? 'bg-[#262a35] text-[#dfe2f1] font-semibold'
                      : 'text-[#c7c4d7] hover:text-[#dfe2f1]'
                  }`}
                >
                  Active ({counts.active})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('Draft')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    statusTab === 'Draft'
                      ? 'bg-[#262a35] text-[#dfe2f1] font-semibold'
                      : 'text-[#c7c4d7] hover:text-[#dfe2f1]'
                  }`}
                >
                  Draft ({counts.draft})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('Completed')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    statusTab === 'Completed'
                      ? 'bg-[#262a35] text-[#dfe2f1] font-semibold'
                      : 'text-[#c7c4d7] hover:text-[#dfe2f1]'
                  }`}
                >
                  Completed ({counts.completed})
                </button>
              </div>

              {/* Quick Export */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#262a35] border border-[#464554] hover:bg-[#313540] text-[#dfe2f1] text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#c7c4d7]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-[#171b26] border-b border-[#464554] text-[#c7c4d7] text-xs font-semibold tracking-wider uppercase">
                  <th className="py-3.5 px-5">Campaign Name</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Assigned Squad</th>
                  <th className="py-3.5 px-5">Spent Budget</th>
                  <th className="py-3.5 px-5 text-center">ROAS</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#464554]/50 text-[#dfe2f1]">
                {filteredCampaigns.map((c) => {
                  const spentPct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#262a35]/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedCampaign(c)}
                    >
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#dfe2f1] group-hover:text-[#8083ff] transition-colors">
                              {c.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#c7c4d7]/70">
                              #{c.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {c.channels.map((ch) => (
                              <span
                                key={ch}
                                className="px-2 py-0.5 rounded bg-[#141e33] border border-[#464554] text-[10px] font-mono font-medium text-[#c7c4d7]"
                              >
                                {ch}
                              </span>
                            ))}
                            <span className="text-[11px] text-[#c7c4d7]/70">• {c.tag}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        {c.status === 'Active' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#03b5d3]/15 border border-[#03b5d3]/40 text-[#03b5d3] text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#03b5d3]" />
                            Active
                          </span>
                        )}
                        {c.status === 'Draft' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffc107]/15 border border-[#ffc107]/40 text-[#ffc107] text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ffc107]" />
                            Draft
                          </span>
                        )}
                        {c.status === 'Completed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c7c4d7]/15 border border-[#c7c4d7]/30 text-[#c7c4d7] text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c7c4d7]" />
                            Completed
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded bg-[#262a35] border border-[#464554] flex items-center justify-center font-mono text-[10px] font-bold ${c.squadColor}`}
                          >
                            {c.squadSymbol}
                          </div>
                          <span className="font-medium text-[#dfe2f1]">{c.squad}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex flex-col w-36">
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="font-semibold text-[#dfe2f1]">
                              ${c.spent.toLocaleString()}
                            </span>
                            <span className="text-[#c7c4d7]/70 text-[11px] font-normal">
                              / ${c.budget.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-[#141e33] border border-[#464554]/70 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#8083ff] h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, spentPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap text-center">
                        {c.roas !== '—' ? (
                          <span className="font-mono text-xs font-bold text-[#03b5d3] bg-[#03b5d3]/10 px-2 py-1 rounded border border-[#03b5d3]/20">
                            {c.roas}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-[#c7c4d7]/50">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedCampaign(c)}
                            className="px-2.5 py-1 rounded bg-[#262a35] border border-[#464554] text-[#dfe2f1] hover:bg-[#313540] text-xs font-medium transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => setPage?.('performance')}
                            title="View detailed performance"
                            className="p-1 rounded hover:bg-[#262a35] text-[#c7c4d7] hover:text-[#dfe2f1] transition-colors cursor-pointer"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="py-12 text-center text-[#c7c4d7]">
              <Layers className="w-10 h-10 mx-auto text-[#464554] mb-2" />
              <p className="font-semibold text-[#dfe2f1]">No matching campaigns found</p>
              <p className="text-xs mt-1">Try adjusting your search query or clearing the filter.</p>
            </div>
          )}
        </section>
      </div>

      {/* DETAIL MODAL */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#464554] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#262a35] border border-[#464554] text-[#8083ff]">
                  #{selectedCampaign.id}
                </span>
                <h3 className="font-bold text-[#dfe2f1] text-base truncate">
                  {selectedCampaign.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="p-1 text-[#c7c4d7] hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#171b26] p-3 rounded-lg border border-[#464554]">
                  <span className="text-[#c7c4d7] block text-[11px]">Status</span>
                  <span className="font-bold text-[#03b5d3] text-sm mt-0.5 block">
                    {selectedCampaign.status}
                  </span>
                </div>
                <div className="bg-[#171b26] p-3 rounded-lg border border-[#464554]">
                  <span className="text-[#c7c4d7] block text-[11px]">Current ROAS</span>
                  <span className="font-bold text-[#03b5d3] text-sm mt-0.5 block">
                    {selectedCampaign.roas}
                  </span>
                </div>
              </div>

              <div className="bg-[#171b26] p-3 rounded-lg border border-[#464554] space-y-2">
                <div className="flex justify-between text-[#c7c4d7]">
                  <span>Budget Utilization</span>
                  <span className="font-mono text-[#dfe2f1] font-semibold">
                    ${selectedCampaign.spent.toLocaleString()} / $
                    {selectedCampaign.budget.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-[#141e33] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#8083ff] h-full"
                    style={{
                      width: `${
                        selectedCampaign.budget > 0
                          ? (selectedCampaign.spent / selectedCampaign.budget) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <span className="text-[#c7c4d7] block mb-1.5">Allocated Channels:</span>
                <div className="flex gap-2 flex-wrap">
                  {selectedCampaign.channels.map((ch) => (
                    <span
                      key={ch}
                      className="px-2.5 py-1 rounded bg-[#262a35] border border-[#464554] text-[#dfe2f1] font-mono text-[11px]"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[#c7c4d7] block mb-1">Assigned Squad:</span>
                <div className="flex items-center gap-2 text-[#dfe2f1] font-medium">
                  <span className="w-5 h-5 rounded bg-[#262a35] border border-[#464554] flex items-center justify-center font-mono text-[10px] text-[#8083ff]">
                    {selectedCampaign.squadSymbol}
                  </span>
                  <span>{selectedCampaign.squad}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#464554]">
              <button
                type="button"
                onClick={() => {
                  setSelectedCampaign(null)
                  setPage?.('performance')
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8083ff] text-[#0d0096] font-bold text-xs hover:bg-[#6c70f0] transition-colors"
              >
                <span>View Analytics</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#464554] pb-3">
              <h3 className="font-bold text-[#dfe2f1] text-base">Create New Campaign (Draft)</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#c7c4d7] hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#c7c4d7] font-semibold mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="e.g., Winter Outerwear Retargeting 2026..."
                  className="w-full bg-[#141e33] border border-[#464554] rounded-lg px-3 py-2 text-[#dfe2f1] outline-none focus:border-[#8083ff]"
                />
              </div>

              <div>
                <label className="block text-[#c7c4d7] font-semibold mb-1">
                  Planned Budget ($)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  required
                  value={newCampaignBudget}
                  onChange={(e) => setNewCampaignBudget(e.target.value)}
                  className="w-full bg-[#141e33] border border-[#464554] rounded-lg px-3 py-2 text-[#dfe2f1] outline-none focus:border-[#8083ff]"
                />
              </div>

              <div>
                <label className="block text-[#c7c4d7] font-semibold mb-1">Assigned Squad</label>
                <select
                  value={newCampaignSquad}
                  onChange={(e) => setNewCampaignSquad(e.target.value)}
                  className="w-full bg-[#141e33] border border-[#464554] rounded-lg px-3 py-2 text-[#dfe2f1] outline-none focus:border-[#8083ff]"
                >
                  <option value="Growth Squad Alpha">Growth Squad Alpha (Current Squad)</option>
                  <option value="Content Studio Beta">Content Studio Beta</option>
                  <option value="Performance Delta">Performance Delta</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#464554]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#464554] text-[#c7c4d7] hover:bg-[#262a35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#8083ff] text-[#0d0096] font-bold hover:bg-[#6c70f0]"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

LeaderCampaigns.propTypes = {
  setPage: PropTypes.func,
  notify: PropTypes.func,
}
