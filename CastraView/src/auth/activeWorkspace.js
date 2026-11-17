const key = userId => `castravision:active-workspace:${userId}`
export function getActiveWorkspaceId(userId) {
  try { return localStorage.getItem(key(userId)) } catch { return null }
}
export function setActiveWorkspaceId(userId, workspaceId) {
  try {
    if (workspaceId) localStorage.setItem(key(userId), workspaceId)
    else localStorage.removeItem(key(userId))
  } catch { /* The server still verifies membership when storage is unavailable. */ }
}
