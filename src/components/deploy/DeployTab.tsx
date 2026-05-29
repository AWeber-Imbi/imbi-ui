import { useEffect, useMemo, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Rocket } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError } from '@/api/client'
import {
  compareDeploymentRefs,
  listCurrentReleases,
  listDeploymentRefs,
  listRefCommits,
  triggerDeployment,
} from '@/api/endpoints'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { extractApiErrorDetail } from '@/lib/apiError'
import { cn, sortEnvironments } from '@/lib/utils'
import type {
  CurrentReleaseEnvironment,
  DeploymentCommit,
  DeploymentRef,
  Environment,
} from '@/types'

import { BranchList, CommitList, TagList } from './lists'
import { useBranchPicker } from './useBranchPicker'

interface DeployTabProps {
  environments: Environment[]
  initialEnvSlug?: string
  onClose: () => void
  onRunStarted?: (run: import('./DeploymentModal').DeploymentRunStarted) => void
  // Modal-open gate: queries only fire while the modal is open so the
  // hidden DeployTab doesn't issue GitHub round-trips on every page load.
  open: boolean
  orgSlug: string
  projectId: string
}

interface SelectedVersion {
  label: null | string
  sha: string
}

export function DeployTab({
  environments,
  initialEnvSlug,
  onClose,
  onRunStarted,
  open,
  orgSlug,
  projectId,
}: DeployTabProps) {
  const sorted = useMemo(() => sortEnvironments(environments), [environments])
  // Env is locked at modal open time — the URL ``/deploy/<env>`` carries
  // the target, and re-deploys are scoped to that single env. No picker
  // is rendered; users navigate to a different chip to change env.
  // Resolve the env first so a stale ``initialEnvSlug`` falls back to the
  // first env *and* the slug used to display / dispatch matches.
  const env = initialEnvSlug
    ? (sorted.find((e) => e.slug === initialEnvSlug) ?? sorted[0])
    : sorted[0]
  const envSlug = env?.slug ?? ''

  const {
    data: currentReleases = [],
    isError: currentReleasesError,
    isLoading: currentReleasesLoading,
  } = useQuery<CurrentReleaseEnvironment[]>({
    enabled: open && !!orgSlug && !!projectId,
    queryFn: ({ signal }) => listCurrentReleases(orgSlug, projectId, signal),
    queryKey: ['currentReleases', orgSlug, projectId],
  })
  const current = useMemo(
    () =>
      env
        ? currentReleases.find((r) => r.environment.slug === env.slug)
        : undefined,
    [currentReleases, env],
  )

  // For the first env (e.g. Testing) we list commits on the default
  // branch.  For staging / production we list tags.
  const isFirstEnv = env?.slug === sorted[0]?.slug

  const {
    data: refs = [],
    isError: refsError,
    isLoading: refsLoading,
    refetch: refsRefetch,
  } = useQuery<DeploymentRef[]>({
    enabled: open && !!env,
    queryFn: ({ signal }) =>
      listDeploymentRefs(
        orgSlug,
        projectId,
        { kind: isFirstEnv ? 'default' : 'tag' },
        signal,
      ),
    queryKey: [
      'deploymentRefs',
      orgSlug,
      projectId,
      isFirstEnv ? 'branch' : 'tag',
    ],
  })

  const defaultBranchName = useMemo(() => {
    const def = refs.find((r) => r.is_default)
    return def?.name ?? 'main'
  }, [refs])

  const {
    data: branchCommits = [],
    isError: commitsError,
    isLoading: commitsLoading,
    refetch: commitsRefetch,
  } = useQuery<DeploymentCommit[]>({
    enabled: open && !!env && isFirstEnv,
    queryFn: ({ signal }) =>
      listRefCommits(
        orgSlug,
        projectId,
        defaultBranchName,
        { limit: 25 },
        signal,
      ),
    queryKey: ['refCommits', orgSlug, projectId, defaultBranchName],
  })

  const tagOptions = useMemo<DeploymentRef[]>(
    () => (isFirstEnv ? [] : refs.filter((r) => r.kind === 'tag')),
    [isFirstEnv, refs],
  )

  // Phase 1.5 picker: on Testing the user can swap from the flat
  // default-branch commit list into a "Branches" pane that lists every
  // branch (filterable) and pulls commits for the chosen one on demand.
  const {
    activeBranch,
    activeBranchCommits,
    activeBranchError,
    activeBranchLoading,
    activeBranchRefetch,
    branchesError,
    branchesLoading,
    branchesRefetch,
    branchQuery,
    filteredBranches,
    pickerMode,
    setActiveBranch,
    setBranchQuery,
    setPickerMode,
    showBranchPane,
  } = useBranchPicker({ envSlug, isFirstEnv, open, orgSlug, projectId })

  const [selected, setSelected] = useState<null | SelectedVersion>(null)
  useEffect(() => {
    setSelected(null)
  }, [envSlug])

  // For first-env (commit-based) deployments, ``selected.label`` is the
  // branch name (e.g. ``main``), so compare against ``selected.sha`` via
  // the release's ``committish``. For tag-based envs ``selected.label`` is
  // the tag and matches ``current.release.tag``.
  const currentCommittish = current?.release?.committish ?? null
  const currentTag = current?.release?.tag ?? null
  const isRedeploy =
    !!current?.release &&
    !!selected &&
    (isFirstEnv
      ? !!currentCommittish &&
        (currentCommittish === selected.sha ||
          selected.sha.startsWith(currentCommittish) ||
          currentCommittish.startsWith(selected.sha))
      : currentTag === selected.label)

  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: SelectedVersion) =>
      triggerDeployment(orgSlug, projectId, {
        action: isRedeploy ? 'redeploy' : 'deploy',
        committish: payload.sha,
        environment: envSlug,
        ref_label: payload.label,
      }),
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? (extractApiErrorDetail(err) ?? err.message)
          : (err as Error).message,
      )
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ['currentReleases', orgSlug, projectId],
      })
      const url = data.run.run_url
      const envName = env?.name ?? envSlug
      if (onRunStarted && data.run.run_id) {
        const toastId = toast.loading(`Deploying to ${envName}…`, {
          action: url
            ? {
                label: 'View run',
                onClick: () => window.open(url, '_blank', 'noopener'),
              }
            : undefined,
          description: data.run.status
            ? `status: ${data.run.status}`
            : undefined,
          icon: <Loader2 className="size-4 animate-spin" />,
        })
        onRunStarted({
          actionLabel: url ? 'View run' : undefined,
          actionUrl: url,
          envName,
          initialStatus: data.run.status,
          originOrgSlug: orgSlug,
          originProjectId: projectId,
          runId: data.run.run_id,
          runUrl: url,
          toastId,
        })
      } else {
        toast.success(
          `Workflow dispatched to ${envName}`,
          url
            ? {
                action: {
                  label: 'View run',
                  onClick: () => window.open(url, '_blank', 'noopener'),
                },
              }
            : undefined,
        )
      }
      onClose()
    },
  })

  const onDeploy = () => {
    if (!selected) return
    mutation.mutate(selected)
  }

  return (
    <div className="flex max-h-[80vh] min-h-121.5 flex-col gap-4">
      {/* Locked target environment */}
      <section>
        <p className="text-tertiary mb-2 text-xs tracking-wider uppercase">
          Environment
        </p>
        <div className="border-action bg-action/5 rounded-md border p-3">
          <div className="text-sm font-medium">{env?.name ?? envSlug}</div>
          <div className="text-tertiary mt-1 text-xs">
            {currentReleasesLoading ? (
              <div
                aria-busy="true"
                aria-label="Loading current release"
                className="flex items-center gap-2"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : currentReleasesError ? (
              <span className="text-danger">
                Unable to load current release.
              </span>
            ) : current?.release ? (
              <>
                <span className="font-mono">
                  {current.release.tag ?? current.release.committish}
                </span>
                {current.last_event_at ? (
                  <>
                    {' · '}
                    {formatDistanceToNow(new Date(current.last_event_at), {
                      addSuffix: true,
                    })}
                  </>
                ) : null}
              </>
            ) : (
              'not deployed'
            )}
          </div>
        </div>
      </section>

      {/* Version picker */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-tertiary text-xs tracking-wider uppercase">
            {isFirstEnv
              ? showBranchPane
                ? activeBranch
                  ? `Commit on ${activeBranch}`
                  : 'Pick a branch'
                : `Commit on ${defaultBranchName}`
              : 'Tag'}
          </p>
          {isFirstEnv ? (
            <PickerToggle
              defaultLabel={defaultBranchName}
              mode={pickerMode}
              onChange={(m) => {
                setPickerMode(m)
                setSelected(null)
                if (m === 'default') setActiveBranch(null)
              }}
            />
          ) : null}
        </div>
        {!isFirstEnv ? (
          <TagList
            current={
              current?.release?.tag ?? current?.release?.committish ?? null
            }
            isError={refsError}
            isLoading={refsLoading}
            onRetry={refsRefetch}
            onSelect={(r) => setSelected({ label: r.name, sha: r.sha })}
            selectedSha={selected?.sha ?? null}
            tags={tagOptions}
          />
        ) : showBranchPane ? (
          <BranchPicker
            activeBranch={activeBranch}
            branches={filteredBranches}
            branchesError={branchesError}
            branchesLoading={branchesLoading}
            commits={activeBranchCommits}
            commitsError={activeBranchError}
            commitsLoading={activeBranchLoading}
            current={
              current?.release?.tag ?? current?.release?.committish ?? null
            }
            onBranchesRetry={branchesRefetch}
            onBranchSelect={(name) => {
              setActiveBranch(name)
              setSelected(null)
            }}
            onCommitSelect={(c) => {
              if (!activeBranch) return
              setSelected({ label: activeBranch, sha: c.sha })
            }}
            onCommitsRetry={activeBranchRefetch}
            onQueryChange={setBranchQuery}
            query={branchQuery}
            selectedSha={selected?.sha ?? null}
          />
        ) : (
          <CommitList
            commits={branchCommits}
            current={
              current?.release?.tag ?? current?.release?.committish ?? null
            }
            isError={commitsError}
            isLoading={commitsLoading}
            onRetry={commitsRefetch}
            onSelect={(c) =>
              setSelected({ label: defaultBranchName, sha: c.sha })
            }
            selectedSha={selected?.sha ?? null}
          />
        )}
      </section>

      {/* Diff summary — fixed-height slot so footer doesn't shift */}
      <div className="min-h-[70.5px]">
        {selected && current?.release ? (
          <DiffSummary
            base={current.release.committish}
            head={selected.label ?? selected.sha}
            orgSlug={orgSlug}
            projectId={projectId}
          />
        ) : null}
      </div>

      {/* Footer */}
      <div className="border-tertiary bg-secondary/30 -mx-6 mt-2 -mb-4 flex items-center justify-end gap-2 border-t px-6 py-4">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancel
        </Button>
        <Button
          disabled={!selected || mutation.isPending}
          onClick={onDeploy}
          type="button"
        >
          {mutation.isPending ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <Rocket className="mr-1 size-4" />
          )}
          {`${isRedeploy ? 'Redeploy' : 'Deploy'} ${
            selected?.label ?? selected?.sha.slice(0, 7) ?? ''
          } to ${env?.name ?? envSlug}`}
        </Button>
      </div>
    </div>
  )
}

