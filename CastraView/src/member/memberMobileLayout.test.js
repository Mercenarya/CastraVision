import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const stylesheet = readFileSync(new URL('./ui/member.css', import.meta.url), 'utf8')

function zIndexFor(selector) {
  const match = stylesheet.match(
    new RegExp(`${selector} \\{[^}]*z-index: (\\d+)`, 's'),
  )
  return Number(match?.[1])
}

test('mobile member drawer stays above its scrim for keyboard and pointer access', () => {
  const scrimZIndex = zIndexFor('\\.member-shell__scrim')
  const sidebarZIndex = zIndexFor('\\.member-shell__sidebar')

  assert.ok(Number.isFinite(scrimZIndex))
  assert.ok(Number.isFinite(sidebarZIndex))
  assert.ok(sidebarZIndex > scrimZIndex)
})

test('member workspace uses the reference font pairing and compact proposal filters', () => {
  assert.match(stylesheet, /font-family:\s*Inter, sans-serif/)
  assert.match(stylesheet, /\.member-shell \.member-toolbar select\s*\{[^}]*width:\s*auto/s)
  assert.match(stylesheet, /\.member-shell \.member-toolbar select\s*\{[^}]*min-width:\s*180px/s)
})

test('overview provides Stitch-like preview content without connecting it to account records', async () => {
  const source = readFileSync(new URL('./ui/MemberOverview.jsx', import.meta.url), 'utf8')
  const preview = await import('./memberDashboardMockData.js')

  for (const heading of [
    'My Priority Tasks',
    'My Recent Submissions',
    'My Assigned Campaigns',
    'AI Content Studio',
    'AI Work Assistant',
    'Current Sprint Velocity',
  ]) {
    assert.ok(source.includes(heading), `missing Overview section: ${heading}`)
  }

  assert.deepEqual(preview.memberDashboardPreview.metrics.map(({ title }) => title), [
    'My Assigned Tasks',
    'Tasks Completed',
    'Pending Submissions',
    'Revisions Req.',
    'Sprint Deadline',
  ])
  assert.match(source, /Preview data · not account activity/)
  assert.match(source, /memberDashboardPreview/)
  assert.ok(preview.memberDashboardPreview.tasks.length > 0)
  assert.ok(preview.memberDashboardPreview.submissions.length > 0)
  assert.ok(preview.memberDashboardPreview.campaigns.length > 0)
  assert.match(stylesheet, /\.member-dashboard-ref__metrics\s*\{[^}]*grid-template-columns:\s*repeat\(5,/s)
})

