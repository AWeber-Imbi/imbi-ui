import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

import { notifyNewVersion, serviceWorkerSupported } from '@/lib/pwa'

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000
const CURRENT_VERSION = __APP_VERSION__

export function useVersionCheck(intervalMs = DEFAULT_INTERVAL_MS) {
  const notifiedRef = useRef(false)
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (import.meta.env.DEV) return
    // When a service worker is active it is the single source of update
    // truth (see src/lib/pwa.ts); skip the /version.json poll to avoid a
    // second prompt. This poll remains the fallback for browsers without SW.
    if (serviceWorkerSupported()) return

    const check = async () => {
      if (!shouldCheck(notifiedRef, inFlightRef)) return
      inFlightRef.current = true
      try {
        await runCheck(notifiedRef)
      } finally {
        inFlightRef.current = false
      }
    }

    const id = window.setInterval(check, intervalMs)
    const onVisibility = () => {
      if (!document.hidden) void check()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs])
}

async function fetchRemoteVersion(): Promise<null | string> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' })
    if (!res.ok) return null
    const { version } = (await res.json()) as { version?: string }
    return version ?? null
  } catch {
    return null
  }
}

function isStale(remote: null | string): boolean {
  return remote !== null && remote !== CURRENT_VERSION
}

async function runCheck(notifiedRef: MutableRefObject<boolean>): Promise<void> {
  const remote = await fetchRemoteVersion()
  if (!isStale(remote)) return
  notifiedRef.current = true
  notifyNewVersion()
}

function shouldCheck(
  notifiedRef: MutableRefObject<boolean>,
  inFlightRef: MutableRefObject<boolean>,
): boolean {
  return !notifiedRef.current && !inFlightRef.current && !document.hidden
}
