import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  RejectProposalModal,
  RequestRevisionModal,
  EscalateToManagerModal,
  ApprovalSuccessModal,
  VersionHistoryDrawer,
} from '../components/LeaderModals'

/**
 * LeaderContentReview
 * Replaces old review screen with full Stitch design:
 * - leader_content_proposal_review_normal_escalate_secondary
 * - leader_content_proposal_review_modified
 * - leader_edit_content_proposal
 */
export default function LeaderContentReview({ proposal: initialProposal, onBack, onComplete, setPage, notify }) {
  const handleBack = () => {
    if (onBack) onBack()
    else setPage?.('approvals')
  }

  const handleComplete = () => {
    if (onComplete) onComplete()
    else setPage?.('approvals')
  }
  const [proposal, setProposal] = useState(
    initialProposal || {
      id: 'PRP-8402',
      title: 'Revise TikTok Hook Copy for Gen Z UGC #3',
      campaign: 'Summer Streetwear Launch 2025',
      channel: 'TikTok Video',
      author: 'Maya Lin',
      authorRole: 'Short-form Video Lead • Squad Alpha',
      authorInitials: 'ML',
      date: 'Oct 24, 2026 · 14:15 UTC',
      status: 'PENDING APPROVAL',
      confidence: 94,
      hook: 'Tired of generic oversized tees that fade in 2 washes? Here is what streetwear creators actually wear.',
      headline: 'Streetwear Crafted for Daily Wear',
      body: 'Engineered with 280GSM heavyweight combed cotton, reinforced collar ribs, and pigment-dyed longevity. Elevate your everyday streetwear rotation without the luxury tax markup.',
      cta: 'Shop Summer Drop (20% Off)',
      targetAudience: 'Urban Gen Z & Millennial Creators (18–30 y/o, Street Fashion & Hip-hop Culture)',
      aspectRatio: '9:16 Vertical Video (30-sec UGC format)',
      visualNotes: 'Fast cuts, creator unboxing in daylight studio, high-contrast typography overlays.',
      isModified: false,
    }
  )

  const [isEditing, setIsEditing] = useState(false)
  const [draftHook, setDraftHook] = useState(proposal.hook)
  const [draftHeadline, setDraftHeadline] = useState(proposal.headline)
  const [draftBody, setDraftBody] = useState(proposal.body)
  const [draftCta, setDraftCta] = useState(proposal.cta)
  const [validationError, setValidationError] = useState('')

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)

  const handleSaveEdit = () => {
    if (draftHeadline.length > 50) {
      setValidationError('Headline exceeds maximum limit of 50 characters.')
      return
    }
    if (draftHook.length < 10) {
      setValidationError('Hook copy is too short. Must be at least 10 characters.')
      return
    }
    setValidationError('')
    setProposal((prev) => ({
      ...prev,
      hook: draftHook,
      headline: draftHeadline,
      body: draftBody,
      cta: draftCta,
      isModified: true,
    }))
    setIsEditing(false)
    notify?.('Leader modifications saved to proposal draft.')
  }

  const handleCancelEdit = () => {
    setDraftHook(proposal.hook)
    setDraftHeadline(proposal.headline)
    setDraftBody(proposal.body)
    setDraftCta(proposal.cta)
    setValidationError('')
    setIsEditing(false)
  }

  const handleApprove = () => {
    setShowSuccessModal(true)
  }

  return (
    <div className="w-full flex flex-col gap-6 p-6 max-w-[1440px] mx-auto text-[#dfe2f1] font-sans animate-in fade-in duration-200">
      {/* ── Top Action Breadcrumb & Stage Gate Banner ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#464554]/30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1c1f2a] text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35] transition-colors text-xs font-semibold border border-[#464554]/40"
          >
            ← Back to Queue
          </button>
          <span className="text-[#464554]">•</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#908fa0]">PROPOSAL ID:</span>
            <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#8083ff] font-mono font-bold text-xs">
              {proposal.id}
            </span>
          </div>
          {proposal.isModified && (
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
              ● LEADER MODIFIED
            </span>
          )}
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowHistoryDrawer(true)}
            className="px-3 py-1.5 rounded-lg bg-[#1c1f2a] hover:bg-[#262a35] text-xs font-semibold text-[#c7c4d7] border border-[#464554]/40 flex items-center gap-1.5 transition-colors"
          >
            <span className="text-[#8083ff]">🕒</span> Audit History
          </button>
          <button
            type="button"
            onClick={() => setShowEscalateModal(true)}
            className="px-3.5 py-1.5 rounded-lg border border-[#8083ff]/40 bg-[#8083ff]/10 hover:bg-[#8083ff]/20 text-[#c0c1ff] text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>⇪</span> Escalate to Manager
          </button>
        </div>
      </div>

      {/* ── Metadata Strip / Campaign Context Card ── */}
      <div className="w-full bg-[#171b26] rounded-xl p-4 md:p-5 border border-[#464554]/40 shadow-sm grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#908fa0]">Campaign Creator</span>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#8083ff] text-[#0d0096] font-bold text-[10px] flex items-center justify-center shrink-0">
              {proposal.authorInitials || 'ML'}
            </span>
            <span className="font-semibold text-[#dfe2f1] truncate">{proposal.author}</span>
          </div>
          <span className="text-[11px] text-[#908fa0] truncate">{proposal.authorRole}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#908fa0]">Target Placement</span>
          <span className="font-semibold text-[#4cd7f6]">{proposal.channel}</span>
          <span className="text-[11px] text-[#908fa0]">{proposal.aspectRatio}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#908fa0]">Assigned Campaign</span>
          <span className="font-semibold text-[#dfe2f1] truncate">{proposal.campaign}</span>
          <span className="text-[11px] text-[#908fa0]">{proposal.date}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#908fa0]">AI Confidence</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#8083ff] text-sm">{proposal.confidence}%</span>
            <span className="text-[10px] text-emerald-400 font-semibold">High Relevancy</span>
          </div>
          <span className="text-[10px] text-[#908fa0]">Engine v3.2 Sprint-22</span>
        </div>

        <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#908fa0]">Review SLA &amp; Status</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] w-fit flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {proposal.status}
          </span>
          <span className="text-[10px] text-[#908fa0]">Highest wait: 2h 10m</span>
        </div>
      </div>

      {/* ── Two-Column Main Review Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (65% width = 8 cols): Creative Copy & Hook Breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <span>⚠️</span>
              <span>{validationError}</span>
            </div>
          )}

          {/* Card: Hook & Headline */}
          <div className="rounded-xl bg-[#171b26] border border-[#464554]/40 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-[#1c1f2a] border-b border-[#464554]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-secondary text-sm font-bold">1.</span>
                <h3 className="text-sm font-bold text-[#dfe2f1]">Hook (0–3s) &amp; Primary Headline</h3>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-2.5 py-1 rounded bg-[#262a35] hover:bg-[#313540] text-xs font-semibold text-[#8083ff] transition-colors border border-[#464554]/30"
                >
                  ✎ Edit Copy
                </button>
              )}
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Hook */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#908fa0] uppercase tracking-wider text-[11px]">
                    Hook Copy (First 3 Seconds)
                  </span>
                  {isEditing && (
                    <span className={`text-[11px] font-mono ${draftHook.length > 90 ? 'text-rose-400 font-bold' : 'text-[#908fa0]'}`}>
                      {draftHook.length} / 90 chars
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={draftHook}
                    onChange={(e) => setDraftHook(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#0a0e18] border border-[#8083ff] text-xs text-[#dfe2f1] focus:outline-none"
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-[#0a0e18] border border-[#464554]/30 text-xs text-[#dfe2f1] font-medium leading-relaxed">
                    “{proposal.hook}”
                  </div>
                )}
              </div>

              {/* Headline */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#908fa0] uppercase tracking-wider text-[11px]">
                    Main Display Headline
                  </span>
                  {isEditing && (
                    <span className={`text-[11px] font-mono ${draftHeadline.length > 50 ? 'text-rose-400 font-bold' : 'text-[#908fa0]'}`}>
                      {draftHeadline.length} / 50 chars
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={draftHeadline}
                    onChange={(e) => setDraftHeadline(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#0a0e18] border border-[#8083ff] text-xs text-[#dfe2f1] focus:outline-none"
                  />
                ) : (
                  <div className="p-2.5 rounded-lg bg-[#0a0e18] border border-[#464554]/30 text-xs font-bold text-[#dfe2f1]">
                    {proposal.headline}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: Primary Copy & CTA */}
          <div className="rounded-xl bg-[#171b26] border border-[#464554]/40 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-[#1c1f2a] border-b border-[#464554]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-secondary text-sm font-bold">2.</span>
                <h3 className="text-sm font-bold text-[#dfe2f1]">Primary Caption Body &amp; Call to Action</h3>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-[#908fa0] uppercase tracking-wider text-[11px]">
                  Body Text / Ad Copy
                </span>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#0a0e18] border border-[#8083ff] text-xs text-[#dfe2f1] focus:outline-none leading-relaxed"
                  />
                ) : (
                  <div className="p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/30 text-xs text-[#c7c4d7] leading-relaxed whitespace-pre-wrap">
                    {proposal.body}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[#908fa0] uppercase tracking-wider text-[11px]">
                    Button CTA
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftCta}
                      onChange={(e) => setDraftCta(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0a0e18] border border-[#8083ff] text-xs text-[#dfe2f1]"
                    />
                  ) : (
                    <div className="p-2 rounded-lg bg-[#8083ff]/10 border border-[#8083ff]/30 text-[#c0c1ff] font-bold text-xs flex items-center justify-center">
                      {proposal.cta}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[#908fa0] uppercase tracking-wider text-[11px]">
                    Visual Asset Direction
                  </span>
                  <div className="p-2 rounded-lg bg-[#0a0e18] border border-[#464554]/30 text-[#908fa0] text-[11px] truncate">
                    {proposal.visualNotes}
                  </div>
                </div>
              </div>

              {/* In Edit Mode: Save / Cancel bar */}
              {isEditing && (
                <div className="pt-3 border-t border-[#464554]/50 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3.5 py-1.5 rounded-lg bg-[#262a35] text-xs font-semibold text-[#dfe2f1]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 rounded-lg bg-[#8083ff] text-xs font-bold text-[#0d0096] shadow-sm"
                  >
                    ✓ Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (35% width = 4 cols): Compliance & Governance Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Target Audience Card */}
          <div className="rounded-xl bg-[#171b26] border border-[#464554]/40 p-4 flex flex-col gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#908fa0]">Target Persona Segment</span>
            <p className="text-xs text-[#dfe2f1] font-medium leading-relaxed">
              {proposal.targetAudience}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded bg-[#0a0e18] text-[#8083ff] text-[10px] font-mono">18–28 Gen Z</span>
              <span className="px-2 py-0.5 rounded bg-[#0a0e18] text-[#4cd7f6] text-[10px] font-mono">Streetwear Interest</span>
              <span className="px-2 py-0.5 rounded bg-[#0a0e18] text-[#a78bfa] text-[10px] font-mono">UGC Receptive</span>
            </div>
          </div>

          {/* Brand Governance & Compliance Checklist Card */}
          <div className="rounded-xl bg-[#171b26] border border-[#464554]/40 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#908fa0]">Brand Safety &amp; Guardrails</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[9px]">PASSED</span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-[#0a0e18] border border-[#464554]/20">
                <span className="text-[#dfe2f1]">Prohibited Claims Check</span>
                <span className="text-emerald-400 font-bold text-[11px]">0 Flags ✓</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0a0e18] border border-[#464554]/20">
                <span className="text-[#dfe2f1]">Tone &amp; Style Alignment</span>
                <span className="text-emerald-400 font-bold text-[11px]">96% Match ✓</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0a0e18] border border-[#464554]/20">
                <span className="text-[#dfe2f1]">Discount Token Verification</span>
                <span className="text-emerald-400 font-bold text-[11px]">Valid 20% ✓</span>
              </div>
            </div>
          </div>

          {/* Sticky Decision Action Card */}
          <div className="rounded-xl bg-[#171b26] border border-[#8083ff]/40 p-5 flex flex-col gap-3 shadow-lg shadow-[#8083ff]/5 sticky top-20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#dfe2f1]">Leader Decision Authority</h4>
            <p className="text-[11px] text-[#908fa0] leading-snug">
              Review and sign off on this creative asset before downstream campaign dispatch.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleApprove}
                className="w-full py-2.5 rounded-lg bg-[#8083ff] hover:bg-[#999cff] text-xs font-bold text-[#0d0096] flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#8083ff]/20"
              >
                <span>✓</span> Approve &amp; Authorize Dispatch
              </button>

              <button
                type="button"
                onClick={() => setShowRevisionModal(true)}
                className="w-full py-2 rounded-lg bg-[#262a35] hover:bg-[#313540] text-xs font-semibold text-[#dfe2f1] flex items-center justify-center gap-1.5 transition-colors border border-[#464554]/40"
              >
                <span>✎</span> Request Specific Rework
              </button>

              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="w-full py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-rose-500/30"
              >
                <span>✕</span> Reject with Reason
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog Modals ── */}
      <RejectProposalModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        proposal={proposal}
        onConfirm={({ reason }) => {
          notify?.(`Proposal ${proposal.id} rejected: ${reason}`)
          handleComplete()
        }}
      />

      <RequestRevisionModal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        proposal={proposal}
        onConfirm={({ notes: _notes }) => {
          notify?.(`Revision request dispatched for ${proposal.id}`)
          handleComplete()
        }}
      />

      <EscalateToManagerModal
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        proposal={proposal}
        onConfirm={({ justification: _justification, urgency }) => {
          notify?.(`Proposal ${proposal.id} escalated to Marketing Manager (${urgency})`)
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

LeaderContentReview.propTypes = {
  proposal: PropTypes.object,
  onBack: PropTypes.func,
  onComplete: PropTypes.func,
  notify: PropTypes.func,
}
