import { useMemo, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'

import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  GitPullRequest,
  Grid3x3,
  List,
  ListFilter,
  Network,
  Plus,
  Search,
} from 'lucide-react'
import { matchSorter } from 'match-sorter'

import { getProjects } from '@/api/endpoints'
import { useOrganization } from '@/contexts/OrganizationContext'
import { sortEnvironments } from '@/lib/utils'

import { NewProjectDialog } from './NewProjectDialog'
import { ProjectGraphView } from './ProjectGraphView'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Checkbox } from './ui/checkbox'
import { EnvironmentBadge } from './ui/environment-badge'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { ScoreBadge } from './ui/score-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

interface FilterHeaderProps {
  activeFilters: Set<string>
  children: React.ReactNode
  label: string
  onSort: () => void
  onToggle: (slug: string) => void
  options: { label: string; slug: string }[]
  sortDir: SortDir
  sorted: boolean
}

type SortDir = 'asc' | 'desc'

interface SortHeaderProps {
  children: React.ReactNode
  onSort: () => void
  sortDir: SortDir
  sorted: boolean
}

type SortKey = 'name' | 'prs' | 'score' | 'team' | 'type'

// fallow-ignore-next-line complexity
export function ProjectsView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedOrganization } = useOrganization()
  const orgSlug = selectedOrganization?.slug || ''

  const rawView = searchParams.get('view')
  const viewMode: 'graph' | 'grid' | 'list' =
    rawView === 'grid' || rawView === 'list' || rawView === 'graph'
      ? rawView
      : 'grid'
  const searchQuery = searchParams.get('q') ?? ''
  const sortKey = searchParams.get('sort') as null | SortKey
  const sortDir = (searchParams.get('dir') ?? 'asc') as SortDir
  const teamsParam = searchParams.get('teams') ?? ''
  const typesParam = searchParams.get('types') ?? ''

  const setViewMode = (v: 'graph' | 'grid' | 'list') =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('view', v)
        return next
      },
      { replace: true },
    )

  const setSearchQuery = (q: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (q) next.set('q', q)
        else next.delete('q')
        return next
      },
      { replace: true },
    )

  const setSort = (key: SortKey) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (prev.get('sort') === key) {
          if ((prev.get('dir') ?? 'asc') === 'asc') {
            next.set('dir', 'desc')
          } else {
            next.delete('sort')
            next.delete('dir')
          }
        } else {
          next.set('sort', key)
          next.set('dir', 'asc')
        }
        return next
      },
      { replace: true },
    )

  const toggleFilter = (param: string, slug: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        const current = new Set(
          prev.get(param)?.split(',').filter(Boolean) ?? [],
        )
        if (current.has(slug)) current.delete(slug)
        else current.add(slug)
        if (current.size > 0) next.set(param, [...current].sort().join(','))
        else next.delete(param)
        return next
      },
      { replace: true },
    )

  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false)

  const { data: projects, isLoading } = useQuery({
    enabled: !!orgSlug,
    queryFn: ({ signal }) => getProjects(orgSlug, signal),
    queryKey: ['projects', orgSlug],
  })

  const teamOptions = useMemo(
    () =>
      Array.from(
        new Map(
          (projects ?? []).map((p) => [p.team.slug, p.team.name]),
        ).entries(),
      )
        .map(([slug, label]) => ({ label, slug }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [projects],
  )

  // fallow-ignore-next-line complexity
  const typeOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of projects ?? []) {
      for (const pt of p.project_types ?? []) {
        map.set(pt.slug, pt.name)
      }
    }
    return Array.from(map.entries())
      .map(([slug, label]) => ({ label, slug }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [projects])

  const handleProjectSelect = (projectId: string) => {
    navigate(`/projects/${projectId}`)
  }

  // fallow-ignore-next-line complexity
  const filteredProjects = useMemo(() => {
    const teamSet = new Set(teamsParam.split(',').filter(Boolean))
    const typeSet = new Set(typesParam.split(',').filter(Boolean))
    let all = projects ?? []

    if (teamSet.size > 0) {
      all = all.filter((p) => teamSet.has(p.team.slug))
    }
    if (typeSet.size > 0) {
      all = all.filter((p) =>
        (p.project_types ?? []).some((pt) => typeSet.has(pt.slug)),
      )
    }
    if (searchQuery) {
      return matchSorter(all, searchQuery, {
        keys: [
          'name',
          'description',
          'team.name',
          { key: (p) => (p.project_types || []).map((pt) => pt.name) },
        ],
      })
    }
    if (!sortKey) return all

    // fallow-ignore-next-line complexity
    return [...all].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'team') cmp = a.team.name.localeCompare(b.team.name)
      else if (sortKey === 'type') {
        const aType = (a.project_types ?? [])[0]?.name ?? ''
        const bType = (b.project_types ?? [])[0]?.name ?? ''
        cmp = aType.localeCompare(bType)
      } else if (sortKey === 'prs')
        cmp = (a.open_pr_count ?? 0) - (b.open_pr_count ?? 0)
      else if (sortKey === 'score') cmp = (a.score ?? 0) - (b.score ?? 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [projects, searchQuery, sortKey, sortDir, teamsParam, typesParam])

  const activeTeamSet = new Set(teamsParam.split(',').filter(Boolean))
  const activeTypeSet = new Set(typesParam.split(',').filter(Boolean))

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg">Loading projects...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-primary text-2xl font-semibold">Projects</h1>
          <Button
            className="bg-action text-action-foreground hover:bg-action-hover"
            onClick={() => setNewProjectDialogOpen(true)}
            size="sm"
          >
            <Plus className="mr-2 size-4" />
            New Project
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="text-tertiary absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                className={`pl-9 ${''}`}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                type="text"
                value={searchQuery}
              />
            </div>

            <div className="border-secondary flex items-center rounded-lg border">
              <Button
                aria-label="Grid view"
                className={`rounded-r-none ${viewMode === 'grid' ? 'bg-amber-bg text-amber-text' : ''}`}
                onClick={() => setViewMode('grid')}
                size="sm"
                variant="ghost"
              >
                <Grid3x3 className="size-4" />
              </Button>
              <Button
                aria-label="List view"
                className={`rounded-none ${viewMode === 'list' ? 'bg-amber-bg text-amber-text' : ''}`}
                onClick={() => setViewMode('list')}
                size="sm"
                variant="ghost"
              >
                <List className="size-4" />
              </Button>
              <Button
                aria-label="Graph view"
                className={`rounded-l-none ${viewMode === 'graph' ? 'bg-amber-bg text-amber-text' : ''}`}
                onClick={() => setViewMode('graph')}
                size="sm"
                variant="ghost"
              >
                <Network className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Projects Graph/Grid/List */}
      {viewMode === 'graph' ? (
        <ProjectGraphView projects={filteredProjects} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* fallow-ignore-next-line complexity */}
          {filteredProjects.map((project) => {
            return (
              <Card
                className={`cursor-pointer p-5 transition-shadow hover:shadow-md ${''}`}
                key={`card-${project.id}`}
                onClick={() => handleProjectSelect(project.id)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-primary mb-1 truncate font-medium">
                      {project.name}
                    </h3>
                    <p className="text-tertiary text-sm">
                      {(project.project_types || [])
                        .map((pt) => pt.name)
                        .join(', ')}
                    </p>
                  </div>
                  <div className="ml-3">
                    <ScoreBadge
                      score={project.score}
                      size="md"
                      variant="circle"
                    />
                  </div>
                </div>

                {project.description && (
                  <p className="text-secondary mb-3 line-clamp-2 text-sm">
                    {project.description}
                  </p>
                )}

                <div className="mb-3">
                  <p className="text-tertiary text-xs">{project.team.name}</p>
                </div>

                {project.environments && project.environments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {sortEnvironments(project.environments || []).map((env) => (
                      <EnvironmentBadge
                        key={env.slug}
                        label_color={env.label_color}
                        name={env.name}
                        slug={env.slug}
                      />
                    ))}
                  </div>
                )}
                {((project.open_pr_count ?? 0) > 0 ||
                  (project.closed_pr_count ?? 0) > 0) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(project.open_pr_count ?? 0) > 0 && (
                      <span className="text-action flex items-center gap-1 text-xs font-medium">
                        <GitPullRequest className="size-3" />
                        {project.open_pr_count} open
                      </span>
                    )}
                    {(project.closed_pr_count ?? 0) > 0 && (
                      <span className="text-tertiary flex items-center gap-1 text-xs">
                        <GitPullRequest className="size-3" />
                        {project.closed_pr_count} closed
                      </span>
                    )}
                    {(project.viewer_open_pr_count ?? 0) > 0 && (
                      <span className="text-amber-text flex items-center gap-1 text-xs font-medium">
                        <GitPullRequest className="size-3" />
                        {project.viewer_open_pr_count} mine
                      </span>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-tertiary bg-secondary border-b">
                <TableRow>
                  <SortHeader
                    onSort={() => setSort('name')}
                    sortDir={sortDir}
                    sorted={sortKey === 'name'}
                  >
                    Project
                  </SortHeader>
                  <FilterHeader
                    activeFilters={activeTypeSet}
                    label="type"
                    onSort={() => setSort('type')}
                    onToggle={(s) => toggleFilter('types', s)}
                    options={typeOptions}
                    sortDir={sortDir}
                    sorted={sortKey === 'type'}
                  >
                    Type
                  </FilterHeader>
                  <FilterHeader
                    activeFilters={activeTeamSet}
                    label="team"
                    onSort={() => setSort('team')}
                    onToggle={(s) => toggleFilter('teams', s)}
                    options={teamOptions}
                    sortDir={sortDir}
                    sorted={sortKey === 'team'}
                  >
                    Team
                  </FilterHeader>
                  <TableHead className="text-secondary px-6 py-3 text-left text-sm font-medium">
                    Environments
                  </TableHead>
                  <SortHeader
                    onSort={() => setSort('prs')}
                    sortDir={sortDir}
                    sorted={sortKey === 'prs'}
                  >
                    PRs
                  </SortHeader>
                  <SortHeader
                    onSort={() => setSort('score')}
                    sortDir={sortDir}
                    sorted={sortKey === 'score'}
                  >
                    Health
                  </SortHeader>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-tertiary divide-y">
                {/* fallow-ignore-next-line complexity */}
                {filteredProjects.map((project) => {
                  return (
                    <TableRow
                      className="hover:bg-secondary cursor-pointer transition-colors"
                      key={`table-${project.id}`}
                      onClick={() => handleProjectSelect(project.id)}
                    >
                      <TableCell className="text-primary px-6 py-4 font-medium">
                        {project.name}
                      </TableCell>
                      <TableCell className="text-secondary px-6 py-4">
                        {(project.project_types || [])
                          .map((pt) => pt.name)
                          .join(', ')}
                      </TableCell>
                      <TableCell className="text-secondary px-6 py-4">
                        {project.team.name}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {project.environments &&
                          project.environments.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              {sortEnvironments(project.environments || []).map(
                                (env) => (
                                  <EnvironmentBadge
                                    key={env.slug}
                                    label_color={env.label_color}
                                    name={env.name}
                                    slug={env.slug}
                                  />
                                ),
                              )}
                            </div>
                          )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-action flex items-center gap-1 text-xs font-medium">
                            <GitPullRequest className="size-3" />
                            {project.open_pr_count ?? 0} open
                          </span>
                          <span className="text-tertiary flex items-center gap-1 text-xs">
                            <GitPullRequest className="size-3" />
                            {project.closed_pr_count ?? 0} closed
                          </span>
                          <span className="text-amber-text flex items-center gap-1 text-xs font-medium">
                            <GitPullRequest className="size-3" />
                            {project.viewer_open_pr_count ?? 0} mine
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <ScoreBadge score={project.score} variant="circle" />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {filteredProjects.length === 0 && viewMode !== 'graph' && (
        <div className="py-12 text-center">
          <p className="text-tertiary">
            No projects found matching your criteria
          </p>
        </div>
      )}

      <NewProjectDialog
        isOpen={newProjectDialogOpen}
        onClose={() => setNewProjectDialogOpen(false)}
        onProjectCreated={(id) => navigate(`/projects/${id}`)}
      />
    </div>
  )
}

// fallow-ignore-next-line complexity
function FilterHeader({
  activeFilters,
  children,
  label,
  onSort,
  onToggle,
  options,
  sortDir,
  sorted,
}: FilterHeaderProps) {
  return (
    <TableHead className="text-secondary px-6 py-3 text-left text-sm font-medium">
      <div className="flex items-center gap-0.5">
        <button
          className="hover:text-primary inline-flex items-center gap-1"
          onClick={onSort}
          type="button"
        >
          {children}
          {sorted ? (
            sortDir === 'asc' ? (
              <ChevronUp className="size-3.5 shrink-0" />
            ) : (
              <ChevronDown className="size-3.5 shrink-0" />
            )
          ) : (
            <ChevronsUpDown className="text-tertiary/50 size-3.5 shrink-0" />
          )}
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`flex items-center gap-0.5 rounded px-0.5 py-0.5 ${
                activeFilters.size > 0
                  ? 'text-action'
                  : 'text-tertiary/50 hover:text-secondary'
              }`}
              type="button"
            >
              <ListFilter className="size-3.5" />
              {activeFilters.size > 0 && (
                <span className="text-xs leading-none">
                  {activeFilters.size}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-2">
            <p className="text-secondary mb-2 px-1 text-xs font-medium tracking-wide uppercase">
              Filter by {label}
            </p>
            <div className="space-y-0.5">
              {options.map((opt) => (
                <label
                  className="hover:bg-secondary flex cursor-pointer items-center gap-2 rounded px-1 py-1.5"
                  key={opt.slug}
                >
                  <Checkbox
                    checked={activeFilters.has(opt.slug)}
                    onCheckedChange={() => onToggle(opt.slug)}
                  />
                  <span className="text-primary text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TableHead>
  )
}

function SortHeader({ children, onSort, sortDir, sorted }: SortHeaderProps) {
  return (
    <TableHead
      className="text-secondary hover:text-primary cursor-pointer px-6 py-3 text-left text-sm font-medium select-none"
      onClick={onSort}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sorted ? (
          sortDir === 'asc' ? (
            <ChevronUp className="size-3.5 shrink-0" />
          ) : (
            <ChevronDown className="size-3.5 shrink-0" />
          )
        ) : (
          <ChevronsUpDown className="text-tertiary/50 size-3.5 shrink-0" />
        )}
      </span>
    </TableHead>
  )
}
