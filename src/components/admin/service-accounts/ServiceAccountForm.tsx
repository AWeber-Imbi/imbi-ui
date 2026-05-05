import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'

import { getRoles } from '@/api/endpoints'
import { FormHeader } from '@/components/admin/form-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useDirtyState } from '@/hooks/useDirtyState'
import { useFormScaffold } from '@/hooks/useFormScaffold'
import type {
  ApiKeyCreated,
  ClientCredentialCreated,
  ServiceAccount,
  ServiceAccountCreate,
} from '@/types'

import { ApiKeysSection } from './ApiKeysSection'
import { AvatarUpload } from './AvatarUpload'
import { ClientCredentialsSection } from './ClientCredentialsSection'
import { OrgMembershipsCard } from './OrgMembershipsCard'
import { useServiceAccountMutations } from './useServiceAccountMutations'

interface ServiceAccountFormProps {
  account: null | ServiceAccount
  error?: null | { message?: string; response?: { data?: { detail?: string } } }
  isLoading?: boolean
  onCancel: () => void
  onSave: (data: ServiceAccountCreate) => void
}

export function ServiceAccountForm({
  account,
  error,
  isLoading = false,
  onCancel,
  onSave,
}: ServiceAccountFormProps) {
  const isEditing = !!account

  const [slug, setSlug] = useState(account?.slug || '')
  const [displayName, setDisplayName] = useState(account?.display_name || '')
  const [description, setDescription] = useState(account?.description || '')
  const [isActive, setIsActive] = useState(account?.is_active ?? true)

  const { organizations } = useOrganization()
  const [organizationSlug, setOrganizationSlug] = useState(
    organizations.length === 1 ? organizations[0].slug : '',
  )
  const [roleSlug, setRoleSlug] = useState('')

  const {
    data: availableRoles = [],
    isError: rolesError,
    isLoading: rolesLoading,
  } = useQuery({
    queryFn: ({ signal }) => getRoles(signal),
    queryKey: ['roles'],
  })

  const {
    handleFieldChange,
    setTouched,
    setValidationErrors,
    touched,
    validationErrors,
  } = useFormScaffold()

  const [initialFormData] = useState(() => ({
    description: account?.description ?? '',
    display_name: account?.display_name ?? '',
    is_active: account?.is_active ?? true,
    organization_slug: organizations.length === 1 ? organizations[0].slug : '',
    role_slug: '',
    slug: account?.slug ?? '',
  }))
  const currentFormData = {
    description,
    display_name: displayName,
    is_active: isActive,
    organization_slug: organizationSlug,
    role_slug: roleSlug,
    slug,
  }
  useDirtyState(initialFormData, currentFormData, { enabled: !isLoading })

  const validateSlug = (value: string): string => {
    if (!value.trim()) return 'Slug is required'
    if (!/^[a-z][a-z0-9-]*$/.test(value)) {
      return 'Slug must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens'
    }
    return ''
  }

  const validateDisplayName = (value: string): string => {
    if (!value.trim()) return 'Display name is required'
    return ''
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    const slugError = validateSlug(slug)
    if (slugError) errors.slug = slugError

    const displayNameError = validateDisplayName(displayName)
    if (displayNameError) errors.display_name = displayNameError

    if (!isEditing) {
      if (!organizationSlug)
        errors.organization_slug = 'Organization is required'
      if (!roleSlug) errors.role_slug = 'Role is required'
    }

    setValidationErrors(errors)
    setTouched({
      display_name: true,
      organization_slug: true,
      role_slug: true,
      slug: true,
    })

    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return
    onSave({
      description: description.trim() || null,
      display_name: displayName.trim(),
      is_active: isActive,
      organization_slug: organizationSlug,
      role_slug: roleSlug,
      slug: slug.trim(),
    })
  }

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(sanitized)
    handleFieldChange('slug')
  }

  return (
    <div className="space-y-6">
      <FormHeader
        createLabel="Create Service Account"
        isEditing={isEditing}
        isLoading={isLoading}
        onCancel={onCancel}
        onSave={handleSave}
        subtitle={
          isEditing
            ? `Editing ${account?.display_name}`
            : 'Create an automated service account for API access'
        }
        title={isEditing ? 'Edit Service Account' : 'Create Service Account'}
      />

      {error && (
        <div className="rounded-lg border border-danger bg-danger p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-danger" />
            <div>
              <div className="font-medium text-danger">
                Failed to save service account
              </div>
              <div className="mt-1 text-sm text-danger">
                {error?.response?.data?.detail ||
                  error?.message ||
                  'An error occurred'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main info card — merged basic info + status */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Slug */}
          {isEditing ? (
            <div>
              <label className="mb-1.5 block text-sm text-secondary">
                Slug
              </label>
              <Input disabled value={account.slug} />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm text-secondary">
                Slug <span className="text-red-500">*</span>
              </label>
              <Input
                disabled={isLoading}
                onBlur={() => {
                  setTouched({ ...touched, slug: true })
                  const err = validateSlug(slug)
                  if (err)
                    setValidationErrors({ ...validationErrors, slug: err })
                }}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-service-account"
                value={slug}
              />
              <p className="mt-1 text-xs text-tertiary">
                Lowercase letters, numbers, and hyphens only. Must start with a
                letter.
              </p>
              {touched.slug && validationErrors.slug && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.slug}
                </p>
              )}
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="mb-1.5 block text-sm text-secondary">
              Display Name <span className="text-red-500">*</span>
            </label>
            <Input
              disabled={isLoading}
              onBlur={() => {
                setTouched({ ...touched, display_name: true })
                const err = validateDisplayName(displayName)
                if (err)
                  setValidationErrors({
                    ...validationErrors,
                    display_name: err,
                  })
              }}
              onChange={(e) => {
                setDisplayName(e.target.value)
                handleFieldChange('display_name')
              }}
              placeholder="CI/CD Pipeline"
              value={displayName}
            />
            {touched.display_name && validationErrors.display_name && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.display_name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm text-secondary">
              Description
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this service account do?"
              rows={3}
              value={description}
            />
          </div>

          {/* Avatar (edit only) */}
          {isEditing && account && (
            <div>
              <label className="mb-1.5 block text-sm text-secondary">
                Avatar
              </label>
              <AvatarSection account={account} />
            </div>
          )}

          {/* Account Active */}
          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={isActive}
                className="rounded"
                disabled={isLoading}
                onChange={(e) => setIsActive(e.target.checked)}
                type="checkbox"
              />
              <span className="text-secondary">Account Active</span>
            </label>
            <p className="ml-6 mt-1 text-sm text-secondary">
              Inactive service accounts cannot authenticate via API
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Organization Membership (creation only) */}
      {!isEditing && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="mb-4 text-sm text-secondary">
              Service accounts must belong to at least one organization with a
              role to have any permissions.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm text-secondary">
                  Organization <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  onChange={(e) => {
                    setOrganizationSlug(e.target.value)
                    handleFieldChange('organization_slug')
                  }}
                  value={organizationSlug}
                >
                  <option value="">Select an organization...</option>
                  {organizations.map((org) => (
                    <option key={org.slug} value={org.slug}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {touched.organization_slug &&
                  validationErrors.organization_slug && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.organization_slug}
                    </p>
                  )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-secondary">
                  Role <span className="text-red-500">*</span>
                </label>
                {rolesLoading ? (
                  <p className="text-sm text-secondary">Loading roles...</p>
                ) : rolesError ? (
                  <p className="text-sm text-danger">
                    Failed to load roles. Please refresh and try again.
                  </p>
                ) : (
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                    onChange={(e) => {
                      setRoleSlug(e.target.value)
                      handleFieldChange('role_slug')
                    }}
                    value={roleSlug}
                  >
                    <option value="">Select a role...</option>
                    {availableRoles.map((role) => (
                      <option key={role.slug} value={role.slug}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
                {touched.role_slug && validationErrors.role_slug && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.role_slug}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isEditing && account && <EditSections account={account} />}
    </div>
  )
}

function AvatarSection({ account }: { account: ServiceAccount }) {
  const { removeAvatarMutation, uploadAvatarMutation } =
    useServiceAccountMutations(account)
  return (
    <AvatarUpload
      avatarUrl={account.avatar_url}
      displayName={account.display_name}
      isRemoving={removeAvatarMutation.isPending}
      isUploading={uploadAvatarMutation.isPending}
      onRemove={() => removeAvatarMutation.mutate()}
      onUpload={(file) => uploadAvatarMutation.mutate(file)}
    />
  )
}

function EditSections({ account }: { account: ServiceAccount }) {
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyCreated | null>(
    null,
  )
  const [newlyCreatedCredential, setNewlyCreatedCredential] =
    useState<ClientCredentialCreated | null>(null)

  const {
    data: availableRoles = [],
    isError: rolesError,
    isLoading: rolesLoading,
  } = useQuery({
    queryFn: ({ signal }) => getRoles(signal),
    queryKey: ['roles'],
  })

  const {
    addOrgMutation,
    createApiKeyMutation,
    createCredentialMutation,
    removeOrgMutation,
    revokeApiKeyMutation,
    revokeCredentialMutation,
    rotateApiKeyMutation,
    rotateCredentialMutation,
    updateOrgRoleMutation,
  } = useServiceAccountMutations(account)

  return (
    <>
      <OrgMembershipsCard
        account={account}
        addOrgMutation={addOrgMutation}
        availableRoles={availableRoles}
        onConfirmRemove={(orgSlug, orgName) => {
          if (confirm(`Remove ${account.display_name} from ${orgName}?`)) {
            removeOrgMutation.mutate(orgSlug)
          }
        }}
        removeOrgMutation={removeOrgMutation}
        rolesError={rolesError}
        rolesLoading={rolesLoading}
        updateOrgRoleMutation={updateOrgRoleMutation}
      />

      <ClientCredentialsSection
        account={account}
        createCredentialMutation={createCredentialMutation}
        newlyCreatedCredential={newlyCreatedCredential}
        onConfirmRevoke={(clientId) => {
          if (
            confirm('Revoke this credential? This action cannot be undone.')
          ) {
            revokeCredentialMutation.mutate(clientId)
          }
        }}
        onConfirmRotate={(clientId) => {
          if (
            confirm(
              'Rotate this credential? The old secret will stop working immediately.',
            )
          ) {
            rotateCredentialMutation.mutate(clientId, {
              onSuccess: (data) => setNewlyCreatedCredential(data),
            })
          }
        }}
        onNewlyCreatedCredentialChange={setNewlyCreatedCredential}
        revokeCredentialMutation={revokeCredentialMutation}
        rotateCredentialMutation={rotateCredentialMutation}
      />

      <ApiKeysSection
        account={account}
        createApiKeyMutation={createApiKeyMutation}
        newlyCreatedKey={newlyCreatedKey}
        onConfirmRevoke={(keyId) => {
          if (confirm('Revoke this API key? This action cannot be undone.')) {
            revokeApiKeyMutation.mutate(keyId)
          }
        }}
        onConfirmRotate={(keyId) => {
          if (
            confirm(
              'Rotate this API key? The old key will stop working immediately.',
            )
          ) {
            rotateApiKeyMutation.mutate(keyId, {
              onSuccess: (data) => setNewlyCreatedKey(data),
            })
          }
        }}
        onNewlyCreatedKeyChange={setNewlyCreatedKey}
        revokeApiKeyMutation={revokeApiKeyMutation}
        rotateApiKeyMutation={rotateApiKeyMutation}
      />
    </>
  )
}