function BranchPicker({
  activeBranch,
  branches,
  branchesError,
  branchesLoading,
  commits,
  commitsError,
  commitsLoading,
  current,
  onBranchesRetry,
  onBranchSelect,
  onCommitSelect,
  onCommitsRetry,
  onQueryChange,
  query,
  selectedSha,
}: {
  activeBranch: null | string
  branches: DeploymentRef[]
  branchesError: boolean
  branchesLoading: boolean
  commits: DeploymentCommit[]
  commitsError: boolean
  commitsLoading: boolean
  current: null | string
  onBranchesRetry: () => void
  onBranchSelect: (name: string) => void
  onCommitSelect: (commit: DeploymentCommit) => void
  onCommitsRetry: () => void
  onQueryChange: (q: string) => void
  query: string
  selectedSha: null | string
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <Input
          aria-label="Filter branches"
          className="h-8"
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Filter branches…"
          type="text"
          value={query}
        />
        <BranchList
          activeBranch={activeBranch}
          branches={branches}
          isError={branchesError}
          isLoading={branchesLoading}
          onRetry={onBranchesRetry}
          onSelect={onBranchSelect}
        />
      </div>
      <div>
        {!activeBranch ? (
          <p className="border-secondary text-tertiary rounded-md border border-dashed p-3 text-sm">
            Select a branch to see commits.
          </p>
        ) : (
          <CommitList
            commits={commits}
            current={current}
            isError={commitsError}
            isLoading={commitsLoading}
            onRetry={onCommitsRetry}
            onSelect={onCommitSelect}
            selectedSha={selectedSha}
          />
        )}
      </div>
    </div>
  )
}

