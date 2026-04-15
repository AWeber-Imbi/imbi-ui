import * as PhosphorIcons from '@phosphor-icons/react'
import { createElement } from 'react'
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

// Use the short-form names only (exclude the *Icon aliases to avoid duplicates)
export const PHOSPHOR_ICONS: IconEntry[] = Object.keys(phosphorLookup)
  .filter(
    (k) =>
      isPhosphorIcon(phosphorLookup[k]) &&
      /^[A-Z]/.test(k) &&
      !k.endsWith('Icon'),
  )
  .map((k) => ({
    label: k,
    value: `phosphor-${k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label))

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
      createElement(Component, {
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
