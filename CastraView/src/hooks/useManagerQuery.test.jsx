import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useManagerQuery } from './useManagerQuery'

describe('manager workspace reads', () => {
  it('clears previous workspace data immediately and ignores its late response', async () => {
    let finishA
    const a = vi.fn(() => new Promise(resolve => { finishA = resolve }))
    const b = vi.fn(async () => ({ workspace: 'B' }))
    const view = renderHook(({ workspace, load }) => useManagerQuery(workspace, load), { initialProps: { workspace: 'A', load: a } })
    await waitFor(() => expect(a).toHaveBeenCalledOnce())
    view.rerender({ workspace: 'B', load: b })
    expect(view.result.current.data).toBeNull()
    await waitFor(() => expect(view.result.current.data).toEqual({ workspace: 'B' }))
    await act(async () => finishA({ workspace: 'A' }))
    expect(view.result.current.data).toEqual({ workspace: 'B' })
  })
  it('does not replace an error with a successful empty result; retry recovers', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('RLS denied')).mockResolvedValue({ items: [] })
    const view = renderHook(() => useManagerQuery('workspace', load))
    await waitFor(() => expect(view.result.current.error).toBe('RLS denied'))
    expect(view.result.current.data).toBeNull()
    act(() => view.result.current.reload())
    await waitFor(() => expect(view.result.current.data).toEqual({ items: [] }))
    expect(view.result.current.error).toBe('')
  })
})
