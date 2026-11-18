import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { api } from './services/api'

vi.mock('./services/api', () => ({ api: vi.fn(), onApiUnauthorized: vi.fn() }))
vi.mock('./auth/AuthProvider', () => ({ AuthProvider: ({ children }) => children }))
vi.mock('./auth/AuthContext', () => ({ useAuth: () => ({
  ready: true, user: { id: 'leader-user', email: 'leader@example.test' },
  membership: { workspaceId: 'workspace-a', role: 'manager' },
  workspaceId: 'workspace-a', memberships: [{ workspaceId: 'workspace-a', role: 'manager' }],
  platformRole: null, passwordSetupRequired: false,
}) }))
vi.mock('./leader/LeaderWorkspace', () => ({ default: () => <h1>Live Leader Workspace</h1> }))

describe('Leader startup', () => {
  it('opens the scoped workspace without waiting for unused legacy profile/import requests', async () => {
    api.mockImplementation(() => new Promise(() => {}))
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Live Leader Workspace' })).toBeVisible()
    await waitFor(() => expect(api).not.toHaveBeenCalled())
  })
})
