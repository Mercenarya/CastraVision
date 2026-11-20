import { expect, it } from 'vitest'
import { consumeAuthCallback } from './emailOnboarding'

it('preserves only validated invitation identifiers while clearing callback credentials', async () => {
  const auth={getSession:async()=>({data:{session:{user:{id:'fixture'}}},error:null})}
  const id='11111111-1111-4111-8111-111111111111'
  const result=await consumeAuthCallback(auth,`http://127.0.0.1:61300/auth/complete?platformInvitationId=${id}&untrusted=ignored#secret_fragment`)
  expect(result.cleanPath).toBe('/auth/complete?platformInvitationId='+id)
})
