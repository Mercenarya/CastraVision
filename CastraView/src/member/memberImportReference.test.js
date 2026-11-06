import assert from 'node:assert/strict'
import test from 'node:test'

import { importHistoryReference, importValidationReference } from './memberImportReference.js'

test('campaign import Stitch examples are labeled and never treated as imported records', () => {
  assert.equal(importValidationReference.isExample, true)
  assert.match(importValidationReference.label, /illustrative/i)
  assert.equal(importValidationReference.rowCount, 1420)
  assert.equal(importValidationReference.errorCount, 0)
  assert.equal(importHistoryReference.length, 4)
  assert.ok(importHistoryReference.every((record) => record.isExample && record.filename && record.campaign))
  assert.ok(importHistoryReference.every((record) => record.status !== 'Imported'))
})
