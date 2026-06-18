import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Download, RefreshCw } from 'lucide-react'

import { getPRActivity } from '@/api/endpoints'
import { Sk } from '@/components/ui/skeleton'
import { UserIdentity } from '@/components/ui/user-identity'
import { useOrganization } from '@/contexts/OrganizationContext'

export function PRActivityReport() {
  const { selectedOrganization } = useOrganization()
  const orgSlug = selectedOrganization?.slug ?? ''

  const [since, setSince] = useState(() => isoDaysAgo(30))
  const [appliedSince, setAppliedSince] = useState(since)

  const { data, error, isFetching, refetch } = useQuery({
    enabled: !!orgSlug,
    queryFn: ({ signal }) => getPRActivity(orgSlug, appliedSince, signal),
    queryKey: ['prActivity', orgSlug, appliedSince],
    staleTime: 60_000,
  })

  const rows = data?.rows ?? []
  const maxCreated = useMemo(
    () => rows.reduce((m, r) => Math.max(m, r.created), 0),
    [rows],
  )
  const maxMerged = useMemo(
    () => rows.reduce((m, r) => Math.max(m, r.merged), 0),
    [rows],
  )
  const totalCreated = rows.reduce((s, r) => s + r.created, 0)
  const totalMerged = rows.reduce((s, r) => s + r.merged, 0)

  function fetchActivity() {
    if (since === appliedSince) {
      void refetch()
    } else {
      setAppliedSince(since)
    }
  }

  function downloadCsv() {
    const header = ['Member', 'Login', 'Email', 'Created', 'Merged']
    const lines = rows.map((r) =>
      [r.display_name ?? r.login, r.login, r.email ?? '', r.created, r.merged]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.download = `pr-activity-${appliedSince}.csv`
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="border-tertiary bg-primary flex flex-wrap items-end gap-4 rounded-lg border p-[18px]">
        <label className="flex flex-col gap-1">
          <span className="text-overline text-tertiary tracking-wide uppercase">
            Since (inclusive)
          </span>
          <input
            className="border-tertiary bg-tertiary text-primary h-8 rounded border px-2 font-mono text-xs"
            onChange={(e) => setSince(e.target.value)}
            type="date"
            value={since}
          />
        </label>
        <button
          className="bg-warning text-warning inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={!orgSlug || isFetching}
          onClick={fetchActivity}
        >
          <RefreshCw className={isFetching ? 'animate-spin' : ''} size={11} />
          Fetch activity
        </button>
        <button
          className="border-tertiary text-primary hover:bg-secondary inline-flex h-8 items-center gap-1.5 rounded border px-3 text-xs transition-colors disabled:opacity-50"
          disabled={rows.length === 0}
          onClick={downloadCsv}
        >
          <Download size={11} />
          Download CSV
        </button>
        <span className="text-tertiary ml-auto self-center text-xs">
          {isFetching
            ? 'Fetching…'
            : error
              ? 'Failed to load activity.'
              : data
                ? `Done — ${data.members} member${data.members === 1 ? '' : 's'}.`
                : null}
        </span>
      </div>

      {/* Table card */}
      <div className="border-tertiary bg-primary overflow-hidden rounded-lg border">
        {isFetching && !data ? (
          <ActivityRowsSkeleton />
        ) : error ? (
          <div className="text-danger py-10 text-center text-sm">
            Failed to load PR activity.{' '}
            <button className="underline" onClick={() => void refetch()}>
              Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-tertiary py-10 text-center text-sm">
            No pull request activity since {appliedSince}.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-tertiary border-b">
                <th className="text-overline text-tertiary px-[18px] py-2.5 text-left font-normal tracking-wide uppercase">
                  Member
                </th>
                <th className="text-overline text-tertiary w-48 px-4 py-2.5 text-right font-normal tracking-wide uppercase">
                  Created
                </th>
                <th className="text-overline text-tertiary w-48 px-[18px] py-2.5 text-right font-normal tracking-wide uppercase">
                  Merged ↓
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  className={`border-tertiary hover:bg-secondary transition-colors ${
                    i === rows.length - 1 ? 'border-0' : 'border-b'
                  }`}
                  key={row.login}
                >
                  <td className="px-[18px] py-2.5">
                    <UserIdentity
                      actor={row.login}
                      displayName={row.display_name}
                      email={row.email}
                      size="small"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <CountCell max={maxCreated} value={row.created} />
                  </td>
                  <td className="px-[18px] py-2.5">
                    <CountCell max={maxMerged} value={row.merged} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-tertiary border-t">
                <td className="text-secondary px-[18px] py-3 text-xs font-medium tracking-wide uppercase">
                  Total ({rows.length})
                </td>
                <td className="text-primary px-4 py-3 text-right font-mono text-xs tabular-nums">
                  {totalCreated}
                </td>
                <td className="text-primary px-[18px] py-3 text-right font-mono text-xs tabular-nums">
                  {totalMerged}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}

function ActivityRowsSkeleton() {
  return (
    <table aria-busy className="w-full text-sm">
      <tbody>
        {Array.from({ length: 8 }, (_, i) => (
          <tr className="border-tertiary border-b last:border-0" key={i}>
            <td className="px-[18px] py-2.5">
              <div className="flex items-center gap-2">
                <Sk h={20} r={999} w={20} />
                <Sk line w={120} />
              </div>
            </td>
            <td className="px-4 py-2.5">
              <div className="flex justify-end">
                <Sk h={16} r={3} w="70%" />
              </div>
            </td>
            <td className="px-[18px] py-2.5">
              <div className="flex justify-end">
                <Sk h={16} r={3} w="70%" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Number with an amber bar sized to its share of the column max. */
function CountCell({ max, value }: { max: number; value: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="relative flex h-6 items-center justify-end">
      {value > 0 ? (
        <div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{
            background: 'var(--background-color-warning)',
            width: `${pct}%`,
          }}
        />
      ) : null}
      <span
        className="relative z-10 px-2 font-mono text-xs tabular-nums"
        style={{
          color:
            value > 0
              ? 'var(--text-color-primary)'
              : 'var(--text-color-tertiary)',
        }}
      >
        {value}
      </span>
    </div>
  )
}

/** YYYY-MM-DD for a date `days` before today (local time). */
function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
