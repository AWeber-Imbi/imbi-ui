import { Fragment, useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import {
  ExternalLink,
  GitCommitHorizontal,
  Loader2,
  RotateCcw,
  Upload,
} from 'lucide-react'

import {
  listDeploymentRefs,
  listRefCommits,
  resolveDeploymentCommit,
} from '@/api/endpoints'
import { CiStatusDot } from '@/components/releases/CiStatusDot'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import type { ChipColors } from '@/lib/chip-colors'
import type { DeploymentCommit, DeploymentRef } from '@/types'

import { ConfirmActionDialog } from './ConfirmActionDialog'
import type { PipelineStage } from './pipeline'
import { StageCardShell } from './StageCardShell'
import type { DeploymentActions } from './useDeploymentActions'

interface CommitDeployCardProps {
  accent: ChipColors | null
  actions: DeploymentActions
  canTrigger: boolean
  orgSlug: string
  projectId: string
  stage: PipelineStage
}

const COMMIT_LIMIT = 25

/**
 * The entry environment: tracks raw commits off the default branch.
 * Deploy a newer commit forward, or roll back to an older one — no
 * promotion happens here.
 */
// fallow-ignore-next-line complexity
export function CommitDeployCard({
  accent,
  actions,
  canTrigger,
  orgSlug,
  projectId,
  stage,
}: CommitDeployCardProps) {
  const [confirming, setConfirming] = useState<null | {
    commit: DeploymentCommit
    rollback: boolean
  }>(null)

  const { data: refs = [] } = useQuery<DeploymentRef[]>({
    queryFn: ({ signal }) =>
      listDeploymentRefs(orgSlug, projectId, { kind: 'default' }, signal),
    queryKey: ['deploymentRefs', orgSlug, projectId, 'branch'],
  })
  const defaultBranchName = useMemo(() => {
    const def = refs.find((r) => r.is_default)
    return def?.name ?? 'main'
  }, [refs])

  const {
    data: commits = [],
    isError,
    isLoading,
  } = useQuery<DeploymentCommit[]>({
    queryFn: ({ signal }) =>
      listRefCommits(
        orgSlug,
        projectId,
        defaultBranchName,
        { limit: COMMIT_LIMIT },
        signal,
      ),
    queryKey: ['refCommits', orgSlug, projectId, defaultBranchName],
  })

  const currentSha = stage.current?.release?.committish ?? null
  const matchesCurrent = (c: DeploymentCommit) =>
    !!currentSha &&
    (c.sha.startsWith(currentSha) || currentSha.startsWith(c.sha))

  // The deployed commit can be older than the recent-commits window (the
  // branch has moved on). Resolve it so the list still anchors on what's
  // actually running, pinned below a gap marker.
  const currentMissing =
    !!currentSha &&
    !isLoading &&
    !isError &&
    commits.length > 0 &&
    !commits.some(matchesCurrent)
  const { data: resolvedCurrent } = useQuery<DeploymentCommit>({
    enabled: currentMissing,
    queryFn: ({ signal }) =>
      resolveDeploymentCommit(orgSlug, projectId, currentSha ?? '', signal),
    queryKey: ['resolveCommit', orgSlug, projectId, currentSha],
  })
  const rows = useMemo(
    () =>
      currentMissing && resolvedCurrent
        ? [...commits, resolvedCurrent]
        : commits,
    [commits, currentMissing, resolvedCurrent],
  )
  const deployedIdx = rows.findIndex(matchesCurrent)
  const pinnedCurrent = currentMissing && !!resolvedCurrent

  return (
    <StageCardShell
      accent={accent}
      icon={GitCommitHorizontal}
      subtitle={
        currentSha ? (
          <>
            On <span className="font-mono">{currentSha.slice(0, 7)}</span> ·
            deploy a newer commit or roll back
          </>
        ) : (
          'Nothing deployed yet — deploy a commit to get started'
        )
      }
      title={stage.env.name}
    >
      <div className="px-4 py-4">
        <p className="text-tertiary mb-2 text-xs tracking-wider uppercase">
          Recent commits on {defaultBranchName}
        </p>
        {isLoading ? (
          <LoadingState label="Loading commits…" />
        ) : isError ? (
          <p className="border-danger bg-danger/10 text-danger rounded-md border px-3 py-2 text-sm">
            Failed to load commits.
          </p>
        ) : commits.length === 0 ? (
          <p className="border-secondary text-tertiary rounded-md border p-3 text-sm">
            No commits available.
          </p>
        ) : (
          <ul className="border-tertiary max-h-120 overflow-y-auto rounded-md border">
            {rows.map((c, idx) => (
              <Fragment key={c.sha}>
                {pinnedCurrent && idx === rows.length - 1 ? (
                  <li className="border-tertiary text-tertiary border-b px-3 py-1 text-center text-xs italic last:border-b-0">
                    … older commits not shown
                  </li>
                ) : null}
                <CommitRow
                  accent={accent}
                  actionPending={actions.deployPendingSha === c.sha}
                  canTrigger={canTrigger && !actions.deployPending}
                  commit={c}
                  isCurrent={idx === deployedIdx}
                  onAction={(rollback) =>
                    setConfirming({ commit: c, rollback })
                  }
                  rollback={deployedIdx >= 0 && idx > deployedIdx}
                />
              </Fragment>
            ))}
          </ul>
        )}
      </div>

      <ConfirmActionDialog
        confirmLabel={
          confirming
            ? `${confirming.rollback ? 'Roll back to' : 'Deploy'} ${confirming.commit.short_sha}`
            : 'Deploy'
        }
        description={
          confirming ? (
            <>
              {confirming.rollback ? 'Redeploys' : 'Deploys'}{' '}
              <span className="font-mono">{confirming.commit.short_sha}</span> (
              {confirming.commit.message.split('\n')[0]}) to {stage.env.name}.
            </>
          ) : (
            ''
          )
        }
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (!confirming) return
          actions.deploy({
            action: 'deploy',
            envName: stage.env.name,
            envSlug: stage.env.slug,
            refLabel: defaultBranchName,
            rollback: confirming.rollback,
            sha: confirming.commit.sha,
          })
          setConfirming(null)
        }}
        open={confirming !== null}
        title={
          confirming?.rollback
            ? `Roll back ${stage.env.name}?`
            : `Deploy to ${stage.env.name}?`
        }
      />
    </StageCardShell>
  )
}

