import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { usePlatformCompanies } from './usePlatformCompanies'

it('ignores an older registry response after identity changes', async () => {
  let finish
  let calls=0
  const service={ list: () => ++calls===1 ? new Promise(resolve => { finish=resolve }) : Promise.resolve({companies:[{id:'new'}]}) }
  const hook=renderHook(({id}) => usePlatformCompanies(service,id),{initialProps:{id:'old'}})
  await waitFor(() => expect(calls).toBe(1))
  hook.rerender({id:'new'})
  await waitFor(() => expect(hook.result.current.companies).toEqual([{id:'new'}]))
  await act(async () => finish({companies:[{id:'stale'}]}))
  expect(hook.result.current.companies).toEqual([{id:'new'}])
})

it('reports fetch errors and permits an explicit retry', async () => {
  let fail=true
  const service={list:async () => {if(fail)throw Error('Registry unavailable');return {companies:[]}}}
  const hook=renderHook(() => usePlatformCompanies(service,'fixture'))
  await waitFor(() => expect(hook.result.current.error).toBe('Registry unavailable'))
  fail=false
  await act(async () => hook.result.current.refresh())
  expect(hook.result.current.error).toBe('')
  expect(hook.result.current.companies).toEqual([])
})
