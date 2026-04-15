import * as simpleIcons from '@icons-pack/react-simple-icons'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { iconRegistry } from '@/lib/icon-registry'
import type { IconComponent, IconEntry } from '@/lib/icon-registry'

const siLookup = simpleIcons as Record<string, unknown>

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

export const SI_ICONS: IconEntry[] = Object.keys(siLookup)
  .filter((k) => k.startsWith('Si') && !k.endsWith('Hex') && k !== 'default')
  .map((k) => {
    const raw = k.slice(2)
    const kebab = raw.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    return { label: raw, value: `si-${kebab}` }
  })
  .sort((a, b) => a.label.localeCompare(b.label))

function resolve(value: string): IconComponent | null {
  if (!value.startsWith('si-')) return null
  const name = 'Si' + toPascalCase(value.slice(3))
  return (siLookup[name] as IconComponent) || null
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
  id: 'simple-icons',
  label: 'Simple Icons',
  description: 'Brand icons for popular services, frameworks, and tools',
  valueFormat: 'si-{name}',
  icons: SI_ICONS,
  resolve,
  resolveUrl,
})
