import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './AuthContext'
import { api } from '../services/api'

const fixture=vi.hoisted(()=>({listener:null,id:'11111111-1111-4111-8111-111111111111'}))
vi.mock('../lib/supabase',()=>({supabaseConfigurationError:'',requireSupabase:()=>({auth:{
  getSession:async()=>({data:{session:{user:{id:fixture.id}}}}),
  onAuthStateChange:callback=>{fixture.listener=callback;return {data:{subscription:{unsubscribe(){}}}}},
}})}))
vi.mock('../services/api',()=>({api:vi.fn(async()=>({version:1,user:{id:fixture.id,email:'fixture@example.test'},platform_role:'system_admin',memberships:[],onboarding:{passwordSetupRequired:false}})),onApiUnauthorized:()=>()=>{}}))

function Editor(){const [draft,setDraft]=useState('initial');return <input aria-label="draft" value={draft} onChange={event=>setDraft(event.target.value)} />}
function Shell(){const auth=useAuth();return auth.ready&&auth.user?<Editor/>:<p>Loading identity</p>}
beforeEach(()=>localStorage.clear())

it('keeps the current screen mounted for a same-user Auth update',async()=>{
  const user=userEvent.setup()
  render(<AuthProvider><Shell/></AuthProvider>)
  const input=await screen.findByLabelText('draft')
  await user.clear(input);await user.type(input,'unsaved')
  await act(async()=>fixture.listener('USER_UPDATED',{user:{id:fixture.id}}))
  expect(await screen.findByLabelText('draft')).toHaveValue('unsaved')
})

it('unmounts the old screen while a different user is being authorized',async()=>{
  render(<AuthProvider><Shell/></AuthProvider>)
  await screen.findByLabelText('draft')
  api.mockImplementationOnce(()=>new Promise(()=>{}))
  await act(async()=>fixture.listener('SIGNED_IN',{user:{id:'22222222-2222-4222-8222-222222222222'}}))
  expect(screen.queryByLabelText('draft')).not.toBeInTheDocument()
  expect(screen.getByText('Loading identity')).toBeInTheDocument()
})
