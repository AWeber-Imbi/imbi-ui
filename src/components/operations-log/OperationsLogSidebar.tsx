import { Box, Clock } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { deriveChipColors } from '@/lib/chip-colors'
import { cn } from '@/lib/utils'
import { Gravatar } from '@/components/ui/gravatar'
import { ENTRY_TYPE_ICONS } from '@/lib/ops-log-icons'
import { sortEnvironments } from '@/lib/utils'
import {
  OPERATIONS_LOG_ENTRY_TYPES,
  type Environment,
  type OperationsLogEntryType,
} from '@/types'
import type { TimeRange } from './opsLogHelpers'
import { cleanName } from './opsLogHelpers'

export interface SidebarCounts {
  type: Partial<Record<OperationsLogEntryType, number>>
  env: Record<string, number>
  project: Record<string, number>
  person: Record<string, number>
}

interface SidebarProps {
  counts: SidebarCounts
  range: TimeRange
  onRange: (r: TimeRange) => void
  entryType?: OperationsLogEntryType
  onEntryType: (t: OperationsLogEntryType | undefined) => void
  environmentSlug: string | undefined
  onEnvironment: (slug: string | undefined) => void
  environments: Environment[]
  projectSlug: string | undefined
  onProject: (slug: string | undefined) => void
  projectNames: Map<string, string>
  performer: string | undefined
  onPerformer: (email: string | undefined) => void
  performerDisplayNames: Map<string, string>
}

const RANGES: { key: TimeRange; label: string }[] = [
  { key: '24h', label: 'Last 24 hours' },
  { key: '3d', label: 'Last 3 days' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
]

function SideButton({
  active,
  onClick,
  icon,
  children,
  count,
  title,
}: {
  active?: boolean
  onClick: () => void
  icon?: React.ReactNode
  children: React.ReactNode
  count?: number
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        'hover:bg-secondary',
        active ? 'bg-secondary font-medium text-primary' : 'text-secondary',
      )}
    >
      {icon ? (
        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-tertiary">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count != null ? (
        <span className="text-xs text-tertiary">{count}</span>
      ) : null}
    </button>
  )
}

function Section({
  title,
  rightMeta,
  children,
}: {
  title: string
  rightMeta?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="mx-2 mb-1 flex items-center justify-between text-overline uppercase tracking-[0.06em] text-tertiary">
        <span>{title}</span>
        {rightMeta}
      </h3>
      {children}
    </div>
  )
}

export function OperationsLogSidebar({
  counts,
  range,
  onRange,
  entryType,
  onEntryType,
  environmentSlug,
  onEnvironment,
  environments,
  projectSlug,
  onProject,
  projectNames,
  performer,
  onPerformer,
  performerDisplayNames,
}: SidebarProps) {
  const { isDarkMode } = useTheme()
  const topProjects = Object.entries(counts.project)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const topPeople = Object.entries(counts.person)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const orderedEnvironments = sortEnvironments(environments).filter(
    (env) => (counts.env[env.slug] ?? 0) > 0 || environmentSlug === env.slug,
  )

  return (
    <aside className="sticky top-20 flex flex-col gap-5 self-start text-sm">
      <Section title="Time range">
        {RANGES.map((r) => (
          <SideButton
            key={r.key}
            active={range === r.key}
            onClick={() => onRange(r.key)}
            icon={<Clock className="h-3.5 w-3.5" />}
          >
            {r.label}
          </SideButton>
        ))}
      </Section>

      <Section title="Event type">
        {OPERATIONS_LOG_ENTRY_TYPES.filter(
          (t) => (counts.type[t] ?? 0) > 0,
        ).map((t) => {
          const Icon = ENTRY_TYPE_ICONS[t]
          return (
            <SideButton
              key={t}
              active={entryType === t}
              onClick={() => onEntryType(entryType === t ? undefined : t)}
              icon={<Icon className="h-3.5 w-3.5" />}
              count={counts.type[t]}
            >
              {t}
            </SideButton>
          )
        })}
      </Section>

      {orderedEnvironments.length > 0 && (
        <Section title="Environment">
          {orderedEnvironments.map((env) => {
            const colors = env.label_color
              ? deriveChipColors(env.label_color, isDarkMode)
              : null
            return (
              <SideButton
                key={env.slug}
                active={environmentSlug === env.slug}
                onClick={() =>
                  onEnvironment(
                    environmentSlug === env.slug ? undefined : env.slug,
                  )
                }
                icon={
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: colors?.border ?? 'currentColor',
                    }}
                    aria-hidden
                  />
                }
                count={counts.env[env.slug] ?? 0}
              >
                {env.name}
              </SideButton>
            )
          })}
        </Section>
      )}

      {topProjects.length > 0 && (
        <Section
          title="Projects"
          rightMeta={
            <span className="text-xs font-normal tracking-normal text-tertiary">
              {Object.keys(counts.project).length}
            </span>
          }
        >
          {topProjects.map(([slug, c]) => (
            <SideButton
              key={slug}
              active={projectSlug === slug}
              onClick={() => onProject(projectSlug === slug ? undefined : slug)}
              icon={<Box className="h-3.5 w-3.5" />}
              count={c}
              title={projectNames.get(slug) ?? slug}
            >
              {projectNames.get(slug) ?? slug}
            </SideButton>
          ))}
        </Section>
      )}

      {topPeople.length > 0 && (
        <Section title="People">
          {topPeople.map(([email, c]) => (
            <SideButton
              key={email}
              active={performer === email}
              onClick={() =>
                onPerformer(performer === email ? undefined : email)
              }
              icon={
                <Gravatar
                  email={email}
                  size={18}
                  className="h-4 w-4 rounded-full"
                />
              }
              count={c}
            >
              {performerDisplayNames.get(email) ?? cleanName(email)}
            </SideButton>
          ))}
        </Section>
      )}
    </aside>
  )
}
