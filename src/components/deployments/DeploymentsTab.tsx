import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { listCurrentReleases, listPromotionOptions } from '@/api/endpoints'
import { getReleaseHistory } from '@/api/releases'
import type { DeploymentRunStarted } from '@/components/deploy/DeploymentModal'
import { LoadingState } from '@/components/ui/loading-state'
import { useTheme } from '@/contexts/ThemeContext'
import { deriveChipColors } from '@/lib/chip-colors'
import type { Environment } from '@/types'

import { EnvironmentDetail } from './EnvironmentDetail'
import { EnvironmentNav } from './EnvironmentNav'
import { buildPipeline, defaultStageSlug } from './pipeline'
import { useDeploymentActions } from './useDeploymentActions'

interface DeploymentsTabProps {
  canTrigger: boolean
  connectLabel: string
  /** Pipeline environments, already sorted ascending by sort_order. */
  environments: Environment[]
  onRunStarted?: (run: DeploymentRunStarted) => void
  orgSlug: string
  projectId: string
  readiness: 'connected' | 'disconnected' | 'error' | 'loading'
}

/**
 * Project-detail Deployments tab: an environment sidebar (descending
 * sort order) and a per-environment detail pane for deploying,
 * promoting, and rolling back.
 */
// fallow-ignore-next-line complexity
export function DeploymentsTab({
  canTrigger,
  connectLabel,
  environments,
  onRunStarted,
  orgSlug,
  projectId,
  readiness,
}: DeploymentsTabProps) {
  const { isDarkMode } = useTheme()
  const enabled = !!orgSlug && !!projectId

  const {
    data: currentReleases = [],
    error: currentError,
    isLoading: currentLoading,
  } = useQuery({
    enabled,
    queryFn: ({ signal }) => listCurrentReleases(orgSlug, projectId, signal),
    queryKey: ['currentReleases', orgSlug, projectId],
  })
  const {
    data: history = [],
    error: historyError,
    isLoading: historyLoading,
  } = useQuery({
    enabled,
    queryFn: ({ signal }) => getReleaseHistory(orgSlug, projectId, signal),
    queryKey: ['releaseHistory', orgSlug, projectId],
  })
  // Adjacent-env commit counts for the sidebar badges; tolerated as
  // best-effort (the endpoint already degrades per-pair on plugin
  // failures).
  const { data: promotionOptions = [] } = useQuery({
    enabled,
    queryFn: ({ signal }) => listPromotionOptions(orgSlug, projectId, signal),
    queryKey: ['promotionOptions', orgSlug, projectId],
  })

  const stages = useMemo(
    () => buildPipeline(environments, currentReleases, history),
    [environments, currentReleases, history],
  )
  const pendingCommitsBySlug = useMemo(() => {
    const out: Record<string, null | number | undefined> = {}
    for (const option of promotionOptions) {
      out[option.to_environment] = option.commits_pending
    }
    return out
  }, [promotionOptions])

  const [selectedSlug, setSelectedSlug] = useState<null | string>(null)
  const effectiveSlug =
    selectedSlug && stages.some((s) => s.env.slug === selectedSlug)
      ? selectedSlug
      : defaultStageSlug(stages, pendingCommitsBySlug)
  const selectedStage = stages.find((s) => s.env.slug === effectiveSlug) ?? null

  const actions = useDeploymentActions({ onRunStarted, orgSlug, projectId })

  if (currentLoading || historyLoading) {
    return <LoadingState label="Loading deployments…" />
  }
  if (currentError || historyError) {
    return (
      <div className="border-tertiary text-tertiary rounded-lg border p-6 text-center text-sm">
        Could not load deployment data for this project.
      </div>
    )
  }
  if (stages.length === 0) {
    return (
      <div className="border-tertiary text-tertiary rounded-lg border p-6 text-center text-sm">
        No environments are configured for this project.
      </div>
    )
  }

  return (
    <div className="grid items-start gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
      <EnvironmentNav
        connectLabel={connectLabel}
        isDarkMode={isDarkMode}
        onSelect={setSelectedSlug}
        pendingCommitsBySlug={pendingCommitsBySlug}
        readiness={readiness}
        selectedSlug={effectiveSlug}
        stages={stages}
      />
      {selectedStage ? (
        <EnvironmentDetail
          accent={
            selectedStage.env.label_color
              ? deriveChipColors(selectedStage.env.label_color, isDarkMode)
              : null
          }
          actions={actions}
          canTrigger={canTrigger}
          orgSlug={orgSlug}
          projectId={projectId}
          stage={selectedStage}
        />
      ) : null}
    </div>
  )
}