function DiffSummary({
  base,
  head,
  orgSlug,
  projectId,
}: {
  base: string
  head: string
  orgSlug: string
  projectId: string
}) {
  const { data, isLoading } = useQuery({
    enabled: base !== head,
    queryFn: ({ signal }) =>
      compareDeploymentRefs(orgSlug, projectId, base, head, undefined, signal),
    queryKey: ['compare', orgSlug, projectId, base, head],
  })
  if (base === head)
    return (
      <p className="text-tertiary text-xs">
        Re-deploying — no commit delta to summarize.
      </p>
    )
  if (isLoading)
    return (
      <div
        aria-busy="true"
        aria-label="Loading diff summary"
        className="border-secondary bg-tertiary/20 flex flex-col gap-2 rounded-md border p-3"
      >
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    )
  if (!data) return null
  return (
    <div className="border-secondary bg-tertiary/20 rounded-md border p-3 text-xs">
      <div className="text-tertiary font-mono">
        {base} → {head}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        <span>{data.commits.length} commits</span>
        <span>{data.files_changed} files changed</span>
        <span className="text-success">+{data.additions}</span>
        <span className="text-danger">−{data.deletions}</span>
      </div>
    </div>
  )
}

function PickerToggle({
  defaultLabel,
  mode,
  onChange,
}: {
  defaultLabel: string
  mode: 'branches' | 'default'
  onChange: (mode: 'branches' | 'default') => void
}) {
  return (
    <div
      className="border-secondary inline-flex rounded-md border text-xs"
      role="group"
    >
      <button
        aria-pressed={mode === 'default'}
        className={cn(
          'px-2 py-1',
          mode === 'default'
            ? 'bg-action/10 text-primary'
            : 'text-tertiary hover:bg-tertiary/30',
        )}
        onClick={() => onChange('default')}
        type="button"
      >
        {defaultLabel}
      </button>
      <button
        aria-pressed={mode === 'branches'}
        className={cn(
          'border-l border-secondary px-2 py-1',
          mode === 'branches'
            ? 'bg-action/10 text-primary'
            : 'text-tertiary hover:bg-tertiary/30',
        )}
        onClick={() => onChange('branches')}
        type="button"
      >
        Branches
      </button>
    </div>
  )
}
