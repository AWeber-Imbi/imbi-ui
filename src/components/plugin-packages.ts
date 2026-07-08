// Small derivations over the v3 `PluginPackage` shape that reproduce the
// flat fields the deleted v2 `InstalledPlugin` exposed. In v3 these live on
// the plugin's `identity` capability (its `hints` map), so the UI derives
// them from `capabilities` instead of reading top-level flags.
import type { PluginPackage } from '@/types'

// A plugin the actor can connect a personal account to (drives the
// settings connections table + dashboard "unconnected" tiles).
export function pluginIsIdentity(p: PluginPackage): boolean {
  return identityCapability(p) !== undefined
}

// v2 `widget_text` → identity capability's `hints.widget_text`.
export function pluginWidgetText(p: PluginPackage): null | string {
  const text = identityCapability(p)?.hints.widget_text
  return typeof text === 'string' ? text : null
}

function identityCapability(p: PluginPackage) {
  return p.capabilities.find((c) => c.kind === 'identity')
}
