import React, { useState } from 'react'
import PropTypes from 'prop-types'

/**
 * LeaderModals
 * Encapsulates the 5 key interactive dialogs defined in Google Stitch:
 * 1. RejectProposalModal (leader_reject_proposal_modal_default & missing_reason_error)
 * 2. RequestRevisionModal (leader_request_revision_modal)
 * 3. EscalateToManagerModal (leader_escalate_proposal_to_manager_modal)
 * 4. ApprovalSuccessModal (leader_proposal_approved_success_modal)
 * 5. VersionHistoryDrawer (leader_version_history_read_only)
 */

export function RejectProposalModal({ isOpen, onClose, proposal, onConfirm }) {
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submittedAttempt, setSubmittedAttempt] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const REASONS = [
    'Violates Brand Guidelines (Tone / Visual)',
    'Budget Allocation Suboptimal / Excessive Shift',
    'Weak Value Proposition / Low-Retention Hook',
    'Target Audience / Channel Placement Mismatch',
    'Exceeds Risk & Performance Floor Threshold',
    'Other Policy / Regulatory Non-Compliance',
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmittedAttempt(true)
    if (!reason) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      onConfirm?.({ proposalId: proposal?.id, reason, feedback })
      onClose()
    }, 600)
  }

  const hasReasonError = submittedAttempt && !reason

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#171b26] border border-[#464554] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#464554]/60 flex items-start justify-between bg-[#1c1f2a]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#dfe2f1]">Reject Proposal</h3>
              <p className="text-xs text-[#908fa0] mt-0.5">
                {proposal?.id ? `ID: ${proposal.id} • ` : ''}Provide structured feedback to the creator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#908fa0] hover:text-[#dfe2f1] hover:bg-[#262a35] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {proposal && (
            <div className="p-3 rounded-lg bg-[#0a0e18] border border-[#464554]/40 flex items-center justify-between text-xs">
              <span className="text-[#908fa0] truncate">Proposal: <strong className="text-[#dfe2f1]">{proposal.title || proposal.name}</strong></span>
              <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#8083ff] font-mono font-bold text-[10px] shrink-0">
                {proposal.type || 'Content'}
              </span>
            </div>
          )}

          {/* Reason Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#dfe2f1] flex items-center justify-between">
              <span>Primary Rejection Reason <span className="text-rose-400">*</span></span>
              {hasReasonError && <span className="text-rose-400 normal-case font-normal text-[11px]">Please select a reason</span>}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full h-10 px-3 rounded-lg bg-[#0a0e18] text-xs text-[#dfe2f1] border transition-colors focus:outline-none ${
                hasReasonError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#464554] focus:border-[#8083ff]'
              }`}
            >
              <option value="">-- Select reason for rejection --</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Detailed Feedback Textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#dfe2f1] flex items-center justify-between">
              <span>Specific Feedback &amp; Correction Notes</span>
              <span className="text-[11px] text-[#908fa0] font-normal">{feedback.length} / 500</span>
            </label>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Explain why this proposal was rejected and provide clear guidance for the next revision..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0a0e18] border border-[#464554] text-xs text-[#dfe2f1] placeholder:text-[#908fa0]/60 focus:outline-none focus:border-[#8083ff] transition-colors resize-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300/90 flex items-start gap-2">
            <span className="text-amber-400 font-bold shrink-0">ℹ</span>
            <span>Rejecting returns this asset back to the squad pipeline. An audit notification will be dispatched to the creator.</span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#464554]/50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#262a35] hover:bg-[#313540] text-xs font-semibold text-[#dfe2f1] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-2 transition-colors shadow-lg shadow-rose-900/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting Rejection...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

RejectProposalModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  proposal: PropTypes.object,
  onConfirm: PropTypes.func,
}

export function RequestRevisionModal({ isOpen, onClose, proposal, onConfirm }) {
  const [notes, setNotes] = useState('')
  const [checklist, setChecklist] = useState({
    hook: false,
    copy: false,
    compliance: false,
    creative: false,
  })

  if (!isOpen) return null

  const toggleCheck = (k) => setChecklist((prev) => ({ ...prev, [k]: !prev[k] }))

  const handleSend = () => {
    onConfirm?.({ proposalId: proposal?.id, notes, checklist })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#171b26] border border-[#464554] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-[#464554]/60 flex items-start justify-between bg-[#1c1f2a]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#dfe2f1]">Request Revisions</h3>
              <p className="text-xs text-[#908fa0] mt-0.5">Send targeted rework instructions to creator</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#908fa0] hover:text-[#dfe2f1] hover:bg-[#262a35]">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#dfe2f1]">Revision Checklist Items</label>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0a0e18] border border-[#464554]/40 cursor-pointer hover:bg-[#262a35]/40">
                <input type="checkbox" checked={checklist.hook} onChange={() => toggleCheck('hook')} className="rounded accent-[#8083ff]" />
                <span className="text-[#dfe2f1]">Optimize Opening Hook (First 0–3 Seconds for Higher Retention)</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0a0e18] border border-[#464554]/40 cursor-pointer hover:bg-[#262a35]/40">
                <input type="checkbox" checked={checklist.copy} onChange={() => toggleCheck('copy')} className="rounded accent-[#8083ff]" />
                <span className="text-[#dfe2f1]">Shorten Primary Body Text &amp; Refine CTA Clarity</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0a0e18] border border-[#464554]/40 cursor-pointer hover:bg-[#262a35]/40">
                <input type="checkbox" checked={checklist.compliance} onChange={() => toggleCheck('compliance')} className="rounded accent-[#8083ff]" />
                <span className="text-[#dfe2f1]">Ensure Pricing Claim &amp; Brand Guideline Compliance</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0a0e18] border border-[#464554]/40 cursor-pointer hover:bg-[#262a35]/40">
                <input type="checkbox" checked={checklist.creative} onChange={() => toggleCheck('creative')} className="rounded accent-[#8083ff]" />
                <span className="text-[#dfe2f1]">Add 2 Alternate Headline Variations for A/B Testing</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#dfe2f1]">Leader Guidance Notes</label>
            <textarea
              rows={3}
              placeholder="Add specific instructions for Alex/Maya regarding what to change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0a0e18] border border-[#464554] text-xs text-[#dfe2f1] focus:outline-none focus:border-[#8083ff] resize-none"
            />
          </div>

          <div className="pt-3 border-t border-[#464554]/50 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-[#262a35] hover:bg-[#313540] text-xs font-semibold text-[#dfe2f1]">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-[#0a0e18] transition-colors shadow-lg shadow-amber-900/20"
            >
              Send Revision Request
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

RequestRevisionModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  proposal: PropTypes.object,
  onConfirm: PropTypes.func,
}

export function EscalateToManagerModal({ isOpen, onClose, proposal, onConfirm }) {
  const [justification, setJustification] = useState('')
  const [urgency, setUrgency] = useState('NORMAL')

  if (!isOpen) return null

  const handleEscalate = () => {
    onConfirm?.({ proposalId: proposal?.id, justification, urgency })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#171b26] border border-[#464554] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-[#464554]/60 flex items-start justify-between bg-[#1c1f2a]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8083ff]/20 border border-[#8083ff]/40 flex items-center justify-center text-[#c0c1ff]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="17 11 12 6 7 11" />
                <polyline points="17 18 12 13 7 18" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#dfe2f1]">Escalate to Marketing Manager</h3>
              <p className="text-xs text-[#908fa0] mt-0.5">Route proposal to Company Admin for final signoff</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#908fa0] hover:text-[#dfe2f1] hover:bg-[#262a35]">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="p-3 rounded-lg bg-[#262a35]/60 border border-[#464554]/40 flex flex-col gap-1 text-xs">
            <span className="text-[#908fa0]">Governance Trigger:</span>
            <span className="font-semibold text-rose-300">
              {proposal?.type === 'Budget'
                ? 'Budget Variance Exceeds ±20% Leader Authority Ceiling (FR04 Rule)'
                : 'Strategic Content Escalation / Multi-Channel Flag'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#dfe2f1]">Urgency Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['NORMAL', 'HIGH', 'CRITICAL'].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setUrgency(lvl)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                    urgency === lvl
                      ? 'bg-[#8083ff] text-[#0d0096] border-[#8083ff]'
                      : 'bg-[#0a0e18] text-[#908fa0] border-[#464554]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#dfe2f1]">Escalation Justification</label>
            <textarea
              rows={3}
              placeholder="Explain why this proposal requires Marketing Manager signoff..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0a0e18] border border-[#464554] text-xs text-[#dfe2f1] focus:outline-none focus:border-[#8083ff] resize-none"
            />
          </div>

          <div className="pt-3 border-t border-[#464554]/50 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-[#262a35] hover:bg-[#313540] text-xs font-semibold text-[#dfe2f1]">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEscalate}
              className="px-5 py-2 rounded-lg bg-[#8083ff] hover:bg-[#999cff] text-xs font-bold text-[#0d0096] transition-colors shadow-lg shadow-[#8083ff]/30"
            >
              Confirm Escalation →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

EscalateToManagerModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  proposal: PropTypes.object,
  onConfirm: PropTypes.func,
}

export function ApprovalSuccessModal({ isOpen, onClose, proposal }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#171b26] border border-[#464554] rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#dfe2f1]">Proposal Approved &amp; Signed!</h3>
        <p className="text-xs text-[#908fa0] mt-1.5 leading-relaxed">
          {proposal?.id ? `ID: ${proposal.id} • ` : ''}Human-in-the-loop stage gate completed successfully. Assets are queued for ad network dispatch.
        </p>
        <div className="mt-6 w-full flex flex-col gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-[#8083ff] hover:bg-[#999cff] text-xs font-bold text-[#0d0096] transition-colors shadow-lg shadow-[#8083ff]/30"
          >
            Return to Approval Queue
          </button>
        </div>
      </div>
    </div>
  )
}

ApprovalSuccessModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  proposal: PropTypes.object,
}

export function VersionHistoryDrawer({ isOpen, onClose, proposal }) {
  if (!isOpen) return null

  const VERSIONS = [
    {
      v: 'v1.1',
      date: 'Today, 14:22 UTC',
      author: 'Marcus Vance (Leader)',
      type: 'LEADER EDIT',
      changes: ['Shortened hook duration to 2.8s', 'Updated headline for search ad specs', 'Approved discount token'],
    },
    {
      v: 'v1.0',
      date: 'Yesterday, 18:10 UTC',
      author: 'Maya Lin (Squad Alpha)',
      type: 'ORIGINAL SUBMISSION',
      changes: ['Initial draft generated via AI Engine v3.2', 'Selected TikTok & Meta Reels placements'],
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#171b26] border-l border-[#464554] shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-[#464554]/60 flex items-center justify-between bg-[#1c1f2a]">
          <div>
            <h3 className="text-sm font-bold text-[#dfe2f1]">Audit &amp; Version History</h3>
            <p className="text-xs text-[#908fa0] mt-0.5">{proposal?.id || 'PRP-8402'} • Full Stage Gate Trail</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#908fa0] hover:text-[#dfe2f1] hover:bg-[#262a35]">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {VERSIONS.map((item, idx) => (
            <div key={item.v} className="relative pl-6 pb-4 border-l-2 border-[#464554] last:border-l-0">
              <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${idx === 0 ? 'bg-[#8083ff] border-[#dfe2f1]' : 'bg-[#262a35] border-[#464554]'}`} />
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#dfe2f1]">{item.v}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#262a35] text-[#8083ff] font-semibold">{item.type}</span>
              </div>
              <div className="text-[11px] text-[#908fa0] mb-2">{item.author} • {item.date}</div>
              <ul className="text-xs text-[#c7c4d7] space-y-1 list-disc list-inside">
                {item.changes.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#464554]/60 bg-[#1c1f2a]">
          <button type="button" onClick={onClose} className="w-full py-2 rounded-lg bg-[#262a35] text-xs font-semibold text-[#dfe2f1] hover:bg-[#313540]">
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  )
}

VersionHistoryDrawer.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  proposal: PropTypes.object,
}
