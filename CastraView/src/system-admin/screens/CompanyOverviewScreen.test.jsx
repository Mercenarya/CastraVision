import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { CompanyOverviewScreen } from './CompanyOverviewScreen'

it('requires acknowledgement before suspending a company',async()=>{
  const update=vi.fn(async()=>({id:'fixture'}))
  const {container}=render(<CompanyOverviewScreen company={{id:'fixture',name:'Company',legalEntity:'Company',domain:'',notes:'',status:'Active',version:1,employeeCount:1,history:[]}} onUpdateCompany={update} />)
  const user=userEvent.setup()
  await user.click(screen.getByRole('button',{name:'Edit Organization Details'}))
  await user.selectOptions(screen.getByLabelText('Trạng thái'),'Inactive')
  fireEvent.submit(container.querySelector('form'))
  expect(update).not.toHaveBeenCalled()
  await user.click(screen.getByRole('checkbox'))
  await user.click(screen.getByRole('button',{name:'Save Changes'}))
  await waitFor(()=>expect(update).toHaveBeenCalledOnce())
  expect(update.mock.calls[0][1]).toMatchObject({status:'Inactive',version:1})
})
