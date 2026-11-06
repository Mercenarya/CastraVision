import assert from 'node:assert/strict'
import test from 'node:test'

import { proposalDetailsReferencePreview } from './memberProposalDetailsPreview.js'

test('proposal details reference payload is explicitly illustrative and read-only', () => {
  assert.equal(proposalDetailsReferencePreview.isExample, true)
  assert.match(proposalDetailsReferencePreview.disclaimer, /not an account record/i)
  assert.equal(proposalDetailsReferencePreview.id, 'PRP-8402')
  assert.ok(proposalDetailsReferencePreview.variants.length >= 2)
  assert.ok(proposalDetailsReferencePreview.history.length >= 1)
  const historyIds = proposalDetailsReferencePreview.history.map((event) => event.id)
  assert.ok(historyIds.every((id) => typeof id === 'string' && id.length > 0))
  assert.equal(new Set(historyIds).size, historyIds.length)
  assert.equal(proposalDetailsReferencePreview.canSubmitRevision, false)
})
