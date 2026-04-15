import { describe, it, expect } from 'vitest'
import { iconRegistry } from '@/lib/icon-registry'
import '@/lib/icon-sets/lucide'

describe('Lucide icon set', () => {
  it('registers under id "lucide" with label "Lucide"', () => {
    const set = iconRegistry.getSets().find((s) => s.id === 'lucide')
    expect(set).toBeDefined()
    expect(set?.label).toBe('Lucide')
  })

  it('has icons sorted alphabetically by label', () => {
    const set = iconRegistry.getSets().find((s) => s.id === 'lucide')!
    const labels = set.icons.map((i) => i.label)
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)))
  })

  it('resolves lucide-house', () => {
    expect(iconRegistry.resolve('lucide-house')).not.toBeNull()
  })

  it('resolves lucide-settings', () => {
    expect(iconRegistry.resolve('lucide-settings')).not.toBeNull()
  })

  it('icon values use lucide- prefix', () => {
    const set = iconRegistry.getSets().find((s) => s.id === 'lucide')!
    expect(set.icons.every((i) => i.value.startsWith('lucide-'))).toBe(true)
  })

  it('returns null for unrecognised value', () => {
    expect(iconRegistry.resolve('totally-unknown-xyz-999')).toBeNull()
  })
})
