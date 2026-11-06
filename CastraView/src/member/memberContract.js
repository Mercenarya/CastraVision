export const MEMBER_NAV_ITEMS = [
  { key: 'overview', icon: 'dashboard', label: 'Overview' },
  { key: 'proposals', icon: 'description', label: 'My Proposals' },
  { key: 'campaigns', icon: 'campaign', label: 'Campaigns' },
  { key: 'strategy', icon: 'explore', label: 'Strategy Studio' },
  { key: 'content', icon: 'auto_awesome', label: 'Content Gen' },
  { key: 'import', icon: 'cloud_upload', label: 'Campaign Import' },
  { key: 'notifications', icon: 'notifications', label: 'Notifications' },
  { key: 'account', icon: 'settings', label: 'Account Settings' },
]

const MEMBER_PAGE_KEYS = new Set([...MEMBER_NAV_ITEMS.map((item) => item.key), 'notifications'])

export function normalizeMemberPage(page) {
  if (page === 'member-dashboard') return 'overview'
  if (page === 'profile') return 'account'
  return MEMBER_PAGE_KEYS.has(page) ? page : 'overview'
}

export function getMemberPageLabel(page) {
  const normalizedPage = normalizeMemberPage(page)
  if (normalizedPage === 'notifications') return 'Notifications'
  return MEMBER_NAV_ITEMS.find((item) => item.key === normalizedPage)?.label || 'Overview'
}

export function getMemberPageFromHash(hash) {
  const page = hash.startsWith('#member/') ? hash.slice('#member/'.length) : ''
  if (page === 'profile') return 'profile'
  return normalizeMemberPage(page)
}

export function getMemberPageHash(page) {
  const pageKey = page === 'profile' ? page : normalizeMemberPage(page)
  return `#member/${pageKey}`
}
