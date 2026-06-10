import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import {
  Check,
  ChevronDown,
  ChevronUp,
  GitMerge,
  Info,
  Loader2,
  Rocket,
} from 'lucide-react'

import { compareDeploymentRefs } from '@/api/endpoints'
import { CiStatusDot } from '@/components/releases/CiStatusDot'
import { Button } from '@/components/ui/button'
import type { ChipColors } from '@/lib/chip-colors'
import { formatRelativeDate } from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import type { ReleaseHistoryEntry } from '@/types'

import { UpToDateCard } from './PendingPromoteCard'
import type { PipelineStage } from './pipeline'
import { ReleaseNotesMarkdown } from './ReleaseNotesMarkdown'
import { StageCardShell } from './StageCardShell'
import type { DeploymentActions } from './useDeploymentActions'

interface PendingReleasesCardProps {
  accent: ChipColors | null
  actions: DeploymentActions
  canTrigger: boolean
  orgSlug: string
  projectId: string
  stage: PipelineStage
}

/**
 * Releases already cut upstream that haven't reached this environment.
 * One pending release renders as a confirm card with its notes; several
 * render as a selectable stack — deploying the newest rolls the
 * intermediate ones up. No new tag is cut either way.
 */
// fallow-ignore-next-line complexity
export function PendingReleasesCard({
  accent,
  actions,
  canTrigger,
  orgSlug,
  projectId,
  stage,
}: PendingReleasesCardProps) {
  const pending = stage.pendingReleases
  const [selectedTag, setSelectedTag] = useState<null | string>(null)
  const upstreamName = stage.upstream?.name ?? 'upstream'

  if (pending.length === 0) {
    return <UpToDateCard upstreamName={upstreamName} />
  }

  const multi = pending.length > 1
  const active = pending.find((rel) => rel.tag === selectedTag) ?? pending[0]
  const activeIdx = pending.findIndex((rel) => rel.tag === active.tag)
  const rolledUp = pending.slice(activeIdx + 1).map((rel) => rel.tag)
  const stillPending = pending.slice(0, activeIdx).map((rel) => rel.tag)
  const canSubmit = canTrigger && !actions.deployPending

  return (
    <StageCardShell
      accent={accent}
      icon={GitMerge}
      subtitle={
        multi ? (
          <>
            {pending.length} releases live in {upstreamName.toLowerCase()} ·
            choose which to deploy
          </>
        ) : (
          <>
            {active.title ? `${active.title} · ` : ''}live in{' '}
            {upstreamName.toLowerCase()}
            {active.published_at
              ? ` since ${formatRelativeDate(active.published_at)}`
              : ''}
          </>
        )
      }
      title={
        multi ? (
          `${pending.length} releases waiting to go live`
        ) : (
          <>
            Release <span className="font-mono">{active.tag}</span> is waiting
            to go live
          </>
        )
      }
    >
      <div className="flex flex-col gap-4 px-4 py-4">
        {multi ? (
          <>
            <section>
              <p className="text-tertiary mb-2 text-xs tracking-wider uppercase">
                Select a release to deploy
              </p>
              <ReleaseStack
                accent={accent}
                onSelect={setSelectedTag}
                releases={pending}
                selectedTag={active.tag}
              />
            </section>
            <div className="border-info bg-info text-info flex gap-2 rounded-md border px-3 py-2.5">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span className="text-xs leading-relaxed">
                Deploys release <span className="font-mono">{active.tag}</span>{' '}
                into {stage.env.name.toLowerCase()}.
                {rolledUp.length > 0 ? (
                  <>
                    {' '}
                    {rolledUp.join(', ')} {rolledUp.length > 1 ? 'are' : 'is'}{' '}
                    rolled up — {stage.env.name.toLowerCase()} skips straight to{' '}
                    {active.tag}.
                  </>
                ) : null}
                {stillPending.length > 0 ? (
                  <> {stillPending.join(', ')} stays pending above it.</>
                ) : null}{' '}
                No new tag is cut.
              </span>
            </div>
          </>
        ) : (
          <>
            <SingleReleaseChanges
              entry={active}
              orgSlug={orgSlug}
              projectId={projectId}
              stage={stage}
            />
            <section>
              <p className="text-tertiary mb-2 text-xs tracking-wider uppercase">
                Release notes ·{' '}
                <span className="font-mono normal-case">{active.tag}</span>
              </p>
              <div className="border-tertiary rounded-md border px-3.5 py-3">
                <ReleaseNotesMarkdown notes={active.notes_markdown} />
              </div>
            </section>
          </>
        )}

        <div className="border-tertiary flex items-center justify-end gap-2 border-t pt-4">
          <Button
            disabled={!canSubmit}
            onClick={() =>
              actions.deploy({
                action: 'deploy',
                envName: stage.env.name,
                envSlug: stage.env.slug,
                refLabel: active.tag,
                sha: active.sha,
              })
            }
            type="button"
          >
            {actions.deployPending ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Rocket className="mr-1 size-4" />
            )}
            {`Deploy ${active.tag} to ${stage.env.name.toLowerCase()}`}
          </Button>
        </div>
      </div>
    </StageCardShell>
  )
}

