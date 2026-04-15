import * as PhosphorIcons from '@phosphor-icons/react'
import { type ComponentType, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { iconRegistry } from '@/lib/icon-registry'
import type { IconComponent, IconEntry } from '@/lib/icon-registry'

const phosphorLookup = PhosphorIcons as Record<string, unknown>

// Phosphor exports React.forwardRef components ($$typeof === Symbol.for('react.forward_ref'))
const REACT_FORWARD_REF = Symbol.for('react.forward_ref')

function isPhosphorIcon(v: unknown): v is IconComponent {
  return (
    v !== null &&
    typeof v === 'object' &&
    (v as Record<string, unknown>)['$$typeof'] === REACT_FORWARD_REF
  )
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

// Deduplicate by component identity (some icons have both Base and BaseIcon export
// pointing to the same component; 18 icons exist only under the *Icon name)
export const PHOSPHOR_ICONS: IconEntry[] = Object.keys(phosphorLookup)
  .filter((k) => isPhosphorIcon(phosphorLookup[k]) && /^[A-Z]/.test(k))
  .reduce<{ seen: Set<unknown>; entries: IconEntry[] }>(
    (acc, k) => {
      const comp = phosphorLookup[k]
      if (acc.seen.has(comp)) return acc
      acc.seen.add(comp)
      acc.entries.push({
        label: k,
        value: `phosphor-${k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`,
      })
      return acc
    },
    { seen: new Set(), entries: [] },
  )
  .entries.sort((a, b) => a.label.localeCompare(b.label))

function resolve(value: string): IconComponent | null {
  if (!value.startsWith('phosphor-')) return null
  const name = toPascalCase(value.slice(9))
  const Component = phosphorLookup[name]
  return isPhosphorIcon(Component) ? Component : null
}

function resolveUrl(value: string, color?: string): string | null {
  const Component = resolve(value)
  if (!Component) return null
  try {
    const markup = renderToStaticMarkup(
      createElement(Component as ComponentType<Record<string, unknown>>, {
        weight: 'regular',
        width: 128,
        height: 128,
        ...(color ? { color } : {}),
      }),
    )
    const encoded = btoa(unescape(encodeURIComponent(markup)))
    return `data:image/svg+xml;base64,${encoded}`
  } catch {
    return null
  }
}

iconRegistry.register({
  id: 'phosphor',
  label: 'Phosphor',
  description:
    'Flexible icon family for interfaces and diagrams (regular weight)',
  valueFormat: 'phosphor-{name}',
  icons: PHOSPHOR_ICONS,
  resolve,
  resolveUrl,
})
