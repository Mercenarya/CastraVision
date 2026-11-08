import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { RejectProposalModal, ApprovalSuccessModal, EscalateToManagerModal } from '../components/LeaderModals'

/**
 * LeaderApprovalQueue
 * Implements Stitch designs:
 * - leader_approval_queue_default
 * - leader_approval_queue_filtered
 * - leader_approval_queue_empty_state
 * - leader_approval_success_with_edited_version
 */
export default function LeaderApprovalQueue({ onSelectContentReview, onSelectBudgetReview, setPage, notify }) {
  const [proposals, setProposals] = useState([
    {
      id: 'PRP-8402',
      title: 'Revise TikTok Hook Copy for Gen Z UGC #3',
      type: 'Content Proposals',
      channel: 'TikTok Video',
      channelIcon: '🎵',
      author: 'Maya Lin',
      authorRole: 'Short-form Video Lead',
      authorInitials: 'ML',
      campaign: 'Summer Streetwear Launch 2025',
      date: 'Oct 24, 2026',
      priority: 'HIGH',
      status: 'Pending',
      budgetImpact: '$0 (Creative Draft)',
      hook: 'Tired of generic oversized tees that fade in 2 washes? Here is what streetwear creators actually wear.',
      headline: 'Streetwear Crafted for Daily Wear',
      body: 'Engineered with 280GSM heavyweight combed cotton, reinforced collar ribs, and pigment-dyed longevity. Elevate your everyday streetwear rotation without the luxury tax markup.',
      cta: 'Shop Summer Drop (20% Off)',
    },
    {
      id: 'PRP-8403',
      title: 'Dynamic Budget Reallocation — Q4 ROAS Optimization',
      type: 'Budget Optimization',
      channel: 'Multi-Channel (Google / Meta / TikTok)',
      channelIcon: '⚖️',
      author: 'Autonomous Engine Agent',
      authorRole: 'Pipeline Engine Beta',
      authorInitials: 'AI',
      campaign: 'Q3 Activewear Omnichannel Campaign',
      date: 'Oct 24, 2026',
      priority: 'HIGH',
      status: 'Pending',
      budgetImpact: '+$7,000 Shift (>20% Threshold)',
      isThresholdExceeded: true,
    },
    {
      id: 'PRP-8404',
      title: 'Google Search Responsive Ad Headline Variations',
      type: 'Content Proposals',
      channel: 'Google Search',
      channelIcon: '🔍',
      author: 'Alex Mercer',
      authorRole: 'Search Intent Specialist',
      authorInitials: 'AM',
      campaign: "Men's Athletic Shoes P-Max",
      date: 'Oct 24, 2026',
      priority: 'MEDIUM',
      status: 'Pending',
      budgetImpact: '$0 (RSA Copy Set)',
      hook: 'Find running shoes engineered for sub-4 marathon training.',
      headline: 'Sub-4 Marathon Cushion Running Shoes',
      body: 'Carbon plate rebound with responsive dual-density foam. Experience marathon-grade energy return with every stride.',
      cta: 'Explore Marathon Collection',
    },
    {
      id: 'PRP-8399',
      title: 'Instagram Reels Video & Dynamic Caption Set',
      type: 'Content Proposals',
      channel: 'Meta Ads',
      channelIcon: '📱',
      author: 'Elena Rostova',
      authorRole: 'Senior Media Buyer',
      authorInitials: 'ER',
      campaign: 'Summer Streetwear Launch 2025',
      date: 'Oct 23, 2026',
      priority: 'MEDIUM',
      status: 'Approved',
      budgetImpact: '$0 (Approved & Dispatched)',
    },
    {
      id: 'PRP-8395',
      title: 'Weekend Spend Pacing Optimization (+10% Boost)',
      type: 'Budget Optimization',
      channel: 'Meta Ads',
      channelIcon: '📈',
      author: 'Elena Rostova',
      authorRole: 'Senior Media Buyer',
      authorInitials: 'ER',
      campaign: 'Brand Awareness Omnichannel',
      date: 'Oct 22, 2026',
      priority: 'LOW',
      status: 'Approved',
      budgetImpact: '+$2,500 (+8.3% Pacing)',
    },
    {
      id: 'PRP-8388',
      title: 'Flash Sale UGC Hook (Discounts Exceeded Claim Limit)',
      type: 'Content Proposals',
      channel: 'TikTok Video',
      channelIcon: '🎵',
      author: 'Liam Patel',
      authorRole: 'Creative Visual Designer',
      authorInitials: 'LP',
      campaign: 'Fall Sneaker Preview',
      date: 'Oct 21, 2026',
      priority: 'HIGH',
      status: 'Rejected',
      budgetImpact: '$0 (Disapproved)',
      rejectionReason: 'Violates Brand Guidelines (Unapproved 70% Discount Claim)',
    },
  ])

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('All Types')
  const [selectedStatus, setSelectedStatus] = useState('All Statuses')
  const [selectedTab, setSelectedTab] = useState('All') // 'All' | 'Pending' | 'Approved' | 'Rejected'
  const [activeProposalForModal, setActiveProposalForModal] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Counts
  const counts = useMemo(() => {
    return {
      all: proposals.length,
      pending: proposals.filter((p) => p.status === 'Pending').length,
      approved: proposals.filter((p) => p.status === 'Approved').length,
      rejected: proposals.filter((p) => p.status === 'Rejected').length,
    }
  }, [proposals])

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      // Tab filter
      if (selectedTab !== 'All' && p.status !== selectedTab) return false
      // Status dropdown
      if (selectedStatus !== 'All Statuses' && p.status !== selectedStatus) return false
      // Type dropdown
      if (selectedType !== 'All Types' && p.type !== selectedType) return false
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = p.title.toLowerCase().includes(q)
        const matchId = p.id.toLowerCase().includes(q)
        const matchAuthor = p.author.toLowerCase().includes(q)
        const matchCampaign = p.campaign.toLowerCase().includes(q)
        if (!matchTitle && !matchId && !matchAuthor && !matchCampaign) return false
      }
      return true
    })
  }, [proposals, selectedTab, selectedStatus, selectedType, searchQuery])

  const handleQuickApprove = (proposal) => {
    setProposals((prev) =>
      prev.map((item) => (item.id === proposal.id ? { ...item, status: 'Approved' } : item))
    )
    setActiveProposalForModal(proposal)
    setShowSuccessModal(true)
    notify?.(`Proposal ${proposal.id} approved and signed.`)
  }

  const handleQuickReject = (proposal) => {
    setActiveProposalForModal(proposal)
    setShowRejectModal(true)
  }

  const handleQuickEscalate = (proposal) => {
    setActiveProposalForModal(proposal)
    setShowEscalateModal(true)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedType('All Types')
    setSelectedStatus('All Statuses')
    setSelectedTab('All')
  }

  const handleExportCSV = () => {
    const csvContent = [
      'ID,Title,Type,Channel,Author,Campaign,Priority,Status,BudgetImpact',
      ...filteredProposals.map(
        (p) =>
          `"${p.id}","${p.title}","${p.type}","${p.channel}","${p.author}","${p.campaign}","${p.priority}","${p.status}","${p.budgetImpact}"`
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `castravision_approval_queue_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    notify?.('Approval queue exported to CSV.')
  }

  return (
    <div className="w-full flex flex-col gap-6 p-6 max-w-[1440px] mx-auto text-[#dfe2f1] font-sans animate-in fade-in duration-200 pb-20">
      {/* ── Main Section Header ── */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-2">
        <div className="flex flex-col max-w-3xl">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#dfe2f1]">
            Proposal Approval Queue
          </h1>
          <p className="text-xs lg:text-sm text-[#908fa0] mt-1 leading-relaxed">
            Review, edit, authorize, or reject AI-generated campaign content and budget allocation proposals before downstream ad network dispatch.
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-lg bg-[#1c1f2a] hover:bg-[#262a35] text-xs font-semibold text-[#dfe2f1] flex items-center gap-2 border border-[#464554]/40 transition-colors shadow-sm"
          >
            <span>↓</span> Export Queue (CSV)
          </button>
          <button
            type="button"
            onClick={() => notify?.('Pipeline refreshed with latest proposals.')}
            className="h-9 px-3.5 rounded-lg bg-[#262a35] hover:bg-[#313540] text-xs font-semibold text-[#8083ff] flex items-center gap-2 border border-[#464554]/40 transition-colors"
          >
            <span>↻</span> Refresh Pipeline
          </button>
        </div>
      </div>

      {/* ── Summary KPI Cards (4 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Pending */}
        <div className="p-4 rounded-xl bg-[#171b26] border border-[#464554]/40 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#908fa0]">PENDING REVIEW</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Action Required
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-[#dfe2f1]">{counts.pending} Proposals</div>
            <div className="text-xs text-[#908fa0] mt-0.5">2 Content · 1 Budget reallocation</div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTab('Pending')}
            className="text-xs text-[#4cd7f6] hover:underline flex items-center gap-1 font-semibold text-left"
          >
            Filter pending →
          </button>
        </div>

        {/* Card 2: Approved */}
        <div className="p-4 rounded-xl bg-[#171b26] border border-[#464554]/40 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#908fa0]">APPROVED</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Ready for Dispatch
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-[#dfe2f1]">{counts.approved} Approved</div>
            <div className="text-xs text-[#908fa0] mt-0.5">100% human signoff verified</div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTab('Approved')}
            className="text-xs text-[#4cd7f6] hover:underline flex items-center gap-1 font-semibold text-left"
          >
            View approved →
          </button>
        </div>

        {/* Card 3: Rejected */}
        <div className="p-4 rounded-xl bg-[#171b26] border border-[#464554]/40 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#908fa0]">REJECTED</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Feedback Logged
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-[#dfe2f1]">{counts.rejected} Rejected</div>
            <div className="text-xs text-[#908fa0] mt-0.5">Returned to pipeline with notes</div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTab('Rejected')}
            className="text-xs text-[#4cd7f6] hover:underline flex items-center gap-1 font-semibold text-left"
          >
            View rejected →
          </button>
        </div>

        {/* Card 4: Recently Signed */}
        <div className="p-4 rounded-xl bg-[#171b26] border border-[#464554]/40 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#908fa0]">RECENTLY SIGNED</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8083ff]/20 text-[#c0c1ff]">
              PRP-8399
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-[#dfe2f1]">Just now</div>
            <div className="text-xs text-[#908fa0] mt-0.5">Avg review SLA: 2.4 hrs</div>
          </div>
          <span className="text-xs text-[#908fa0] flex items-center gap-1 font-semibold">
            Stage Gate Nominal ✓
          </span>
        </div>
      </div>

      {/* ── Search and Filter Controls Bar ── */}
      <div className="p-4 rounded-xl bg-[#171b26] border border-[#464554]/40 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[280px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#908fa0] text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by proposal name, ID (e.g. PRP-8402), or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-[#0a0e18] border border-[#464554]/50 text-xs text-[#dfe2f1] placeholder:text-[#908fa0]/60 focus:outline-none focus:border-[#8083ff] transition-colors"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 px-3 rounded-lg bg-[#0a0e18] border border-[#464554]/50 text-xs text-[#dfe2f1] focus:outline-none focus:border-[#8083ff]"
            >
              <option>All Types</option>
              <option>Content Proposals</option>
              <option>Budget Optimization</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 rounded-lg bg-[#0a0e18] border border-[#464554]/50 text-xs text-[#dfe2f1] focus:outline-none focus:border-[#8083ff]"
            >
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset all filters"
              className="h-10 px-3 rounded-lg bg-[#0a0e18] hover:bg-[#262a35] text-xs font-semibold text-[#908fa0] hover:text-[#dfe2f1] border border-[#464554]/50 transition-colors flex items-center gap-1.5"
            >
              <span>✕</span> Reset
            </button>
          </div>
        </div>

        {/* Status Tab Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#464554]/30">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0a0e18] border border-[#464554]/30">
            {[
              { key: 'All', count: counts.all, color: 'bg-[#8083ff] text-[#0d0096]' },
              { key: 'Pending', count: counts.pending, color: 'bg-amber-500/20 text-amber-300' },
              { key: 'Approved', count: counts.approved, color: 'bg-emerald-500/20 text-emerald-300' },
              { key: 'Rejected', count: counts.rejected, color: 'bg-rose-500/20 text-rose-300' },
            ].map((tab) => (
              <button
                type="button"
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  selectedTab === tab.key
                    ? 'bg-[#8083ff] text-[#0d0096] shadow-sm'
                    : 'text-[#c7c4d7] hover:bg-[#262a35] hover:text-[#dfe2f1]'
                }`}
              >
                <span>{tab.key}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab.color}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="text-xs text-[#908fa0]">
            Showing <strong className="text-[#dfe2f1]">{filteredProposals.length}</strong> of {proposals.length} records
          </div>
        </div>
      </div>

      {/* ── Proposals Table Card ── */}
      <div className="w-full rounded-xl bg-[#171b26] border border-[#464554]/40 overflow-hidden shadow-sm">
        {filteredProposals.length === 0 ? (
          /* Empty State (Matching leader_approval_queue_empty_state) */
          <div className="p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#262a35] border border-[#464554]/50 flex items-center justify-center text-3xl mb-4">
              ✨
            </div>
            <h3 className="text-lg font-bold text-[#dfe2f1]">Queue is Empty</h3>
            <p className="text-xs text-[#908fa0] mt-1 max-w-sm leading-relaxed">
              No proposals match your current filter settings. Reset filters or wait for new campaign submissions from the squad pipeline.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-lg bg-[#8083ff] text-xs font-bold text-[#0d0096] shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1c1f2a] border-b border-[#464554]/40 text-[#908fa0] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Proposal Name &amp; ID</th>
                  <th className="py-3 px-3">Type &amp; Channel</th>
                  <th className="py-3 px-3">Author / Squad</th>
                  <th className="py-3 px-3">Campaign</th>
                  <th className="py-3 px-3">Budget Impact</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#464554]/20">
                {filteredProposals.map((item) => (
                  <tr key={item.id} className="hover:bg-[#262a35]/40 transition-colors">
                    {/* Proposal Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-[#dfe2f1] hover:text-[#8083ff] cursor-pointer" onClick={() => {
                          if (item.type === 'Budget Optimization') onSelectBudgetReview?.(item)
                          else onSelectContentReview?.(item)
                        }}>
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-[#8083ff] font-bold">{item.id}</span>
                          <span className="text-[#464554]">•</span>
                          <span className="text-[10px] text-[#908fa0]">{item.date}</span>
                        </div>
                      </div>
                    </td>

                    {/* Type & Channel */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[#dfe2f1] flex items-center gap-1.5">
                          <span>{item.channelIcon}</span>
                          <span>{item.channel}</span>
                        </span>
                        <span className="text-[10px] text-[#908fa0]">{item.type}</span>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#8083ff]/30 text-[#c0c1ff] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {item.authorInitials}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium text-[#dfe2f1]">{item.author}</span>
                          <span className="text-[10px] text-[#908fa0] truncate">{item.authorRole}</span>
                        </div>
                      </div>
                    </td>

                    {/* Campaign */}
                    <td className="py-3.5 px-3">
                      <span className="text-[#c7c4d7] font-medium">{item.campaign}</span>
                    </td>

                    {/* Budget Impact */}
                    <td className="py-3.5 px-3 font-mono">
                      <span className={`text-[11px] font-semibold ${item.isThresholdExceeded ? 'text-rose-400 font-bold' : 'text-[#c7c4d7]'}`}>
                        {item.budgetImpact}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.priority === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.priority === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-[#262a35] text-[#908fa0]'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          item.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : item.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {item.status === 'Pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Primary Review Action */}
                        <button
                          type="button"
                          onClick={() => {
                            if (item.type === 'Budget Optimization' || item.type === 'Budget') {
                              if (onSelectBudgetReview) onSelectBudgetReview(item)
                              else setPage?.('budget-review-detail')
                            } else {
                              if (onSelectContentReview) onSelectContentReview(item)
                              else setPage?.('content-review-detail')
                            }
                          }}
                          className="px-2.5 py-1 rounded-md bg-[#262a35] hover:bg-[#313540] text-xs font-bold text-[#8083ff] transition-colors border border-[#464554]/40"
                        >
                          Review →
                        </button>

                        {/* Quick Approve / Reject for Pending items */}
                        {item.status === 'Pending' && (
                          <>
                            {item.isThresholdExceeded ? (
                              <button
                                type="button"
                                onClick={() => handleQuickEscalate(item)}
                                title="Threshold Exceeded: Escalate to Marketing Manager"
                                className="px-2 py-1 rounded-md bg-[#8083ff]/15 hover:bg-[#8083ff]/25 text-[11px] font-bold text-[#c0c1ff] border border-[#8083ff]/30"
                              >
                                ⇪ Escalate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickApprove(item)}
                                title="Quick Approve"
                                className="w-7 h-7 rounded-md bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30"
                              >
                                ✓
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleQuickReject(item)}
                              title="Quick Reject"
                              className="w-7 h-7 rounded-md bg-rose-950 hover:bg-rose-900 text-rose-400 font-bold flex items-center justify-center border border-rose-500/30"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RejectProposalModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        proposal={activeProposalForModal}
        onConfirm={({ reason }) => {
          if (activeProposalForModal) {
            setProposals((prev) =>
              prev.map((p) => (p.id === activeProposalForModal.id ? { ...p, status: 'Rejected' } : p))
            )
            notify?.(`Proposal ${activeProposalForModal.id} marked as Rejected: ${reason}`)
          }
        }}
      />

      <EscalateToManagerModal
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        proposal={activeProposalForModal}
        onConfirm={({ justification, urgency }) => {
          if (activeProposalForModal) {
            notify?.(`Proposal ${activeProposalForModal.id} escalated to Manager (${urgency}): ${justification}`)
          }
        }}
      />

      <ApprovalSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        proposal={activeProposalForModal}
      />
    </div>
  )
}

LeaderApprovalQueue.propTypes = {
  onSelectContentReview: PropTypes.func,
  onSelectBudgetReview: PropTypes.func,
  notify: PropTypes.func,
}
