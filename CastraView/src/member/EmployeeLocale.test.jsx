import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import en from '../i18n/locales/en'
import viLocale from '../i18n/locales/vi'
import { LanguageProvider } from '../contexts/LanguageContext'
import { useLanguage } from '../hooks/useLanguage'
import WorkflowComposer from '../leader/screens/WorkflowComposer'
import { workflow } from '../services/leaderWorkflow'

vi.mock('../services/leaderWorkflow', () => ({ workflow: vi.fn() }))
function Switch() { const { setLanguage } = useLanguage(); return <button onClick={() => setLanguage('vi')}>Switch VI</button> }

test('Employee workflow, settings, error and rule-provider dictionaries have complete matching keys', () => {
  const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([key, value]) => typeof value === 'string' ? [prefix + key] : flatten(value, prefix + key + '.')).sort()
  for (const namespace of ['employeeFlow', 'employeeSettings', 'employeeErrors', 'brandSafety']) {
    expect(flatten(en[namespace])).toEqual(flatten(viLocale[namespace]))
    expect(flatten(en[namespace]).length).toBeGreaterThan(0)
  }
})

test('Composer changes labels EN/VI without translating or discarding the authored payload', async () => {
  localStorage.setItem('castravision_language', 'en')
  workflow.mockImplementation(async command => command === 'campaigns' ? { items: [{ id: 'campaign-a', name: 'Real title unchanged', currency: 'USD' }], total: 1 } : command === 'submit' ? { id: 'saved' } : { items: [], total: 0 })
  const user = userEvent.setup()
  render(<LanguageProvider><Switch /><WorkflowComposer kind="content" onCreated={vi.fn()} /></LanguageProvider>)
  await screen.findByRole('option', { name: 'Real title unchanged (USD)' })
  await user.selectOptions(screen.getByRole('combobox', { name: 'Campaign' }), 'campaign-a')
  await user.type(screen.getByRole('textbox', { name: 'Proposal title' }), 'My authored title')
  await user.type(screen.getByRole('textbox', { name: /Headline/ }), 'Keep my actual words')
  fireEvent.click(screen.getByText('Switch VI'))
  expect(screen.getByRole('textbox', { name: /Tiêu đề quảng cáo/ })).toHaveValue('Keep my actual words')
  expect(screen.getByRole('textbox', { name: 'Tên đề xuất' })).toHaveValue('My authored title')
  expect(document.documentElement.lang).toBe('vi')
  await user.type(screen.getByRole('textbox', { name: /Hook/ }), 'A valid authored hook')
  await user.type(screen.getByRole('textbox', { name: /Nội dung quảng cáo/ }), 'Authored body')
  await user.type(screen.getByRole('textbox', { name: /Lời kêu gọi hành động/ }), 'Authored CTA')
  await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))
  await waitFor(() => expect(workflow).toHaveBeenCalledWith('submit', expect.objectContaining({ title: 'My authored title', payload: expect.objectContaining({ headline: 'Keep my actual words', body: 'Authored body', channel: 'Meta', source: 'manual' }) })))
})
