import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { CreateCompanyScreen } from './CreateCompanyScreen'

beforeEach(() => vi.spyOn(window, 'alert').mockImplementation(() => {}))

it('accepts Gmail and does not reject a reused domain with a unique slug', async () => {
  const user = userEvent.setup()
  const created = vi.fn()
  render(<CreateCompanyScreen existingCompanies={[{ slug: 'existing', domain: 'gmail.com' }]} onCreateCompany={created} onNavigate={vi.fn()} />)
  await user.type(screen.getByPlaceholderText('Apex Logistics Global'), 'Điện Máy Đà Nẵng')
  await user.type(screen.getByPlaceholderText('admin@apexlogistics.io'), 'operator@gmail.com')
  expect(screen.getByPlaceholderText('apex-logistics')).toHaveValue('dien-may-da-nang')
  await user.click(screen.getByRole('button', { name: 'Create Account' }))
  await waitFor(() => expect(created).toHaveBeenCalledOnce())
  expect(created.mock.calls[0][0]).toMatchObject({ accountEmail: 'operator@gmail.com', slug: 'dien-may-da-nang' })
})

it('rejects duplicate slug on submit as well as in the visible warning', async () => {
  const user = userEvent.setup()
  const created = vi.fn()
  render(<CreateCompanyScreen existingCompanies={[{ slug: 'taken' }]} onCreateCompany={created} onNavigate={vi.fn()} />)
  await user.type(screen.getByPlaceholderText('Apex Logistics Global'), 'Taken')
  await user.type(screen.getByPlaceholderText('admin@apexlogistics.io'), 'operator@gmail.com')
  expect(screen.getByText('Slug đã tồn tại. Chọn slug khác để tiếp tục.')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Create Account' }))
  expect(window.alert).toHaveBeenCalledWith('Slug đã tồn tại. Chọn slug khác để tiếp tục.')
  expect(created).not.toHaveBeenCalled()
})
