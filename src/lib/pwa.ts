import { toast } from 'sonner'

// Re-check for a freshly deployed service worker on the same cadence the
// old /version.json poll used, so a long-open tab still notices new builds.
const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000

let notified = false
// Default reload for environments without an active SW (older browsers, the
// useVersionCheck fallback). Replaced with the Workbox updater once the SW
// registers — a plain reload would NOT activate a `waiting` SW under the
// 'prompt' strategy, so the new precache would never take effect.
let applyUpdate: () => void = () => window.location.reload()

/**
 * Show the single "new version" prompt. Guarded so the SW signal and the
 * version.json fallback can never stack two toasts on top of each other.
 */
export function notifyNewVersion(): void {
  if (notified) return
  notified = true
  toast('A new version of Imbi is available', {
    action: {
      label: 'Reload',
      onClick: () => applyUpdate(),
    },
    duration: Infinity,
  })
}

export async function registerPwa(): Promise<void> {
  if (!serviceWorkerSupported()) return
  const { registerSW } = await import('virtual:pwa-register')
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      notifyNewVersion()
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      const check = () => {
        if (!document.hidden) void registration.update()
      }
      window.setInterval(check, UPDATE_CHECK_INTERVAL_MS)
      document.addEventListener('visibilitychange', check)
    },
  })
  // updateSW(true) messages the waiting SW to skipWaiting, then reloads once
  // it takes control — the only reliable way to apply a prompt-mode update.
  applyUpdate = () => void updateSW(true)
}

/** True when the service worker (not the version.json poll) owns updates. */
export function serviceWorkerSupported(): boolean {
  return !import.meta.env.DEV && 'serviceWorker' in navigator
}
