import PropTypes from 'prop-types'
import {
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Share2,
  Compass,
  ArrowRight,
  ShieldCheck,
  Megaphone,
} from 'lucide-react'

/**
 * MemberStrategyReferences
 * Dedicated Read-Only Strategy Reference screen for Employee / Member role.
 *
 * Provides creative guidelines, target persona profiles, brand tone, and
 * channel-specific execution instructions so squad members can produce
 * compliant marketing copy and creative deliverables.
 */
export default function MemberStrategyReferences({
  profile,
  strategy,
  setPage,
  notify,
}) {
  const hasStrategy = Boolean(strategy?.strategy)
  const strategyData = strategy?.strategy

  // Derived values from live strategy or business profile
  const primaryAngle =
    strategyData?.primary_angle ||
    profile?.primary_goal ||
    'Multi-Channel Brand Growth & Customer Engagement'

  const rationale =
    strategyData?.rationale ||
    (profile?.business_name
      ? `Strategic focus tailored for ${profile.business_name} in ${profile.industry || 'Retail'}, targeting ${profile.target_customers || 'modern consumers'}.`
      : 'Approved workspace marketing blueprint guiding creative deliverables across active flight channels.')

  const targetAudience =
    strategyData?.target_audience ||
    profile?.target_customers ||
    'Modern consumers seeking high-quality products and transparent brand communication'

  const activeChannels =
    profile?.preferred_channels && profile.preferred_channels.length > 0
      ? profile.preferred_channels
      : ['Meta', 'Google Ads', 'TikTok']

  // Channel execution guidelines for copywriters & creative specialists
  const CHANNEL_GUIDELINES = [
    {
      channel: 'Meta',
      name: 'Meta Ads (Instagram & Facebook)',
      icon: '∞',
      badgeColor: 'border-[#4cd7f6]/40 bg-[#4cd7f6]/10 text-[#4cd7f6]',
      focus: 'Visual Storytelling & Value-Driven Carousels',
      formats: 'Reels (9:16), Feed Carousels (1:1), Story Banners',
      creativeHooks: [
        'Hook viewers with a relatable lifestyle question in the first 2 seconds.',
        'Use carousel slide 1 for the core hook, slides 2–4 for product proof, slide 5 for clear CTA.',
        'Ensure text overlay does not exceed 20% of image area for optimal delivery.',
      ],
      suggestedCta: 'Shop Now / Learn More',
    },
    {
      channel: 'TikTok',
      name: 'TikTok Ads & Spark Network',
      icon: '♪',
      badgeColor: 'border-[#a078ff]/40 bg-[#a078ff]/10 text-[#a078ff]',
      focus: 'Authentic Creator UGC & Problem-Solution Demos',
      formats: 'Full-Screen Vertical Video (9:16), Sound-On Native Ads',
      creativeHooks: [
        'Hook within 1.5 seconds using unexpected sound or direct pain-point callout.',
        'Keep total video pacing under 25 seconds; show the product in use by second 3.',
        'Use conversational captions with 2–4 niche community hashtags.',
      ],
      suggestedCta: 'Get Yours Today / Tap to Discover',
    },
    {
      channel: 'Google Ads',
      name: 'Google Ads (Search & Performance Max)',
      icon: 'G',
      badgeColor: 'border-[#03b5d3]/40 bg-[#03b5d3]/10 text-[#03b5d3]',
      focus: 'High-Intent Solution Capture & Benefit Headlines',
      formats: 'Responsive Search Ads (RSA), Performance Max Asset Groups',
      creativeHooks: [
        'Pin exact customer intent keyword in Headline 1; emotional benefit in Headline 2.',
        'Highlight unique value proposition (e.g. Free Shipping, Fast Delivery, Warranty).',
        'Provide at least 4 distinct descriptions emphasizing trust and direct satisfaction.',
      ],
      suggestedCta: 'Order Online / Official Store',
    },
  ]

  // Filter guidelines based on active channels
  const displayedChannels = CHANNEL_GUIDELINES.filter((item) =>
    activeChannels.some((c) =>
      item.channel.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(item.channel.toLowerCase())
    )
  )

  const channelsToRender =
    displayedChannels.length > 0 ? displayedChannels : CHANNEL_GUIDELINES

  // Editorial Tone: Dos and Don'ts for creative copywriters
  const EDITORIAL_DOS = [
    'Focus on tangible customer benefits within the opening 3 seconds of copy or video.',
    'Use active, confident verbs and conversational language that reflects authenticity.',
    'Align messaging strictly with the approved primary positioning angle.',
    'Include clear, unambiguous calls-to-action tailored to each respective platform.',
  ]

  const EDITORIAL_DONTS = [
    'Do not use passive or generic corporate jargon (e.g. "synergistic next-gen paradigm").',
    'Do not promise unauthorized discounts, unverified product specs, or false scarcity.',
    'Never exceed approved brand color palettes or submit low-resolution visual assets.',
    'Avoid clickbait hooks that create expectations mismatched with destination pages.',
  ]

  return (
    <div className="flex-1 bg-[#0f131d] overflow-y-auto p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-64px)] text-[#dfe2f1] font-sans">
      <div className="max-w-[1360px] w-full mx-auto space-y-6 pb-16">
        {/* ─── 1. PAGE HEADER CARD ─────────────────────────────────────────── */}
        <div className="w-full bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#dfe2f1] tracking-tight m-0">
                Strategy References
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#8083ff]/15 border border-[#8083ff]/40 text-[#8083ff] text-[11px] font-mono tracking-wider uppercase font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8083ff]" />
                READ-ONLY // SQUAD BLUEPRINT
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#262a35] border border-[#464554] text-[#c7c4d7] text-[11px] font-medium">
                <ShieldCheck className="w-3 h-3 text-[#10b981]" />
                FR03 Reference Library
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#c7c4d7] m-0 max-w-3xl">
              Approved brand positioning, audience personas, and platform messaging guidelines for creative deliverables.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              className="px-3.5 py-2 rounded-lg border border-[#464554] text-[#dfe2f1] hover:bg-[#262a35] text-xs font-semibold transition-colors flex items-center gap-1.5"
              onClick={() => {
                if (setPage) setPage('overview')
              }}
            >
              ← My Dashboard
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-[#8083ff] text-[#0d0096] hover:bg-[#9a9cff] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              onClick={() => {
                if (setPage) {
                  setPage('content')
                  notify?.('Navigating to Content Studio with Strategy Reference.')
                }
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Open Content Studio →
            </button>
          </div>
        </div>

        {/* ─── 2. PRIMARY POSITIONING ANGLE ─────────────────────────────────── */}
        <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#464554] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#03b5d3]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#03b5d3]">
                CORE STRATEGIC ANGLE &amp; VALUE PROPOSITION
              </span>
            </div>
            {hasStrategy ? (
              <span className="px-2 py-0.5 rounded bg-[#10b981]/15 border border-[#10b981]/40 text-[#10b981] text-[10px] font-mono font-bold uppercase">
                ✓ AI Strategy Active ({strategyData.confidence || 92}% Confidence)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-[#262a35] border border-[#464554] text-[#c7c4d7] text-[10px] font-mono uppercase">
                ◈ Workspace Profile Baseline
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#c7c4d7]/70">
                  Primary Strategic Angle
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#dfe2f1] mt-0.5 m-0 leading-snug">
                  {primaryAngle}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#c7c4d7] leading-relaxed m-0">
                {rationale}
              </p>

              {/* Strategic Value Proposition Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[11px] font-mono text-[#c7c4d7]/70 font-semibold mr-1">
                  CORE PILLARS:
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#262a35] border border-[#464554] text-[#dfe2f1] text-[11px] font-medium">
                  Direct-to-Consumer Authenticity
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#262a35] border border-[#464554] text-[#dfe2f1] text-[11px] font-medium">
                  Rapid Value Demonstration
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#262a35] border border-[#464554] text-[#dfe2f1] text-[11px] font-medium">
                  Clear Social Proof &amp; Trust
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 bg-[#141e33] border border-[#464554] rounded-lg p-4 space-y-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8083ff] block">
                CREATIVE SPECIFICATION
              </span>
              <div className="space-y-1.5 text-xs text-[#c7c4d7]">
                <div className="flex justify-between py-1 border-b border-[#464554]/40">
                  <span>Target Industry</span>
                  <strong className="text-[#dfe2f1]">{profile?.industry || 'Fashion & Retail'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[#464554]/40">
                  <span>Company Size</span>
                  <strong className="text-[#dfe2f1]">{profile?.business_size || 'Medium (51–250)'}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Currency Context</span>
                  <strong className="text-[#dfe2f1]">{profile?.currency || 'USD'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. TARGET AUDIENCE & PERSONA PROFILES ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Audience Profile */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#464554]">
              <Target className="w-4 h-4 text-[#4cd7f6]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#dfe2f1] m-0">
                Target Audience &amp; Buyer Persona
              </h2>
            </div>

            <div className="bg-[#141e33] border border-[#464554] rounded-lg p-4">
              <span className="text-[10px] font-mono uppercase text-[#4cd7f6] font-bold block mb-1">
                PRIMARY AUDIENCE SEGMENT
              </span>
              <p className="text-xs sm:text-sm font-medium text-[#dfe2f1] m-0 leading-relaxed">
                {targetAudience}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c7c4d7]/70 block mb-1">
                  Key Customer Pain Points
                </span>
                <ul className="text-xs text-[#c7c4d7] space-y-1.5 pl-4 list-disc m-0">
                  <li>Overwhelmed by generic, mass-market retail options without personal relevance.</li>
                  <li>Demands immediate clarity on product durability, delivery speed, and return terms.</li>
                  <li>Prefers mobile-first, friction-free checkout experiences directly via social ad links.</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-[#464554]/40">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c7c4d7]/70 block mb-1">
                  Primary Emotional Motivators
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#262a35] text-[11px] text-[#dfe2f1]">
                    Self-Expression
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#262a35] text-[11px] text-[#dfe2f1]">
                    Confidence in Quality
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#262a35] text-[11px] text-[#dfe2f1]">
                    Peer Validation
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#262a35] text-[11px] text-[#dfe2f1]">
                    Time-Saving Convenience
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Voice & Editorial Tone */}
          <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#464554]">
              <MessageSquare className="w-4 h-4 text-[#a078ff]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#dfe2f1] m-0">
                Brand Voice &amp; Editorial Tone
              </h2>
            </div>

            <div className="bg-[#141e33] border border-[#464554] rounded-lg p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#a078ff] font-bold block">
                  APPROVED TONE OF VOICE
                </span>
                <span className="text-sm sm:text-base font-bold text-[#dfe2f1] mt-0.5 block">
                  Energetic, Confident, Direct
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#a078ff]/15 border border-[#a078ff]/40 text-[#a078ff] text-[10px] font-mono font-bold uppercase">
                STYLE GUIDE v2.4
              </span>
            </div>

            {/* Dos and Don'ts Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Copywriter Dos */}
              <div className="bg-[#0f131d] border border-[#10b981]/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#10b981] uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DO (Recommended)</span>
                </div>
                <ul className="text-[11px] text-[#c7c4d7] space-y-1.5 pl-3 list-disc m-0">
                  {EDITORIAL_DOS.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Copywriter Don'ts */}
              <div className="bg-[#0f131d] border border-[#ffb4ab]/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#ffb4ab] uppercase">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>DON&apos;T (Prohibited)</span>
                </div>
                <ul className="text-[11px] text-[#c7c4d7] space-y-1.5 pl-3 list-disc m-0">
                  {EDITORIAL_DONTS.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. CHANNEL STRATEGY MATRIX ─────────────────────────────────── */}
        <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#464554] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#8083ff]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#dfe2f1] m-0">
                Channel Strategy Matrix &amp; Creative Execution
              </h2>
            </div>
            <span className="text-xs text-[#c7c4d7]">
              Tailored execution rules per authorized flight channel
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelsToRender.map((ch) => (
              <div
                key={ch.channel}
                className="bg-[#141e33] border border-[#464554] rounded-lg p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-[#262a35] border border-[#464554] text-[#dfe2f1] text-xs font-bold flex items-center justify-center font-mono">
                        {ch.icon}
                      </span>
                      <strong className="text-xs sm:text-sm text-[#dfe2f1]">
                        {ch.name}
                      </strong>
                    </div>
                  </div>

                  <div className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase inline-block ${ch.badgeColor}`}>
                    {ch.focus}
                  </div>

                  <div className="pt-2 text-xs space-y-1 border-t border-[#464554]/40">
                    <span className="text-[10px] uppercase font-bold text-[#c7c4d7]/70 block">
                      Target Formats
                    </span>
                    <p className="text-[#dfe2f1] m-0 text-[11px] font-medium">
                      {ch.formats}
                    </p>
                  </div>

                  <div className="pt-1 text-xs space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#c7c4d7]/70 block">
                      Execution Hooks
                    </span>
                    <ul className="text-[11px] text-[#c7c4d7] space-y-1 pl-3 list-disc m-0">
                      {ch.creativeHooks.map((h, i) => (
                        <li key={i} className="leading-snug">{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#464554]/40 flex items-center justify-between text-[11px]">
                  <span className="text-[#c7c4d7]/70 font-mono">RECOMMENDED CTA</span>
                  <strong className="text-[#03b5d3] font-semibold">{ch.suggestedCta}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 5. QUICK ACTION CTA BANNER ─────────────────────────────────── */}
        <div className="bg-[#141e33] border border-[#8083ff]/40 rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#8083ff]" />
              <h3 className="text-sm sm:text-base font-bold text-[#dfe2f1] m-0">
                Ready to draft campaign deliverables with these references?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#c7c4d7] m-0 max-w-2xl">
              Proceed to Content Studio to generate, edit, and review multi-channel ad copy, headline variations, and creative hooks aligned with this strategy.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              className="px-4 py-2.5 rounded-lg bg-[#8083ff] text-[#0d0096] hover:bg-[#9a9cff] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
              onClick={() => {
                if (setPage) {
                  setPage('content')
                  notify?.('Switched to Content Studio.')
                }
              }}
            >
              Go to Content Studio
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

MemberStrategyReferences.propTypes = {
  profile: PropTypes.object,
  strategy: PropTypes.object,
  setPage: PropTypes.func,
  notify: PropTypes.func,
}
