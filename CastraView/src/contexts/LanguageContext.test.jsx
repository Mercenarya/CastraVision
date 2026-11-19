import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { LanguageProvider } from './LanguageContext'
import { LanguageDropdownSubmenu } from '../components/LanguageDropdownSubmenu'
import { useLanguage } from '../hooks/useLanguage'

function Probe() {
  const { t } = useLanguage()
  return <><p>{t('header.signOut')}</p><LanguageDropdownSubmenu /></>
}

afterEach(() => window.localStorage.removeItem('castravision_language'))

describe('imported language UI', () => {
  it('switches language and restores it after remount', async () => {
    window.localStorage.setItem('castravision_language', 'en')
    const user = userEvent.setup()
    const view = render(<Probe />, { wrapper: LanguageProvider })
    expect(screen.getByText('Sign Out')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Language/i }))
    await user.click(screen.getByRole('menuitem', { name: /Tiếng Việt/i }))
    expect(window.localStorage.getItem('castravision_language')).toBe('vi')
    view.unmount()
    render(<Probe />, { wrapper: LanguageProvider })
    expect(screen.getByText('Đăng xuất')).toBeVisible()
  })
})
