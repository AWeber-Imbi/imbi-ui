import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen, waitFor } from '@/test/utils'
import type { LoginProviderRead } from '@/types'

vi.mock('@/api/endpoints', () => ({
  createAuthProvider: vi.fn(),
  deleteAuthProvider: vi.fn(),
  demoteAuthProviderToLogin: vi.fn(),
  getLocalAuthConfig: vi.fn(),
  listAuthProviders: vi.fn(),
  listOrganizations: vi.fn(),
  listThirdPartyServices: vi.fn(),
  promoteAuthProviderToBoth: vi.fn(),
  updateAuthProvider: vi.fn(),
  updateLocalAuthConfig: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { is_admin: true, permissions: ['auth_providers:write'] },
  }),
}))

const sampleProvider = (
  overrides: Partial<LoginProviderRead> = {},
): LoginProviderRead => ({
  allowed_domains: [],
  authorization_endpoint: null,
  callback_url: 'https://example.com/auth/oauth/google-prod/callback',
  client_id: 'abc',
  description: null,
  has_secret: true,
  issuer_url: null,
  name: 'Google Prod',
  oauth_app_type: 'google',
  organization_name: 'AWeber',
  organization_slug: 'aweber',
  revoke_endpoint: null,
  scopes: [],
  slug: 'google-prod',
  status: 'active',
  third_party_service_name: 'Google Identity',
  third_party_service_slug: 'google-identity',
  token_endpoint: null,
  usage: 'login',
  ...overrides,
})

describe('AuthProvidersManagement', () => {
  beforeEach(async () => {
    const endpoints = await import('@/api/endpoints')
    vi.mocked(endpoints.getLocalAuthConfig).mockResolvedValue({
      enabled: true,
      updated_at: '2026-04-01T00:00:00Z',
    })
    vi.mocked(endpoints.listOrganizations).mockResolvedValue([])
    vi.mocked(endpoints.listThirdPartyServices).mockResolvedValue([])
  })

  it('renders the local auth card', async () => {
    const endpoints = await import('@/api/endpoints')
    vi.mocked(endpoints.listAuthProviders).mockResolvedValue([])
    const { AuthProvidersManagement } =
      await import('../AuthProvidersManagement')
    render(<AuthProvidersManagement />)
    await waitFor(() =>
      expect(screen.getByText('Local Authentication')).toBeInTheDocument(),
    )
  })

  it('renders a login provider card with promote action', async () => {
    const endpoints = await import('@/api/endpoints')
    vi.mocked(endpoints.listAuthProviders).mockResolvedValue([
      sampleProvider({ usage: 'login' }),
    ])
    const { AuthProvidersManagement } =
      await import('../AuthProvidersManagement')
    render(<AuthProvidersManagement />)
    await waitFor(() =>
      expect(screen.getByText('Google Prod')).toBeInTheDocument(),
    )
    expect(screen.getByText(/promote to both/i)).toBeInTheDocument()
    expect(screen.getByText(/^login$/i)).toBeInTheDocument()
  })

  it('renders a both row with demote action and disables delete', async () => {
    const endpoints = await import('@/api/endpoints')
    vi.mocked(endpoints.listAuthProviders).mockResolvedValue([
      sampleProvider({ usage: 'both' }),
    ])
    const { AuthProvidersManagement } =
      await import('../AuthProvidersManagement')
    render(<AuthProvidersManagement />)
    await waitFor(() =>
      expect(screen.getByText('Google Prod')).toBeInTheDocument(),
    )
    expect(screen.getByText(/demote to login/i)).toBeInTheDocument()
    expect(
      screen.getByText(/delete: demote integration first/i),
    ).toBeInTheDocument()
  })
})
