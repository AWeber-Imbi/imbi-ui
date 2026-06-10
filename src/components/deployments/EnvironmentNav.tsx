import { ArrowUp, Check, GitMerge, Loader2, Plug, PlugZap } from 'lucide-react'

import { deriveChipColors } from '@/lib/chip-colors'
import { cn } from '@/lib/utils'

import type { PipelineStage } from './pipeline'

interface EnvironmentNavProps {
  connectLabel: string
  isDarkMode: boolean
  onSelect: (slug: string) => void
  /** Commits pending per target env slug (promote-kind badge counts). */
  pendingCommitsBySlug: Record<string, null | number | undefined>
  readiness: Readiness
  selectedSlug: null | string
  /** Stages in ascending sort order; rendered descending (last env first). */
  stages: PipelineStage[]
}

type Readiness = 'connected' | 'disconnected' | 'error' | 'loading'

// fallow-ignore-next-line complexity
export function EnvironmentNav({
  connectLabel,
  isDarkMode,
  onSelect,
  pendingCommitsBySlug,
  readiness,
  selectedSlug,
  stages,
}: EnvironmentNavProps) {
  return (
    <nav className="border-tertiary sticky top-4 self-start rounded-lg border p-2.5">
      <p className="text-tertiary px-2 pt-1 pb-2 text-xs tracking-wider uppercase">
        Pipeline
      </p>
      {[...stages].reverse().map((stage) => {
        const accent = stage.env.label_color
          ? deriveChipColors(stage.env.label_color, isDarkMode)
          : null
        const active = stage.env.slug === selectedSlug
        const version =
          stage.current?.release?.tag ??
          stage.current?.release?.committish.slice(0, 7) ??
          'not deployed'
        return (
          <button
            className={cn(
              'mb-0.5 flex w-full items-center gap-3 rounded-md border border-transparent px-2.5 py-2 text-left transition-colors',
              !active && 'hover:bg-secondary',
            )}
            key={stage.env.slug}
            onClick={() => onSelect(stage.env.slug)}
            style={
              active && accent
                ? { backgroundColor: accent.bg, borderColor: accent.border }
                : undefined
            }
            type="button"
          >
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-sm',
                  active ? 'font-semibold' : 'font-medium',
                )}
              >
                {stage.env.name}
              </span>
              <span className="text-tertiary block font-mono text-[11px]">
                {version}
              </span>
            </span>
            <StageBadge
              accent={accent}
              pendingCommits={pendingCommitsBySlug[stage.env.slug]}
              stage={stage}
            />
          </button>
        )
      })}
      <div className="border-tertiary mt-2 border-t px-2 pt-2.5 pb-1">
        <ConnectionStatus connectLabel={connectLabel} readiness={readiness} />
      </div>
    </nav>
  )
}

function ConnectionStatus({
  connectLabel,
  readiness,
}: {
  connectLabel: string
  readiness: Readiness
}) {
  if (readiness === 'connected') {
    return (
      <span className="text-success inline-flex items-center gap-1.5 text-xs">
        <PlugZap size={13} />
        {connectLabel} connected
      </span>
    )
  }
  if (readiness === 'loading') {
    return (
      <span className="text-tertiary inline-flex items-center gap-1.5 text-xs">
        <Loader2 className="animate-spin" size={13} />
        Checking deployment access…
      </span>
    )
  }
  return (
    <span className="text-tertiary inline-flex items-center gap-1.5 text-xs">
      <Plug size={13} />
      {readiness === 'error'
        ? 'Could not check deployment access'
        : `Connect to ${connectLabel} to enable deployments`}
    </span>
  )
}

// fallow-ignore-next-line complexity
function StageBadge({
  accent,
  pendingCommits,
  stage,
}: {
  accent: null | ReturnType<typeof deriveChipColors>
  pendingCommits: null | number | undefined
  stage: PipelineStage
}) {
  if (stage.kind === 'release' && stage.pendingReleases.length > 0) {
    const newest = stage.pendingReleases[0]
    return (
      <span
        className="bg-secondary inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold"
        style={
          accent ? { backgroundColor: accent.bg, color: accent.fg } : undefined
        }
        title={`Release ${newest.tag} is waiting to deploy here`}
      >
        <GitMerge size={11} />
        {newest.tag}
      </span>
    )
  }
  if (stage.kind === 'promote' && (pendingCommits ?? 0) > 0) {
    return (
      <span
        className="bg-secondary inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={
          accent ? { backgroundColor: accent.bg, color: accent.fg } : undefined
        }
        title={`${pendingCommits} commits waiting to promote here`}
      >
        <ArrowUp size={11} />
        {pendingCommits}
      </span>
    )
  }
  if (stage.kind === 'commit') return null
  return (
    <span
      className="border-success text-success flex size-4.5 shrink-0 items-center justify-center rounded-full border"
      title="In sync"
    >
      <Check size={11} strokeWidth={3} />
    </span>
  )
}
