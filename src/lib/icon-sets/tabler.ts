import * as TablerIcons from '@tabler/icons-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { iconRegistry } from '@/lib/icon-registry'
import type { IconComponent, IconEntry } from '@/lib/icon-registry'

const tablerLookup = TablerIcons as Record<string, unknown>

// Tabler exports React.forwardRef components ($$typeof === Symbol.for('react.forward_ref'))
const REACT_FORWARD_REF = Symbol.for('react.forward_ref')

function isTablerIcon(v: unknown): v is IconComponent {
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

// All Tabler icon exports start with "Icon"
export const TABLER_ICONS: IconEntry[] = Object.keys(tablerLookup)
  .filter((k) => isTablerIcon(tablerLookup[k]) && k.startsWith('Icon'))
  .map((k) => {
    const stripped = k.slice(4) // "IconHome" → "Home", "IconHomeFilled" → "HomeFilled"
    const kebab = stripped.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    return { label: stripped, value: `tabler-${kebab}` }
  })
  .sort((a, b) => a.label.localeCompare(b.label))

function resolve(value: string): IconComponent | null {
  if (!value.startsWith('tabler-')) return null
  const name = 'Icon' + toPascalCase(value.slice(7))
  const Component = tablerLookup[name]
  return isTablerIcon(Component) ? Component : null
}

function resolveUrl(value: string, color?: string): string | null {
  const Component = resolve(value)
  if (!Component) return null
  try {
    const markup = renderToStaticMarkup(
      createElement(Component, {
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
  id: 'tabler',
  label: 'Tabler',
  description: 'Clean open source SVG icons (outline and filled variants)',
  valueFormat: 'tabler-{name}',
  icons: TABLER_ICONS,
  resolve,
  resolveUrl,
})
