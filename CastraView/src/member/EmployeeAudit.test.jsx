import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemberDashboardView } from './ui/MemberDashboardView'
import { LanguageProvider } from '../contexts/LanguageContext'
import { useLanguage } from '../hooks/useLanguage'

beforeEach(() => localStorage.setItem('castravision_language', 'vi'))

const data = {
  context: { actor: { fullName: 'Nguyễn Audit' }, workspace: { name: 'Doanh nghiệp thật' }, teams: [{ id: 'team-a', name: 'Nhóm thật' }] },
  proposals: { items: [{ id: 'proposal-a', title: 'Nội dung thật', status: 'revision_requested', campaign_name: 'Chiến dịch thật' }] },
  campaigns: { items: [{ id: 'campaign-a', name: 'Chiến dịch thật', channels: ['Meta'], status: 'active' }], total: 1 },
  counts: { pending: 3, revision_requested: 1, approved: 8 },
}
test('dashboard binds verified actor/team instead of mock fixtures', () => {
  render(<LanguageProvider><MemberDashboardView data={data} /></LanguageProvider>)
  expect(screen.getByText(/Nguyễn Audit/)).toBeInTheDocument()
  expect(screen.getByText(/Nhóm thật/)).toBeInTheDocument()
  expect(screen.queryByText(/Welcome back, Alex/)).not.toBeInTheDocument()
  expect(screen.queryByText(/Summer Streetwear/)).not.toBeInTheDocument()
})
test('revision action opens the exact stored proposal', () => {
  const onOpenProposal = vi.fn()
  render(<LanguageProvider><MemberDashboardView data={data} onOpenProposal={onOpenProposal} /></LanguageProvider>)
  fireEvent.click(screen.getByRole('button', { name: /Sửa và gửi lại/ }))
  expect(onOpenProposal).toHaveBeenCalledWith('proposal-a')
})
test('unknown sprint data is unavailable rather than fabricated progress', () => {
  render(<LanguageProvider><MemberDashboardView data={data} /></LanguageProvider>)
  expect(screen.getByText(/Chưa cấu hình sprint/)).toBeInTheDocument()
  expect(screen.queryByText(/14 \/ 16/)).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Brand Safety Audit/ })).not.toBeInTheDocument()
})

test('priority tasks and task totals use persisted task data and open exact ID', () => {
  const onOpenTask = vi.fn()
  render(<LanguageProvider><MemberDashboardView data={{ ...data, tasks: { summary: { active: 11, completed: 4 }, items: [{ id: 'task-real', title: 'Nhiệm vụ được giao thật', status: 'todo', assigned_by_name: 'Leader thật', due_at: null }] } }} onOpenTask={onOpenTask} /></LanguageProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Mở nhiệm vụ' }))
  expect(onOpenTask).toHaveBeenCalledWith('task-real')
  expect(screen.getByText('11')).toBeInTheDocument()
  expect(screen.getByText(/Leader thật/)).toBeInTheDocument()
})

function EnglishSwitch() {
  const { setLanguage } = useLanguage()
  return <button onClick={() => setLanguage('en')}>Set English</button>
}

test('dashboard uses the existing EN/VI provider and preserves real data when language changes', () => {
  render(<LanguageProvider><EnglishSwitch /><MemberDashboardView data={data} /></LanguageProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Set English' }))
  expect(screen.getByText('My recent submissions')).toBeInTheDocument()
  expect(screen.getByText('Hello, Nguyễn Audit')).toBeInTheDocument()
  expect(screen.getByText('Nội dung thật')).toBeInTheDocument()
  expect(localStorage.getItem('castravision_language')).toBe('en')
})
