import { useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Power,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  deleteOAuthProvider,
  listOAuthProviders,
  upsertOAuthProvider,
} from '@/api/endpoints'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EntityIcon } from '@/components/ui/entity-icon'
import { ErrorBanner } from '@/components/ui/error-banner'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/loading-state'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/useAuth'
import { extractApiErrorDetail } from '@/lib/apiError'
import type {
  OAuthProviderConfig,
  OAuthProviderType,
  OAuthProviderWrite,
} from '@/types'

const PROVIDER_DESCRIPTIONS: Record<OAuthProviderType, string> = {
  github:
    'Sign in with a GitHub account. Required: client ID and secret from a GitHub OAuth App.',
  google:
    'Sign in with a Google Workspace account. Optionally restrict by email domain.',
  oidc: 'Generic OpenID Connect provider. Requires an issuer URL and a registered client.',
}

interface EditDialogProps {
  isSaving: boolean
  onCancel: () => void
  onSave: (payload: OAuthProviderWrite) => void
  provider: OAuthProviderConfig
}

const PROVIDER_ORDER: OAuthProviderType[] = ['google', 'github', 'oidc']

const sortByOrder = (rows: OAuthProviderConfig[]): OAuthProviderConfig[] => {
  const rank = (slug: OAuthProviderType) => PROVIDER_ORDER.indexOf(slug)
  return [...rows].sort((a, b) => rank(a.slug) - rank(b.slug))
}

