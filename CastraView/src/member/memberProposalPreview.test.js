import assert from 'node:assert/strict'
import test from 'node:test'

import { proposalReferencePreview } from './memberProposalPreview.js'

test('proposal reference metrics and manager feedback are explicitly preview-only', () => {
  assert.match(proposalReferencePreview.label, /preview|example/i)
  assert.match(proposalReferencePreview.disclaimer, /not account|not real/i)
  assert.equal(proposalReferencePreview.rows.length, 4)
  assert.equal(proposalReferencePreview.rows[0].id, 'PRP-8402')
  assert.equal(proposalReferencePreview.priorityFeedback.proposalId, 'PRP-8402')
  assert.equal(proposalReferencePreview.priorityFeedback.isExample, true)
})
