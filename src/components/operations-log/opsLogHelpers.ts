import type { OperationsLogRecord } from '@/types'

export type TimeRange = '24h' | '3d' | '7d' | '30d' | 'all'
export type OperationsLogView = 'stream' | 'grouped'

export function parseUtcIso(iso: string): Date {
  const hasOffset = /(Z|[+-]\d\d:?\d\d)$/.test(iso)
  return new Date(hasOffset ? iso : iso + 'Z')
}

export function relTime(iso: string, now: number = Date.now()): string {
  const t = parseUtcIso(iso).getTime()
  const diff = Math.max(0, now - t)
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return `${Math.floor(d / 7)}w`
}

export function absTime(iso: string): string {
  return parseUtcIso(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export interface DayBucketKey {
  key: string
  label: string
  date: Date
}

export function dayKey(iso: string, now: number = Date.now()): DayBucketKey {
  const d = parseUtcIso(iso)
  const n = new Date(now)
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()
  const eventDay = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
  ).getTime()
  const diffDays = Math.round((today - eventDay) / 86_400_000)
  if (diffDays === 0) return { key: 'today', label: 'Today', date: d }
  if (diffDays === 1) return { key: 'yesterday', label: 'Yesterday', date: d }
  return {
    key: d.toDateString(),
    label: d.toLocaleDateString(undefined, { weekday: 'long' }),
    date: d,
  }
}

export function cleanName(email: string | null | undefined): string {
  if (!email) return 'system'
  const part = email.split('@')[0]
  return part || email
}

export function initials(email: string | null | undefined): string {
  if (!email) return 'SY'
  const part = email.split('@')[0]
  if (!part) return email[0]?.toUpperCase() ?? '?'
  if (part.length >= 2) return (part[0] + part[part.length - 1]).toUpperCase()
  return part[0].toUpperCase()
}

export interface ReleaseStop {
  environment_slug: string
  entry: OperationsLogRecord
}

export interface ReleaseGroup {
  project_slug: string
  description: string
  stops: ReleaseStop[]
  latestEntry: OperationsLogRecord
}

export type FeedItem =
  | { kind: 'single'; entry: OperationsLogRecord }
  | { kind: 'release'; group: ReleaseGroup }

// Group contiguous same-version deploys of one project into a single
// release train. Keys by `project_slug::description` — the API emits the
// same description for each env a single release moves through.
export function groupReleases(entries: OperationsLogRecord[]): FeedItem[] {
  const groups = new Map<string, ReleaseGroup>()
  const order: FeedItem[] = []
  for (const e of entries) {
    if (e.entry_type !== 'Deployed') {
      order.push({ kind: 'single', entry: e })
      continue
    }
    const descKey = (e.description || '').trim()
    const key = `${e.project_slug}::${descKey}`
    let g = groups.get(key)
    if (!g) {
      g = {
        project_slug: e.project_slug,
        description: descKey,
        stops: [],
        latestEntry: e,
      }
      groups.set(key, g)
      order.push({ kind: 'release', group: g })
    }
    const envSlug = e.environment_slug
    const existingIdx = g.stops.findIndex((s) => s.environment_slug === envSlug)
    if (existingIdx >= 0) {
      // Keep the earliest deploy into each env — it's when the release
      // first reached that stop.
      if (
        parseUtcIso(e.occurred_at) <
        parseUtcIso(g.stops[existingIdx].entry.occurred_at)
      ) {
        g.stops[existingIdx] = { environment_slug: envSlug, entry: e }
      }
    } else {
      g.stops.push({ environment_slug: envSlug, entry: e })
    }
    if (parseUtcIso(e.occurred_at) > parseUtcIso(g.latestEntry.occurred_at)) {
      g.latestEntry = e
    }
  }
  return order
}

export interface DayBucket {
  key: string
  label: string
  date: Date
  items: FeedItem[]
}

export function bucketByDay(
  items: FeedItem[],
  now: number = Date.now(),
): DayBucket[] {
  const buckets: DayBucket[] = []
  let current: DayBucket | null = null
  for (const it of items) {
    const iso =
      it.kind === 'release'
        ? it.group.latestEntry.occurred_at
        : it.entry.occurred_at
    const dk = dayKey(iso, now)
    if (!current || current.key !== dk.key) {
      current = { key: dk.key, label: dk.label, date: dk.date, items: [] }
      buckets.push(current)
    }
    current.items.push(it)
  }
  return buckets
}

// Strip a leading "release X.Y.Z" / "release X.Y.Z - " from a description
// when it just repeats the version already shown in the row.
export function cleanDescription(
  description: string | null | undefined,
  version: string | null | undefined,
): string {
  const desc = (description || '').trim()
  if (!version) return desc
  const lower = desc.toLowerCase()
  const prefix = `release ${version.toLowerCase()}`
  if (lower.startsWith(prefix)) {
    return desc
      .substring(`release ${version}`.length)
      .replace(/^\s*[-–—:]\s*/, '')
      .trim()
  }
  return desc
}