const copyToClipboard = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied`)
  } catch {
    toast.error(`Failed to copy ${label.toLowerCase()}`)
  }
}

export function OAuthManagement() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const canWrite =
    !!user?.is_admin ||
    (user?.permissions ?? []).includes('oauth_providers:write')

  const [editing, setEditing] = useState<null | OAuthProviderConfig>(null)
  const [pendingDelete, setPendingDelete] =
    useState<null | OAuthProviderConfig>(null)

  const { data, error, isLoading } = useQuery({
    queryFn: ({ signal }) => listOAuthProviders(signal),
    queryKey: ['admin', 'oauth-providers'],
  })

  // The API returns one row per known provider type, with `configured`
  // flagging whether it's been persisted yet. No client-side synthesis.
  const cards = sortByOrder(data ?? [])

  const upsertMutation = useMutation({
    mutationFn: ({
      payload,
      slug,
    }: {
      payload: OAuthProviderWrite
      slug: OAuthProviderType
    }) => upsertOAuthProvider(slug, payload),
    onError: (err) => {
      toast.error(
        `Failed to save OAuth provider: ${extractApiErrorDetail(err)}`,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'oauth-providers'] })
      queryClient.invalidateQueries({ queryKey: ['authProviders'] })
      setEditing(null)
      toast.success('OAuth provider saved')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (slug: OAuthProviderType) => deleteOAuthProvider(slug),
    onError: (err) => {
      toast.error(
        `Failed to delete OAuth provider: ${extractApiErrorDetail(err)}`,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'oauth-providers'] })
      queryClient.invalidateQueries({ queryKey: ['authProviders'] })
      setPendingDelete(null)
      toast.success('OAuth provider deleted')
    },
  })

  if (isLoading) {
    return <LoadingState label="Loading OAuth providers..." />
  }

  if (error) {
    return <ErrorBanner error={error} title="Failed to load OAuth providers" />
  }

  return (
    <div className="space-y-4">
      {!canWrite && (
        <div
          className={
            'flex items-start gap-3 rounded-lg border border-info bg-info p-4'
          }
        >
          <Power className="mt-0.5 h-5 w-5 flex-shrink-0 text-info" />
          <p className="text-sm text-info">
            You don't have permission to modify OAuth providers. Contact an
            administrator to add or change providers.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((provider) => (
          <Card key={provider.slug}>
            <CardHeader
              className={
                'flex flex-row items-center justify-between space-y-0 pb-2'
              }
            >
              <div className="flex items-center gap-2">
                <EntityIcon
                  className="h-5 w-5 text-secondary"
                  icon={provider.icon}
                />
                <CardTitle>{provider.name}</CardTitle>
              </div>
              {provider.configured ? (
                provider.enabled ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-status-review-dot" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-tertiary" />
                )
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-tertiary">
                {PROVIDER_DESCRIPTIONS[provider.type]}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{provider.type}</Badge>
                {!provider.configured && (
                  <span className="text-xs text-tertiary">Not configured</span>
                )}
              </div>
              <div>
                <div className="mb-1 text-xs text-tertiary">
                  Authorized redirect URI
                </div>
                <div
                  className={
                    'flex items-center gap-1 rounded-md border border-input bg-secondary px-2 py-1'
                  }
                >
                  <code
                    className="flex-1 truncate text-xs text-secondary"
                    title={provider.callback_url}
                  >
                    {provider.callback_url}
                  </code>
                  <Button
                    aria-label="Copy redirect URI"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() =>
                      copyToClipboard(provider.callback_url, 'Redirect URI')
                    }
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {canWrite && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={() => setEditing(provider)}
                    size="sm"
                    variant="outline"
                  >
                    <Settings className="mr-1 h-4 w-4" />
                    {provider.configured ? 'Edit' : 'Configure'}
                  </Button>
                  {provider.configured && (
                    <Button
                      onClick={() => setPendingDelete(provider)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <OAuthProviderEditDialog
          isSaving={upsertMutation.isPending}
          onCancel={() => setEditing(null)}
          onSave={(payload) =>
            upsertMutation.mutate({ payload, slug: editing.slug })
          }
          provider={editing}
        />
      )}

      <ConfirmDialog
        confirmLabel="Delete"
        description={
          pendingDelete
            ? `Remove the ${pendingDelete.name} OAuth provider? Users currently linked through this provider won't be able to sign in until it's recreated.`
            : ''
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.slug)
        }}
        open={!!pendingDelete}
        title="Delete OAuth provider"
      />
    </div>
  )
}

function OAuthProviderEditDialog({
  isSaving,
  onCancel,
  onSave,
  provider,
}: EditDialogProps) {
  const [name, setName] = useState(provider.name)
  const [enabled, setEnabled] = useState(provider.enabled)
  const [clientId, setClientId] = useState(provider.client_id ?? '')
  const [issuerUrl, setIssuerUrl] = useState(provider.issuer_url ?? '')
  const [allowedDomains, setAllowedDomains] = useState<string[]>(
    provider.allowed_domains,
  )
  const [domainDraft, setDomainDraft] = useState('')
  const [replaceSecret, setReplaceSecret] = useState(!provider.has_secret)
  const [secret, setSecret] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const showAllowedDomains = provider.type === 'google'
  const showIssuerUrl = provider.type === 'oidc'

  const addDomain = () => {
    const value = domainDraft.trim().toLowerCase()
    if (!value) return
    if (allowedDomains.includes(value)) {
      setDomainDraft('')
      return
    }
    setAllowedDomains([...allowedDomains, value])
    setDomainDraft('')
  }

  const removeDomain = (value: string) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== value))
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Name is required'
    if (enabled) {
      if (!clientId.trim())
        next.client_id = 'Client ID is required when enabled'
      if (showIssuerUrl && !issuerUrl.trim()) {
        next.issuer_url = 'Issuer URL is required when enabled'
      }
      if (replaceSecret && !secret) {
        if (!provider.has_secret) {
          next.client_secret = 'Client secret is required when enabled'
        }
      }
    }
    if (showIssuerUrl && issuerUrl.trim()) {
      try {
        const u = new URL(issuerUrl.trim())
        if (u.protocol !== 'https:' && u.protocol !== 'http:') {
          next.issuer_url = 'Issuer URL must be http(s)://'
        }
      } catch {
        next.issuer_url = 'Issuer URL must be a valid URL'
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const payload: OAuthProviderWrite = {
      enabled,
      icon: provider.icon,
      name: name.trim(),
      type: provider.type,
    }
    payload.client_id = clientId.trim() ? clientId.trim() : null
    if (showIssuerUrl) {
      payload.issuer_url = issuerUrl.trim() ? issuerUrl.trim() : null
    }
    if (showAllowedDomains) {
      payload.allowed_domains = allowedDomains
    }
    // Blank secret is omitted entirely so the API preserves the existing one.
    // A non-empty value (including when first configuring) is sent through.
    if (replaceSecret && secret) {
      payload.client_secret = secret
    }
    onSave(payload)
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
      open
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {provider.name}</DialogTitle>
          <DialogDescription>
            {PROVIDER_DESCRIPTIONS[provider.type]}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between rounded-lg border border-input p-3">
            <div>
              <div className="text-sm text-primary">Enabled</div>
              <div className="text-xs text-tertiary">
                When disabled, this provider won't appear on the login page.
              </div>
            </div>
            <Switch
              checked={enabled}
              disabled={isSaving}
              onCheckedChange={setEnabled}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-secondary">
              Display Name <span className="text-red-500">*</span>
            </label>
            <Input
              className={errors.name ? 'border-red-500' : ''}
              disabled={isSaving}
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
            {errors.name && (
              <div className="mt-1 flex items-center gap-1 text-xs text-danger">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-secondary">
              Client ID
            </label>
            <Input
              className={errors.client_id ? 'border-red-500' : ''}
              disabled={isSaving}
              onChange={(e) => setClientId(e.target.value)}
              value={clientId}
            />
            {errors.client_id && (
              <div className="mt-1 flex items-center gap-1 text-xs text-danger">
                <AlertCircle className="h-3 w-3" />
                {errors.client_id}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-secondary">
              Client Secret
            </label>
            {provider.has_secret && !replaceSecret ? (
              <div
                className={
                  'flex items-center justify-between rounded-lg border border-input bg-secondary px-3 py-2'
                }
              >
                <span className="text-sm text-secondary">
                  Secret is set (hidden).
                </span>
                <Button
                  disabled={isSaving}
                  onClick={() => setReplaceSecret(true)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Replace secret
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <Input
                  autoComplete="new-password"
                  className={errors.client_secret ? 'border-red-500' : ''}
                  disabled={isSaving}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder={
                    provider.has_secret
                      ? 'Enter a new secret (leave blank to keep current)'
                      : ''
                  }
                  type="password"
                  value={secret}
                />
                {provider.has_secret && (
                  <Button
                    disabled={isSaving}
                    onClick={() => {
                      setReplaceSecret(false)
                      setSecret('')
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Cancel replace
                  </Button>
                )}
                {errors.client_secret && (
                  <div
                    className={'flex items-center gap-1 text-xs text-danger'}
                  >
                    <AlertCircle className="h-3 w-3" />
                    {errors.client_secret}
                  </div>
                )}
              </div>
            )}
          </div>

          {showIssuerUrl && (
            <div>
              <label className="mb-1.5 block text-sm text-secondary">
                Issuer URL <span className="text-red-500">*</span>
              </label>
              <Input
                className={errors.issuer_url ? 'border-red-500' : ''}
                disabled={isSaving}
                onChange={(e) => setIssuerUrl(e.target.value)}
                placeholder="https://idp.example.com/"
                value={issuerUrl}
              />
              {errors.issuer_url && (
                <div className="mt-1 flex items-center gap-1 text-xs text-danger">
                  <AlertCircle className="h-3 w-3" />
                  {errors.issuer_url}
                </div>
              )}
              <p className="mt-1 text-xs text-tertiary">
                OpenID Connect discovery base URL.
              </p>
            </div>
          )}

          {showAllowedDomains && (
            <div>
              <label className="mb-1.5 block text-sm text-secondary">
                Allowed Email Domains
              </label>
              <div
                className={
                  'flex flex-wrap items-center gap-2 rounded-lg border border-input bg-background p-2'
                }
              >
                {allowedDomains.map((d) => (
                  <span
                    className={
                      'inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary'
                    }
                    key={d}
                  >
                    {d}
                    <button
                      aria-label={`Remove ${d}`}
                      className="text-tertiary hover:text-primary"
                      disabled={isSaving}
                      onClick={() => removeDomain(d)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  className={
                    'min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground'
                  }
                  disabled={isSaving}
                  onBlur={addDomain}
                  onChange={(e) => setDomainDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                      e.preventDefault()
                      addDomain()
                    } else if (
                      e.key === 'Backspace' &&
                      !domainDraft &&
                      allowedDomains.length > 0
                    ) {
                      setAllowedDomains(allowedDomains.slice(0, -1))
                    }
                  }}
                  placeholder={
                    allowedDomains.length === 0
                      ? 'example.com (Enter to add)'
                      : ''
                  }
                  value={domainDraft}
                />
              </div>
              <p className="mt-1 text-xs text-tertiary">
                Restrict sign-in to users whose email domain matches one of
                these. Leave empty to allow any domain.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              disabled={isSaving}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
