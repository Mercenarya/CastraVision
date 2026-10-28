/**
 * marketingGroupsData.js — Shared Marketing Group & Governance Model
 *
 * CastraVision 4-Actor Hierarchy:
 *   1. System Admin   (role: 'system_admin' | 'sys_admin') — Platform-level
 *   2. Company Admin  (role: 'company_admin' | 'admin')     — Company tenant administration
 *   3. Manager        (role: 'manager')                    — Supervise assigned Marketing Groups
 *   4. Employee       (role: 'member')                     — Contributor within assigned groups
 *
 * Business Rules Enforced:
 *   BR-CM-01: A company may contain multiple Marketing Groups.
 *   BR-CM-02: One Manager may be assigned to multiple Marketing Groups.
 *   BR-CM-03: Company Admin controls group membership and Manager assignments.
 *   BR-CM-04: Manager may access only authorized groups and their associated business data.
 *   BR-CM-05: Manager may review, edit, approve, or reject proposals within authorized scope (FR04).
 *   BR-CM-06: Employee must not access approval actions.
 *   BR-CM-07: Manager must not inherit System Admin or Company Admin privileges.
 *   BR-CM-08: Authorization model is designed for backend enforcement (clean relational structure).
 */

import { useSyncExternalStore } from 'react'

// ─── 1. COMPANIES (Top-level Legal Business Tenants) ──────────────────────────
export const INITIAL_COMPANIES = [
  {
    id: 'comp-acme-global',
    name: 'Acme Corp',
    legalName: 'Acme Global Holdings Inc.',
    domain: 'acmecorp.com',
    tier: 'Enterprise Max',
    status: 'active',
    createdAt: '2026-10-10T00:00:00Z',
  },
]

// ─── 2. WORKSPACES (FR06 Workspace Boundaries within Company) ─────────────────
// Note: We do not assume a permanent 1:1 relationship between Company and Workspace.
// A Company may contain multiple Workspaces (e.g. regional, brand-specific).
export const INITIAL_WORKSPACES = [
  {
    id: 'ws-acme-8920',
    companyId: 'comp-acme-global',
    name: 'Acme Corp Primary Workspace',
    tier: 'Enterprise Workspace',
    totalMembers: 14,
    status: 'active',
    createdAt: '2026-10-12T00:00:00Z',
  },
]

// ─── 3. MARKETING GROUPS (Operational Divisions inside Company/Workspace) ─────
export const INITIAL_MARKETING_GROUPS = [
  {
    id: 'grp-growth-01',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    name: 'Growth Marketing',
    code: 'GM',
    description: 'Rapid customer acquisition, referral loops, landing page testing, and copy synthesis.',
    budgetCap: 25000,
    currentSpend: 18500,
    currency: 'USD',
    status: 'active',
    createdAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'grp-performance-02',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    name: 'Performance & Paid Ads',
    code: 'PPA',
    description: 'Meta Ads, Google Search, algorithmic bid optimizations, and retargeting budgets.',
    budgetCap: 30000,
    currentSpend: 26500,
    currency: 'USD',
    status: 'active',
    createdAt: '2026-10-14T00:00:00Z',
  },
  {
    id: 'grp-brand-03',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    name: 'Brand & Creative Content',
    code: 'BCC',
    description: 'Organic social media storytelling, brand voice guardrails, visual assets, and video copy.',
    budgetCap: 15000,
    currentSpend: 9200,
    currency: 'USD',
    status: 'active',
    createdAt: '2026-10-15T00:00:00Z',
  },
  {
    id: 'grp-lifecycle-04',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    name: 'Lifecycle & Retention',
    code: 'LCR',
    description: 'Email nurture sequences, churn prevention, loyalty campaigns, and push automation.',
    budgetCap: 12000,
    currentSpend: 6400,
    currency: 'USD',
    status: 'active',
    createdAt: '2026-10-16T00:00:00Z',
  },
]

// ─── 4. MANAGER-TO-GROUP ASSIGNMENTS (BR-CM-02: 1 Manager -> Multiple Groups) ─
export const INITIAL_MANAGER_ASSIGNMENTS = [
  // David Kross (mem-004, Manager) supervises TWO Marketing Groups:
  {
    id: 'mga-001',
    managerId: 'mem-004',
    managerEmail: 'david.kross@acmecorp.com',
    groupId: 'grp-growth-01',
    assignedAt: '2026-10-20T09:00:00Z',
    assignedBy: 'mem-001', // Sarah Jenkins (Company Admin)
  },
  {
    id: 'mga-002',
    managerId: 'mem-004',
    managerEmail: 'david.kross@acmecorp.com',
    groupId: 'grp-performance-02',
    assignedAt: '2026-10-20T09:00:00Z',
    assignedBy: 'mem-001',
  },
  // Elena Rostova (mem-003, Manager) supervises TWO Marketing Groups:
  {
    id: 'mga-003',
    managerId: 'mem-003',
    managerEmail: 'elena.rostova@acmecorp.com',
    groupId: 'grp-brand-03',
    assignedAt: '2026-10-18T10:00:00Z',
    assignedBy: 'mem-001',
  },
  {
    id: 'mga-004',
    managerId: 'mem-003',
    managerEmail: 'elena.rostova@acmecorp.com',
    groupId: 'grp-lifecycle-04',
    assignedAt: '2026-10-18T10:00:00Z',
    assignedBy: 'mem-001',
  },
  // Liam Zhao (mem-008, Manager) - Unassigned initially
  // Rachel Adams (mem-009, Manager) - Unassigned initially
]

