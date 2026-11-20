import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { LanguageProvider } from '../contexts/LanguageContext'
import { useLanguage } from '../hooks/useLanguage'
import ContentSafetyCheck from './ContentSafetyCheck'
import BrandSafetyRules from './BrandSafetyRules'
import { checkBrandContent, getBrandRules, saveBrandRules } from '../services/brandSafety'

vi.mock('../services/brandSafety', async original => ({ ...await original(), getBrandRules: vi.fn(), checkBrandContent: vi.fn(), saveBrandRules: vi.fn() }))
const config = { rules: { schemaVersion: 1, bannedTerms: ['Example'], requiredTerms: [], warnAbsoluteClaims: true, warnPersonalData: true }, version: '2026-11-20T14:00:00+00:00', canEdit: true, provider: 'internal_rules', engineVersion: '1.0.0' }
beforeEach(() => { vi.clearAllMocks(); localStorage.setItem('castravision_language', 'vi'); getBrandRules.mockResolvedValue(config) })
function Switch() { const { setLanguage } = useLanguage(); return <button onClick={() => setLanguage('en')}>Switch EN</button> }

test('changing content invalidates an in-flight result rather than claiming the new draft passed', async () => {
  let finish
  checkBrandContent.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  const view = render(<LanguageProvider><ContentSafetyCheck scopeKey="user:workspace" fields={{ body: 'Old draft' }} /></LanguageProvider>)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Kiểm tra nội dung' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra nội dung' }))
  view.rerender(<LanguageProvider><ContentSafetyCheck scopeKey="user:workspace" fields={{ body: 'New draft' }} /></LanguageProvider>)
  await act(async () => finish({ provider: 'internal_rules', status: 'no_findings', findings: [], rulesVersion: config.version }))
  expect(screen.queryByText(/Không tìm thấy vấn đề theo/)).not.toBeInTheDocument()
  expect(screen.getByText(/kết quả cũ không còn/)).toBeInTheDocument()
})

test('failed or stale saves preserve the edited rule and do not claim it was saved; errors switch locale', async () => {
  saveBrandRules.mockRejectedValue(Object.assign(new Error('conflict'), { code: 'STALE_VERSION' }))
  render(<LanguageProvider><Switch /><BrandSafetyRules scopeKey="manager:workspace" allowEdit /></LanguageProvider>)
  const input = await screen.findByRole('textbox', { name: 'Cụm từ cần tránh' })
  fireEvent.change(input, { target: { value: 'Keep my edit' } })
  fireEvent.submit(input.closest('form'))
  expect(await screen.findByRole('alert')).toHaveTextContent('Quy tắc đã thay đổi')
  expect(input).toHaveValue('Keep my edit')
  expect(screen.queryByText('Quy tắc đã được lưu trên máy chủ.')).not.toBeInTheDocument()
  fireEvent.click(screen.getByText('Switch EN'))
  expect(screen.getByRole('alert')).toHaveTextContent('Rules changed')
  expect(screen.getByRole('textbox', { name: 'Phrases to avoid' })).toHaveValue('Keep my edit')
})

test('read-only users get configuration, not the edit form', async () => {
  getBrandRules.mockResolvedValue({ ...config, canEdit: false })
  render(<LanguageProvider><BrandSafetyRules scopeKey="employee:workspace" allowEdit /></LanguageProvider>)
  expect(await screen.findByText(/Chỉ Marketing Manager/)).toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Lưu quy tắc doanh nghiệp' })).not.toBeInTheDocument()
})

test('a stalled content check times out and permits retry without a success result', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  checkBrandContent.mockImplementation(() => new Promise(() => {}))
  try {
    render(<LanguageProvider><ContentSafetyCheck scopeKey="user:workspace" fields={{ body: 'Actual draft' }} /></LanguageProvider>)
    await act(async () => { await Promise.resolve() })
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra nội dung', exact: true }))
    await act(async () => vi.advanceTimersByTime(30000))
    expect(screen.getByRole('alert')).toHaveTextContent('Yêu cầu mất quá lâu')
    expect(screen.getByRole('button', { name: 'Kiểm tra nội dung', exact: true })).toBeEnabled()
    expect(screen.queryByText(/Không tìm thấy vấn đề theo/)).not.toBeInTheDocument()
  } finally { vi.useRealTimers() }
})

test('switching workspace immediately hides previous rules and ignores a late response', async () => {
  let finish
  getBrandRules.mockImplementationOnce(() => Promise.resolve(config)).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  const view = render(<LanguageProvider><BrandSafetyRules scopeKey="user:old" /></LanguageProvider>)
  await screen.findByText(/Example/)
  view.rerender(<LanguageProvider><BrandSafetyRules scopeKey="user:new" /></LanguageProvider>)
  expect(screen.queryByText(/Example/)).not.toBeInTheDocument()
  await waitFor(() => expect(getBrandRules).toHaveBeenCalledTimes(2))
  await act(async () => finish({ ...config, rules: { ...config.rules, bannedTerms: ['New company term'] } }))
  expect(screen.getByText(/New company term/)).toBeInTheDocument()
})
