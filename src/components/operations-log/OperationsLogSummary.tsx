import type { OperationsLogRecord } from '@/types'
import { useMemo } from 'react'
import { toMs, type TimeRange } from './opsLogHelpers'

interface SummaryProps {
  entries: OperationsLogRecord[]
  rangeLabel: string
  range: TimeRange
  loading?: boolean
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <span
      className={`bg-tertiary/40 inline-block animate-pulse rounded ${className}`}
      aria-hidden
    />
  )
}

const RANGE_WINDOW_MS: Record<Exclude<TimeRange, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
}

const BARS = 12

export function OperationsLogSummary({
  entries,
  rangeLabel,
  range,
  loading = false,
}: SummaryProps) {
  // Single-pass aggregation: counts, uniques, sparkline buckets, and the
  // earliest-timestamp scan (for 'all time') all read the entries array
  // exactly once. Previously we did 4 filter/map passes plus 3 Set
  // allocations per render, all running again on every auto-fetch page.
  const stats = useMemo(() => {
    const now = Date.now()
    const windowMs =
      range === 'all' ? 0 /* resolved after the pass */ : RANGE_WINDOW_MS[range]
    let effectiveWindowMs = windowMs
    let earliest = now

    const projectSlugs = new Set<string>()
    const envSlugs = new Set<string>()
    const people = new Set<string>()
    let deploys = 0
    let prod = 0
    let occurredMs: number[] = []
    occurredMs = new Array(entries.length)
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]
      const t = toMs(e.occurred_at)
      occurredMs[i] = t
      if (range === 'all' && t < earliest) earliest = t
      projectSlugs.add(e.project_slug)
      if (e.environment_slug) envSlugs.add(e.environment_slug)
      if (e.performed_by) people.add(e.performed_by)
      if (e.entry_type === 'Deployed') {
        deploys += 1
        if (e.environment_slug === 'production') prod += 1
      }
    }
    if (range === 'all') {
      effectiveWindowMs = Math.max(60 * 60 * 1000, now - earliest)
    }
    const bucketMs = effectiveWindowMs / BARS
    const start = now - effectiveWindowMs
    const buckets = new Array<number>(BARS).fill(0)
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]
      if (e.entry_type !== 'Deployed') continue
      const t = occurredMs[i]
      if (t < start || t > now) continue
      const idx = Math.min(BARS - 1, Math.floor((t - start) / bucketMs))
      buckets[idx] += 1
    }
    let max = 1
    for (const v of buckets) if (v > max) max = v
    return {
      deploys,
      prod,
      projects: projectSlugs.size,
      envCount: envSlugs.size,
      people: people.size,
      buckets,
      max,
    }
  }, [entries, range])

  const { deploys, prod, projects, envCount, people, buckets, max } = stats
  const bars = BARS

  return (
    <div
      className={`mb-4 grid grid-cols-2 overflow-hidden rounded-md border border-tertiary bg-primary md:grid-cols-4 ${loading ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-col gap-1 border-b border-r border-tertiary p-3 md:border-b-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-tertiary">
          Events
        </span>
        {loading ? (
          <SkeletonBlock className="mt-0.5 h-5 w-16" />
        ) : (
          <span className="flex items-baseline gap-1.5 font-medium tabular-nums text-primary">
            <span className="text-xl leading-none">{entries.length}</span>
            <span className="text-[11px] uppercase tracking-wide text-tertiary">
              in {rangeLabel}
            </span>
          </span>
        )}
        <div className="mt-1 flex h-4 items-end gap-[2px]" aria-hidden="true">
          {loading
            ? Array.from({ length: bars }).map((_, i) => (
                <span
                  key={i}
                  className="bg-tertiary/30 h-full flex-1 rounded-[1px]"
                />
              ))
            : buckets.map((v, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-[1px] bg-amber-bg"
                  style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
                />
              ))}
        </div>
      </div>
      <div className="flex flex-col gap-1 border-b border-tertiary p-3 md:border-b-0 md:border-r">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-tertiary">
          Deploys
        </span>
        {loading ? (
          <>
            <SkeletonBlock className="mt-0.5 h-5 w-12" />
            <SkeletonBlock className="mt-1 h-3 w-24" />
          </>
        ) : (
          <>
            <span className="text-xl font-medium tabular-nums leading-none text-primary">
              {deploys}
            </span>
            <span className="text-[11.5px] text-secondary">
              {prod} to production
            </span>
          </>
        )}
      </div>
      <div className="flex flex-col gap-1 border-r border-tertiary p-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-tertiary">
          Projects touched
        </span>
        {loading ? (
          <>
            <SkeletonBlock className="mt-0.5 h-5 w-10" />
            <SkeletonBlock className="mt-1 h-3 w-32" />
          </>
        ) : (
          <>
            <span className="text-xl font-medium tabular-nums leading-none text-primary">
              {projects}
            </span>
            <span className="text-[11.5px] text-secondary">
              across {envCount}{' '}
              {envCount === 1 ? 'environment' : 'environments'}
            </span>
          </>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-tertiary">
          Team members
        </span>
        {loading ? (
          <>
            <SkeletonBlock className="mt-0.5 h-5 w-10" />
            <SkeletonBlock className="mt-1 h-3 w-28" />
          </>
        ) : (
          <>
            <span className="text-xl font-medium tabular-nums leading-none text-primary">
              {people}
            </span>
            <span className="text-[11.5px] text-secondary">
              active in {rangeLabel}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
