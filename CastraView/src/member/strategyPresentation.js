export function deriveStrategyPresentation(result, budget) {
  const strategy = result?.strategy
  if (!strategy) return null

  const allocation = Array.isArray(strategy.budget_allocation)
    ? strategy.budget_allocation
    : []
  const actions = Array.isArray(strategy.actions) ? strategy.actions : []

  return {
    confidence: Number(strategy.confidence) || 0,
    rationale: strategy.rationale || '',
    message: strategy.message || '',
    segment: strategy.segment || '',
    recommendedChannel: strategy.recommended_channel || allocation[0]?.channel || '',
    allocation: allocation.map((item) => ({
      channel: item.channel || 'Unspecified channel',
      percentage: Number(item.percentage) || 0,
      amount: (Number(budget) || 0) * (Number(item.percentage) || 0) / 100,
    })),
    actions,
    sources: Array.isArray(result.context_sources) ? result.context_sources : [],
  }
}
