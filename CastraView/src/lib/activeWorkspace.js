const KEY_PREFIX = 'castravision.active-workspace.'

export function activeWorkspaceKey(userId) {
  return `${KEY_PREFIX}${userId}`
}

export function getActiveWorkspaceId(userId) {
  if (!userId || typeof window === 'undefined') return null
  return window.localStorage.getItem(activeWorkspaceKey(userId))
}

export function setActiveWorkspaceId(userId, workspaceId) {
  if (!userId || typeof window === 'undefined') return
  if (workspaceId) window.localStorage.setItem(activeWorkspaceKey(userId), workspaceId)
  else window.localStorage.removeItem(activeWorkspaceKey(userId))
}
