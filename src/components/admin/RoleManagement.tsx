import { useState } from 'react'
import { Shield, Lock } from 'lucide-react'
import { formatRelativeDate } from '@/lib/formatDate'
import { Badge } from '@/components/ui/badge'
import { AdminTable } from '@/components/ui/admin-table'
import type { CanDeleteResult } from '@/components/ui/admin-table'
import { AdminSection } from './AdminSection'
import { RoleForm } from './roles/RoleForm'
import { RoleDetail } from './roles/RoleDetail'
import { useAdminNav } from '@/hooks/useAdminNav'
import { useAdminCrud } from '@/hooks/useAdminCrud'
import {
  getRoles,
  getRole,
  deleteRole,
  createRole,
  updateRole,
  grantPermission,
  revokePermission,
} from '@/api/endpoints'
import type { RoleDetail as RoleDetailType, RoleCreate } from '@/types'

type Role = Awaited<ReturnType<typeof getRoles>>[number]

// Sync permissions: grant new ones, revoke removed ones
async function syncPermissions(slug: string, desired: string[]) {
  const current = await getRole(slug)
  const currentPerms = new Set(current.permissions?.map((p) => p.name) || [])
  const desiredPerms = new Set(desired)

  const toGrant = desired.filter((p) => !currentPerms.has(p))
  const toRevoke = [...currentPerms].filter((p) => !desiredPerms.has(p))

  await Promise.all([
    ...toGrant.map((p) => grantPermission(slug, p)),
    ...toRevoke.map((p) => revokePermission(slug, p)),
  ])
}

export function RoleManagement() {
  const {
    viewMode,
    slug: selectedRoleSlug,
    goToList,
    goToCreate,
    goToEdit,
  } = useAdminNav()
  const [searchQuery, setSearchQuery] = useState('')

  const {
    items: roles,
    isLoading,
    error,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useAdminCrud<
    Role,
    { role: RoleCreate; permissions: string[] },
    { slug: string; role: RoleCreate; permissions: string[] },
    string
  >({
    queryKey: ['roles'],
    listFn: getRoles,
    createFn: async ({ role, permissions }) => {
      const created = await createRole(role)
      if (permissions.length > 0) {
        await syncPermissions(created.slug, permissions)
      }
    },
    updateFn: async ({ slug, role, permissions }) => {
      const updated = await updateRole(slug, role)
      await syncPermissions(updated.slug, permissions)
    },
    deleteFn: deleteRole,
    onMutationSuccess: goToList,
    extraInvalidateKeys: [['role']],
    deleteErrorLabel: 'role',
  })

  // Filter roles locally
  const filteredRoles = roles.filter((role) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        role.name.toLowerCase().includes(query) ||
        role.slug.toLowerCase().includes(query) ||
        (role.description?.toLowerCase().includes(query) ?? false)
      )
    }
    return true
  })

  const handleDelete = (role: Role) => {
    deleteMutation.mutate(role.slug)
  }

  const canDeleteRole = (role: Role): CanDeleteResult => {
    const isSystem = 'is_system' in role && (role as RoleDetailType).is_system
    if (isSystem)
      return { allowed: false, reason: 'System roles cannot be deleted' }
    return { allowed: true }
  }

  const handleSave = (roleData: RoleCreate, permissions: string[]) => {
    if (viewMode === 'create') {
      createMutation.mutate({ role: roleData, permissions })
    } else if (selectedRoleSlug) {
      updateMutation.mutate({
        slug: selectedRoleSlug,
        role: roleData,
        permissions,
      })
    }
  }

  const handleCancel = () => {
    goToList()
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    const isCreate = viewMode === 'create'
    return (
      <RoleForm
        roleSlug={selectedRoleSlug}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={
          isCreate ? createMutation.isPending : updateMutation.isPending
        }
        error={isCreate ? createMutation.error : updateMutation.error}
      />
    )
  }

  if (viewMode === 'detail' && selectedRoleSlug) {
    return (
      <RoleDetail
        slug={selectedRoleSlug}
        onEdit={() => goToEdit(selectedRoleSlug)}
        onBack={handleCancel}
      />
    )
  }

  return (
    <AdminSection
      searchPlaceholder="Search roles..."
      search={searchQuery}
      onSearchChange={setSearchQuery}
      createLabel="New Role"
      onCreate={goToCreate}
      isLoading={isLoading}
      loadingLabel="Loading roles..."
      error={error}
      errorTitle="Failed to load roles"
    >
      <AdminTable
        columns={[
          {
            key: 'name',
            header: 'Role',
            headerAlign: 'left',
            cellAlign: 'left',
            render: (role) => (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 flex-shrink-0 text-info" />
                <span className="text-sm font-medium text-primary">
                  {role.name}
                </span>
              </div>
            ),
          },
          {
            key: 'slug',
            header: 'Slug',
            headerAlign: 'center',
            cellAlign: 'center',
            render: (role) => (
              <span className="font-mono text-sm text-secondary">
                {role.slug}
              </span>
            ),
          },
          {
            key: 'description',
            header: 'Description',
            headerAlign: 'left',
            cellAlign: 'left',
            render: (role) => (
              <span className="text-sm text-secondary">
                {role.description || '-'}
              </span>
            ),
          },
          {
            key: 'type',
            header: 'Type',
            headerAlign: 'center',
            cellAlign: 'center',
            render: (role) => {
              const isSystem =
                'is_system' in role && (role as RoleDetailType).is_system
              return isSystem ? (
                <Badge variant="warning" className="gap-1">
                  <Lock className="h-3 w-3" />
                  System
                </Badge>
              ) : (
                <Badge variant="info">Custom</Badge>
              )
            },
          },
          {
            key: 'updated',
            header: 'Last Updated',
            headerAlign: 'center',
            cellAlign: 'center',
            render: (role) => formatRelativeDate(role.updated_at),
          },
        ]}
        rows={filteredRoles}
        getRowKey={(role) => role.slug}
        getDeleteLabel={(role) => role.name}
        onRowClick={(role) => goToEdit(role.slug)}
        isRowClickable={(role) =>
          !('is_system' in role && (role as RoleDetailType).is_system)
        }
        onDelete={handleDelete}
        canDelete={canDeleteRole}
        isDeleting={deleteMutation.isPending}
        emptyMessage={
          searchQuery ? 'No roles match your search' : 'No roles created yet'
        }
      />
    </AdminSection>
  )
}
