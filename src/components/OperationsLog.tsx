import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Download,
  GitBranch,
  List,
  LoaderCircle,
  Search,
  SearchX,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useInfiniteOperationsLog } from '@/hooks/useInfiniteOperationsLog'
import { listEnvironments, getProjects, listAdminUsers } from '@/api/endpoints'
import type {
  Environment,
  OperationsLogEntryType,
  OperationsLogFilters,
  OperationsLogRecord,
  Project,
} from '@/types'
import {
  OperationsLogToolbar,
  type ToolbarCounts,
} from './operations-log/OperationsLogToolbar'
import { OperationsLogSummary } from './operations-log/OperationsLogSummary'
import { OperationsLogStreamRow } from './operations-log/OperationsLogStreamRow'
import { OperationsLogReleaseCard } from './operations-log/OperationsLogReleaseCard'
import {
  bucketByDay,
  cleanName,
  groupReleases,
  toMs,
  type FeedItem,
  type OperationsLogView,
  type TimeRange,
} from './operations-log/opsLogHelpers'

// Memoised + WAAPI-driven so the spin animation has its own lifetime
// independent of React's render cycle and runs on the compositor thread.
// The CSS `animate-spin` class would be re-applied on every render and
// can visually stutter / appear to reverse when the main thread blocks;
// `element.animate(...)` is installed once on mount and never restarts.
const LoadingIndicator = memo(function LoadingIndicator({
  loading,
}: {
  loading: boolean
}) {
  const spinnerRef = useRef<SVGSVGElement | null>(null)
  useEffect(() => {
    const el = spinnerRef.current
    if (!el || typeof el.animate !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animation = el.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      { duration: 1200, iterations: Infinity, easing: 'linear' },
    )
    return () => animation.cancel()
  }, [])
  return (
    <span
      className="relative inline-block h-5 w-5"
      style={{
        contain: 'layout paint',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
      aria-label={loading ? 'Loading' : undefined}
    >
      <Activity
        className={cn(
          'absolute inset-0 h-5 w-5 text-secondary transition-opacity duration-200',
          loading && 'opacity-0',
        )}
        aria-hidden
      />
      <LoaderCircle
        ref={spinnerRef}
        className={cn(
          'absolute inset-0 h-5 w-5 text-secondary transition-opacity duration-200',
          !loading && 'opacity-0',
        )}
        style={{
          transformOrigin: 'center',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
        aria-hidden
      />
    </span>
  )
})

const RANGE_DELTA: Record<Exclude<TimeRange, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
}

const RANGE_LABEL: Record<TimeRange, string> = {
  '24h': 'last 24h',
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '90d': 'last 90 days',
  all: 'all time',
}

function rangeToSince(range: TimeRange): string | undefined {
  if (range === 'all') return undefined
  return new Date(Date.now() - RANGE_DELTA[range]).toISOString()
}

interface ScreenFilters {
  range: TimeRange
  entry_type?: OperationsLogEntryType
  environment_slug?: string
  project_slug?: string
  performed_by?: string
  q?: string
}

const DEFAULT_FILTERS: ScreenFilters = { range: '30d' }

export function OperationsLog() {
  const { selectedOrganization } = useOrganization()
  const orgSlug = selectedOrganization?.slug || ''

  const [filters, setFilters] = useState<ScreenFilters>(DEFAULT_FILTERS)
  const [view, setView] = useState<OperationsLogView>('grouped')
  const [openId, setOpenId] = useState<string | undefined>(undefined)
  // Stable dispatcher — lets memoised row components compare props by
  // reference without creating a new closure per row per render.
  const toggleOpen = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? undefined : id))
  }, [])

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', orgSlug],
    queryFn: () => getProjects(orgSlug),
    enabled: !!orgSlug,
  })
  const { data: environments = [] } = useQuery({
    queryKey: ['environments', orgSlug],
    queryFn: () => listEnvironments(orgSlug),
    enabled: !!orgSlug,
  })
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users', 'active'],
    queryFn: () => listAdminUsers({ is_active: true }),
  })

  // API filters exclude env bucket (client-side) and search text so typing
  // or toggling env bucket doesn't refetch.
  const apiFilters: OperationsLogFilters = useMemo(
    () => ({
      project_slug: filters.project_slug,
      environment_slug: filters.environment_slug,
      entry_type: filters.entry_type,
      performed_by: filters.performed_by,
      since: rangeToSince(filters.range),
    }),
    [
      filters.project_slug,
      filters.environment_slug,
      filters.entry_type,
      filters.performed_by,
      filters.range,
    ],
  )

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteOperationsLog(apiFilters)

  const rawEntries: OperationsLogRecord[] = useMemo(
    () => data?.entries ?? [],
    [data],
  )

  // Eagerly walk all pages so the summary strip sees the full universe
  // for the selected range — not just the first page. Bounded ranges
  // are naturally capped by the `since` filter; only 'all time' needs a
  // safety cap to avoid pulling the entire DB.
  //
  // The fetch is deferred one frame so the browser can paint between
  // pages. Firing synchronously starves the compositor and visibly
  // stutters the loading spinner during long fetches.
  const autoFetchCap = filters.range === 'all' ? 5000 : Infinity
  useEffect(() => {
    if (
      !hasNextPage ||
      isFetchingNextPage ||
      rawEntries.length >= autoFetchCap
    ) {
      return
    }
    const id = window.setTimeout(() => fetchNextPage(), 16)
    return () => window.clearTimeout(id)
  }, [
    hasNextPage,
    isFetchingNextPage,
    rawEntries.length,
    autoFetchCap,
    fetchNextPage,
  ])

  // Also trigger another page load as the user nears the bottom of the list.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!hasNextPage) return
    const node = sentinelRef.current
    if (!node) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '400px 0px' },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Also enforce the `since` cutoff client-side. Defense in depth: if the
  // backend ever drifts, a stale cached page reappears, or the clock skews,
  // we still only ever display entries inside the selected window.
  const sinceCutoffMs = useMemo(() => {
    if (filters.range === 'all') return 0
    return Date.now() - RANGE_DELTA[filters.range]
  }, [filters.range])

  const visibleEntries = useMemo(() => {
    let xs = rawEntries
    if (sinceCutoffMs > 0) {
      xs = xs.filter((e) => toMs(e.occurred_at) >= sinceCutoffMs)
    }
    const q = filters.q?.toLowerCase().trim()
    if (q) {
      xs = xs.filter((e) => {
        // Avoid .join().includes() on every entry — it builds a throwaway
        // string per row. Short-circuit on first hit instead.
        if (e.project_slug.toLowerCase().includes(q)) return true
        if (e.description.toLowerCase().includes(q)) return true
        if (e.version && e.version.toLowerCase().includes(q)) return true
        if (e.ticket_slug && e.ticket_slug.toLowerCase().includes(q))
          return true
        if (e.notes && e.notes.toLowerCase().includes(q)) return true
        if (e.performed_by && e.performed_by.toLowerCase().includes(q))
          return true
        if (e.recorded_by.toLowerCase().includes(q)) return true
        return false
      })
    }
    return xs
  }, [rawEntries, sinceCutoffMs, filters.q])

  const projectsBySlug = useMemo(
    () => new Map(projects.map((p: Project) => [p.slug, p])),
    [projects],
  )
  const environmentsBySlug = useMemo(
    () => new Map(environments.map((e: Environment) => [e.slug, e])),
    [environments],
  )
  const performerDisplayNames = useMemo(() => {
    const m = new Map<string, string>()
    for (const u of users) {
      if (u.email && u.display_name) m.set(u.email, u.display_name)
    }
    return m
  }, [users])

  // Toolbar counts — one pass over the date-filtered universe, built
  // independently of the search/env filters so the other facets show
  // the full set they're picking from.
  const counts: ToolbarCounts = useMemo(() => {
    const type: ToolbarCounts['type'] = {}
    const env: ToolbarCounts['env'] = {}
    const project: Record<string, number> = {}
    for (const e of rawEntries) {
      if (sinceCutoffMs > 0 && toMs(e.occurred_at) < sinceCutoffMs) continue
      type[e.entry_type] = (type[e.entry_type] ?? 0) + 1
      if (e.environment_slug) {
        env[e.environment_slug] = (env[e.environment_slug] ?? 0) + 1
      }
      project[e.project_slug] = (project[e.project_slug] ?? 0) + 1
    }
    return { type, env, project }
  }, [rawEntries, sinceCutoffMs])

  // Stable Map so the sidebar's project section doesn't see a new ref
  // on every parent render and the section's own memoised filter runs
  // on a stable input.
  const projectNames = useMemo(
    () =>
      new Map(
        Array.from(projectsBySlug.entries()).map(([k, v]) => [k, v.name]),
      ),
    [projectsBySlug],
  )

  const items: FeedItem[] = useMemo(() => {
    // Decorate-sort-undecorate: parse each timestamp exactly once rather
    // than twice per comparator call. Cuts parse count from 2·N·log N to
    // N — roughly 20× fewer parses at 5000 entries.
    const decorated = visibleEntries.map(
      (entry) => [toMs(entry.occurred_at), entry] as const,
    )
    decorated.sort((a, b) => b[0] - a[0])
    const sorted = decorated.map(([, entry]) => entry)
    if (view === 'grouped') return groupReleases(sorted)
    return sorted.map((entry) => ({ kind: 'single', entry }) as FeedItem)
  }, [visibleEntries, view])

  const buckets = useMemo(() => bucketByDay(items), [items])

  const activeChips: { key: string; label: string; clear: () => void }[] = []
  if (filters.entry_type) {
    activeChips.push({
      key: 'type',
      label: filters.entry_type,
      clear: () => setFilters({ ...filters, entry_type: undefined }),
    })
  }
  if (filters.environment_slug) {
    const env = environmentsBySlug.get(filters.environment_slug)
    activeChips.push({
      key: 'env',
      label: env?.name ?? filters.environment_slug,
      clear: () => setFilters({ ...filters, environment_slug: undefined }),
    })
  }
  if (filters.project_slug) {
    activeChips.push({
      key: 'project',
      label:
        projectsBySlug.get(filters.project_slug)?.name ?? filters.project_slug,
      clear: () => setFilters({ ...filters, project_slug: undefined }),
    })
  }
  if (filters.performed_by) {
    activeChips.push({
      key: 'person',
      label:
        performerDisplayNames.get(filters.performed_by) ??
        cleanName(filters.performed_by),
      clear: () => setFilters({ ...filters, performed_by: undefined }),
    })
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      <div className="grid items-start gap-7">
        <main className="min-w-0">
          <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h1 className="flex items-center gap-2 text-h1 text-primary">
              <LoadingIndicator
                loading={Boolean(
                  isLoading || isFetchingNextPage || hasNextPage,
                )}
              />
              Operations log
            </h1>
            <div className="flex items-center gap-2">
              <div className="relative w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
                <Input
                  value={filters.q ?? ''}
                  onChange={(e) =>
                    setFilters({ ...filters, q: e.target.value || undefined })
                  }
                  placeholder="Search project, version, description…"
                  className="pl-9"
                />
              </div>
              <div
                role="group"
                aria-label="View"
                className="inline-flex h-10 items-center rounded-md border border-tertiary bg-secondary p-1"
              >
                <button
                  type="button"
                  onClick={() => setView('stream')}
                  className={cn(
                    'inline-flex h-full items-center gap-1.5 rounded px-3 text-xs font-medium transition-colors',
                    view === 'stream'
                      ? 'bg-primary text-primary shadow-sm'
                      : 'text-secondary hover:text-primary',
                  )}
                >
                  <List className="h-3.5 w-3.5" /> Stream
                </button>
                <button
                  type="button"
                  onClick={() => setView('grouped')}
                  className={cn(
                    'inline-flex h-full items-center gap-1.5 rounded px-3 text-xs font-medium transition-colors',
                    view === 'grouped'
                      ? 'bg-primary text-primary shadow-sm'
                      : 'text-secondary hover:text-primary',
                  )}
                >
                  <GitBranch className="h-3.5 w-3.5" /> Releases
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5"
                disabled
                title="Export coming soon"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </div>
          </header>

          <OperationsLogSummary
            entries={visibleEntries}
            rangeLabel={RANGE_LABEL[filters.range]}
            range={filters.range}
            loading={Boolean(isLoading || isFetchingNextPage || hasNextPage)}
          />

          <OperationsLogToolbar
            counts={counts}
            range={filters.range}
            onRange={(range) => setFilters({ ...filters, range })}
            entryType={filters.entry_type}
            onEntryType={(entry_type) => setFilters({ ...filters, entry_type })}
            environmentSlug={filters.environment_slug}
            onEnvironment={(environment_slug) =>
              setFilters({ ...filters, environment_slug })
            }
            environments={environments}
            projectSlug={filters.project_slug}
            onProject={(project_slug) =>
              setFilters({ ...filters, project_slug })
            }
            projectNames={projectNames}
          />

          {activeChips.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-tertiary">
                Filters
              </span>
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={c.clear}
                  className="inline-flex h-6 items-center gap-1 rounded bg-secondary px-2 text-[12px] text-secondary hover:text-primary"
                >
                  <span className="truncate">{c.label}</span>
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFilters({ range: filters.range, q: filters.q })
                }
                className="ml-1 rounded px-2 py-0.5 text-[12px] text-tertiary hover:bg-secondary hover:text-primary"
              >
                Clear all
              </button>
            </div>
          )}

          {isError && (
            <div className="bg-danger/10 mb-3 rounded-md border border-danger px-3 py-2 text-sm text-danger">
              Failed to load operations log.{' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                className="ml-2"
              >
                Retry
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="rounded-md border border-tertiary bg-primary px-4 py-16 text-center text-secondary">
              Loading operations log…
            </div>
          )}

          {!isLoading &&
            !isError &&
            (buckets.length === 0 ? (
              <div className="rounded-md border border-tertiary bg-primary px-6 py-16 text-center text-sm text-tertiary">
                <SearchX className="mx-auto mb-2 h-7 w-7 text-tertiary" />
                No events match these filters.
              </div>
            ) : (
              <div className="space-y-4">
                {buckets.map((bucket) => (
                  <section key={bucket.key}>
                    <div className="mb-1.5 flex items-center gap-2.5 px-0.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-tertiary">
                        {bucket.label}
                      </span>
                      <span className="font-mono text-[11px] text-tertiary">
                        {bucket.date.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="h-px flex-1 bg-tertiary" />
                      <span className="font-mono text-[11px] text-tertiary">
                        {bucket.items.length}{' '}
                        {bucket.items.length === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-md border border-tertiary bg-primary">
                      {bucket.items.map((it) => {
                        if (it.kind === 'release') {
                          const id = it.group.latestEntry.id
                          const isOpen =
                            openId === id ||
                            it.group.stops.some((s) => s.entry.id === openId)
                          return (
                            <OperationsLogReleaseCard
                              key={`rel-${id}`}
                              id={id}
                              group={it.group}
                              project={projectsBySlug.get(
                                it.group.project_slug,
                              )}
                              environmentsBySlug={environmentsBySlug}
                              isOpen={isOpen}
                              onToggle={toggleOpen}
                              performerDisplayNames={performerDisplayNames}
                            />
                          )
                        }
                        const id = it.entry.id
                        const isOpen = openId === id
                        return (
                          <OperationsLogStreamRow
                            key={`evt-${id}`}
                            id={id}
                            entry={it.entry}
                            project={projectsBySlug.get(it.entry.project_slug)}
                            environment={environmentsBySlug.get(
                              it.entry.environment_slug,
                            )}
                            isOpen={isOpen}
                            onToggle={toggleOpen}
                            performerDisplayNames={performerDisplayNames}
                          />
                        )
                      })}
                    </div>
                  </section>
                ))}
                <div
                  ref={sentinelRef}
                  className="py-3 text-center text-xs text-tertiary"
                >
                  {isFetchingNextPage ? (
                    'Loading more…'
                  ) : hasNextPage ? (
                    rawEntries.length >= autoFetchCap ? (
                      <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        className="rounded px-3 py-1 text-[12px] hover:bg-secondary hover:text-primary"
                      >
                        Load more (showing {rawEntries.length})
                      </button>
                    ) : (
                      'Loading…'
                    )
                  ) : (
                    `End of log · ${visibleEntries.length} entries`
                  )}
                </div>
              </div>
            ))}
        </main>
      </div>
    </div>
  )
}
