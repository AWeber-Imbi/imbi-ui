import { useCallback, useEffect, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { patchProject } from '@/api/endpoints'
import { extractApiErrorDetail } from '@/lib/apiError'
import { applyJsonPatch } from '@/lib/json-patch'
import type { PatchOperation, Project } from '@/types'

const SCORE_REFRESH_DELAY = 5_000

export interface UseProjectPatchResult {
  patch: (path: string, value: unknown) => Promise<void>
  pendingPath: null | string
}

export function useProjectPatch(
  orgSlug: string,
  projectId: string,
): UseProjectPatchResult {
  const qc = useQueryClient()
  const [pendingPath, setPendingPath] = useState<null | string>(null)
  const scoreRefreshTimer = useRef<null | ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => {
      if (scoreRefreshTimer.current !== null) {
        clearTimeout(scoreRefreshTimer.current)
      }
    }
  }, [])

  const scheduleScoreRefresh = useCallback(() => {
    if (scoreRefreshTimer.current !== null) {
      clearTimeout(scoreRefreshTimer.current)
    }
    scoreRefreshTimer.current = setTimeout(() => {
      scoreRefreshTimer.current = null
      qc.invalidateQueries({ queryKey: ['project', orgSlug, projectId] })
      qc.invalidateQueries({
        queryKey: ['scoreTrend', orgSlug, projectId],
      })
      qc.invalidateQueries({
        queryKey: ['scoreTrend90', orgSlug, projectId],
      })
      qc.invalidateQueries({
        queryKey: ['projectBreakdown', orgSlug, projectId],
      })
      qc.invalidateQueries({
        queryKey: ['scoreHistory', orgSlug, projectId],
      })
      qc.invalidateQueries({
        queryKey: ['scoreHistoryRaw', orgSlug, projectId],
      })
    }, SCORE_REFRESH_DELAY)
  }, [qc, orgSlug, projectId])

  const patch = useCallback(
    async (path: string, value: unknown) => {
      const key = ['project', orgSlug, projectId] as const
      const op = buildOp(path, value)
      const snapshot = qc.getQueryData<Project>(key)
      let optimisticApplied = false

      setPendingPath(path)

      try {
        // Apply optimistic update (best-effort; skip if the patch shape
        // cannot be applied locally so the network PATCH still runs).
        if (snapshot) {
          try {
            qc.setQueryData<Project>(
              key,
              applyJsonPatch(snapshot as unknown as Record<string, unknown>, [
                op,
              ]) as unknown as Project,
            )
            optimisticApplied = true
          } catch {
            // Unsupported local patch shape — let the server be the source of truth.
          }
        }

        await patchProject(orgSlug, projectId, [op])
        // The server PATCH response may echo fields in a different shape than
        // GET returns (e.g. environments as a map vs. an array). Invalidate
        // so the next read comes from the canonical GET.
        qc.invalidateQueries({ queryKey: key })
        // Activity events are written synchronously — refresh immediately.
        qc.invalidateQueries({
          queryKey: ['events', orgSlug, projectId],
        })
        scheduleScoreRefresh()
      } catch (error) {
        // Rollback optimistic update
        if (optimisticApplied && snapshot !== undefined) {
          qc.setQueryData(key, snapshot)
        }
        toast.error(`Save failed: ${extractApiErrorDetail(error)}`)
        throw error
      } finally {
        setPendingPath(null)
      }
    },
    [qc, orgSlug, projectId, scheduleScoreRefresh],
  )

  return { patch, pendingPath }
}

function buildOp(path: string, value: unknown): PatchOperation {
  if (value === null || value === undefined || value === '') {
    return { op: 'remove', path }
  }
  return { op: 'replace', path, value }
}
