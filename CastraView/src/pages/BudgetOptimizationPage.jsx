import { useState, useId } from 'react'
import PropTypes from 'prop-types'
import {
  ArrowRight,
  Check,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'

const STORAGE_KEY_PREFIX = 'castravision_manager_budget_draft_v1'

function getBudgetDraftStorageKey(userId, workspaceId) {
  if (
    !userId ||
    !workspaceId ||
    typeof userId !== 'string' ||
    typeof workspaceId !== 'string'
  ) {
    return null
  }
  const cleanUser = userId.trim()
  const cleanWorkspace = workspaceId.trim()
  if (!cleanUser || !cleanWorkspace) return null
  return `${STORAGE_KEY_PREFIX}:${cleanUser}:${cleanWorkspace}`
}

const BASELINE_CHANNELS = [
  {
    id: 'meta',
    name: 'Meta Ads (Instagram & Facebook)',
    category: 'Advantage+ & Retargeting',
    currentSpend: 45000,
    currentShare: 36,
    recommendedSpend: 55000,
    recommendedShare: 44,
    delta: 10000,
    deltaPercent: 22.2,
    currentRoas: 3.85,
    projectedRoas: 4.80,
    action: 'Scale Budget',
    actionTone: 'bg-[#03b5d3]/15 text-[#4cd7f6] border-[#03b5d3]/30',
  },
  {
    id: 'google',
    name: 'Google Search Ads',
    category: 'High-Intent Search & PMax',
    currentSpend: 40000,
    currentShare: 32,
    recommendedSpend: 47500,
    recommendedShare: 38,
    delta: 7500,
    deltaPercent: 18.8,
    currentRoas: 4.10,
    projectedRoas: 4.95,
    action: 'Scale Headroom',
    actionTone: 'bg-[#8083ff]/15 text-[#8083ff] border-[#8083ff]/30',
  },
  {
    id: 'tiktok',
    name: 'TikTok Video Ads',
    category: 'Top-Funnel & Spark Ads',
    currentSpend: 30000,
    currentShare: 24,
    recommendedSpend: 12500,
    recommendedShare: 10,
    delta: -17500,
    deltaPercent: -58.3,
    currentRoas: 2.15,
    projectedRoas: 3.10,
    action: 'Reduce Exposure',
    actionTone: 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30',
  },
  {
    id: 'email',
    name: 'Email & Retention Marketing',
    category: 'Klaviyo Lifecycle Automations',
    currentSpend: 10000,
    currentShare: 8,
    recommendedSpend: 10000,
    recommendedShare: 8,
    delta: 0,
    deltaPercent: 0.0,
    currentRoas: 5.20,
    projectedRoas: 5.20,
    action: 'Maintain Ceiling',
    actionTone: 'bg-[#262a35] text-[#c7c4d7] border-[#464554]',
  },
]

function loadStoredDraft(storageKey, expectedUserId, expectedWorkspaceId) {
  if (
    typeof window === 'undefined' ||
    !window.localStorage ||
    !storageKey ||
    !expectedUserId ||
    !expectedWorkspaceId
  ) {
    return null
  }
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    // 1. Strict user isolation check
    if (parsed.userId !== expectedUserId) {
      console.warn('Budget draft rejected: user mismatch.')
      return null
    }

    // 2. Strict workspace isolation check
    const storedWorkspace = parsed.workspaceId || parsed.companyId
    if (storedWorkspace !== expectedWorkspaceId) {
      console.warn('Budget draft rejected: workspace mismatch.')
      return null
    }

    // 3. Schema and channel data validation
    if (!Array.isArray(parsed.channels) || parsed.channels.length === 0 || !parsed.savedAt) {
      console.warn('Budget draft rejected: invalid payload schema.')
      return null
    }

    const isValid = BASELINE_CHANNELS.every((base) =>
      parsed.channels.some(
        (c) =>
          c &&
          c.id === base.id &&
          typeof c.recommendedSpend === 'number' &&
          !isNaN(c.recommendedSpend) &&
          c.recommendedSpend >= 0
      )
    )

    if (isValid) {
      return {
        channels: parsed.channels,
        timeframe: typeof parsed.timeframe === 'string' ? parsed.timeframe : '30 Days',
        savedAt: parsed.savedAt,
      }
    }
  } catch (err) {
    console.warn('Failed to parse budget draft from localStorage:', err)
  }
  return null
}

