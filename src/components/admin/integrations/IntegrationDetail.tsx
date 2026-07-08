import { useState } from 'react'

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ArrowLeft, Lock, Package } from 'lucide-react'
import { toast } from 'sonner'

import {
  deleteIntegration,
  getIntegration,
  listCapabilityAssignments,
  listPluginPackages,
  listProjectTypes,
  replaceCapabilityAssignments,
  updateIntegration,
  updateIntegrationCredentials,
} from '@/api/endpoints'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ErrorBanner } from '@/components/ui/error-banner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sk, Swap } from '@/components/ui/skeleton'
import { useOrganization } from '@/contexts/OrganizationContext'
import { extractApiErrorDetail } from '@/lib/apiError'
import { queryKeys } from '@/lib/queryKeys'
import { statusBadgeVariant } from '@/lib/status-colors'
import type { CapabilityKind, Integration, PluginPackage } from '@/types'

import { CapabilityRow } from './CapabilityRow'

interface CredentialsDialogProps {
  credentials: PluginPackage['credentials']
  integrationName: string
  isSaving: boolean
  onClose: () => void
  onSave: (values: Record<string, null | string>) => Promise<void>
  open: boolean
}

interface IntegrationDetailProps {
  onBack: () => void
  seed: Integration | null
  slug: string
}