// ─── 5. GROUP MEMBERSHIPS (Employees assigned to Marketing Groups) ─────────────
export const INITIAL_GROUP_MEMBERSHIPS = [
  {
    id: 'gmb-001',
    userId: 'mem-005', // Alex Mercer (Employee)
    userEmail: 'alex.mercer@acmecorp.com',
    groupId: 'grp-growth-01',
    role: 'member',
    joinedAt: '2026-10-22T08:00:00Z',
  },
  {
    id: 'gmb-002',
    userId: 'mem-010', // Carlos Mendez (Employee)
    userEmail: 'carlos.mendez@acmecorp.com',
    groupId: 'grp-growth-01',
    role: 'member',
    joinedAt: '2026-10-19T08:00:00Z',
  },
  {
    id: 'gmb-003',
    userId: 'mem-012', // Kevin Patel (Employee)
    userEmail: 'kevin.patel@acmecorp.com',
    groupId: 'grp-growth-01',
    role: 'member',
    joinedAt: '2026-10-22T08:00:00Z',
  },
  {
    id: 'gmb-004',
    userId: 'mem-014', // Tyler Brooks (Employee)
    userEmail: 'tyler.brooks@acmecorp.com',
    groupId: 'grp-performance-02',
    role: 'member',
    joinedAt: '2026-10-23T08:00:00Z',
  },
  {
    id: 'gmb-005',
    userId: 'mem-006', // Chloe Nguyen (Employee)
    userEmail: 'chloe.nguyen@acmecorp.com',
    groupId: 'grp-brand-03',
    role: 'member',
    joinedAt: '2026-10-23T08:00:00Z',
  },
  {
    id: 'gmb-006',
    userId: 'mem-011', // Jessica Taylor (Employee)
    userEmail: 'jessica.taylor@acmecorp.com',
    groupId: 'grp-brand-03',
    role: 'member',
    joinedAt: '2026-10-21T08:00:00Z',
  },
  {
    id: 'gmb-007',
    userId: 'mem-013', // Maya Lin (Employee)
    userEmail: 'maya.lin@acmecorp.com',
    groupId: 'grp-lifecycle-04',
    role: 'member',
    joinedAt: '2026-10-23T08:00:00Z',
  },
]

// ─── 4. GROUP NORMALIZATION & ALIASES ───────────────────────────────────────
export const GROUP_ID_ALIASES = {
  'grp-content-01': 'grp-growth-01',
}

export function normalizeGroupId(groupId) {
  return GROUP_ID_ALIASES[groupId] || groupId
}

