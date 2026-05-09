import { useEffect, useRef } from 'react'

import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { getDeploymentRunStatus } from '@/api/endpoints'
import type { DeploymentRun } from '@/types'

const TERMINAL_STATUSES: ReadonlySet<DeploymentRun['status']> = new Set([
  'cancelled',
  'failure',
  'success',
])

interface DeploymentRunWatcherProps {
  envName: string
  /** Initial status reported by `trigger_deployment`. */
  initialStatus?: DeploymentRun['status']
  onTerminal: (runId: string) => void
  orgSlug: string
  projectId: string
  runId: string
  runUrl?: null | string
  toastId: number | string
}

/**
 * Polls `/deployments/runs/{run_id}` while a workflow is in flight and
 * updates the matching sonner toast as the status flips.
 *
 * Renders nothing — it's a side-effect component the parent mounts per
 * active run. Removes itself from the parent's tracking list once the
 * run reaches a terminal state.
 */
export function DeploymentRunWatcher(props: DeploymentRunWatcherProps): null {
  const {
    envName,
    initialStatus,
    onTerminal,
    orgSlug,
    projectId,
    runId,
    runUrl,
    toastId,
  } = props

  // Snapshot the latest known status so refetchInterval can short-circuit
  // once we hit a terminal state.
  const statusRef = useRef<DeploymentRun['status']>(initialStatus ?? null)
  const settledRef = useRef(false)

  const query = useQuery<DeploymentRun>({
    enabled: !!runId && !settledRef.current,
    queryFn: ({ signal }) =>
      getDeploymentRunStatus(orgSlug, projectId, runId, undefined, signal),
    queryKey: ['deployment-run', orgSlug, projectId, runId],
    refetchInterval: (q) => {
      const status = q.state.data?.status
      if (status && TERMINAL_STATUSES.has(status)) return false
      return 4000
    },
    refetchIntervalInBackground: false,
    // Keep retrying transient errors a few times before giving up; the
    // toast still shows the last good status.
    retry: 3,
  })

  useEffect(() => {
    const data = query.data
    if (!data) return
    statusRef.current = data.status
    if (data.status === 'success') {
      settledRef.current = true
      toast.success(`Deployed to ${envName}`, {
        action: runUrl
          ? {
              label: 'View run',
              onClick: () => window.open(runUrl, '_blank', 'noopener'),
            }
          : undefined,
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        id: toastId,
      })
      onTerminal(runId)
    } else if (data.status === 'failure' || data.status === 'cancelled') {
      settledRef.current = true
      const verb = data.status === 'cancelled' ? 'cancelled' : 'failed'
      toast.error(`Deployment to ${envName} ${verb}`, {
        action: runUrl
          ? {
              label: 'View run',
              onClick: () => window.open(runUrl, '_blank', 'noopener'),
            }
          : undefined,
        icon: <XCircle className="h-4 w-4 text-rose-500" />,
        id: toastId,
      })
      onTerminal(runId)
    } else {
      // queued / in_progress — keep the loading toast fresh.
      toast.loading(`Deploying to ${envName}…`, {
        action: runUrl
          ? {
              label: 'View run',
              onClick: () => window.open(runUrl, '_blank', 'noopener'),
            }
          : undefined,
        description: data.status ? `status: ${data.status}` : undefined,
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        id: toastId,
      })
    }
  }, [query.data, envName, onTerminal, runId, runUrl, toastId])

  // If the status endpoint itself errors out persistently, bail so the
  // toast doesn't sit on "deploying…" forever.
  useEffect(() => {
    if (!query.isError || settledRef.current) return
    settledRef.current = true
    toast.message(`Lost track of deployment to ${envName}`, {
      action: runUrl
        ? {
            label: 'View run',
            onClick: () => window.open(runUrl, '_blank', 'noopener'),
          }
        : undefined,
      description: 'Status polling failed; check the workflow run directly.',
      icon: <ExternalLink className="h-4 w-4" />,
      id: toastId,
    })
    onTerminal(runId)
  }, [query.isError, envName, onTerminal, runId, runUrl, toastId])

  return null
}
