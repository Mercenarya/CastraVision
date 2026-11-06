import assert from 'node:assert/strict'
import test from 'node:test'

import { strategyStudioReference } from './strategyStudioReference.js'

test('strategy preview fixture is explicitly non-operational and covers Stitch sections', () => {
  assert.match(strategyStudioReference.label, /illustrative/i)
  assert.match(strategyStudioReference.label, /not generated or account data/i)
  assert.equal(strategyStudioReference.channelAllocations.reduce((sum, item) => sum + item.percentage, 0), 100)
  assert.equal(strategyStudioReference.contentPillars.length, 3)
  assert.equal(strategyStudioReference.budgetTiers.length, 3)
  assert.equal(strategyStudioReference.safeguards.length, 2)
  assert.ok(strategyStudioReference.channelAllocations.every((item) => item.amount.includes('example')))
})