// ─── 6. PROPOSALS WITH GROUP ATTRIBUTION (FR04 Stage-Gate Engine) ──────────────
export const INITIAL_PROPOSALS = [
  {
    id: 'PRP-8402',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-growth-01',
    groupName: 'Growth Marketing',
    name: 'Q3 Activewear Omnichannel Copy',
    title: 'Q3 Activewear Omnichannel Copy',
    type: 'Content',
    engine: 'CastraLM-V4',
    author: 'Sarah Jenkins',
    authorId: 'mem-001',
    authorRole: 'Campaign Lead',
    authorInitials: 'SJ',
    createdDate: 'Oct 24, 2026 · 14:32:08 UTC',
    submittedAt: '2026-10-24T14:32:08Z',
    workspace: 'Acme Corp',
    status: 'pending',
    statusLabel: 'Pending Signoff',
    version: 'v1.0',
    targetChannel: 'Meta & Google Ads',
    targetSegment: 'Urban Activewear · Ages 18–34',
    campaignContext:
      'AI-generated multichannel ad copy designed to increase conversion rates for Autumn performance apparel line, focusing on durability and moisture-wicking benefits.',
    primaryHeadline: 'Unstoppable Momentum. Built for High-Performance Training.',
    primaryBodyCopy:
      'Engineered with proprietary thermal-weave fabrics that adapt to your workout intensity. Discover the next generation of performance apparel with zero friction and complimentary express delivery.',
    cta: 'Shop Collection Now',
    destinationUrl: 'https://acmeactive.com/collections/q3-performance-line?utm_source=meta',
    conversionTarget: 'PDP Route',
    keywords: ['activewear', 'athletic-training', 'moisture-wicking', 'performance-apparel'],
    revisionNote: 'Original generated version ready for manager verification.',
    noticeText: 'Original Version (v1.0) generated by CastraVision AI Engine.',
    baselineDraft: {
      headline: 'Unstoppable Momentum. Built for High-Performance Training.',
      bodyCopy:
        'Engineered with proprietary thermal-weave fabrics that adapt to your workout intensity. Discover the next generation of performance apparel with zero friction and complimentary express delivery.',
      cta: 'Shop Collection Now',
      destinationUrl: 'https://acmeactive.com/collections/q3-performance-line?utm_source=meta',
      asset: 'Asset #01 (AirStride V2 Black Edition)',
    },
    creativeAsset: {
      id: 'AST-901-PRO',
      title: 'Asset #01 (AirStride V2 Black Edition)',
      aspectRatio: '1:1 Square',
      resolution: '2048 x 2048',
      format: 'WEBP / Lossless',
      fileSize: '642 KB',
      description:
        'High-contrast product studio rendering formatted in 1:1 ratio for mobile feed optimization. Balanced for Instagram Dynamic Feed and Facebook Carousel tiles.',
      colorProfile: 'Display P3 / sRGB',
    },
    guardrails: {
      targetTone: 'Energetic, Premium',
      modelTemperature: '0.65 (Deterministic)',
      trademarkSafety: 'Passed',
      regulatoryClaimCheck: 'Passed',
      textLengthLimits: 'Passed',
      profanityFilter: 'Passed',
    },
    history: [
      {
        id: 'ev-8402-1',
        type: 'submitted',
        version: 'v1.0',
        title: 'Proposal Ingested',
        operator: 'Sarah Jenkins',
        operatorRole: 'Campaign Lead',
        timestamp: 'Oct 24, 2026 · 14:32:08 UTC',
        notes: 'Initial AI-assisted draft generated via CastraLM-V4 orchestrator.',
      },
    ],
  },
  {
    id: 'PRP-8403',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-performance-02',
    groupName: 'Performance & Paid Ads',
    name: 'Dynamic Budget Reallocation',
    title: 'Dynamic Budget Reallocation',
    type: 'Budget',
    engine: 'Engine Agent [Beta] (Core Opt v2.4)',
    author: 'Engine Agent [Beta]',
    authorId: 'agent-bot',
    authorRole: 'Autonomous Pipeline',
    authorInitials: 'bot',
    createdDate: 'Oct 24, 2026 · 13:15:40 UTC',
    submittedAt: '2026-10-24T13:15:40Z',
    workspace: 'Acme Corp',
    status: 'pending',
    statusLabel: 'Pending Signoff',
    version: 'v1.0',
    targetChannel: 'Meta Ads, Google Ads & TikTok Ads',
    totalRequested: 45000,
    budgetCap: 45000,
    monthlySpendEnvelope: 45000,
    targetPeriod: 'Nov 1 – Nov 30, 2026',
    pacingStrategy: 'Even Daily + Weekend Bias (Friday 18:00 to Sunday 23:59 +15%)',
    authorizationTier: 'Tier 2 Manager Review (Threshold: Spend > $10,000)',
    primaryObjective: 'CPA Reduction & ROAS Optimization (Target ROAS: 3.80x)',
    shiftedCapitalReallocation: 8500,
    netVariance: 0,
    channels: [
      {
        id: 'ch-google',
        name: 'Google Search & Performance Max',
        subtext: 'High-intent intent capture & Merchant feed',
        current: 15000,
        currentShare: 33.3,
        proposed: 21000,
        proposedShare: 46.7,
        netChange: 6000,
        netChangePct: 40.0,
      },
      {
        id: 'ch-meta',
        name: 'Meta Ads (Instagram & FB Reels)',
        subtext: 'Catalog Advantage+ & Remarketing',
        current: 17500,
        currentShare: 38.9,
        proposed: 19500,
        proposedShare: 43.3,
        netChange: 2000,
        netChangePct: 11.4,
      },
      {
        id: 'ch-tiktok',
        name: 'TikTok Ads (Video UGC & Spark)',
        subtext: 'Upper funnel creative prospecting',
        current: 12500,
        currentShare: 27.8,
        proposed: 4500,
        proposedShare: 10.0,
        netChange: -8000,
        netChangePct: -64.0,
      },
    ],
    campaignContext:
      'Automated advertising spend reallocations are held in pre-flight staging. This budget allocation proposal requires explicit human manager signoff on capital shift parameters.',
    strategicRecommendation:
      'TikTok CPA increased by 28% over the past 14 days ($4.80 vs target $3.50), reflecting audience saturation in the 18–24 cohort. Concurrently, Google Search and Meta Ads have exhibited consistent margin headroom with conversion rates of 4.62% and 3.42% respectively. Reallocating $8,000 away from TikTok into high-intent Google Search (+ $6,000) and Meta retargeting (+ $2,000) maintains overall campaign reach while restoring blended acquisition costs to target thresholds.',
    confidenceScore: '94.2%',
    primaryHeadline: '+$45,000 / Mo Reallocation to High-Conversion Segments',
    primaryBodyCopy:
      'Reallocates $8,000 from TikTok Ads into Google Search & Performance Max (+$6,000) and Meta Ads (+$2,000) to optimize cross-channel ROAS.',
    cta: 'Execute Proposal Approval',
    conversionTarget: 'Media Spend Matrix',
    keywords: ['budget pacing', 'google search', 'meta ads', 'roas optimization'],
    revisionNote: 'Algorithmic optimization spike (+18.4% Blended ROAS forecasted).',
    noticeText: 'Generated by Engine Agent [Beta] based on 30-day conversion signals.',
    history: [
      {
        id: 'ev-8403-1',
        type: 'submitted',
        version: 'v1.0',
        title: 'Proposal Compiled and Queued',
        operator: 'Engine Agent [Beta]',
        operatorRole: 'Autonomous Pipeline',
        timestamp: 'Oct 24, 2026 · 13:15:00 UTC',
        notes: 'Pacing constraints and non-negative parameters validated.',
      },
    ],
  },
  {
    id: 'PRP-8404',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-brand-03',
    groupName: 'Brand & Creative Content',
    name: 'Holiday Email Lead Nurture Sequence',
    title: 'Holiday Email Lead Nurture Sequence',
    type: 'Content',
    engine: 'CastraLM-V4',
    author: 'Chloe Nguyen',
    authorId: 'mem-006',
    authorRole: 'Employee',
    authorInitials: 'CN',
    createdDate: 'Oct 24, 2026 11:04:12 UTC',
    submittedAt: '2026-10-24T11:04:12Z',
    workspace: 'Acme Corp',
    status: 'pending',
    version: 'v1.1',
    modifiedBadge: 'Modified v2 • 1h ago',
    targetChannel: 'Email / Klaviyo Pipeline',
    campaignContext:
      'Four-part automated email nurture flow for high-value leads captured during Q3 flash promotions.',
    primaryHeadline: 'Exclusive Preview: Curated Collections for Your Early Winter Warmup',
    primaryBodyCopy:
      'Personalized styling recommendations, bundle discounts up to 20%, and dedicated priority fulfillment before public release.',
    cta: 'Claim Member Access',
    conversionTarget: 'Email Landing Page',
    keywords: ['email sequence', 'lead nurture', 'klaviyo', 'early access'],
    revisionNote: 'Updated promotional tier discount from 15% to 20%.',
    noticeText: 'Human-modified draft (v1.1). Reviewed by Elena Rostova.',
  },
  {
    id: 'PRP-8401',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-performance-02',
    groupName: 'Performance & Paid Ads',
    name: 'Retargeting Creative Set · Tier 1',
    title: 'Retargeting Creative Set · Tier 1',
    type: 'Content',
    engine: 'CastraLM-V4',
    author: 'Tyler Brooks',
    authorId: 'mem-014',
    authorRole: 'Employee',
    authorInitials: 'TB',
    createdDate: 'Oct 23, 2026 16:40:00 UTC',
    submittedAt: '2026-10-23T16:40:00Z',
    workspace: 'Acme Corp',
    status: 'approved',
    version: 'v1.0',
    targetChannel: 'Meta Ads & Pinterest',
    campaignContext: 'Dynamic product ad set with localized customer reviews.',
    primaryHeadline: 'Over 10,000 Athletes Switched This Season',
    primaryBodyCopy: 'Engineered for durability under extreme training conditions.',
    cta: 'Explore Rated Gear',
    conversionTarget: 'Social Storefront',
    keywords: ['retargeting', 'customer proof', 'performance'],
    revisionNote: 'Approved for activation by David Kross.',
    noticeText: 'Approved proposal ready for execution.',
  },
  {
    id: 'PRP-8405',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-lifecycle-04',
    groupName: 'Lifecycle & Retention',
    name: 'Post-Purchase VIP Onboarding Flow',
    title: 'Post-Purchase VIP Onboarding Flow',
    type: 'Content',
    engine: 'CastraLM-V4',
    author: 'Maya Lin',
    authorId: 'mem-013',
    authorRole: 'Employee',
    authorInitials: 'ML',
    createdDate: 'Oct 22, 2026 09:20:00 UTC',
    submittedAt: '2026-10-22T09:20:00Z',
    workspace: 'Acme Corp',
    status: 'rejected',
    version: 'v1.0',
    targetChannel: 'SMS & Email Automation',
    campaignContext: 'Onboarding VIP tier buyers with specialized loyalty credits.',
    primaryHeadline: 'Welcome to the Inner Circle',
    primaryBodyCopy: 'Your premium membership includes 24/7 styling consultations and early access to new drops.',
    cta: 'Activate VIP Perks',
    conversionTarget: 'Loyalty Portal',
    keywords: ['loyalty', 'retention', 'vip'],
    revisionNote: 'Rejected due to budget constraints on SMS delivery.',
    noticeText: 'Proposal rejected. Revision requested.',
  },
  {
    id: 'PRP-8399',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-performance-02',
    groupName: 'Performance & Paid Ads',
    name: 'Q4 Search Impression Cap Uplift',
    title: 'Q4 Search Impression Cap Uplift',
    type: 'Budget',
    engine: 'CastraBudget-Opt',
    author: 'Sarah Jenkins',
    authorId: 'mem-001',
    authorRole: 'Company Admin',
    authorInitials: 'SJ',
    createdDate: 'Oct 23, 2026',
    submittedAt: '2026-10-23T10:00:00Z',
    workspace: 'Acme Corp',
    status: 'approved',
    version: 'v1.0',
    targetChannel: 'Google Search Pacing',
    totalRequested: 20000,
    budgetCap: 25000,
    spendDelta: 3500,
    channels: [{ name: 'Google Search Ads', current: 16500, proposed: 20000 }],
    campaignContext: 'Impression share expansion during peak search query volume window.',
    primaryHeadline: 'Scale High-Intent Keyword Capture',
    primaryBodyCopy: 'Expand daily budget pacing across brand and non-brand keywords.',
    cta: 'Approve Budget',
    conversionTarget: 'Search Ads Network',
    keywords: ['search', 'impression share', 'pacing'],
    revisionNote: 'Approved by Sarah Jenkins.',
    noticeText: 'Approved budget reallocation.',
  },
  {
    id: 'PRP-8395',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-growth-01',
    groupName: 'Growth Marketing',
    name: 'TikTok Micro-Influencer Discovery Spike',
    title: 'TikTok Micro-Influencer Discovery Spike',
    type: 'Content',
    engine: 'CastraLM-V4',
    author: 'Sarah Jenkins',
    authorId: 'mem-001',
    authorRole: 'Campaign Lead',
    authorInitials: 'SJ',
    createdDate: 'Oct 23, 2026 · 11:05 UTC',
    submittedAt: '2026-10-23T11:05:00Z',
    relativeTime: '1 day ago',
    workspace: 'Acme Corp',
    status: 'rejected',
    statusLabel: 'Rejected',
    version: 'v1.0 (AI Draft)',
    targetChannel: 'TikTok Creator Network',
    campaignContext: 'Discovery campaign for emerging fitness creators.',
    primaryHeadline: 'Discovery campaign for emerging fitness',
    primaryBodyCopy: 'Direct creator partnership program targeting sub-100k fitness accounts.',
    cta: 'Fund Program',
    conversionTarget: 'Creator Network',
    keywords: ['tiktok', 'influencers', 'seeding'],
    revisionNote: 'Reason: Demographic & Tone Mismatch',
    noticeText: 'Reason: Demographic & Tone Mismatch. Proposal rejected.',
    metaText: 'Reason: Demographic & Tone Mismatch',
  },
  {
    id: 'PRP-8398',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-growth-01',
    groupName: 'Growth Marketing',
    name: 'Activewear Compression Line - Social Teaser',
    title: 'Activewear Compression Line - Social Teaser',
    type: 'Content',
    engine: 'CastraLM-V4',
    author: 'Elena Rostova',
    authorId: 'mem-003',
    authorRole: 'Marketing Lead',
    authorInitials: 'ER',
    createdDate: 'Oct 24, 2026 · 09:15 UTC',
    submittedAt: '2026-10-24T09:15:00Z',
    relativeTime: '3 hrs ago',
    workspace: 'Acme Corp',
    status: 'pending',
    statusLabel: 'Pending Signoff',
    version: 'v1.1 (Modified v2)',
    targetChannel: 'Instagram & TikTok',
    campaignContext: 'Short-form video teaser script and carousel copy for Q4 launch.',
    primaryHeadline: '“Short-form video teaser script and carousel copy for Q4 launch”',
    primaryBodyCopy: 'Engineered gradient compression designed to accelerate recovery and support endurance during high-cadence training sessions.',
    cta: 'Watch Teaser',
    conversionTarget: 'Social Storefront',
    keywords: ['compression', 'social teaser', 'q4 launch'],
    revisionNote: 'Human-modified draft v1.1. Verified by Elena Rostova.',
    noticeText: 'Human-modified draft v1.1. Verified by Elena Rostova.',
    metaText: 'Target: Instagram & TikTok',
  },
  {
    id: 'PRP-8390',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-performance-02',
    groupName: 'Performance & Paid Ads',
    name: 'Q4 Top-of-Funnel Search Expansion',
    title: 'Q4 Top-of-Funnel Search Expansion',
    type: 'Budget',
    engine: 'CastraBudget-Opt',
    author: 'Engine Agent [Beta]',
    authorId: 'agent-bot',
    authorRole: 'Automated Pipeline',
    authorInitials: 'bot',
    createdDate: 'Oct 21, 2026 · 09:20 UTC',
    submittedAt: '2026-10-21T09:20:00Z',
    relativeTime: '3 days ago',
    workspace: 'Acme Corp',
    status: 'approved',
    statusLabel: 'Approved',
    version: 'v1.0 (AI Draft)',
    targetChannel: 'Google Search Pacing',
    totalRequested: 18500,
    budgetCap: 25000,
    spendDelta: 3500,
    campaignContext: 'High-intent keyword bid expansion on brand search terms.',
    primaryHeadline: 'High-intent keyword bid expansion on search inventory',
    primaryBodyCopy: 'Captures excess peak season search demand with dynamic bid caps.',
    cta: 'Approve Budget',
    conversionTarget: 'Search Ads Network',
    keywords: ['search', 'impression share', 'pacing'],
    revisionNote: 'Approved by David Kross.',
    noticeText: 'Budget Allocated: $18,500/mo',
    metaText: 'Budget Allocated: $18,500/mo',
  },
  {
    id: 'PRP-8388',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-growth-01',
    groupName: 'Growth Marketing',
    name: 'Fall Lookbook Social Carousel',
    title: 'Fall Lookbook Social Carousel',
    type: 'Content',
    engine: 'CastraLM-V4',
    author: 'Alex Mercer',
    authorId: 'mem-005',
    authorRole: 'Employee',
    authorInitials: 'AM',
    createdDate: 'Oct 20, 2026 · 15:30 UTC',
    submittedAt: '2026-10-20T15:30:00Z',
    relativeTime: '4 days ago',
    workspace: 'Acme Corp',
    status: 'approved',
    statusLabel: 'Approved',
    version: 'v1.0 (AI Draft)',
    targetChannel: 'Instagram Feed',
    campaignContext: 'Seasonal outfit showcase across top-performing demographics.',
    primaryHeadline: 'Transition Seamlessly: The New Fall Essentials',
    primaryBodyCopy: 'Explore layers designed for unpredictable weather and effortless style.',
    cta: 'View Lookbook',
    conversionTarget: 'Social Storefront',
    keywords: ['fall lookbook', 'apparel', 'carousel'],
    revisionNote: 'Approved for distribution.',
    noticeText: 'Dispatched to Instagram',
    metaText: 'Dispatched to Instagram',
  },
  {
    id: 'PRP-8385',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-performance-02',
    groupName: 'Performance & Paid Ads',
    name: 'Weekend Flash Sale Bid Multiplier',
    title: 'Weekend Flash Sale Bid Multiplier',
    type: 'Budget',
    engine: 'CastraBudget-Opt',
    author: 'Tyler Brooks',
    authorId: 'mem-014',
    authorRole: 'Employee',
    authorInitials: 'TB',
    createdDate: 'Oct 19, 2026 · 18:00 UTC',
    submittedAt: '2026-10-19T18:00:00Z',
    relativeTime: '5 days ago',
    workspace: 'Acme Corp',
    status: 'approved',
    statusLabel: 'Approved',
    version: 'v1.0 (Autonomous)',
    targetChannel: 'Meta Ads & Google Shopping',
    totalRequested: 8200,
    budgetCap: 10000,
    spendDelta: 2000,
    campaignContext: 'Dynamic bid surging for 48-hour promotional period.',
    primaryHeadline: 'Dynamic 48-Hour Conversion Window Multipliers',
    primaryBodyCopy: 'Automates weekend surge bidding across top 5 revenue-generating ad sets.',
    cta: 'Authorize Shift',
    conversionTarget: 'Shopping Feed',
    keywords: ['flash sale', 'bid multiplier', 'weekend promo'],
    revisionNote: 'Approved by David Kross.',
    noticeText: 'Budget Allocated: $8,200',
    metaText: 'Budget Allocated: $8,200',
  },
  {
    id: 'PRP-8380',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-growth-01',
    groupName: 'Growth Marketing',
    name: 'Q4 Omnichannel Acquisition Roadmap',
    title: 'Q4 Omnichannel Acquisition Roadmap',
    type: 'Strategy',
    engine: 'CastraStrategy-V2',
    author: 'Carlos Mendez',
    authorId: 'mem-010',
    authorRole: 'Employee',
    authorInitials: 'CM',
    createdDate: 'Oct 18, 2026 · 11:20 UTC',
    submittedAt: '2026-10-18T11:20:00Z',
    relativeTime: '6 days ago',
    workspace: 'Acme Corp',
    status: 'approved',
    statusLabel: 'Approved',
    version: 'v1.0 (AI Draft)',
    targetChannel: 'Enterprise Strategy',
    campaignContext: 'Quarterly strategic alignment for growth and performance channels.',
    primaryHeadline: 'Consolidated Growth Vectors for Q4 Holiday Peak',
    primaryBodyCopy: 'Establishes unified messaging pillars and audience segmentation rules for multi-touch attribution.',
    cta: 'Adopt Strategy',
    conversionTarget: 'Omnichannel Playbook',
    keywords: ['acquisition roadmap', 'q4 strategy', 'growth vectors'],
    revisionNote: 'Executive signoff complete.',
    noticeText: 'Approved for Execution',
    metaText: 'Approved for Execution',
  },
  {
    id: 'PRP-8392',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-performance-02',
    groupName: 'Performance & Paid Ads',
    name: 'Late-Night Bidding Surge Experiment',
    title: 'Late-Night Bidding Surge Experiment',
    type: 'Budget',
    engine: 'CastraBudget-Opt',
    author: 'Tyler Brooks',
    authorId: 'mem-014',
    authorRole: 'Employee',
    authorInitials: 'TB',
    createdDate: 'Oct 21, 2026 · 02:40 UTC',
    submittedAt: '2026-10-21T02:40:00Z',
    relativeTime: '3 days ago',
    workspace: 'Acme Corp',
    status: 'rejected',
    statusLabel: 'Rejected',
    version: 'v1.0 (Autonomous)',
    targetChannel: 'Google Search Ads',
    totalRequested: 12000,
    budgetCap: 10000,
    spendDelta: 2500,
    campaignContext: 'Off-peak conversion capture experimentation.',
    primaryHeadline: 'Off-Peak Search Query Bidding Experiment',
    primaryBodyCopy: 'Increases bid limits by 35% during 23:00 to 04:00 hours.',
    cta: 'Execute Shift',
    conversionTarget: 'Search Network',
    keywords: ['off-peak', 'bid surge', 'experiment'],
    revisionNote: 'Reason: Cost per Acquisition Threshold Exceeded',
    noticeText: 'Reason: Cost per Acquisition Threshold Exceeded. Rejected.',
    metaText: 'Reason: Cost per Acquisition Threshold Exceeded',
  },
  {
    id: 'PRP-8406',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-brand-03',
    groupName: 'Brand & Creative Content',
    name: 'Brand Heritage Mini-Doc Campaign',
    title: 'Brand Heritage Mini-Doc Campaign',
    type: 'Content',
    engine: 'CastraLM-V4',
    author: 'Chloe Nguyen',
    authorId: 'mem-006',
    authorRole: 'Employee',
    authorInitials: 'CN',
    createdDate: 'Oct 24, 2026 · 10:00 UTC',
    submittedAt: '2026-10-24T10:00:00Z',
    relativeTime: '4 hrs ago',
    workspace: 'Acme Corp',
    status: 'pending',
    statusLabel: 'Pending Signoff',
    version: 'v1.0 (AI Draft)',
    targetChannel: 'YouTube & Brand Hub',
    campaignContext: 'Documentary-style spotlight on sustainable textile production.',
    primaryHeadline: 'Crafted with Integrity: The Thread Behind the Brand',
    primaryBodyCopy: 'Go behind the scenes at our solar-powered manufacturing partners.',
    cta: 'Discover the Story',
    conversionTarget: 'Brand Hub',
    keywords: ['brand heritage', 'sustainability', 'documentary'],
    revisionNote: 'Draft prepared for manager review.',
    noticeText: 'Pending review by Elena Rostova.',
    metaText: 'Target: YouTube & Brand Hub',
  },
  {
    id: 'PRP-8407',
    companyId: 'comp-acme-global',
    workspaceId: 'ws-acme-8920',
    groupId: 'grp-lifecycle-04',
    groupName: 'Lifecycle & Retention',
    name: 'Dormant Account Reactivation SMS',
    title: 'Dormant Account Reactivation SMS',
    type: 'Content',
    engine: 'CastraLM-V4',
    author: 'Maya Lin',
    authorId: 'mem-013',
    authorRole: 'Employee',
    authorInitials: 'ML',
    createdDate: 'Oct 23, 2026 · 14:00 UTC',
    submittedAt: '2026-10-23T14:00:00Z',
    relativeTime: '1 day ago',
    workspace: 'Acme Corp',
    status: 'approved',
    statusLabel: 'Approved',
    version: 'v1.0 (AI Draft)',
    targetChannel: 'SMS Broadcast',
    campaignContext: 'Targeted re-engagement for users inactive > 60 days.',
    primaryHeadline: 'We Saved Your Cart: Exclusive 15% VIP Return Credit',
    primaryBodyCopy: 'Use code WELCOMEBACK15 on your next order before midnight Sunday.',
    cta: 'Reclaim Cart',
    conversionTarget: 'SMS Landing Page',
    keywords: ['reactivation', 'sms', 'retention'],
    revisionNote: 'Approved by Elena Rostova.',
    noticeText: 'Dispatched to SMS gateway.',
    metaText: 'Dispatched to SMS Broadcast',
  },
]

