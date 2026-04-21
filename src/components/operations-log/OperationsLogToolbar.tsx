import { useMemo, useState } from 'react'
import { Box, Check, ChevronDown, Filter, Layers, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { sortEnvironments } from '@/lib/utils'
import {
  OPERATIONS_LOG_ENTRY_TYPES,
  type Environment,
  type OperationsLogEntryType,
} from '@/types'
import type { TimeRange } from './opsLogHelpers'

const RANGES: { key: TimeRange; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'all', label: 'All' },
]

export interface ToolbarCounts {
  type: Partial<Record<OperationsLogEntryType, number>>
  env: Record<string, number>
  project: Record<string, number>
}

interface ToolbarProps {
  counts: ToolbarCounts
  range: TimeRange
  onRange: (r: TimeRange) => void
  entryType?: OperationsLogEntryType
  onEntryType: (t: OperationsLogEntryType | undefined) => void
  environmentSlug?: string
  onEnvironment: (slug: string | undefined) => void
  environments: Environment[]
  projectSlug?: string
  onProject: (slug: string | undefined) => void
  projectNames: Map<string, string>
}

function TriggerButton({
  icon,
  label,
  value,
  count,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  count?: number
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-tertiary bg-primary px-3 text-sm text-secondary transition-colors hover:bg-secondary hover:text-primary"
    >
      <span className="flex h-4 w-4 items-center justify-center text-tertiary">
        {icon}
      </span>
      <span className={cn(value && 'text-primary')}>{value ?? label}</span>
      {count !== undefined ? (
        <span className="ml-0.5 rounded bg-secondary px-1.5 text-[11px] tabular-nums text-tertiary">
          {count}
        </span>
      ) : null}
      <ChevronDown className="h-3.5 w-3.5 text-tertiary" />
    </button>
  )
}

export function OperationsLogToolbar({
  counts,
  range,
  onRange,
  entryType,
  onEntryType,
  environmentSlug,
  onEnvironment,
  environments,
  projectSlug,
  onProject,
  projectNames,
}: ToolbarProps) {
  const [projectQuery, setProjectQuery] = useState('')

  const entryTypes = useMemo(
    () => OPERATIONS_LOG_ENTRY_TYPES.filter((t) => (counts.type[t] ?? 0) > 0),
    [counts.type],
  )
  const orderedEnvs = useMemo(
    () =>
      sortEnvironments(environments).filter(
        (env) =>
          (counts.env[env.slug] ?? 0) > 0 || environmentSlug === env.slug,
      ),
    [environments, counts.env, environmentSlug],
  )
  const projectEntries = useMemo(() => {
    const all = Object.entries(counts.project).sort(
      (a, b) =>
        b[1] - a[1] ||
        (projectNames.get(a[0]) ?? a[0]).localeCompare(
          projectNames.get(b[0]) ?? b[0],
        ),
    )
    const q = projectQuery.toLowerCase().trim()
    if (!q) return all
    return all.filter(([slug]) => {
      const name = (projectNames.get(slug) ?? slug).toLowerCase()
      return slug.toLowerCase().includes(q) || name.includes(q)
    })
  }, [counts.project, projectNames, projectQuery])

  const selectedEnv = environmentSlug
    ? environments.find((e) => e.slug === environmentSlug)
    : undefined
  const selectedProjectLabel = projectSlug
    ? (projectNames.get(projectSlug) ?? projectSlug)
    : undefined

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Time range"
        className="inline-flex items-center rounded-md border border-tertiary bg-secondary p-0.5"
      >
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => onRange(r.key)}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              range === r.key
                ? 'bg-primary text-primary shadow-sm'
                : 'text-secondary hover:text-primary',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <span className="mx-1 h-6 w-px bg-tertiary" aria-hidden />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div>
            <TriggerButton
              icon={<Filter className="h-3.5 w-3.5" />}
              label="Entry Type"
              value={entryType}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuCheckboxItem
            checked={!entryType}
            onSelect={(e) => {
              e.preventDefault()
              onEntryType(undefined)
            }}
          >
            All entry types
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {entryTypes.map((t) => (
            <DropdownMenuCheckboxItem
              key={t}
              checked={entryType === t}
              onSelect={(e) => {
                e.preventDefault()
                onEntryType(entryType === t ? undefined : t)
              }}
            >
              <span className="flex-1">{t}</span>
              <span className="ml-3 text-xs text-tertiary">
                {counts.type[t] ?? 0}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div>
            <TriggerButton
              icon={<Layers className="h-3.5 w-3.5" />}
              label="Environment"
              value={selectedEnv?.name}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[220px]">
          <DropdownMenuCheckboxItem
            checked={!environmentSlug}
            onSelect={(e) => {
              e.preventDefault()
              onEnvironment(undefined)
            }}
          >
            All environments
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {orderedEnvs.map((env) => (
            <DropdownMenuCheckboxItem
              key={env.slug}
              checked={environmentSlug === env.slug}
              onSelect={(e) => {
                e.preventDefault()
                onEnvironment(
                  environmentSlug === env.slug ? undefined : env.slug,
                )
              }}
            >
              <span className="flex-1">{env.name}</span>
              <span className="ml-3 text-xs text-tertiary">
                {counts.env[env.slug] ?? 0}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) setProjectQuery('')
        }}
      >
        <DropdownMenuTrigger asChild>
          <div>
            <TriggerButton
              icon={<Box className="h-3.5 w-3.5" />}
              label="Project"
              value={selectedProjectLabel}
              count={selectedProjectLabel ? undefined : projectEntries.length}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[260px] p-0">
          <div className="relative border-b border-tertiary p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
            <Input
              value={projectQuery}
              onChange={(e) => setProjectQuery(e.target.value)}
              placeholder="Filter projects…"
              className="h-8 pl-7 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => onProject(undefined)}
              className={cn(
                'flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors',
                !projectSlug && 'bg-secondary text-primary',
                projectSlug && 'text-secondary hover:bg-secondary',
              )}
            >
              <Check
                className={cn('h-3.5 w-3.5', projectSlug && 'invisible')}
              />
              All projects
            </button>
            {projectEntries.map(([slug, c]) => (
              <button
                key={slug}
                type="button"
                onClick={() =>
                  onProject(projectSlug === slug ? undefined : slug)
                }
                className={cn(
                  'flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors',
                  projectSlug === slug && 'bg-secondary text-primary',
                  projectSlug !== slug && 'text-secondary hover:bg-secondary',
                )}
                title={projectNames.get(slug) ?? slug}
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5',
                    projectSlug !== slug && 'invisible',
                  )}
                />
                <span className="flex-1 truncate font-mono text-[13px]">
                  {slug}
                </span>
                <span className="ml-3 text-xs text-tertiary">{c}</span>
              </button>
            ))}
            {projectEntries.length === 0 ? (
              <div className="px-3 py-2 text-xs text-tertiary">
                No projects match.
              </div>
            ) : null}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