// fallow-ignore-next-line complexity
export function IntegrationDetail({
  onBack,
  seed,
  slug,
}: IntegrationDetailProps) {
  const { selectedOrganization } = useOrganization()
  const orgSlug = selectedOrganization?.slug
  const queryClient = useQueryClient()

  const {
    data: integration,
    error,
    isLoading,
  } = useQuery({
    enabled: !!orgSlug && !!slug,
    initialData: seed ?? undefined,
    queryFn: ({ signal }) => getIntegration(orgSlug!, slug, signal),
    queryKey:
      orgSlug && slug
        ? queryKeys.integration(orgSlug, slug)
        : ['integration', slug],
  })

  const { data: plugins = [] } = useQuery({
    queryFn: ({ signal }) => listPluginPackages(signal),
    queryKey: queryKeys.pluginPackages(),
    staleTime: 60 * 1000,
  })

  const { data: projectTypes = [] } = useQuery({
    enabled: !!orgSlug,
    queryFn: ({ signal }) => listProjectTypes(orgSlug!, signal),
    queryKey: orgSlug ? queryKeys.projectTypes(orgSlug) : ['projectTypes'],
  })

  const plugin = plugins.find((p) => p.slug === integration?.plugin) ?? null
  const pluginAvailable = !!plugin && plugin.enabled
  const editable = pluginAvailable

  // Load current project-type assignments for each project-scoped capability.
  const scopedKinds =
    plugin?.capabilities.filter((c) => c.project_scoped).map((c) => c.kind) ??
    []
  const assignmentQueries = useQueries({
    queries: scopedKinds.map((kind) => ({
      enabled: !!orgSlug && !!integration,
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        listCapabilityAssignments(
          orgSlug!,
          slug,
          kind as CapabilityKind,
          signal,
        ),
      queryKey: ['capability-assignments', orgSlug, slug, kind],
    })),
  })
  const assignmentsByKind: Record<string, string[]> = {}
  scopedKinds.forEach((kind, i) => {
    assignmentsByKind[kind] = (assignmentQueries[i].data ?? []).map(
      (a) => a.project_type_slug,
    )
  })

  const invalidate = () => {
    if (orgSlug) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.integration(orgSlug, slug),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.integrations(orgSlug),
      })
    }
  }

  const patchMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateIntegration>[2]) =>
      updateIntegration(orgSlug!, slug, data),
    onError: (err) => toast.error(`Save failed: ${extractApiErrorDetail(err)}`),
    onSuccess: invalidate,
  })

  const assignmentMutation = useMutation({
    mutationFn: ({ kind, slugs }: { kind: string; slugs: string[] }) =>
      replaceCapabilityAssignments(orgSlug!, slug, kind as CapabilityKind, {
        assignments: slugs.map((project_type_slug) => ({
          default: false,
          env_payloads: {},
          identity_integration_slug: null,
          options: {},
          project_type_slug,
        })),
      }),
    onError: (err) => toast.error(`Save failed: ${extractApiErrorDetail(err)}`),
    onSuccess: (_data, { kind }) => {
      void queryClient.invalidateQueries({
        queryKey: ['capability-assignments', orgSlug, slug, kind],
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteIntegration(orgSlug!, slug),
    onError: (err) =>
      toast.error(`Delete failed: ${extractApiErrorDetail(err)}`),
    onSuccess: () => {
      toast.success('Integration deleted')
      invalidate()
      onBack()
    },
  })

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingCreds, setEditingCreds] = useState(false)

  if (error && !integration) {
    return <ErrorBanner error={error} title="Failed to load integration" />
  }

  const patchCapability = (
    kind: string,
    enabled: boolean,
    options: Record<string, unknown>,
  ) => {
    patchMutation.mutate({ capabilities: { [kind]: { enabled, options } } })
  }

  return (
    <div className="max-w-4xl">
      <Button
        className="mb-3 pl-1.5"
        onClick={onBack}
        size="sm"
        variant="ghost"
      >
        <ArrowLeft className="size-4" />
        Integrations
      </Button>

      <Swap
        ready={!isLoading || !!integration}
        skeleton={
          <div className="space-y-4">
            <Sk h={32} w="40%" />
            <Sk h={160} />
            <Sk h={220} />
          </div>
        }
      >
        {integration && (
          <>
            {!pluginAvailable && (
              <Alert className="mb-4" variant="warning">
                The {integration.plugin} plugin is disabled or no longer
                installed. This integration is inactive and its capabilities are
                read-only.
              </Alert>
            )}

            <div className="mb-6 flex items-start justify-between gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-primary text-2xl font-semibold tracking-tight">
                  {integration.name}
                </h1>
                <span className="text-tertiary inline-flex items-center gap-1 font-mono text-xs">
                  <Package className="size-3" />
                  {integration.plugin}
                </span>
                <Badge variant={statusBadgeVariant(integration.status)}>
                  {integration.status}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {/* Connection */}
              <Card>
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-primary text-[17px] font-semibold">
                      Connection
                    </h2>
                    <Button
                      disabled={!editable}
                      onClick={() => setEditingCreds(true)}
                      size="sm"
                      variant="secondary"
                    >
                      Replace credentials
                    </Button>
                  </div>

                  {plugin && plugin.options.length > 0 && (
                    <div className="mb-2">
                      {plugin.options.map((opt) => (
                        <ConnectionRow
                          key={opt.name}
                          label={opt.label}
                          value={formatValue(integration.options[opt.name])}
                        />
                      ))}
                    </div>
                  )}

                  <div className="text-tertiary mt-4 mb-1 text-xs font-semibold tracking-wide uppercase">
                    Credentials
                  </div>
                  {(plugin?.credentials ?? []).map((cred) => {
                    const isSet = integration.credential_fields.includes(
                      cred.name,
                    )
                    return (
                      <div
                        className="border-tertiary flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0"
                        key={cred.name}
                      >
                        <span className="text-secondary flex items-center gap-2 text-[13px]">
                          {cred.label}
                          {!cred.required && (
                            <span className="text-tertiary text-xs">
                              optional
                            </span>
                          )}
                        </span>
                        <span className="text-tertiary inline-flex items-center gap-1.5 text-sm">
                          <Lock className="size-3" />
                          {isSet ? (
                            <span className="text-success">set</span>
                          ) : (
                            'not set'
                          )}
                        </span>
                      </div>
                    )
                  })}
                  {(plugin?.credentials.length ?? 0) === 0 && (
                    <div className="text-tertiary text-sm">
                      This plugin requires no credentials.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Capabilities */}
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-5 pt-4 pb-3">
                    <h2 className="text-primary text-[17px] font-semibold">
                      Capabilities
                    </h2>
                  </div>
                  <div className="border-tertiary border-t">
                    {/* fallow-ignore-next-line complexity */}
                    {(plugin?.capabilities ?? []).map((cap) => {
                      const toggle = integration.capabilities[cap.kind]
                      const enabled = toggle?.enabled ?? false
                      const options = toggle?.options ?? {}
                      return (
                        <CapabilityRow
                          assignedTypeSlugs={assignmentsByKind[cap.kind] ?? []}
                          description={cap.description}
                          editable={editable}
                          enabled={enabled}
                          key={cap.kind}
                          kind={cap.kind}
                          label={cap.label}
                          note={
                            cap.project_scoped
                              ? null
                              : 'Applies org-wide, not per project type.'
                          }
                          onAssignmentChange={(slugs) =>
                            assignmentMutation.mutate({
                              kind: cap.kind,
                              slugs,
                            })
                          }
                          onOptionChange={(optName, value) =>
                            patchCapability(cap.kind, enabled, {
                              ...options,
                              [optName]: value,
                            })
                          }
                          onToggle={(nextEnabled) =>
                            patchCapability(cap.kind, nextEnabled, options)
                          }
                          options={cap.options}
                          optionValues={options}
                          projectScoped={cap.project_scoped}
                          projectTypes={projectTypes}
                        />
                      )
                    })}
                    {(plugin?.capabilities.length ?? 0) === 0 && (
                      <div className="text-tertiary p-5 text-sm">
                        No capabilities are available for this plugin.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Danger zone */}
              <Card className="border-danger">
                <CardContent className="p-5">
                  <h2 className="text-danger text-[17px] font-semibold">
                    Danger zone
                  </h2>
                  <div className="flex items-center justify-between gap-4 pt-3">
                    <div>
                      <div className="text-primary text-sm font-medium">
                        Disable integration
                      </div>
                      <div className="text-secondary text-sm">
                        Stops all capabilities. Configuration is kept.
                      </div>
                    </div>
                    <Button
                      disabled={
                        integration.status === 'inactive' ||
                        patchMutation.isPending
                      }
                      onClick={() =>
                        patchMutation.mutate({ status: 'inactive' })
                      }
                      variant="secondary"
                    >
                      {integration.status === 'inactive'
                        ? 'Disabled'
                        : 'Disable'}
                    </Button>
                  </div>
                  <div className="border-tertiary mt-3.5 flex items-center justify-between gap-4 border-t pt-3.5">
                    <div>
                      <div className="text-primary text-sm font-medium">
                        Delete integration
                      </div>
                      <div className="text-secondary text-sm">
                        Removes credentials and unlinks connected projects.
                        Cannot be undone.
                      </div>
                    </div>
                    <Button
                      className="border-danger bg-danger text-danger border"
                      onClick={() => setConfirmDelete(true)}
                      variant="ghost"
                    >
                      Delete…
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {plugin && (
              <CredentialsDialog
                credentials={plugin.credentials}
                integrationName={integration.name}
                isSaving={false}
                onClose={() => setEditingCreds(false)}
                onSave={async (values) => {
                  if (!orgSlug) return
                  await updateIntegrationCredentials(orgSlug, slug, values)
                  toast.success('Credentials updated')
                  setEditingCreds(false)
                  invalidate()
                }}
                open={editingCreds}
              />
            )}

            <ConfirmDialog
              confirmLabel="Delete"
              description={`Delete "${integration.name}"? This removes its credentials and unlinks connected projects. This cannot be undone.`}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => {
                setConfirmDelete(false)
                deleteMutation.mutate()
              }}
              open={confirmDelete}
              title="Delete integration"
            />
          </>
        )}
      </Swap>
    </div>
  )
}

function ConnectionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-tertiary flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0">
      <span className="text-secondary text-[13px]">{label}</span>
      <span className="text-primary font-mono text-sm">{value}</span>
    </div>
  )
}

