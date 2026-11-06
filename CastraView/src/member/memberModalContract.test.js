import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CAMPAIGN_PLATFORMS,
  PROPOSAL_CHARACTER_LIMITS,
  createProposalDraft,
} from './memberModalContract.js'

test('proposal draft starts blank and honors reference character limits', () => {
  const draft = createProposalDraft()

  assert.equal(draft.title, '')
  assert.equal(draft.headline, '')
  assert.equal(draft.body, '')
  assert.equal(draft.cta, '')
  assert.equal(PROPOSAL_CHARACTER_LIMITS.headline, 90)
  assert.equal(PROPOSAL_CHARACTER_LIMITS.body, 280)
})

test('campaign platform selection defaults to TikTok and exposes all reference platforms', () => {
  assert.equal(CAMPAIGN_PLATFORMS[0].id, 'tiktok')
  assert.deepEqual(CAMPAIGN_PLATFORMS.map(({ name }) => name), [
    'TikTok Business',
    'Meta Ads',
    'Google Ads',
  ])
})