export default function BudgetOptimizationPage({
  user,
  profile: _profile,
  membership,
  notify,
  setPage,
}) {
  const userId = typeof user?.id === 'string' && user.id.trim() ? user.id.trim() : null
  const workspaceId =
    typeof membership?.workspaceId === 'string' && membership.workspaceId.trim()
      ? membership.workspaceId.trim()
      : null

  const storageKey = getBudgetDraftStorageKey(userId, workspaceId)

  // Synchronous initialization if identity is already available on mount
  const [initialDraft] = useState(() =>
    storageKey ? loadStoredDraft(storageKey, userId, workspaceId) : null
  )
  const [channels, setChannels] = useState(() => initialDraft?.channels || BASELINE_CHANNELS)
  const [timeframe, setTimeframe] = useState(() => initialDraft?.timeframe || '30 Days')
  const [draftSavedAt, setDraftSavedAt] = useState(() => initialDraft?.savedAt || null)
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const budgetInputPrefix = useId()

  // Safely synchronize draft when identity resolves or switches
  if (prevStorageKey !== storageKey) {
    setPrevStorageKey(storageKey)
    const draft =
      storageKey && userId && workspaceId
        ? loadStoredDraft(storageKey, userId, workspaceId)
        : null
    setChannels(draft?.channels || BASELINE_CHANNELS)
    setTimeframe(draft?.timeframe || '30 Days')
    setDraftSavedAt(draft?.savedAt || null)
  }

  const handleSpendChange = (id, newSpend) => {
    const spendNum = Math.max(0, parseInt(newSpend, 10) || 0)
    setChannels((prev) => {
      const updated = prev.map((ch) => {
        if (ch.id !== id) return ch
        const delta = spendNum - ch.currentSpend
        const deltaPercent =
          ch.currentSpend > 0 ? +((delta / ch.currentSpend) * 100).toFixed(1) : 0
        return {
          ...ch,
          recommendedSpend: spendNum,
          delta,
          deltaPercent,
        }
      })
      const total = updated.reduce((sum, ch) => sum + ch.recommendedSpend, 0)
      return updated.map((ch) => ({
        ...ch,
        recommendedShare: total > 0 ? Math.round((ch.recommendedSpend / total) * 100) : 0,
      }))
    })
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      notify?.('Budget optimization analysis refreshed.')
    }, 600)
  }

  const handleSaveDraft = () => {
    if (!storageKey || !userId || !workspaceId) {
      notify?.('Cannot save draft: workspace identity is not available.', 'error')
      return
    }

    const timestamp = new Date().toISOString()
    const payload = {
      userId,
      workspaceId,
      channels,
      timeframe,
      savedAt: timestamp,
      version: 1,
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
      setDraftSavedAt(timestamp)
      const formattedTime = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      notify?.(`Draft allocation saved locally at ${formattedTime} (Browser Storage).`)
    } catch (err) {
      console.error('Failed to save draft to localStorage:', err)
      notify?.('Failed to save draft allocation to browser storage.', 'error')
    }
  }

  const handleReset = () => {
    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey)
      } catch (err) {
        console.warn('Failed to clear draft from localStorage:', err)
      }
    }
    setChannels(BASELINE_CHANNELS)
    setTimeframe('30 Days')
    setDraftSavedAt(null)
    notify?.('Budget allocation reset to baseline. Local draft cleared.')
  }

  // Dynamic portfolio totals
  const totalCurrentSpend = channels.reduce((sum, c) => sum + c.currentSpend, 0)
  const totalProposedSpend = channels.reduce((sum, c) => sum + c.recommendedSpend, 0)
  const totalNetDelta = totalProposedSpend - totalCurrentSpend

  const metaShare = channels.find((c) => c.id === 'meta')?.recommendedShare || 0
  const googleShare = channels.find((c) => c.id === 'google')?.recommendedShare || 0
  const tiktokShare = channels.find((c) => c.id === 'tiktok')?.recommendedShare || 0
  const emailShare = channels.find((c) => c.id === 'email')?.recommendedShare || 0

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1c1f2a] border border-[#464554] text-[#4cd7f6] text-[11px] font-semibold tracking-wider uppercase font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse" />
              Algorithm Confidence: 94.2%
            </span>
            {draftSavedAt ? (
              <span className="text-[12px] text-[#4cd7f6] flex items-center gap-1 font-mono">
                <Check className="w-3.5 h-3.5" />
                Local Draft Active ({new Date(draftSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            ) : (
              <span className="text-[12px] text-[#c7c4d7] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#8083ff]" />
                Automated Rebalance Ready
              </span>
            )}
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#dfe2f1] tracking-tight">
            Performance-Based Budget Allocation
          </h1>
          <p className="text-sm text-[#c7c4d7] max-w-3xl">
            Optimize marketing channel distribution based on verified conversion return elasticity and marginal ROAS.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="h-9 px-3 bg-[#1c1f2a] border border-[#464554] text-[#dfe2f1] hover:bg-[#262a35] rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#8083ff] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Analysis</span>
          </button>
          <button
            type="button"
            onClick={() => setPage?.('budget-review')}
            className="h-9 px-3.5 bg-[#8083ff] hover:bg-[#6f72f0] text-[#0a0e18] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Review Recommendation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI DIRECTIVES BANNER */}
      <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-[#8083ff]/15 text-[#8083ff] mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-[#8083ff] uppercase tracking-wider">
              Budget Optimization Recommendation
            </span>
            <p className="text-xs text-[#c7c4d7] mt-0.5">
              Reallocate underperforming TikTok budget to Meta Ads and Google Search to maximize portfolio ROAS.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPage?.('budget-review')}
          className="text-xs font-medium text-[#4cd7f6] hover:text-[#78e3fa] flex items-center gap-1 shrink-0 font-mono cursor-pointer"
        >
          <span>View Detailed Model Rationale</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 TOP KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Total Budget */}
        <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#908fa0] font-semibold">
              Total Marketing Budget
            </span>
            <div className="w-7 h-7 rounded bg-[#262a35] border border-[#464554] flex items-center justify-center text-[#4cd7f6]">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-mono font-bold text-[#dfe2f1]">
                ${totalProposedSpend.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-[#4cd7f6]">+8.5% scale</span>
            </div>
            <p className="text-xs text-[#c7c4d7] mt-1 font-mono">Baseline: ${totalCurrentSpend.toLocaleString()} trailing period</p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#464554]/60 flex items-center justify-between text-[11px]">
            <span className="text-[#908fa0]">Rebalance Envelope</span>
            <span className="font-mono text-[#dfe2f1] font-semibold">
              {totalNetDelta === 0 ? 'Zero-Sum (100% Balanced)' : `${totalNetDelta > 0 ? '+' : ''}$${totalNetDelta.toLocaleString()} Net`}
            </span>
          </div>
        </div>

        {/* KPI 2: Current ROAS */}
        <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#908fa0] font-semibold">
              Current ROAS
            </span>
            <div className="w-7 h-7 rounded bg-[#262a35] border border-[#464554] flex items-center justify-center text-[#8083ff]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-mono font-bold text-[#dfe2f1]">3.42x</span>
              <span className="text-xs font-mono text-[#8083ff]">+0.28x vs prev</span>
            </div>
            <p className="text-xs text-[#c7c4d7] mt-1 font-mono">Trailing 30-day verified ad returns</p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#464554]/60 flex items-center justify-between text-[11px]">
            <span className="text-[#908fa0]">Current Return Margin</span>
            <span className="font-mono text-[#dfe2f1] font-semibold">$427,500 Gross Rev</span>
          </div>
        </div>

        {/* KPI 3: Projected ROAS */}
        <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#908fa0] font-semibold">
              Projected ROAS
            </span>
            <div className="w-7 h-7 rounded bg-[#262a35] border border-[#464554] flex items-center justify-center text-[#4cd7f6]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-mono font-bold text-[#4cd7f6]">4.65x</span>
              <span className="text-xs font-mono text-[#4cd7f6] font-bold">+1.23x Projected</span>
            </div>
            <p className="text-xs text-[#c7c4d7] mt-1 font-mono">Estimated 30-day optimized return</p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#464554]/60 flex items-center justify-between text-[11px]">
            <span className="text-[#908fa0]">Projected Net Uplift</span>
            <span className="font-mono text-[#4cd7f6] font-semibold">+$153,750 Value</span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: 8-COL CHANNEL REBALANCE & 4-COL AI DIRECTIVES */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Channel Budget Distribution & Recommendation */}
        <div className="xl:col-span-8 bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between space-y-5 shadow-sm">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#464554]/60">
              <div>
                <h2 className="text-base font-bold text-[#dfe2f1]">
                  Channel Budget Distribution &amp; Recommendation
                </h2>
                <p className="text-xs text-[#c7c4d7] mt-0.5">
                  Comparison between current active spend and AI-recommended reallocation share.
                </p>
              </div>

              {/* Timeframe Tabs */}
              <div className="flex items-center bg-[#0a0e18] border border-[#464554] rounded-lg p-1 text-xs font-mono">
                {['7 Days', '14 Days', '30 Days', 'This Quarter'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTimeframe(tab)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      timeframe === tab
                        ? 'bg-[#262a35] text-[#4cd7f6] font-semibold'
                        : 'text-[#c7c4d7] hover:text-[#dfe2f1]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Channels Comparative Rows */}
            <div className="mt-4 space-y-4">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#dfe2f1]">{channel.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${channel.actionTone}`}>
                          {channel.action}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#908fa0]">{channel.category}</span>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <div className="flex items-center gap-2 sm:justify-end">
                        <span className="text-[#c7c4d7]">${channel.currentSpend.toLocaleString()} ({channel.currentShare}%)</span>
                        <ArrowRight className="w-3 h-3 text-[#908fa0]" />
                        <span className="text-[#4cd7f6] font-bold">${channel.recommendedSpend.toLocaleString()} ({channel.recommendedShare}%)</span>
                      </div>
                      <span className={`text-[11px] ${channel.delta > 0 ? 'text-[#4cd7f6]' : channel.delta < 0 ? 'text-[#ffb4ab]' : 'text-[#c7c4d7]'}`}>
                        {channel.delta > 0 ? `+$${channel.delta.toLocaleString()} (+${channel.deltaPercent}%)` : channel.delta < 0 ? `-$${Math.abs(channel.delta).toLocaleString()} (${channel.deltaPercent}%)` : '$0 (0.0%)'}
                      </span>
                    </div>
                  </div>

                  {/* Dual Segment Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-[#908fa0]">
                      <span>Current Allocation ({channel.currentShare}%)</span>
                      <span>Target Recommended ({channel.recommendedShare}%)</span>
                    </div>
                    <div className="w-full bg-[#171b26] h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#908fa0] h-full"
                        style={{ width: `${channel.currentShare}%` }}
                        title={`Current: ${channel.currentShare}%`}
                      />
                    </div>
                    <div className="w-full bg-[#171b26] h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#4cd7f6] h-full"
                        style={{ width: `${Math.min(100, channel.recommendedShare)}%` }}
                        title={`Recommended: ${channel.recommendedShare}%`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Allocation Bar & Legend */}
          <div className="pt-3 border-t border-[#464554]/60">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-[#908fa0]">Portfolio Reallocation Summary</span>
              <span className="text-[#dfe2f1] font-semibold">
                Total: ${totalProposedSpend.toLocaleString()} Normalized
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#0a0e18] overflow-hidden flex border border-[#464554]">
              <div className="bg-[#4cd7f6] h-full" style={{ width: `${metaShare}%` }} title={`Meta Ads (${metaShare}%)`} />
              <div className="bg-[#8083ff] h-full" style={{ width: `${googleShare}%` }} title={`Google Search Ads (${googleShare}%)`} />
              <div className="bg-[#a078ff] h-full" style={{ width: `${tiktokShare}%` }} title={`TikTok Video Ads (${tiktokShare}%)`} />
              <div className="bg-[#908fa0] h-full" style={{ width: `${emailShare}%` }} title={`Email Marketing (${emailShare}%)`} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]" />
                <span className="text-[#dfe2f1]">Meta: {metaShare}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8083ff]" />
                <span className="text-[#dfe2f1]">Google: {googleShare}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a078ff]" />
                <span className="text-[#dfe2f1]">TikTok: {tiktokShare}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#908fa0]" />
                <span className="text-[#dfe2f1]">Email: {emailShare}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): AI Reallocation Directives */}
        <div className="xl:col-span-4 bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#464554]/60">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#dfe2f1]">AI Reallocation Directives</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8083ff]/15 border border-[#8083ff]/30 text-[#8083ff] font-bold uppercase">
                MARKETING AI
              </span>
            </div>

            {/* Directive 1 */}
            <div className="p-3 rounded-lg bg-[#0a0e18] border border-[#464554]/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
                <span className="text-xs font-semibold text-[#dfe2f1]">Scale Meta Advantage+</span>
              </div>
              <p className="text-xs text-[#c7c4d7] leading-relaxed">
                Shift capital into Meta Ads. Advantage+ campaigns show highest marginal efficiency with 4.80x projected ROAS.
              </p>
            </div>

            {/* Directive 2 */}
            <div className="p-3 rounded-lg bg-[#0a0e18] border border-[#464554]/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8083ff]" />
                <span className="text-xs font-semibold text-[#dfe2f1]">Capture High-Intent Search</span>
              </div>
              <p className="text-xs text-[#c7c4d7] leading-relaxed">
                Reallocate capital into Google Search to capture high commercial intent non-branded queries. Unfilled impression share exceeds 34%.
              </p>
            </div>

            {/* Directive 3 */}
            <div className="p-3 rounded-lg bg-[#0a0e18] border border-[#464554]/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
                <span className="text-xs font-semibold text-[#dfe2f1]">Mitigate TikTok Saturation</span>
              </div>
              <p className="text-xs text-[#c7c4d7] leading-relaxed">
                De-escalate TikTok spend. Creative fatigue index surpassed 68%, pushing blended CPA to $34.20.
              </p>
            </div>

            {/* Directive 4 */}
            <div className="p-3 rounded-lg bg-[#0a0e18] border border-[#464554]/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#908fa0]" />
                <span className="text-xs font-semibold text-[#dfe2f1]">Protect Lifecycle Automations</span>
              </div>
              <p className="text-xs text-[#c7c4d7] leading-relaxed">
                Maintain Email Marketing spend ceiling at $10,000 as high-yield baseline retention channel (5.20x ROAS).
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#464554]/60 space-y-2">
            <button
              type="button"
              onClick={() => setPage?.('budget-review')}
              className="w-full h-9 bg-[#8083ff] hover:bg-[#6f72f0] text-[#0a0e18] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Review Recommendation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-[#908fa0] text-center block">
              Advances allocation proposal to recommendation review
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: CHANNEL VARIANCE DETAILS TABLE */}
      <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#dfe2f1]">
              Channel Reallocation Details &amp; Variance Matrix
            </h2>
            <p className="text-xs text-[#c7c4d7] mt-0.5">
              Detailed breakdown of channel baseline metrics, optimized projections, and editable proposal figures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded bg-[#0a0e18] border border-[#464554] hover:bg-[#262a35] text-[#dfe2f1] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#908fa0]" />
              <span>Reset Allocation</span>
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3 py-1.5 rounded bg-[#0a0e18] border border-[#464554] hover:border-[#8083ff] text-[#c0c1ff] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>Save Draft Allocation</span>
            </button>
            <button
              type="button"
              onClick={() => setPage?.('budget-review')}
              className="px-3 py-1.5 rounded bg-[#8083ff] hover:bg-[#6f72f0] text-[#0a0e18] text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Review Recommendation</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#464554] bg-[#0a0e18]/50 text-[11px] text-[#c7c4d7] font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Channel &amp; Campaign Type</th>
                <th className="py-3 px-4">Current Budget</th>
                <th className="py-3 px-4">Current ROAS</th>
                <th className="py-3 px-4">Proposed Budget</th>
                <th className="py-3 px-4">Projected ROAS</th>
                <th className="py-3 px-4">Net Variance</th>
                <th className="py-3 px-4 text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#464554]/50 text-xs font-mono">
              {channels.map((row) => (
                <tr key={row.id} className="hover:bg-[#262a35]/40 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-medium text-[#dfe2f1]">
                    <div className="font-semibold">{row.name}</div>
                    <div className="text-[11px] text-[#908fa0] font-sans">{row.category}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[#c7c4d7]">
                    ${row.currentSpend.toLocaleString()} <span className="text-[#908fa0]">({row.currentShare}%)</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#dfe2f1] font-semibold">{row.currentRoas.toFixed(2)}x</td>
                  <td className="py-3.5 px-4 text-[#4cd7f6] font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#908fa0] text-xs">$</span>
                      <label htmlFor={`${budgetInputPrefix}-${row.id}`} className="sr-only">
                        Proposed budget for {row.name}
                      </label>
                      <input
                        id={`${budgetInputPrefix}-${row.id}`}
                        type="number"
                        min="0"
                        step="500"
                        value={row.recommendedSpend}
                        onChange={(e) => handleSpendChange(row.id, e.target.value)}
                        className="w-24 bg-[#0a0e18] border border-[#464554] hover:border-[#8083ff] focus:border-[#4cd7f6] focus:outline-none rounded px-2 py-1 text-xs font-mono font-bold text-[#4cd7f6]"
                      />
                      <span className="text-[#4cd7f6]/70 text-[11px]">({row.recommendedShare}%)</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#4cd7f6] font-bold">{row.projectedRoas.toFixed(2)}x</td>
                  <td className="py-3.5 px-4 font-semibold">
                    <span className={row.delta > 0 ? 'text-[#4cd7f6]' : row.delta < 0 ? 'text-[#ffb4ab]' : 'text-[#c7c4d7]'}>
                      {row.delta > 0 ? `+$${row.delta.toLocaleString()} (+${row.deltaPercent}%)` : row.delta < 0 ? `-$${Math.abs(row.delta).toLocaleString()} (${row.deltaPercent}%)` : '$0 (0.0%)'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${row.actionTone}`}>
                      {row.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#464554] bg-[#0a0e18]/80 text-xs font-mono font-bold text-[#dfe2f1]">
                <td className="py-3.5 px-4 font-sans">Total Portfolio Aggregate</td>
                <td className="py-3.5 px-4 text-[#dfe2f1]">${totalCurrentSpend.toLocaleString()} (100%)</td>
                <td className="py-3.5 px-4 text-[#dfe2f1]">3.42x</td>
                <td className="py-3.5 px-4 text-[#4cd7f6]">${totalProposedSpend.toLocaleString()}</td>
                <td className="py-3.5 px-4 text-[#4cd7f6]">4.65x</td>
                <td className="py-3.5 px-4 text-[#4cd7f6]">
                  {totalNetDelta === 0 ? '$0 Net Rebalance' : `${totalNetDelta > 0 ? '+' : ''}$${totalNetDelta.toLocaleString()} Net`}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="px-2 py-0.5 rounded bg-[#03b5d3]/15 text-[#4cd7f6] border border-[#03b5d3]/30 text-[10px] uppercase font-bold">
                    {totalNetDelta === 0 ? '100% Normalized' : 'Custom Delta'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {draftSavedAt && (
          <div className="mt-2 p-3 rounded-lg bg-[#03b5d3]/10 border border-[#03b5d3]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#4cd7f6] font-mono">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>
                Draft allocation saved locally in Browser Storage at{' '}
                <strong className="text-[#dfe2f1]">
                  {new Date(draftSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                  {new Date(draftSavedAt).toLocaleDateString()}
                </strong>
                . Changes persist across navigation and page refresh.
              </span>
            </span>
            <button
              type="button"
              onClick={() => setPage?.('budget-review')}
              className="text-[#dfe2f1] hover:underline font-bold shrink-0 self-start sm:self-auto cursor-pointer"
            >
              Review Recommendation &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

BudgetOptimizationPage.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
    business_name: PropTypes.string,
    company_id: PropTypes.string,
  }),
  profile: PropTypes.shape({
    id: PropTypes.string,
    business_name: PropTypes.string,
    company_id: PropTypes.string,
  }),
  membership: PropTypes.shape({
    workspaceId: PropTypes.string,
    workspaceName: PropTypes.string,
    role: PropTypes.string,
  }),
  notify: PropTypes.func,
  setPage: PropTypes.func,
}