// fallow-ignore-next-line complexity
function CommitRow({
  accent,
  actionPending,
  canTrigger,
  commit,
  isCurrent,
  onAction,
  rollback,
}: {
  accent: ChipColors | null
  actionPending: boolean
  canTrigger: boolean
  commit: DeploymentCommit
  isCurrent: boolean
  onAction: (rollback: boolean) => void
  rollback: boolean
}) {
  return (
    <li
      className="border-tertiary flex min-w-0 items-center gap-3 border-b px-3 py-1.5 last:border-b-0"
      style={isCurrent && accent ? { backgroundColor: accent.bg } : undefined}
    >
      <span className="shrink-0 font-mono text-xs">{commit.short_sha}</span>
      {commit.is_head ? <Badge variant="outline">HEAD</Badge> : null}
      <span className="min-w-0 flex-1 truncate text-sm">
        {commit.message.split('\n')[0]}
      </span>
      <CiStatusDot status={commit.ci_status} />
      {commit.author ? (
        <span className="text-tertiary hidden shrink-0 text-xs sm:inline">
          {commit.author}
        </span>
      ) : null}
      {commit.url ? (
        <a
          aria-label="View commit"
          className="text-tertiary hover:text-primary"
          href={commit.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}
      {isCurrent ? (
        <Badge variant="neutral">deployed</Badge>
      ) : (
        <Button
          disabled={!canTrigger}
          onClick={() => onAction(rollback)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {actionPending ? (
            <Loader2 className="mr-1 size-3.5 animate-spin" />
          ) : rollback ? (
            <RotateCcw className="mr-1 size-3.5" />
          ) : (
            <Upload className="mr-1 size-3.5" />
          )}
          {rollback ? 'Roll back' : 'Deploy'}
        </Button>
      )}
    </li>
  )
}
