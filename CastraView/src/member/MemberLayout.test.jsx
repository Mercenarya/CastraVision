import { expect, test, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageProvider } from '../contexts/LanguageContext'
import MemberLayout from './MemberLayout'

test('employee shell has real identity/count and makes no unsupported health claim', () => {
  render(<LanguageProvider><MemberLayout user={{ full_name: 'Employee Test', email: 'employee@example.test' }} profile={{ business_name: 'Actual Company' }} workspaceId="workspace-fixture" unreadCount={7} /></LanguageProvider>)
  expect(screen.getByText('Employee Test')).toBeInTheDocument()
  expect(screen.queryByText('All systems nominal')).not.toBeInTheDocument()
  expect(screen.queryByText('Alex Mercer')).not.toBeInTheDocument()
  expect(document.querySelector('nav')).toHaveTextContent('7')
  expect(document.querySelector('nav')).not.toHaveTextContent('5')
})
test('mobile navigation drawer supports Escape without retaining scroll lock', () => {
  const setPage = vi.fn()
  render(<LanguageProvider><MemberLayout user={{ full_name: 'Employee Test' }} setPage={setPage} /></LanguageProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(document.body.style.overflow).toBe('')
})

test('selecting a language closes the Employee account menu', () => {
  localStorage.setItem('castravision_language', 'vi')
  render(<LanguageProvider><MemberLayout user={{ full_name: 'Employee Test' }} /></LanguageProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Member Account Menu' }))
  fireEvent.click(screen.getByRole('button', { name: /Ngôn ngữ vi/i }))
  fireEvent.click(screen.getByRole('menuitem', { name: 'English', exact: true }))
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(document.documentElement.lang).toBe('en')
})
