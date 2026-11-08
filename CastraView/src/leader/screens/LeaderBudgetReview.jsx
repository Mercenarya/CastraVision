import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  RejectProposalModal,
  EscalateToManagerModal,
  ApprovalSuccessModal,
  VersionHistoryDrawer,
} from '../components/LeaderModals'

/**
 * LeaderBudgetReview
 * Implements Stitch designs:
 * - leader_budget_proposal_review_pending
 * - leader_budget_proposal_review_editing
 * - leader_budget_proposal_review_exceeded_threshold_20_escalation
 * - leader_budget_proposal_review_allocation_validation_error
 */
export default function LeaderBudgetReview({ proposal: initialProposal, onBack, onComplete, setPage, notify }) {
  const handleBack = () => {
    if (onBack) onBack()
    else setPage?.('approvals')
  }

  const handleComplete = () => {
    if (onComplete) onComplete()
    else setPage?.('approvals')
  }
  const [proposal] = useState(
    initialProposal || {
      id: 'PRP-8403',
      title: 'Dynamic Budget Reallocation — Q4 ROAS Optimization',
      campaign: 'Q3 Activewear Omnichannel Campaign',
      author: 'Autonomous Engine Agent (Squad Pipeline)',
      date: 'Oct 24, 2026 · 13:15 UTC',
      totalBudget: 45000,
      targetRoas: '3.80x (Floor 3.20x)',
      period: 'Nov 1 – Nov 30, 2026',
    }
  )

  // Current allocations
  const [allocations, setAllocations] = useState([
    {
      id: 'google',
      name: 'Google Search & Performance Max',
      currentSpend: 18000,
      proposedSpend: 25000,
      share: 55.5,
      netChange: 7000,
      variancePct: 25.0, // > 20% triggers escalation rule!
      color: '#4cd7f6',
    },
    {
      id: 'meta',
      name: 'Meta Ads (Facebook & Instagram Feed)',
      currentSpend: 18000,
      proposedSpend: 15000,
      share: 33.3,
      netChange: -3000,
      variancePct: -16.7,
      color: '#8083ff',
    },
    {
      id: 'tiktok',
      name: 'TikTok Video UGC Ads',
      currentSpend: 9000,
      proposedSpend: 5000,
      share: 11.2,
      netChange: -4000,
      variancePct: -44.4,
      color: '#d0bcff',
    },
  ])

  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState({
    google: 25000,
    meta: 15000,
    tiktok: 5000,
  })
  const [validationError, setValidationError] = useState('')

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)

  // Check if any channel exceeds ±20% variance threshold
  const maxVariance = Math.max(...allocations.map((a) => Math.abs(a.variancePct)))
  const exceedsThreshold = maxVariance > 20.0

  const handleSaveAllocations = () => {
    const sum = editValues.google + editValues.meta + editValues.tiktok
    if (sum !== proposal.totalBudget) {
      setValidationError(
        `Total allocation sum ($${sum.toLocaleString()}) must match the fixed campaign budget ($${proposal.totalBudget.toLocaleString()}). Delta: $${(sum - proposal.totalBudget).toLocaleString()}`
      )
      return
    }

    setValidationError('')
    setAllocations((prev) =>
      prev.map((item) => {
        const newSpend = editValues[item.id]
        const net = newSpend - item.currentSpend
        const varPct = Number(((net / item.currentSpend) * 100).toFixed(1))
        const share = Number(((newSpend / proposal.totalBudget) * 100).toFixed(1))
        return {
          ...item,
          proposedSpend: newSpend,
          netChange: net,
          variancePct: varPct,
          share,
        }
      })
    )
    setIsEditing(false)
    notify?.('Budget allocation adjustments saved.')
  }

  const formatMoney = (val) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="w-full flex flex-col gap-6 p-6 max-w-[1440px] mx-auto text-[#dfe2f1] font-sans animate-in fade-in duration-200 pb-20">
      {/* ── Top Navigation & Metadata Anchor ── */}
      <div className="flex flex-col gap-3 pb-3 border-b border-[#464554]/30">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-[#c7c4d7] hover:text-[#8083ff] transition-colors font-semibold"
            >
              ← Back to Approval Queue
            </button>
            <span className="text-[#464554]">•</span>
            <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#8083ff] font-mono font-bold">
              {proposal.id}
            </span>
            <span className="text-[#464554]">•</span>
            <span className="text-[#908fa0]">Submitted by {proposal.author}</span>
            <span className="text-[#464554]">•</span>
            <span className="text-[#908fa0]">{proposal.date}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              PENDING REVIEW
            </span>
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(true)}
              className="px-2.5 py-1 rounded bg-[#1c1f2a] hover:bg-[#262a35] text-[#c7c4d7] text-xs font-semibold border border-[#464554]/40"
            >
              Audit Trail
            </button>
          </div>
        </div>

        {/* Title & Primary Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-[#03b5d3]/20 text-[#4cd7f6] font-bold text-[10px] uppercase tracking-wider">
                BUDGET ALLOCATION PROPOSAL
              </span>
              <span className="text-[#908fa0] text-[11px]">Version 1.0 (Autonomous Pipeline)</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-[#dfe2f1]">
              Proposal Review — Dynamic Budget Reallocation
            </h1>
          </div>

          {/* Action Bar with Threshold Warning */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {exceedsThreshold && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#3F1219] border border-rose-500/50 text-rose-300 font-semibold text-xs shadow-sm">
                <span>⚠️</span>
                <span>Budget variance exceeds 20% threshold; requires Marketing Manager escalation</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-3.5 py-2 rounded-lg bg-[#262a35] hover:bg-[#313540] text-xs font-semibold text-[#dfe2f1] border border-[#464554]/40 transition-colors"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Allocation'}
              </button>

              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-3.5 py-2 rounded-lg bg-[#3F1219] hover:bg-[#5C1B25] text-rose-300 text-xs font-semibold border border-rose-500/40 transition-colors"
              >
                Reject with Reason
              </button>

              {/* Direct Approve: Locked if exceeds 20% */}
              <button
                type="button"
                disabled={exceedsThreshold}
                onClick={() => setShowSuccessModal(true)}
                title={exceedsThreshold ? 'Approval locked: Exceeds Leader threshold (±20%)' : 'Approve allocation'}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  exceedsThreshold
                    ? 'bg-[#262a35] text-[#908fa0] opacity-40 cursor-not-allowed border border-[#464554]/30'
                    : 'bg-[#8083ff] hover:bg-[#999cff] text-[#0d0096] shadow-lg shadow-[#8083ff]/20'
                }`}
              >
                {exceedsThreshold ? '🔒 Approve Locked' : '✓ Approve & Proceed'}
              </button>

              {/* Escalate button: Highlighted when threshold exceeded */}
              <button
                type="button"
                onClick={() => setShowEscalateModal(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  exceedsThreshold
                    ? 'bg-[#8083ff] hover:bg-[#999cff] text-[#0d0096] shadow-lg shadow-[#8083ff]/30 ring-2 ring-[#8083ff]/40'
                    : 'bg-[#262a35] hover:bg-[#313540] text-[#c0c1ff] border border-[#8083ff]/40'
                }`}
              >
                <span>⇪</span> Escalate to Manager
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FR04 Human-in-the-Loop Governance Notice ── */}
      <div className="p-4 rounded-xl bg-[#171b26] border border-[#8083ff]/30 flex items-start gap-3.5 shadow-sm">
        <div className="w-9 h-9 rounded-lg bg-[#262a35] flex items-center justify-center text-[#8083ff] font-bold text-base shrink-0 border border-[#8083ff]/20">
          ⚖
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#c0c1ff]">
              FR04 Human-in-the-Loop Governance Notice
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#262a35] text-[#908fa0] uppercase font-mono">
              Mandatory Signoff Protocol
            </span>
          </div>
          <p className="text-xs text-[#c7c4d7] leading-relaxed">
            Automated advertising spend reallocations are held in pre-flight staging. This budget allocation proposal requires explicit human leader/manager signoff on capital shift parameters, channel distribution proportions, and monthly budget pacing limits before downstream network dispatch.
          </p>
        </div>
      </div>

      {/* ── Main Two-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Section 1: Budget Context */}
          <section className="rounded-xl bg-[#171b26] border border-[#464554]/40 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-[#1c1f2a] border-b border-[#464554]/40 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#dfe2f1] flex items-center gap-2">
                <span className="text-[#4cd7f6]">1.</span> Budget Context &amp; Campaign Objectives
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#0a0e18] text-[#908fa0] font-mono text-[10px] uppercase">
                SOURCE: Q4-ROAS-OPT-771
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-[#0a0e18] border border-[#464554]/20">
                <span className="text-[#908fa0] text-[10px] uppercase font-mono">Target Campaign</span>
                <span className="font-semibold text-[#dfe2f1] truncate">{proposal.campaign}</span>
                <span className="text-[11px] text-[#908fa0]">Omnichannel Retail</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-[#0a0e18] border border-[#464554]/20">
                <span className="text-[#908fa0] text-[10px] uppercase font-mono">Primary Objective</span>
                <span className="font-semibold text-[#4cd7f6]">CPA Reduction &amp; ROAS</span>
                <span className="text-[11px] text-[#908fa0]">Target ROAS: {proposal.targetRoas}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-[#0a0e18] border border-[#464554]/20">
                <span className="text-[#908fa0] text-[10px] uppercase font-mono">Monthly Spend Envelope</span>
                <span className="font-bold text-sm text-[#8083ff]">{formatMoney(proposal.totalBudget)}</span>
                <span className="text-[11px] text-emerald-400">Fixed Envelope (Zero Tolerance)</span>
              </div>
            </div>
          </section>

          {/* Section 2: Proposed Channel Allocations Table */}
          <section className="rounded-xl bg-[#171b26] border border-[#464554]/40 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-[#1c1f2a] border-b border-[#464554]/40 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#dfe2f1] flex items-center gap-2">
                <span className="text-[#4cd7f6]">2.</span> Proposed Channel Allocations &amp; Reallocation Breakdown
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                DELTA AUDITED
              </span>
            </div>

            {/* Threshold Banner in Table */}
            {exceedsThreshold && (
              <div className="px-5 py-2.5 bg-[#3F1219]/60 border-b border-rose-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <span>🚨</span>
                  <span>AUTHORIZATION LIMIT EXCEEDED (&gt;20%) — ESCALATION MANDATORY</span>
                </div>
                <span className="font-mono text-[11px] text-rose-300 font-semibold px-2 py-0.5 rounded bg-[#3F1219] border border-rose-500/40">
                  PROPOSED VARIANCE: +{maxVariance.toFixed(1)}% (LEADER THRESHOLD: 20.0%)
                </span>
              </div>
            )}

            {validationError && (
              <div className="p-3 bg-rose-950/80 border-b border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Allocation Table */}
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#464554]/40 text-[#908fa0] uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 pl-3">Channel / Network</th>
                    <th className="py-2.5 px-3 text-right">Current Spend</th>
                    <th className="py-2.5 px-3 text-right">Proposed Allocation</th>
                    <th className="py-2.5 px-2 text-right">Share (%)</th>
                    <th className="py-2.5 px-3 text-right">Net Change</th>
                    <th className="py-2.5 pl-4 pr-3 w-36 text-left">Allocation Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#464554]/20">
                  {allocations.map((row) => (
                    <tr key={row.id} className="hover:bg-[#262a35]/30 transition-colors">
                      <td className="py-3 pl-3 font-semibold text-[#dfe2f1] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                        <span>{row.name}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-[#908fa0] font-mono">
                        {formatMoney(row.currentSpend)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#dfe2f1]">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={editValues[row.id]}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                [row.id]: Number(e.target.value),
                              })
                            }
                            className="w-28 px-2 py-1 rounded bg-[#0a0e18] border border-[#8083ff] text-right font-mono text-xs text-[#dfe2f1]"
                          />
                        ) : (
                          formatMoney(row.proposedSpend)
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-[#8083ff]">
                        {row.share}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <span className={`font-semibold ${row.netChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {row.netChange > 0 ? `+${formatMoney(row.netChange)}` : formatMoney(row.netChange)}
                        </span>
                        <div className="text-[10px] text-[#908fa0]">
                          ({row.variancePct > 0 ? `+${row.variancePct}%` : `${row.variancePct}%`})
                        </div>
                      </td>
                      <td className="py-3 pl-4 pr-3">
                        <div className="w-full h-2 rounded-full bg-[#0a0e18] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${row.share}%`,
                              backgroundColor: row.color,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Edit Controls */}
              {isEditing && (
                <div className="mt-4 pt-3 border-t border-[#464554]/40 flex items-center justify-between">
                  <span className="text-xs text-[#908fa0]">
                    Total Budget: <strong className="text-[#dfe2f1]">${(editValues.google + editValues.meta + editValues.tiktok).toLocaleString()}</strong> / $45,000
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#262a35] text-xs font-semibold text-[#dfe2f1]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAllocations}
                      className="px-4 py-1.5 rounded-lg bg-[#8083ff] text-xs font-bold text-[#0d0096]"
                    >
                      Save Recalculated Values
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right 4 Cols: Threshold Authority & Decision Summary */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-xl bg-[#171b26] border border-[#464554]/40 p-4 flex flex-col gap-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#908fa0]">
              Governance Authority Matrix
            </span>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-[#0a0e18]">
                <span className="text-[#c7c4d7]">Leader Reallocation Limit</span>
                <span className="font-mono font-bold text-[#4cd7f6]">±20.0% Max</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0a0e18]">
                <span className="text-[#c7c4d7]">Requested Max Variance</span>
                <span className={`font-mono font-bold ${exceedsThreshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                  +{maxVariance.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0a0e18]">
                <span className="text-[#c7c4d7]">Required Signoff Level</span>
                <span className="font-mono font-bold text-amber-300">
                  {exceedsThreshold ? 'Tier 2: Manager Signoff' : 'Leader Tier Signoff'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="rounded-xl bg-[#171b26] border border-[#8083ff]/40 p-5 flex flex-col gap-3 shadow-lg shadow-[#8083ff]/5 sticky top-20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#dfe2f1]">
              Leader Authorization Decision
            </h4>
            <p className="text-[11px] text-[#908fa0] leading-snug">
              {exceedsThreshold
                ? 'Because Google allocation exceeds the 20% limit, this proposal must be escalated to the Marketing Manager.'
                : 'All channel adjustments are within your 20% threshold. You may approve directly.'}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEscalateModal(true)}
                className="w-full py-2.5 rounded-lg bg-[#8083ff] hover:bg-[#999cff] text-xs font-bold text-[#0d0096] flex items-center justify-center gap-1.5 shadow-lg shadow-[#8083ff]/20"
              >
                <span>⇪</span> Escalate to Marketing Manager
              </button>

              <button
                type="button"
                disabled={exceedsThreshold}
                onClick={() => setShowSuccessModal(true)}
                className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
                  exceedsThreshold
                    ? 'border-[#464554]/30 bg-[#262a35] text-[#908fa0] opacity-40 cursor-not-allowed'
                    : 'border-[#464554]/40 bg-[#262a35] hover:bg-[#313540] text-[#dfe2f1]'
                }`}
              >
                <span>✓</span> Direct Leader Approval
              </button>

              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="w-full py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-500/30"
              >
                <span>✕</span> Reject Allocation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RejectProposalModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        proposal={proposal}
        onConfirm={({ reason }) => {
          notify?.(`Budget proposal ${proposal.id} rejected: ${reason}`)
          handleComplete()
        }}
      />

      <EscalateToManagerModal
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        proposal={proposal}
        onConfirm={({ justification: _justification, urgency }) => {
          notify?.(`Budget proposal ${proposal.id} escalated to Marketing Manager (${urgency})`)
          handleComplete()
        }}
      />

      <ApprovalSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          handleComplete()
        }}
        proposal={proposal}
      />

      <VersionHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        proposal={proposal}
      />
    </div>
  )
}

LeaderBudgetReview.propTypes = {
  proposal: PropTypes.object,
  onBack: PropTypes.func,
  onComplete: PropTypes.func,
  notify: PropTypes.func,
}
