export const PROPOSAL_CHARACTER_LIMITS = {
  headline: 90,
  body: 280,
}

export const CAMPAIGN_PLATFORMS = [
  {
    id: 'tiktok',
    name: 'TikTok Business',
    description: 'Spark Ads, Feed Video Ads, and Creator In-Feed amplification for Gen Z demographic.',
    integration: 'Example integration metadata',
    status: 'Preview only',
    icon: '♪',
  },
  {
    id: 'meta',
    name: 'Meta Ads',
    description: 'Facebook & Instagram Feed, Reels, and Carousel campaigns with Advantage+ targeting.',
    integration: 'Example integration metadata',
    status: 'Preview only',
    icon: '◎',
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Performance Max, Search High-Intent, and YouTube Video Action campaigns.',
    integration: 'Example integration metadata',
    status: 'Preview only',
    icon: 'G',
  },
]

export function createProposalDraft() {
  return {
    classification: 'content',
    title: '',
    campaign: '',
    channel: 'meta-ads',
    headline: '',
    body: '',
    cta: '',
    reviewerNotes: '',
  }
}