// ─── RUNTIME STATE & REACT EXTERNAL STORE (SINGLE SOURCE OF TRUTH) ─────────
let _activeMarketingGroups = [...INITIAL_MARKETING_GROUPS]
let _activeManagerAssignments = [...INITIAL_MANAGER_ASSIGNMENTS]
let _activeGroupMemberships = [...INITIAL_GROUP_MEMBERSHIPS]
let _activeProposals = [...INITIAL_PROPOSALS]

const _subscribers = new Set()

function _notify() {
  _subscribers.forEach(cb => {
    try {
      cb()
    } catch {
      // Suppress subscriber errors
    }
  })
}

export function subscribeToMarketingStore(callback) {
  _subscribers.add(callback)
  return () => _subscribers.delete(callback)
}

export function notifyStoreSubscribers() {
  _notify()
}

// ─── Authoritative State Selectors ───────────────────────────────────────────

export function getActiveMarketingGroups() {
  return _activeMarketingGroups
}

export function getActiveManagerAssignments() {
  return _activeManagerAssignments
}

export function getActiveProposals() {
  return _activeProposals
}

export function getActiveGroupMemberships() {
  return _activeGroupMemberships
}

// ─── Store Mutation Primitives ───────────────────────────────────────────────

export function setStoreMarketingGroups(updaterOrList) {
  if (typeof updaterOrList === 'function') {
    _activeMarketingGroups = updaterOrList(_activeMarketingGroups)
  } else {
    _activeMarketingGroups = [...updaterOrList]
  }
  _notify()
  return _activeMarketingGroups
}

