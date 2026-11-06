export function resolveMemberOverviewState({ status, proposals = [] }) {
  if (status === 'loading') return 'loading'
  if (status === 'error') return 'error'
  if (status !== 'loaded') return 'demo'
  return proposals.length > 0 ? 'populated' : 'empty'
}
