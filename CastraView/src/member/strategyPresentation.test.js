import assert from 'node:assert/strict'
import { test } from 'node:test'

import { deriveStrategyPresentation } from './strategyPresentation.js'

test('strategy presentation derives sections only from the real strategy response', () => {
  const result = deriveStrategyPresentation({
    strategy: {
      confidence: 91,
      rationale: 'Use high-intent channels.',
      message: 'A useful message',
      segment: 'Returning customers',
      recommended_channel: 'Search',
      budget_allocation: [{ channel: 'Search', percentage: 70 }],
      actions: ['Review search terms'],
    },
    context_sources: ['campaign-import'],
  }, 2000)

  assert.equal(result.confidence, 91)
  assert.equal(result.recommendedChannel, 'Search')
  assert.equal(result.allocation[0].amount, 1400)
  assert.deepEqual(result.actions, ['Review search terms'])
  assert.equal(deriveStrategyPresentation(null, 2000), null)
})
