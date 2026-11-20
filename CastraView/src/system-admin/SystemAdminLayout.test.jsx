import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../contexts/LanguageContext'
import { SystemAdminLayout } from './SystemAdminLayout'
import { INITIAL_COMPANIES } from './mockData'

const fixtureService = {
  list: async () => ({ companies: INITIAL_COMPANIES }),
  company: async id => INITIAL_COMPANIES.find(item => item.id===id),
}

beforeEach(() => {
  localStorage.setItem('castravision_language', 'en')
  window.history.replaceState({}, '', '/')
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

async function setup(props = {}) {
  const view=render(<LanguageProvider><SystemAdminLayout service={fixtureService} user={{ id: 'ui-fixture', fullName: 'Operator' }} {...props} /></LanguageProvider>)
  await screen.findByRole('heading', { level: 1 })
  return view
}

it('opens the selected company from the dashboard and returns to the directory', async () => {
  const user = userEvent.setup()
  await setup()
  await user.click((await screen.findAllByRole('button', { name: 'View Overview' }))[1])
  expect(await screen.findByRole('heading', { name: 'Novus Retail' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Back to Company Management' }))
  expect(screen.getByRole('heading', { name: 'Company Management' })).toBeInTheDocument()
})

it('filters the directory from the header and resets pagination', async () => {
  const user = userEvent.setup()
  await setup()
  await user.click(screen.getByRole('button', { name: 'Next', exact: true }))
  await user.type(screen.getByPlaceholderText('Search registered tenants...'), 'Acme')
  const table = screen.getByRole('table')
  expect(within(table).getByText('Acme Corp')).toBeInTheDocument()
  expect(within(table).queryByText('Novus Retail')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled()
  await user.clear(screen.getByPlaceholderText('Search registered tenants...'))
  expect(screen.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled()
})

it('routes header search from details to a filtered directory', async () => {
  const user = userEvent.setup()
  await setup()
  await user.click((await screen.findAllByRole('button', { name: 'View Overview' }))[0])
  await screen.findByRole('heading', { name: 'Acme Corp' })
  await user.type(screen.getByPlaceholderText('Search registered tenants...'), 'Novus')
  expect(screen.getByRole('heading', { name: 'Company Management' })).toBeInTheDocument()
  expect(within(screen.getByRole('table')).getByText('Novus Retail')).toBeInTheDocument()
  expect(within(screen.getByRole('table')).queryByText('Acme Corp')).not.toBeInTheDocument()
})
