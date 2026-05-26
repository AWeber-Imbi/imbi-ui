import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { getGraphSchema } from '@/api/endpoints'
import type { GraphSchema } from '@/types/graph-query'

interface SchemaPanelProps {
  onInsertSnippet: (snippet: string) => void
}

export function SchemaPanel({ onInsertSnippet }: SchemaPanelProps) {
  const { data, error, isLoading } = useQuery<GraphSchema>({
    queryFn: ({ signal }) => getGraphSchema(signal),
    queryKey: ['admin', 'graph', 'schema'],
    staleTime: 60_000,
  })

  const totalNodes = useMemo(
    () => (data?.node_labels ?? []).reduce((sum, l) => sum + l.count, 0),
    [data?.node_labels],
  )
  const totalEdges = useMemo(
    () => (data?.edge_types ?? []).reduce((sum, t) => sum + t.count, 0),
    [data?.edge_types],
  )

  if (isLoading) {
    return <div className="text-tertiary p-4 text-xs">Loading schema…</div>
  }
  if (error) {
    return (
      <div className="text-tertiary p-4 text-xs">Failed to load schema.</div>
    )
  }
  if (!data) return null

  const labels = [...data.node_labels].sort((a, b) => b.count - a.count)
  const types = [...data.edge_types].sort((a, b) => b.count - a.count)

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <SectionHeader count={totalNodes} title="Nodes" />
      <div className="flex flex-wrap gap-1.5 px-3 pb-4">
        {labels.length === 0 ? (
          <span className="text-tertiary text-xs">No node labels.</span>
        ) : (
          labels.map((l) => (
            <SchemaChip
              count={l.count}
              key={l.label}
              label={l.label}
              onClick={() =>
                onInsertSnippet(`MATCH (n:${l.label}) RETURN n LIMIT 25`)
              }
            />
          ))
        )}
      </div>

      <SectionHeader count={totalEdges} title="Relationships" />
      <div className="flex flex-wrap gap-1.5 px-3 pb-4">
        {types.length === 0 ? (
          <span className="text-tertiary text-xs">No relationship types.</span>
        ) : (
          types.map((t) => (
            <SchemaChip
              count={t.count}
              key={t.type}
              label={t.type}
              onClick={() =>
                onInsertSnippet(`MATCH ()-[r:${t.type}]->() RETURN r LIMIT 25`)
              }
            />
          ))
        )}
      </div>

      <SectionHeader count={data.property_keys.length} title="Property keys" />
      <div className="flex flex-wrap gap-1.5 px-3 pb-4">
        {data.property_keys.length === 0 ? (
          <span className="text-tertiary text-xs">No property keys.</span>
        ) : (
          data.property_keys.map((k) => (
            <span
              className="border-tertiary text-secondary inline-flex items-center rounded-md border bg-transparent px-2 py-0.5 font-mono text-[11px]"
              key={k}
              style={{ borderWidth: '0.5px' }}
            >
              {k}
            </span>
          ))
        )}
      </div>
    </div>
  )
}

function chipColors(label: string): {
  backgroundColor: string
  borderColor: string
  color: string
} {
  const hue = hashHue(label)
  return {
    backgroundColor: `hsl(${hue} 35% 92% / 0.8)`,
    borderColor: `hsl(${hue} 30% 75%)`,
    color: `hsl(${hue} 45% 25%)`,
  }
}

function chipColorsDark(label: string): {
  backgroundColor: string
  borderColor: string
  color: string
} {
  const hue = hashHue(label)
  return {
    backgroundColor: `hsl(${hue} 25% 18%)`,
    borderColor: `hsl(${hue} 25% 30%)`,
    color: `hsl(${hue} 55% 80%)`,
  }
}

/**
 * Deterministic hash-to-hue mapping for label colours. Kept muted so it sits
 * inside the design system rather than competing with the amber accent.
 */
function hashHue(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0
  }
  return h % 360
}

function lightAndDarkChipStyle(label: string): React.CSSProperties {
  // CSS Tailwind dark mode toggles via the .dark class on <html>, so use a
  // media query / matchMedia at runtime would over-complicate this; instead
  // pick the palette based on a simple check at render time.
  if (
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
  ) {
    return chipColorsDark(label)
  }
  return chipColors(label)
}

function SchemaChip({
  count,
  label,
  onClick,
}: {
  count: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="hover:border-amber-border inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] transition-colors"
      onClick={onClick}
      style={{
        borderWidth: '0.5px',
        ...lightAndDarkChipStyle(label),
      }}
      title={`Insert MATCH for ${label}`}
      type="button"
    >
      <span className="font-medium">{label}</span>
      <span className="text-[10px] opacity-70">{count.toLocaleString()}</span>
    </button>
  )
}

function SectionHeader({ count, title }: { count: number; title: string }) {
  return (
    <div className="text-tertiary flex items-center justify-between px-3 pt-3 pb-2 text-[10px] tracking-wider uppercase">
      <span>{title}</span>
      <span className="text-secondary">({count.toLocaleString()})</span>
    </div>
  )
}
