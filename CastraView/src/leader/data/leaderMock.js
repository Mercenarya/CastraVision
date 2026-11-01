export const DASHBOARD_KPIS = [
  { label: 'Active campaigns', value: '12', change: '+2', detail: 'vs last period', tone: 'violet' },
  { label: 'Pending reviews', value: '8', change: '+3', detail: 'need attention', tone: 'coral' },
  { label: 'Blended ROAS', value: '4.2×', change: '+0.6×', detail: 'vs last period', tone: 'green' },
  { label: 'Monthly spend', value: '$48.2k', change: '+12.4%', detail: 'vs last period', tone: 'cyan' },
  { label: 'Overdue tasks', value: '2', change: '-4', detail: 'vs last period', tone: 'green' },
]

export const PERFORMANCE_BARS = [
  { day: 'May 01', spend: 58, return: 43 },
  { day: 'May 05', spend: 72, return: 54 },
  { day: 'May 09', spend: 48, return: 38 },
  { day: 'May 13', spend: 76, return: 63 },
  { day: 'May 17', spend: 62, return: 52 },
  { day: 'May 21', spend: 86, return: 68 },
  { day: 'May 25', spend: 74, return: 61 },
  { day: 'May 30', spend: 92, return: 78 },
]

export const TEAM_EXECUTION = [
  { initials: 'SL', name: 'Sarah Lee', task: 'Content review', progress: 88, status: 'On track', tone: 'coral' },
  { initials: 'MK', name: 'Marcus Kim', task: 'Campaign analysis', progress: 72, status: 'On track', tone: 'violet' },
  { initials: 'JP', name: 'Jordan Park', task: 'Creative delivery', progress: 54, status: '2 days left', tone: 'cyan' },
  { initials: 'CE', name: 'Creative Engine', task: 'Asset production', progress: 36, status: 'Needs help', tone: 'amber' },
]

export const PENDING_REVIEWS = [
  { id: 'PRP-8402', title: 'Q2 Product Story · Social', type: 'Content', submittedBy: 'Sarah Lee', submitted: '18 min ago', status: 'Pending' },
  { id: 'PRP-8403', title: 'Retargeting Creative Set B', type: 'Creative', submittedBy: 'Creative Engine', submitted: '42 min ago', status: 'Pending' },
  { id: 'PRP-8404', title: 'Lifecycle Email · Re-engagement', type: 'Content', submittedBy: 'Marcus Kim', submitted: '1 hr ago', status: 'Needs review' },
  { id: 'PRP-8405', title: 'Summer Launch · Channel Mix', type: 'Campaign', submittedBy: 'AI Strategy Studio', submitted: '2 hrs ago', status: 'Pending' },
]

export const CAMPAIGNS = [
  { name: 'Summer Launch', channel: 'Meta Ads', owner: 'Sarah Lee', spend: '$18,400', roas: '4.8×', progress: 86, status: 'On track', next: 'Creative review' },
  { name: 'Search Intent', channel: 'Google Ads', owner: 'Marcus Kim', spend: '$12,250', roas: '4.4×', progress: 72, status: 'On track', next: 'Budget check' },
  { name: 'Brand Story', channel: 'TikTok', owner: 'Jordan Park', spend: '$7,600', roas: '3.1×', progress: 54, status: 'Needs attention', next: 'Refresh hooks' },
]

export const PROPOSALS = [
  { id: 'PRP-8402', title: 'Q2 Product Story · Social', type: 'Content', author: 'Sarah Lee', submitted: '18 min ago', date: '2026-05-30', status: 'pending', channel: 'Meta Ads', confidence: '94%' },
  { id: 'PRP-8403', title: 'Retargeting Creative Set B', type: 'Creative', author: 'Creative Engine', submitted: '42 min ago', date: '2026-05-30', status: 'pending', channel: 'Google Ads', confidence: '91%' },
  { id: 'PRP-8404', title: 'Lifecycle Email · Re-engagement', type: 'Content', author: 'Marcus Kim', submitted: '1 hr ago', date: '2026-05-30', status: 'edited', channel: 'Email', confidence: '88%' },
  { id: 'PRP-8405', title: 'Summer Launch · Channel Mix', type: 'Campaign', author: 'AI Strategy Studio', submitted: '2 hrs ago', date: '2026-05-30', status: 'pending', channel: 'Multi-channel', confidence: '96%' },
  { id: 'PRP-8401', title: 'Brand Awareness · Video Cut', type: 'Creative', author: 'Jordan Park', submitted: 'Yesterday', date: '2026-05-29', status: 'approved', channel: 'TikTok', confidence: '93%' },
  { id: 'PRP-8399', title: 'Spring Retention · Email Set', type: 'Content', author: 'Sarah Lee', submitted: 'Yesterday', date: '2026-05-29', status: 'approved', channel: 'Email', confidence: '90%' },
  { id: 'PRP-8398', title: 'Performance Max Refresh', type: 'Campaign', author: 'AI Strategy Studio', submitted: '2 days ago', date: '2026-05-28', status: 'rejected', channel: 'Google Ads', confidence: '72%' },
  { id: 'PRP-8397', title: 'Founder Story · Cut A', type: 'Creative', author: 'Jordan Park', submitted: '3 days ago', date: '2026-05-27', status: 'signed', channel: 'Meta Ads', confidence: '97%' },
]

export function proposalStatusLabel(status) {
  return {
    pending: 'Pending',
    edited: 'Needs review',
    approved: 'Approved',
    rejected: 'Rejected',
    signed: 'Recently signed',
  }[status] || status
}

export function proposalTypeIcon(type) {
  return type === 'Content' ? '✦' : type === 'Creative' ? '◈' : '◉'
}