/**
 * Radio + accordion stack of the pending releases. Clicking a row selects
 * it for deploy and toggles its release notes; only one row is open at a
 * time.
 */
function ReleaseStack({
  accent,
  onSelect,
  releases,
  selectedTag,
}: {
  accent: ChipColors | null
  onSelect: (tag: string) => void
  releases: ReleaseHistoryEntry[]
  selectedTag: string
}) {
  const [openTag, setOpenTag] = useState<null | string>(null)
  return (
    <div className="border-tertiary rounded-md border">
      {/* fallow-ignore-next-line complexity */}
      {releases.map((rel) => {
        const selected = rel.tag === selectedTag
        const isOpen = rel.tag === openTag
        return (
          <div
            className="border-tertiary border-b last:border-b-0"
            key={rel.tag}
          >
            <button
              className={cn(
                'flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left transition-colors',
                !selected && 'hover:bg-secondary',
              )}
              onClick={() => {
                onSelect(rel.tag)
                setOpenTag((o) => (o === rel.tag ? null : rel.tag))
              }}
              style={
                selected && accent ? { backgroundColor: accent.bg } : undefined
              }
              type="button"
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border',
                  !accent && selected && 'border-action bg-action text-white',
                  !selected && 'border-secondary',
                )}
                style={
                  selected && accent
                    ? {
                        backgroundColor: accent.fg,
                        borderColor: accent.fg,
                        color: '#fff',
                      }
                    : undefined
                }
              >
                {selected ? <Check size={10} strokeWidth={3} /> : null}
              </span>
              <span className="shrink-0 font-mono text-sm font-semibold">
                {rel.tag}
              </span>
              <CiStatusDot size={13} status={rel.ci_status} />
              <span className="text-secondary min-w-0 flex-1 truncate text-xs">
                {rel.title ?? ''}
              </span>
              {rel.published_at ? (
                <span className="text-tertiary shrink-0 text-xs whitespace-nowrap">
                  {formatRelativeDate(rel.published_at)}
                </span>
              ) : null}
              {isOpen ? (
                <ChevronUp className="text-tertiary size-3.5 shrink-0" />
              ) : (
                <ChevronDown className="text-tertiary size-3.5 shrink-0" />
              )}
            </button>
            {isOpen ? (
              <div className="border-tertiary border-t px-3.5 py-3 pl-10">
                <ReleaseNotesMarkdown notes={rel.notes_markdown} />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

/** Diff summary + commit list for the single-pending-release case. */
function SingleReleaseChanges({
  entry,
  orgSlug,
  projectId,
  stage,
}: {
  entry: ReleaseHistoryEntry
  orgSlug: string
  projectId: string
  stage: PipelineStage
}) {
  const base = stage.current?.release?.tag ?? null
  const { data: compare } = useQuery({
    enabled: !!base && base !== entry.tag,
    queryFn: ({ signal }) =>
      compareDeploymentRefs(
        orgSlug,
        projectId,
        base ?? '',
        entry.sha,
        undefined,
        signal,
      ),
    queryKey: ['compare', orgSlug, projectId, base, entry.sha],
  })
  if (!compare) return null
  return (
    <div className="flex flex-col gap-3">
      <div className="text-tertiary flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs">
        <span>{compare.commits.length} commits</span>
        <span>{compare.files_changed} files</span>
        <span className="text-success">+{compare.additions}</span>
        <span className="text-danger">−{compare.deletions}</span>
        <span className="ml-auto">
          {base} … {entry.tag}
        </span>
      </div>
      {compare.commits.length > 0 ? (
        <section>
          <p className="text-tertiary mb-2 text-xs tracking-wider uppercase">
            Changes in{' '}
            <span className="font-mono normal-case">{entry.tag}</span>
          </p>
          <ul className="border-tertiary max-h-60 overflow-y-auto rounded-md border">
            {[...compare.commits].reverse().map((c) => (
              <li
                className="border-tertiary flex min-w-0 items-center gap-3 border-b px-3 py-1.5 last:border-b-0"
                key={c.sha}
              >
                <span className="shrink-0 font-mono text-xs">
                  {c.short_sha}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {c.message.split('\n')[0]}
                </span>
                <CiStatusDot status={c.ci_status} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
