import { useMemo, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'

import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
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
  User,
} from 'lucide-react'
import { matchSorter } from 'match-sorter'

import { getProjects } from '@/api/endpoints'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useTheme } from '@/contexts/ThemeContext'
import { deriveChipColors } from '@/lib/chip-colors'

import { NewProjectDialog } from './NewProjectDialog'
import { ProjectGraphView } from './ProjectGraphView'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Checkbox } from './ui/checkbox'
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
                  <div className="mb-2">
                    <DeploymentCards
                      environments={project.environments}
                      releases={project.current_releases ?? {}}
                    />
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="bg-secondary flex items-center gap-1 rounded-md px-1.5 py-0.5">
                    <GitPullRequest className="text-action size-3.5" />
                    <span className="text-action text-xs font-medium">
                      {project.open_pr_count ?? 0}
                    </span>
                  </span>
                  <span className="border-action flex items-center gap-1 rounded-md border px-1.5 py-0.5">
                    <User className="text-action size-3.5" />
                    <span className="text-action text-xs font-medium">
                      {project.viewer_open_pr_count ?? 0}
                    </span>
                  </span>
                </div>
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
                  <FilterHeader
                    activeFilters={activeTeamSet}
                    label="team"
                    onSort={() => setSort('name')}
                    onToggle={(s) => toggleFilter('teams', s)}
                    options={teamOptions}
                    sortDir={sortDir}
                    sorted={sortKey === 'name'}
                  >
                    Project
                  </FilterHeader>
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
                  <SortHeader
                    onSort={() => setSort('prs')}
                    sortDir={sortDir}
                    sorted={sortKey === 'prs'}
                  >
                    PRs
                  </SortHeader>
                  <TableHead className="text-secondary px-6 py-3 text-left text-sm font-medium">
                    Deployments
                  </TableHead>
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
                      <TableCell className="px-6 py-4">
                        <div>
                          <p className="text-primary font-medium">
                            {project.name}
                          </p>
                          <p className="text-tertiary text-xs">
                            {project.team.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-secondary px-6 py-4">
                        {(project.project_types || [])
                          .map((pt) => pt.name)
                          .join(', ')}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-secondary flex items-center gap-1 rounded-md px-1.5 py-0.5">
                            <GitPullRequest className="text-action size-3.5" />
                            <span className="text-action text-xs font-medium">
                              {project.open_pr_count ?? 0}
                            </span>
                          </span>
                          <span className="border-action flex items-center gap-1 rounded-md border px-1.5 py-0.5">
                            <User className="text-action size-3.5" />
                            <span className="text-action text-xs font-medium">
                              {project.viewer_open_pr_count ?? 0}
                            </span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {project.environments &&
                          project.environments.length > 0 && (
                            <DeploymentCards
                              environments={project.environments}
                              releases={project.current_releases ?? {}}
                            />
                          )}
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

function DeploymentCards({
  environments,
  releases,
}: {
  environments: {
    label_color?: null | string
    name: string
    slug: string
    sort_order?: null | number
  }[]
  releases: Record<
    string,
    { deployed_at: string; performed_by?: null | string; version: string }
  >
}) {
  const { isDarkMode } = useTheme()
  const sorted = [...environments].sort(
    (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
  )
  return (
    <div className="flex items-start gap-2" style={{ flexWrap: 'nowrap' }}>
      {sorted.map((env, idx) => {
        const release = releases[env.slug]
        const derived = env.label_color
          ? deriveChipColors(env.label_color, isDarkMode)
          : null
        return (
          <span className="flex shrink-0 items-center" key={env.slug}>
            {idx > 0 && (
              <ArrowRight className="text-tertiary mx-2 size-3.5 shrink-0" />
            )}
            <span
              className={`min-w-35 rounded-lg p-3 ${
                release
                  ? 'border-border bg-card border'
                  : 'border-tertiary/40 border border-dashed opacity-60'
              }`}
            >
              <p className="text-secondary mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <span
                  className="size-2 rounded-full"
                  style={derived ? { backgroundColor: derived.fg } : undefined}
                />
                {env.name}
              </p>
              {release ? (
                <>
                  <p className="text-primary font-mono text-base leading-tight font-bold">
                    {release.version}
                  </p>
                  <p className="text-tertiary mt-1 text-xs">
                    {release.performed_by ? `${release.performed_by} · ` : ''}
                    {timeAgo(release.deployed_at)}
                  </p>
                </>
              ) : (
                <p className="text-tertiary font-mono text-sm">Not deployed</p>
              )}
            </span>
          </span>
        )
      })}
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

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
