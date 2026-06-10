// Pure view-model helpers for the Deployments tab. The tab renders one
// detail pane per environment ("stage"); the stage *kind* decides which
// card the pane shows:
//
//   'commit'  — the entry environment (no upstream). Deploys raw commits
//               off the default branch; rolling back redeploys an older
//               commit. Never promotes.
//   'promote' — the upstream environment runs an untagged commit, so
//               moving it forward means cutting a new tag (promote).
//   'release' — the upstream environment already runs a tagged release,
//               so moving forward is deploying an existing tag; nothing
//               new is cut.
//
// The kind is derived from the *data* (does the upstream run a tag?), not
// from the environment's position or name, per the release-train spec.
import type {
  CurrentReleaseEnvironment,
  Environment,
  ReleaseHistoryEntry,
} from '@/types'

export interface PipelineStage {
  current: CurrentReleaseEnvironment | null
  env: Environment
  kind: StageKind
  /** Tagged releases live upstream but not here (newest first). */
  pendingReleases: ReleaseHistoryEntry[]
  /** Releases this env could roll back to (newest first, excludes current). */
  rollbackTargets: ReleaseHistoryEntry[]
  upstream: Environment | null
  upstreamCurrent: CurrentReleaseEnvironment | null
}

export type StageKind = 'commit' | 'promote' | 'release'

const ROLLBACK_LIMIT = 10

/**
 * Build the per-environment stage models. ``environments`` must already be
 * sorted ascending by sort_order; ``history`` is the project's release
 * history, newest (highest semver) first.
 */
export function buildPipeline(
  environments: Environment[],
  currentReleases: CurrentReleaseEnvironment[],
  history: ReleaseHistoryEntry[],
): PipelineStage[] {
  const currentBySlug = new Map(
    currentReleases.map((row) => [row.environment.slug, row]),
  )
  return environments.map((env, idx) => {
    const upstream = idx > 0 ? environments[idx - 1] : null
    const current = currentBySlug.get(env.slug) ?? null
    const upstreamCurrent = upstream
      ? (currentBySlug.get(upstream.slug) ?? null)
      : null
    const kind: StageKind = !upstream
      ? 'commit'
      : upstreamCurrent?.release?.tag
        ? 'release'
        : 'promote'
    return {
      current,
      env,
      kind,
      pendingReleases:
        kind === 'release'
          ? pendingReleases(history, upstreamCurrent, current)
          : [],
      rollbackTargets: rollbackTargets(history, current),
      upstream,
      upstreamCurrent,
    }
  })
}

/**
 * Default selection: the earliest stage with something actionable (the
 * first gap in the train), falling back to the first environment.
 */
export function defaultStageSlug(
  stages: PipelineStage[],
  pendingCommitsBySlug: Record<string, null | number | undefined>,
): null | string {
  const firstGap = stages.find((stage) =>
    stage.kind === 'release'
      ? stage.pendingReleases.length > 0
      : stage.kind === 'promote'
        ? (pendingCommitsBySlug[stage.env.slug] ?? 0) > 0
        : false,
  )
  return firstGap?.env.slug ?? stages[0]?.env.slug ?? null
}

/**
 * Releases the env can deploy: everything at or below the upstream's
 * current tag (it has been validated upstream) but above this env's own
 * current tag. ``history`` is newest-first, so this is the slice between
 * the two tags. Empty when the upstream tag is unknown or the env is
 * already at (or ahead of) the upstream.
 */
// fallow-ignore-next-line complexity
function pendingReleases(
  history: ReleaseHistoryEntry[],
  upstreamCurrent: CurrentReleaseEnvironment | null,
  current: CurrentReleaseEnvironment | null,
): ReleaseHistoryEntry[] {
  const upstreamTag = upstreamCurrent?.release?.tag
  if (!upstreamTag) return []
  const fromIdx = history.findIndex((entry) => entry.tag === upstreamTag)
  if (fromIdx < 0) return []
  const envTag = current?.release?.tag ?? null
  const toIdx = envTag
    ? history.findIndex((entry) => entry.tag === envTag)
    : history.length
  if (toIdx >= 0 && toIdx <= fromIdx) return []
  return history.slice(fromIdx, toIdx < 0 ? history.length : toIdx)
}

/** Releases older than the env's current tag (what it can roll back to). */
function rollbackTargets(
  history: ReleaseHistoryEntry[],
  current: CurrentReleaseEnvironment | null,
): ReleaseHistoryEntry[] {
  const envTag = current?.release?.tag
  if (!envTag) return []
  const idx = history.findIndex((entry) => entry.tag === envTag)
  if (idx < 0) return []
  return history.slice(idx + 1, idx + 1 + ROLLBACK_LIMIT)
}