// Write-only credential replacement. Only fields the operator types into are
// sent (empty fields are left untouched on the server).
function CredentialsDialog({
  credentials,
  integrationName,
  onClose,
  onSave,
  open,
}: CredentialsDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const payload: Record<string, null | string> = {}
    for (const [name, value] of Object.entries(values)) {
      if (value.trim()) payload[name] = value
    }
    setSaving(true)
    try {
      await onSave(payload)
      setValues({})
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) {
          setValues({})
          onClose()
        }
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace credentials — {integrationName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-6 pt-2">
          <p className="text-tertiary text-xs">
            Leave a field blank to keep the current value. Entered values are
            write-only and never shown again.
          </p>
          {credentials.map((cred) => (
            <div className="flex flex-col gap-1.5" key={cred.name}>
              <Label htmlFor={`replace-${cred.name}`}>
                {cred.label}
                {!cred.required && (
                  <span className="text-tertiary ml-1 text-xs">optional</span>
                )}
              </Label>
              <Input
                className="font-mono"
                id={`replace-${cred.name}`}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [cred.name]: e.target.value }))
                }
                placeholder="••••••••"
                type="password"
                value={values[cred.name] ?? ''}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            className="bg-action text-action-foreground hover:bg-action-hover"
            disabled={saving || Object.keys(values).length === 0}
            onClick={submit}
          >
            Save credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// fallow-ignore-next-line complexity
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
