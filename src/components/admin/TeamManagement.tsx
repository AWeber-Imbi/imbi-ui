import { useState, useMemo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/api/client'
import { Plus, Search, Trash2, Users, AlertCircle } from 'lucide-react'
import { formatRelativeDate } from '@/lib/formatDate'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { EntityIcon } from '@/components/ui/entity-icon'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { TeamForm } from './teams/TeamForm'
import { TeamDetail } from './teams/TeamDetail'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useAdminNav } from '@/hooks/useAdminNav'
import { listTeams, deleteTeam, createTeam, updateTeam } from '@/api/endpoints'
import type { TeamCreate } from '@/types'

interface TeamManagementProps {
  isDarkMode: boolean
}

export function TeamManagement({ isDarkMode }: TeamManagementProps) {
  const queryClient = useQueryClient()
  const { selectedOrganization } = useOrganization()
  const {
    viewMode,
    slug: selectedTeamSlug,
    goToList,
    goToCreate,
    goToEdit,
  } = useAdminNav()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{
    slug: string
    name: string
    orgSlug: string
  } | null>(null)

  const orgSlug = selectedOrganization?.slug

  const {
    data: teams = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['teams', orgSlug],
    queryFn: () => listTeams(orgSlug!),
    enabled: !!orgSlug,
  })

  const createMutation = useMutation({
    mutationFn: ({ orgSlug, team }: { orgSlug: string; team: TeamCreate }) =>
      createTeam(orgSlug, team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', orgSlug] })
      goToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      orgSlug,
      slug,
      team,
    }: {
      orgSlug: string
      slug: string
      team: TeamCreate
    }) => updateTeam(orgSlug, slug, team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', orgSlug] })
      goToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ orgSlug, slug }: { orgSlug: string; slug: string }) =>
      deleteTeam(orgSlug, slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', orgSlug] })
    },
    onError: (error: ApiError<{ detail?: string }>) => {
      alert(
        `Failed to delete team: ${error.response?.data?.detail || error.message}`,
      )
    },
  })

  const filteredTeams = teams.filter((team) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        team.name.toLowerCase().includes(query) ||
        team.slug.toLowerCase().includes(query) ||
        (team.description?.toLowerCase().includes(query) ?? false)
      )
    }
    return true
  })

  const selectedTeam = useMemo(
    () => teams.find((t) => t.slug === selectedTeamSlug) || null,
    [teams, selectedTeamSlug],
  )

  const handleDelete = (slug: string) => {
    const team = teams.find((t) => t.slug === slug)
    if (team) {
      setDeleteTarget({
        slug,
        name: team.name,
        orgSlug: team.organization.slug,
      })
    }
  }

  const onDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate({
        orgSlug: deleteTarget.orgSlug,
        slug: deleteTarget.slug,
      })
      setDeleteTarget(null)
    }
  }

  const handleSave = (formOrgSlug: string, teamData: TeamCreate) => {
    if (viewMode === 'create') {
      createMutation.mutate({ orgSlug: formOrgSlug, team: teamData })
    } else if (selectedTeamSlug) {
      updateMutation.mutate({
        orgSlug: selectedTeam?.organization.slug || formOrgSlug,
        slug: selectedTeamSlug,
        team: teamData,
      })
    }
  }

  const handleCancel = () => {
    goToList()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
        >
          Loading teams...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border p-4 ${
          isDarkMode
            ? 'border-red-700 bg-red-900/20 text-red-400'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}
      >
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <div className="font-medium">Failed to load teams</div>
          <div className="mt-1 text-sm">
            {error instanceof Error ? error.message : 'An error occurred'}
          </div>
        </div>
      </div>
    )
  }

  if (!orgSlug) {
    return (
      <div
        className={`py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
      >
        Select an organization to manage teams.
      </div>
    )
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <TeamForm
        team={selectedTeam}
        onSave={handleSave}
        onCancel={handleCancel}
        isDarkMode={isDarkMode}
        isLoading={createMutation.isPending || updateMutation.isPending}
        error={createMutation.error || updateMutation.error}
      />
    )
  }

  if (viewMode === 'detail' && selectedTeam) {
    return (
      <TeamDetail
        team={selectedTeam}
        onEdit={() => goToEdit(selectedTeam.slug)}
        onBack={handleCancel}
        isDarkMode={isDarkMode}
      />
    )
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name}"?`}
        onConfirm={onDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="relative max-w-md">
            <Search
              className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : ''}`}
            />
          </div>
        </div>
        <Button
          onClick={goToCreate}
          className="bg-amber-border text-white hover:bg-amber-border-strong"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Team
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className={isDarkMode ? 'border-gray-700 bg-gray-800' : ''}>
          <CardContent className="p-4">
            <CardDescription
              className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
            >
              Total Teams
            </CardDescription>
            <div
              className={`mt-1 text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {filteredTeams.length}
            </div>
          </CardContent>
        </Card>
        <Card className={isDarkMode ? 'border-gray-700 bg-gray-800' : ''}>
          <CardContent className="p-4">
            <CardDescription
              className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
            >
              Total Projects
            </CardDescription>
            <div
              className={`mt-1 text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {filteredTeams.reduce(
                (sum, t) => sum + (t.relationships?.projects?.count ?? 0),
                0,
              )}
            </div>
          </CardContent>
        </Card>
        <Card className={isDarkMode ? 'border-gray-700 bg-gray-800' : ''}>
          <CardContent className="p-4">
            <CardDescription
              className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
            >
              Total Members
            </CardDescription>
            <div
              className={`mt-1 text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {filteredTeams.reduce(
                (sum, t) => sum + (t.relationships?.members?.count ?? 0),
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams Table */}
      <Card className={isDarkMode ? 'border-gray-700 bg-gray-800' : ''}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-tertiary bg-secondary">
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-xs uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Team
                  </th>
                  <th
                    className={`px-6 py-3 text-center text-xs uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Slug
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Projects
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Members
                  </th>
                  <th
                    className={`whitespace-nowrap px-6 py-3 text-center text-xs uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Last Updated
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
              >
                {filteredTeams.map((team) => (
                  <tr
                    key={team.slug}
                    onClick={() => goToEdit(team.slug)}
                    onKeyDown={(e) => {
                      if (e.currentTarget !== e.target) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        goToEdit(team.slug)
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Edit team ${team.name}`}
                    className={`cursor-pointer ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                            isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                          }`}
                        >
                          {team.icon ? (
                            <EntityIcon
                              icon={team.icon}
                              className="h-5 w-5 rounded object-cover"
                            />
                          ) : (
                            <Users
                              className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                            />
                          )}
                        </div>
                        <div>
                          <div
                            className={
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }
                          >
                            {team.name}
                          </div>
                          {team.description && (
                            <div
                              className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                            >
                              {team.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      <code
                        className={`rounded px-2 py-1 ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {team.slug}
                      </code>
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-right text-sm ${
                        (team.relationships?.projects?.count ?? 0) === 0
                          ? isDarkMode
                            ? 'text-gray-600'
                            : 'text-gray-400'
                          : isDarkMode
                            ? 'text-gray-300'
                            : 'text-gray-600'
                      }`}
                    >
                      {team.relationships?.projects?.count ?? 0}
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-right text-sm ${
                        (team.relationships?.members?.count ?? 0) === 0
                          ? isDarkMode
                            ? 'text-gray-600'
                            : 'text-gray-400'
                          : isDarkMode
                            ? 'text-gray-300'
                            : 'text-gray-600'
                      }`}
                    >
                      {team.relationships?.members?.count ?? 0}
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      {formatRelativeDate(team.updated_at ?? team.created_at)}
                    </td>
                    <td
                      className="whitespace-nowrap px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {(() => {
                          const projectCount =
                            team.relationships?.projects?.count ?? 0
                          const memberCount =
                            team.relationships?.members?.count ?? 0
                          const canDelete =
                            projectCount === 0 && memberCount === 0
                          const disabledParts = [
                            projectCount > 0
                              ? `${projectCount} project(s)`
                              : '',
                            memberCount > 0 ? `${memberCount} member(s)` : '',
                          ].filter(Boolean)
                          const tooltipText = !canDelete
                            ? `Cannot delete: has ${disabledParts.join(' and ')}`
                            : undefined
                          return (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(team.slug)}
                                      disabled={
                                        deleteMutation.isPending || !canDelete
                                      }
                                      className={
                                        isDarkMode
                                          ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300 disabled:pointer-events-none disabled:opacity-30'
                                          : 'text-red-600 hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-30'
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {tooltipText && (
                                  <TooltipContent>
                                    <p>{tooltipText}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTeams.length === 0 && (
              <div
                className={`py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {searchQuery
                  ? 'No teams found matching your search.'
                  : selectedOrganization
                    ? `No teams in ${selectedOrganization.name} yet.`
                    : 'No teams created yet.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
