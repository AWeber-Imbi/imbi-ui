import { useMemo, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { useQuery } from '@tanstack/react-query'
import { ExternalLink, GitPullRequest, RefreshCw } from 'lucide-react'

import {
  getOrgPullRequests,
  getProjectsSlim,
  type ProjectListItem,
} from '@/api/endpoints'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserDisplay } from '@/components/ui/user-display'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useUserDisplayNames } from '@/hooks/useUserDisplayNames'
import { relTime } from '@/lib/formatDate'
import type { PullRequest } from '@/types'

interface EnrichedPR extends PullRequest {
  project_name: string
  project_slug: string
  project_types: { name: string; slug: string }[]
  team_name: string
  team_slug: string
}

const ALL = '__all__'

// fallow-ignore-next-line complexity
export function OpenPullRequestsReport() {
  const { selectedOrganization } = useOrganization()
  const orgSlug = selectedOrganization?.slug ?? ''
  const navigate = useNavigate()

  const [teamFilter, setTeamFilter] = useState<string>(ALL)
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>(ALL)
  const [search, setSearch] = useState('')

  const {
    data: prData,
    isError: prsError,
    isFetching: prsFetching,
    refetch: refetchPrs,
  } = useQuery({
    enabled: !!orgSlug,
    queryFn: ({ signal }) =>
      getOrgPullRequests(orgSlug, { limit: 500, state: 'open' }, signal),
    queryKey: ['org-prs', orgSlug, 'open'],
    staleTime: 60_000,
  })

  const {
    data: projects,
    isError: projectsError,
    isFetching: projectsFetching,
    refetch: refetchProjects,
  } = useQuery({
    enabled: !!orgSlug,
    queryFn: ({ signal }) => getProjectsSlim(orgSlug, signal),
    queryKey: ['projects-slim', orgSlug],
    staleTime: 120_000,
  })

  const { displayNames, users } = useUserDisplayNames()

  const loginToEmail = useMemo(() => {
    const m = new Map<string, string>()
    for (const u of users) {
      if (!u.email) continue
      const local = u.email.split('@')[0]
      if (local) m.set(local, u.email)
    }
    return m
  }, [users])

  const projectsById = useMemo(() => {
    const m = new Map<string, ProjectListItem>()
    for (const p of projects ?? []) m.set(p.id, p)
    return m
  }, [projects])

  const enriched = useMemo<EnrichedPR[]>(() => {
    const prs = prData?.data ?? []
    const out: EnrichedPR[] = []
    for (const pr of prs) {
      if (pr.draft) continue
      if (pr.state !== 'open') continue
      const p = projectsById.get(pr.project_id)
      if (!p) continue
      if (p.archived) continue
      out.push({
        ...pr,
        project_name: p.name,
        project_slug: p.slug,
        project_types: p.project_types,
        team_name: p.team.name,
        team_slug: p.team.slug,
      })
    }
    out.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    return out
  }, [prData, projectsById])

  const teamOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const pr of enriched) map.set(pr.team_slug, pr.team_name)
    return [...map.entries()]
      .map(([slug, name]) => ({ name, slug }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [enriched])

  const projectTypeOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const pr of enriched) {
      for (const pt of pr.project_types) map.set(pt.slug, pt.name)
    }
    return [...map.entries()]
      .map(([slug, name]) => ({ name, slug }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [enriched])

  // fallow-ignore-next-line complexity
  const filtered = useMemo(() => {
    let rows = enriched
    if (teamFilter !== ALL) {
      rows = rows.filter((r) => r.team_slug === teamFilter)
    }
    if (projectTypeFilter !== ALL) {
      rows = rows.filter((r) =>
        r.project_types.some((pt) => pt.slug === projectTypeFilter),
      )
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q) ||
          r.project_name.toLowerCase().includes(q) ||
          String(r.pr_number).includes(q),
      )
    }
    return rows
  }, [enriched, teamFilter, projectTypeFilter, search])

  const isLoading = prsFetching || projectsFetching
  const hasError = prsError || projectsError
  const total = enriched.length

  function refreshAll() {
    void refetchPrs()
    void refetchProjects()
  }

  return (
    <div className="border-tertiary bg-primary overflow-hidden rounded-lg border">
      {/* Toolbar */}
      <div className="border-tertiary flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="text-tertiary text-xs">Team</label>
          <Select onValueChange={setTeamFilter} value={teamFilter}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="All teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All teams</SelectItem>
              {teamOptions.map((t) => (
                <SelectItem key={t.slug} value={t.slug}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-tertiary text-xs">Project type</label>
          <Select
            onValueChange={setProjectTypeFilter}
            value={projectTypeFilter}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {projectTypeOptions.map((pt) => (
                <SelectItem key={pt.slug} value={pt.slug}>
                  {pt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <input
            className="border-input bg-background text-primary focus:ring-action h-8 w-64 rounded border px-3 text-sm focus:ring-1 focus:outline-none"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title, author, project, or #"
            type="text"
            value={search}
          />
          <span className="text-tertiary text-xs">
            {filtered.length} of {total}
          </span>
          <button
            aria-label="Refresh"
            className="text-tertiary hover:text-primary rounded p-1.5 transition-colors"
            disabled={isLoading}
            onClick={refreshAll}
            type="button"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-tertiary border-b">
              <th className="text-tertiary px-4 py-2 text-left text-xs font-medium tracking-wide uppercase">
                Team
              </th>
              <th className="text-tertiary px-4 py-2 text-left text-xs font-medium tracking-wide uppercase">
                Project Type
              </th>
              <th className="text-tertiary px-4 py-2 text-left text-xs font-medium tracking-wide uppercase">
                Project
              </th>
              <th className="text-tertiary w-16 px-4 py-2 text-left text-xs font-medium tracking-wide uppercase">
                #
              </th>
              <th className="text-tertiary px-4 py-2 text-left text-xs font-medium tracking-wide uppercase">
                Title
              </th>
              <th className="text-tertiary w-40 px-4 py-2 text-center text-xs font-medium tracking-wide uppercase">
                Author
              </th>
              <th className="text-tertiary w-14 px-4 py-2 text-center text-xs font-medium tracking-wide uppercase">
                Files
              </th>
              <th className="text-tertiary w-36 px-4 py-2 text-center text-xs font-medium tracking-wide uppercase">
                Diff
              </th>
              <th className="text-tertiary w-20 px-4 py-2 text-right text-xs font-medium tracking-wide uppercase">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {hasError ? (
              <tr>
                <td className="px-4 py-8 text-center" colSpan={9}>
                  <div className="text-danger text-sm">
                    Failed to load pull requests.
                  </div>
                  <button
                    className="text-action mt-2 text-xs hover:underline"
                    onClick={refreshAll}
                    type="button"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : isLoading && enriched.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr className="border-tertiary border-b" key={i}>
                  <td className="px-4 py-3" colSpan={9}>
                    <div className="bg-tertiary/30 h-4 animate-pulse rounded" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  className="text-tertiary px-4 py-12 text-center"
                  colSpan={9}
                >
                  No open pull requests match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((pr) => (
                <PrRow
                  displayNames={displayNames}
                  key={pr.pr_id}
                  loginToEmail={loginToEmail}
                  onOpenProject={() => navigate(`/projects/${pr.project_id}`)}
                  pr={pr}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DiffBar({
  additions,
  deletions,
}: {
  additions: number
  deletions: number
}) {
  const total = additions + deletions
  if (total === 0) return <span className="text-tertiary text-xs">—</span>
  const addBlocks = Math.round((additions / total) * 5)
  const delBlocks = 5 - addBlocks
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs">
        <span className="text-success">+{additions.toLocaleString()}</span>
        <span className="text-tertiary"> · </span>
        <span className="text-danger">-{deletions.toLocaleString()}</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: addBlocks }).map((_, i) => (
          <div
            className="h-2 w-3.5"
            key={`a${i}`}
            style={{ backgroundColor: 'var(--text-color-success)' }}
          />
        ))}
        {Array.from({ length: delBlocks }).map((_, i) => (
          <div
            className="h-2 w-3.5"
            key={`d${i}`}
            style={{ backgroundColor: 'var(--text-color-danger)' }}
          />
        ))}
      </div>
    </div>
  )
}

// fallow-ignore-next-line complexity
function PrRow({
  displayNames,
  loginToEmail,
  onOpenProject,
  pr,
}: {
  displayNames: Map<string, string>
  loginToEmail: Map<string, string>
  onOpenProject: () => void
  pr: EnrichedPR
}) {
  const email = loginToEmail.get(pr.author)

  return (
    <tr className="border-tertiary hover:bg-secondary/30 border-b transition-colors last:border-b-0">
      <td className="text-secondary px-4 py-3 text-xs">{pr.team_name}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {pr.project_types.map((pt) => (
            <Badge key={pt.slug} variant="neutral">
              {pt.name}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          className="text-primary hover:text-action text-left text-sm font-medium transition-colors"
          onClick={onOpenProject}
          type="button"
        >
          {pr.project_name}
        </button>
      </td>
      <td className="px-4 py-3">
        <span className="text-tertiary flex items-center gap-1.5 text-xs">
          <GitPullRequest className="text-success size-3.5 shrink-0" />
          {pr.pr_number}
        </span>
      </td>
      <td className="max-w-0 px-4 py-3">
        <a
          className="text-primary hover:text-action inline-flex max-w-full items-center gap-1.5 transition-colors"
          href={pr.url}
          rel="noreferrer"
          target="_blank"
        >
          <span className="truncate">{pr.title}</span>
          <ExternalLink className="text-tertiary size-3 shrink-0" />
        </a>
      </td>
      <td className="px-4 py-3 text-center">
        <UserDisplay
          displayNames={email ? displayNames : undefined}
          email={email ?? pr.author}
          linkToProfile={!!email}
          textClassName="text-sm"
        />
      </td>
      <td className="text-secondary px-4 py-3 text-center">
        {pr.changed_files}
      </td>
      <td className="px-4 py-3 text-center">
        <DiffBar additions={pr.additions} deletions={pr.deletions} />
      </td>
      <td className="text-tertiary px-4 py-3 text-right text-xs tabular-nums">
        {relTime(pr.updated_at)}
      </td>
    </tr>
  )
}
