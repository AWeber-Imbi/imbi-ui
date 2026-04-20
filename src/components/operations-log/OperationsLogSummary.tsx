import type { OperationsLogRecord } from '@/types'
import { parseUtcIso, type TimeRange } from './opsLogHelpers'

interface SummaryProps {
  entries: OperationsLogRecord[]
  rangeLabel: string
  range: TimeRange
}

const RANGE_WINDOW_MS: Record<Exclude<TimeRange, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

export function OperationsLogSummary({
  entries,
  rangeLabel,
  range,
}: SummaryProps) {
  const deploys = entries.filter((e) => e.entry_type === 'Deployed').length
  const prod = entries.filter(
    (e) => e.entry_type === 'Deployed' && e.environment_slug === 'production',
  ).length
  const projects = new Set(entries.map((e) => e.project_slug)).size
  const envCount = new Set(
    entries.map((e) => e.environment_slug).filter((s): s is string => !!s),
  ).size
  const people = new Set(
    entries.map((e) => e.performed_by).filter((p): p is string => !!p),
  ).size

  // Deploys-per-bucket sparkline scaled to the selected time range so the
  // graph spans exactly what the user is looking at. For "all time" it
  // spans from the earliest visible entry to now.
  const now = Date.now()
  const bars = 12
  let windowMs: number
  if (range === 'all') {
    let earliest = now
    for (const e of entries) {
      const t = parseUtcIso(e.occurred_at).getTime()
      if (t < earliest) earliest = t
    }
    windowMs = Math.max(60 * 60 * 1000, now - earliest)
  } else {
    windowMs = RANGE_WINDOW_MS[range]
  }
  const bucketMs = windowMs / bars
  const start = now - windowMs
  const buckets = new Array<number>(bars).fill(0)
  for (const e of entries) {
    if (e.entry_type !== 'Deployed') continue
    const t = parseUtcIso(e.occurred_at).getTime()
    if (t < start || t > now) continue
    const idx = Math.min(bars - 1, Math.floor((t - start) / bucketMs))
    buckets[idx] += 1
  }
  const max = Math.max(1, ...buckets)

  return (
    <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-md border border-tertiary bg-primary md:grid-cols-4">
      <div className="flex flex-col gap-1 border-b border-r border-tertiary p-3 md:border-b-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-tertiary">
          Events
        </span>
        <span className="flex items-baseline gap-1.5 font-medium tabular-nums text-primary">
          <span className="text-xl leading-none">{entries.length}</span>
          <span className="text-[11px] uppercase tracking-wide text-tertiary">
            in {rangeLabel}
          </span>
        </span>
        <div className="mt-1 flex h-4 items-end gap-[2px]" aria-hidden="true">
          {buckets.map((v, i) => (
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
        <span className="text-xl font-medium tabular-nums leading-none text-primary">
          {deploys}
        </span>
        <span className="text-[11.5px] text-secondary">
          {prod} to production
        </span>
      </div>
      <div className="flex flex-col gap-1 border-r border-tertiary p-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-tertiary">
          Projects touched
        </span>
        <span className="text-xl font-medium tabular-nums leading-none text-primary">
          {projects}
        </span>
        <span className="text-[11.5px] text-secondary">
          across {envCount} {envCount === 1 ? 'environment' : 'environments'}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-tertiary">
          Team members
        </span>
        <span className="text-xl font-medium tabular-nums leading-none text-primary">
          {people}
        </span>
        <span className="text-[11.5px] text-secondary">
          active in {rangeLabel}
        </span>
      </div>
    </div>
  )
}
