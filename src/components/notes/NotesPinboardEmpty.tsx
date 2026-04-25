import {
  AlertTriangle,
  BookOpen,
  FileText,
  Map,
  Plus,
  ShieldCheck,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteTagChip } from './NoteTagChip'

interface Props {
  onCreate: (templateSlug?: string) => void
}

interface Template {
  slug: string
  label: string
  hint: string
  icon: LucideIcon
  tag: { name: string; slug: string }
}

const TEMPLATES: Template[] = [
  {
    slug: 'adr',
    label: 'ADR',
    hint: 'Context · Decision · Trade-offs',
    icon: FileText,
    tag: { name: 'ADR', slug: 'adr' },
  },
  {
    slug: 'security',
    label: 'Security review',
    hint: 'Findings · Follow-ups',
    icon: ShieldCheck,
    tag: { name: 'Security', slug: 'security' },
  },
  {
    slug: 'incident',
    label: 'Incident',
    hint: 'Timeline · Root cause · Actions',
    icon: AlertTriangle,
    tag: { name: 'Incident', slug: 'incident' },
  },
  {
    slug: 'roadmap',
    label: 'Roadmap',
    hint: 'Proposal · Milestones',
    icon: Map,
    tag: { name: 'Roadmap', slug: 'roadmap' },
  },
  {
    slug: 'pattern',
    label: 'Pattern',
    hint: 'When to reach for this',
    icon: Sparkles,
    tag: { name: 'Pattern', slug: 'pattern' },
  },
  {
    slug: 'runbook',
    label: 'Runbook',
    hint: 'Steps · Verification',
    icon: BookOpen,
    tag: { name: 'Runbook', slug: 'runbook' },
  },
]

export function NotesPinboardEmpty({ onCreate }: Props) {
  return (
    <div className="grid grid-cols-[220px_1fr] gap-5">
      {/* Dimmed rail preserved for parity */}
      <aside className="sticky top-5 self-start opacity-50" aria-hidden>
        <div className="mb-3 h-8 rounded-md border border-tertiary bg-primary" />
        <div>
          <div className="mb-1.5 text-overline uppercase text-tertiary">
            Tags
          </div>
          <div className="flex flex-col gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm bg-secondary" />
                <span
                  className="h-2 rounded bg-secondary"
                  style={{ width: 60 + i * 14 }}
                />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="text-xs text-tertiary">0 notes on this project</div>
          <div className="ml-auto">
            <Button size="sm" className="gap-1.5" onClick={() => onCreate()}>
              <Plus className="h-3 w-3" />
              New note
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-lg border border-tertiary bg-primary px-10 py-14 text-center">
          <div className="relative flex h-[108px] w-[108px] items-center justify-center">
            <div className="absolute inset-[18px] -rotate-[7deg] rounded-[10px] border border-tertiary bg-secondary" />
            <div className="absolute inset-[14px] rotate-[4deg] rounded-[10px] border border-tertiary bg-primary shadow-sm" />
            <div className="relative inline-flex h-[68px] w-[68px] items-center justify-center rounded-xl border border-warning bg-warning text-warning">
              <StickyNote className="h-7 w-7" />
            </div>
          </div>

          <h2 className="m-0 text-h2 font-medium tracking-[-0.015em]">
            No notes yet for this project
          </h2>
          <p className="m-0 max-w-[520px] text-sm leading-[1.6] text-secondary">
            Notes capture decisions, reviews, and patterns that outlive any one
            deploy. They render as Markdown, carry tags you can filter from the
            rail, and can be pinned so they stay at the top of this tab.
          </p>

          <div className="mt-1 flex gap-2">
            <Button className="gap-1.5" onClick={() => onCreate()}>
              <Plus className="h-3 w-3" />
              New note
            </Button>
            <Button variant="outline" className="gap-1.5">
              <BookOpen className="h-3 w-3" />
              How notes work
            </Button>
          </div>

          <div className="mt-5 grid w-full max-w-[720px] grid-cols-3 gap-2.5 text-left">
            {TEMPLATES.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => onCreate(t.slug)}
                  className="flex cursor-pointer flex-col gap-1.5 rounded-lg border border-tertiary bg-primary p-3.5 text-left hover:border-secondary hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-md bg-secondary text-secondary">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[13.5px] font-medium text-primary">
                      {t.label}
                    </span>
                    <span className="ml-auto">
                      <NoteTagChip tag={t.tag} size="sm" />
                    </span>
                  </div>
                  <div className="text-xs leading-[1.5] text-tertiary">
                    {t.hint}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