export function setStoreManagerAssignments(updaterOrList) {
  if (typeof updaterOrList === 'function') {
    _activeManagerAssignments = updaterOrList(_activeManagerAssignments)
  } else {
    _activeManagerAssignments = [...updaterOrList]
  }
  _notify()
  return _activeManagerAssignments
}

export function setStoreProposals(updaterOrList) {
  if (typeof updaterOrList === 'function') {
    _activeProposals = updaterOrList(_activeProposals)
  } else {
    _activeProposals = [...updaterOrList]
  }
  _notify()
  return _activeProposals
}

export function updateStoreProposalByIndex(index, updatedProposal) {
  if (index >= 0 && index < _activeProposals.length) {
    _activeProposals[index] = updatedProposal
    _notify()
    return true
  }
  return false
}

export function setStoreGroupMemberships(updaterOrList) {
  if (typeof updaterOrList === 'function') {
    _activeGroupMemberships = updaterOrList(_activeGroupMemberships)
  } else {
    _activeGroupMemberships = [...updaterOrList]
  }
  _notify()
  return _activeGroupMemberships
}

/**
 * Resets the shared runtime store to initial seed data (for test isolation).
 */
export function resetMarketingStore() {
  _activeMarketingGroups = [...INITIAL_MARKETING_GROUPS]
  _activeManagerAssignments = [...INITIAL_MANAGER_ASSIGNMENTS]
  _activeGroupMemberships = [...INITIAL_GROUP_MEMBERSHIPS]
  _activeProposals = [...INITIAL_PROPOSALS]
  _notify()
}

/**
 * React Hook: Returns reactive live Marketing Groups array.
 */
export function useMarketingGroups() {
  return useSyncExternalStore(subscribeToMarketingStore, getActiveMarketingGroups)
}

/**
 * React Hook: Returns reactive live Manager Assignments array.
 */
export function useManagerAssignments() {
  return useSyncExternalStore(subscribeToMarketingStore, getActiveManagerAssignments)
}

/**
 * React Hook: Returns reactive live Proposals array.
 */
export function useProposals() {
  return useSyncExternalStore(subscribeToMarketingStore, getActiveProposals)
}

