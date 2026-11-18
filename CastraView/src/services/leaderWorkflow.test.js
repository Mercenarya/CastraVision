import { describe, expect, it } from 'vitest'
import { budgetExceedsLimit, csvText, money } from './leaderWorkflowContract'

describe('Leader persisted workflow presentation', () => {
  it('does not render missing or nonfinite budgets as money', () => {
    expect(money(undefined, 'USD')).toBe('—')
    expect(money(Number.NaN, 'USD')).toBe('—')
    expect(money('', 'USD')).toBe('—')
    expect(money(100, 'invalid')).toBe('—')
    expect(money(100, 'USD')).toContain('100')
  })
  it('shows the server-equivalent threshold including a zero baseline', () => {
    expect(budgetExceedsLimit([{ current: 100, proposed: 120 }])).toBe(false)
    expect(budgetExceedsLimit([{ current: 100, proposed: 121 }])).toBe(true)
    expect(budgetExceedsLimit([{ current: 0, proposed: 1 }])).toBe(true)
    expect(budgetExceedsLimit([{ current: 0, proposed: 0 }])).toBe(false)
  })
  it('escapes CSV structure and formula cells', () => {
    const csv = csvText(['Name', 'Value'], [['A,"B\nC', '=1+2'], ['@SUM(A1)', 12]])
    expect(csv).toContain('"A,""B\nC"')
    expect(csv).toContain('"\'=1+2"')
    expect(csv).toContain('"\'@SUM(A1)"')
  })
})
