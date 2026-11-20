import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LanguageProvider } from '../../contexts/LanguageContext'
import NotificationPreferencesTab from './NotificationPreferencesTab'

beforeEach(() => localStorage.clear())
const view = id => <LanguageProvider><NotificationPreferencesTab user={{ id }} /></LanguageProvider>
test('employee preferences persist per user and restore after remount', () => {
  const first = render(view('employee-a'))
  fireEvent.click(screen.getAllByRole('switch')[0])
  fireEvent.click(screen.getAllByRole('button', { name: 'Save Preferences' })[0])
  expect(JSON.parse(localStorage.getItem('castravision_notif_prefs:employee-a')).campaign_performance).toBe(false)
  first.unmount()
  const again = render(view('employee-a'))
  expect(screen.getAllByRole('switch')[0]).toHaveAttribute('aria-checked', 'false')
  again.rerender(view('employee-b'))
  expect(screen.getAllByRole('switch')[0]).toHaveAttribute('aria-checked', 'true')
})
test('reset restores defaults after remount', () => {
  localStorage.setItem('castravision_notif_prefs:employee-a', JSON.stringify({ campaign_performance: false }))
  const mounted = render(view('employee-a'))
  fireEvent.click(screen.getAllByRole('button', { name: 'Reset' })[0])
  expect(localStorage.getItem('castravision_notif_prefs:employee-a')).toBeNull()
  mounted.unmount()
  render(view('employee-a'))
  expect(screen.getAllByRole('switch')[0]).toHaveAttribute('aria-checked', 'true')
})
test('failed local reset must not announce success or pretend defaults persisted', () => {
  localStorage.setItem('castravision_notif_prefs:employee-a', JSON.stringify({ campaign_performance: false }))
  render(view('employee-a'))
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('Storage denied') })
  fireEvent.click(screen.getAllByRole('button', { name: 'Reset' })[0])
  expect(screen.queryByText('Đã khôi phục tùy chọn thông báo về trạng thái mặc định.')).not.toBeInTheDocument()
  expect(screen.getAllByRole('switch')[0]).toHaveAttribute('aria-checked', 'false')
})
