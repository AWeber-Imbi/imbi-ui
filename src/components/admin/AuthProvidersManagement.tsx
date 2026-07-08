import { useMemo, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle,
  KeyRound,
  Lock,
  Plus,
  Power,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  getLocalAuthConfig,
  listIntegrations,
  listPluginPackages,
  setIntegrationLoginProvider,
  updateLocalAuthConfig,
} from '@/api/endpoints'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBanner } from '@/components/ui/error-banner'
import { Sk, Swap } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useAuth } from '@/hooks/useAuth'
import { extractApiErrorDetail } from '@/lib/apiError'
import { queryKeys } from '@/lib/queryKeys'
import { statusBadgeVariant } from '@/lib/status-colors'
import type { LocalAuthConfig } from '@/types'

import { AddAuthProviderDialog } from './AddAuthProviderDialog'

// fallow-ignore-next-line complexity
export function AuthProvidersManagement() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { selectedOrganization } = useOrganization()
  const orgSlug = selectedOrganization?.slug
  const orgName = selectedOrganization?.name ?? orgSlug ?? ''

  const canManageLocalAuth =
    !!user?.is_admin ||
    (user?.permissions ?? []).includes('auth_providers:write')
  const canManageProviders =
    !!user?.is_admin || (user?.permissions ?? []).includes('integration:update')

  const localAuthQuery = useQuery({
    queryFn: ({ signal }) => getLocalAuthConfig(signal),
    queryKey: queryKeys.adminLocalAuth(),
  })

  const { data: plugins = [] } = useQuery({
    queryFn: ({ signal }) => listPluginPackages(signal),
    queryKey: queryKeys.pluginPackages(),
    staleTime: 60 * 1000,
  })

  const { data: integrations, error: integrationsError } = useQuery({
    enabled: !!orgSlug,
    queryFn: ({ signal }) => listIntegrations(orgSlug!, signal),
    queryKey: orgSlug ? queryKeys.integrations(orgSlug) : ['integrations'],
  })

  // A plugin can back a login provider when it declares an `identity`
  // capability flagged `login_capable` in the manifest.
  const loginCapablePlugins = useMemo(() => {
    const slugs = new Set<string>()
    for (const p of plugins) {
      const identity = p.capabilities.find((c) => c.kind === 'identity')
      if (identity?.hints?.login_capable) slugs.add(p.slug)
    }
    return slugs
  }, [plugins])

  const providers = useMemo(
    () => (integrations ?? []).filter((i) => loginCapablePlugins.has(i.plugin)),
    [integrations, loginCapablePlugins],
  )

  // Only enabled login-capable plugins can back a new provider created here.
  const addablePlugins = useMemo(
    () => plugins.filter((p) => p.enabled && loginCapablePlugins.has(p.slug)),
    [plugins, loginCapablePlugins],
  )

  const [addOpen, setAddOpen] = useState(false)

  const localAuthMutation = useMutation({
    mutationFn: (enabled: boolean) => updateLocalAuthConfig({ enabled }),
    onError: (err) => {
      toast.error(
        `Failed to update local authentication: ${extractApiErrorDetail(err)}`,
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.adminLocalAuth() })
    },
    onMutate: async (enabled: boolean) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.adminLocalAuth() })
      const previous = queryClient.getQueryData<LocalAuthConfig>(
        queryKeys.adminLocalAuth(),
      )
      if (previous) {
        queryClient.setQueryData<LocalAuthConfig>(queryKeys.adminLocalAuth(), {
          ...previous,
          enabled,
        })
      }
      return { previous }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminLocalAuth() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicAuthProviders(),
      })
      toast.success('Local authentication updated')
    },
  })

  // Promote (or demote) an integration as the org's SSO login provider. The
  // server enforces at most one per org, so a full refetch reflects any
  // sibling that was demoted as a side effect.
  const loginProviderMutation = useMutation({
    mutationFn: ({
      slug,
      usedAsLogin,
    }: {
      slug: string
      usedAsLogin: boolean
    }) => setIntegrationLoginProvider(orgSlug!, slug, usedAsLogin),
    onError: (err) =>
      toast.error(
        `Failed to update login provider: ${extractApiErrorDetail(err)}`,
      ),
    onSuccess: (_data, { usedAsLogin }) => {
      if (orgSlug) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.integrations(orgSlug),
        })
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicAuthProviders(),
      })
      toast.success(
        usedAsLogin ? 'Login provider enabled' : 'Login provider disabled',
      )
    },
  })

  if (integrationsError) {
    return (
      <ErrorBanner error={integrationsError} title="Failed to load providers" />
    )
  }

  return (
    <div className="max-w-4xl space-y-5">
      {!canManageLocalAuth && !canManageProviders && (
        <Alert icon={Power} variant="info">
          You don't have permission to modify authentication settings. Contact
          an administrator to make changes.
        </Alert>
      )}

      {/* Local authentication */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Lock className="text-secondary size-5" />
            <CardTitle>Local Authentication</CardTitle>
          </div>
          <Swap
            ready={!!localAuthQuery.data}
            skeleton={<Sk circle h={20} w={20} />}
          >
            {localAuthQuery.data?.enabled ? (
              <CheckCircle className="text-status-review-dot size-5 shrink-0" />
            ) : (
              <AlertCircle className="text-tertiary size-5 shrink-0" />
            )}
          </Swap>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-tertiary text-xs">
            Allow users to sign in with an email address and password stored in
            Imbi.
          </p>
          <div className="border-input flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-primary text-sm">Enabled</div>
              <div className="text-tertiary text-xs">
                When disabled, the email/password form is hidden on the login
                page.
              </div>
            </div>
            <Swap
              ready={!!localAuthQuery.data}
              skeleton={<Sk h={20} r={9999} w={36} />}
            >
              <Switch
                checked={localAuthQuery.data?.enabled ?? false}
                disabled={!canManageLocalAuth || localAuthMutation.isPending}
                onCheckedChange={(checked) => localAuthMutation.mutate(checked)}
              />
            </Swap>
          </div>
        </CardContent>
      </Card>

      {/* SSO login provider (per organization) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="text-secondary size-5" />
            <CardTitle>SSO Login Provider</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {orgName && <Badge variant="secondary">{orgName}</Badge>}
            {canManageProviders && !!orgSlug && addablePlugins.length > 0 && (
              <Button onClick={() => setAddOpen(true)} size="sm">
                <Plus className="size-4" />
                Add auth provider
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-tertiary text-xs">
            Choose which integration users sign in through. Only integrations
            whose plugin provides a login-capable identity are eligible, and at
            most one can be active per organization.
          </p>

          {!orgSlug ? (
            <Alert variant="info">
              Select an organization to manage its login provider.
            </Alert>
          ) : (
            <Swap
              ready={!!integrations}
              skeleton={
                <div className="space-y-2">
                  <Sk h={56} r={8} />
                  <Sk h={56} r={8} />
                </div>
              }
            >
              {providers.length === 0 ? (
                <div className="border-input text-tertiary rounded-lg border border-dashed p-4 text-sm">
                  {addablePlugins.length > 0
                    ? `No login providers configured for ${orgName} yet. Use “Add auth provider” to create one.`
                    : `No login-capable plugins are enabled. Enable one (e.g. Google, GitHub, OIDC) under Admin → Plugins first.`}
                </div>
              ) : (
                <div className="divide-tertiary border-tertiary divide-y rounded-lg border">
                  {providers.map((provider) => (
                    <div
                      className="flex items-center justify-between gap-4 p-3"
                      key={provider.slug}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-primary truncate text-sm font-medium">
                            {provider.name}
                          </span>
                          <Badge variant={statusBadgeVariant(provider.status)}>
                            {provider.status}
                          </Badge>
                        </div>
                        <div className="text-tertiary truncate font-mono text-xs">
                          {provider.plugin}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <span className="text-tertiary text-xs">
                          {provider.used_as_login
                            ? 'Used for sign-in'
                            : 'Not used'}
                        </span>
                        <Switch
                          aria-label={`Use ${provider.name} for sign-in`}
                          checked={!!provider.used_as_login}
                          disabled={
                            !canManageProviders ||
                            loginProviderMutation.isPending
                          }
                          onCheckedChange={(checked) =>
                            loginProviderMutation.mutate({
                              slug: provider.slug,
                              usedAsLogin: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Swap>
          )}
        </CardContent>
      </Card>

      {orgSlug && (
        <AddAuthProviderDialog
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.integrations(orgSlug),
            })
            queryClient.invalidateQueries({
              queryKey: queryKeys.publicAuthProviders(),
            })
          }}
          open={addOpen}
          orgSlug={orgSlug}
          plugins={addablePlugins}
        />
      )}
    </div>
  )
}
