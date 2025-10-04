/**
 * Event tracking utilities
 */

import type {
  Event,
  ActionId,
  JourneyId,
  ViewEvent,
  TimeEvent,
  ClickEvent,
  ActionEvent,
  SearchEvent,
  JourneyEvent,
  BalanceSeenEvent,
  ScrollEvent,
} from './events'
import { appendEvent, getConsent } from './storage'

let currentPath: string | null = null
let pageStartTime: number | null = null

/**
 * Track a raw event
 */
export async function track(event: Event): Promise<void> {
  if (!getConsent()) return
  await appendEvent(event)
}

/**
 * Track page view and start dwell timer
 */
export function trackView(path: string): void {
  currentPath = path
  pageStartTime = Date.now()

  const event: ViewEvent = {
    type: 'view',
    path,
    timestamp: Date.now(),
  }
  track(event)
}

/**
 * Track dwell time when leaving page
 */
export function trackDwell(): void {
  if (!currentPath || !pageStartTime) return

  const ms = Date.now() - pageStartTime
  const event: TimeEvent = {
    type: 'time',
    path: currentPath,
    ms,
    timestamp: Date.now(),
  }
  track(event)

  currentPath = null
  pageStartTime = null
}

/**
 * Track scroll depth
 */
export function trackScroll(path: string, pct: number): void {
  const event: ScrollEvent = {
    type: 'scroll',
    path,
    pct,
    timestamp: Date.now(),
  }
  track(event)
}

/**
 * Track click
 */
export function trackClick(id: string, path?: string): void {
  const event: ClickEvent = {
    type: 'click',
    id,
    path,
    timestamp: Date.now(),
  }
  track(event)
}

/**
 * Track action (TRANSFER, PAY_BILL, FX, OPEN_SAVINGS)
 */
export function trackAction(name: ActionId, path?: string): void {
  const event: ActionEvent = {
    type: 'action',
    name,
    path,
    timestamp: Date.now(),
  }
  track(event)
}

/**
 * Track search
 */
export function trackSearch(term: string): void {
  const event: SearchEvent = {
    type: 'search',
    term,
    timestamp: Date.now(),
  }
  track(event)
}

/**
 * Track journey event
 */
export function trackJourney(id: JourneyId): void {
  const event: JourneyEvent = {
    type: 'journey',
    id,
    timestamp: Date.now(),
  }
  track(event)
}

/**
 * Track balance seen
 */
export function trackBalanceSeen(): void {
  const event: BalanceSeenEvent = {
    type: 'balance_seen',
    timestamp: Date.now(),
  }
  track(event)
}

/**
 * Wire up click tracking for elements with data-action or data-analytic-id
 */
export function wireClickTracking(): void {
  if (typeof window === 'undefined') return

  // Delegated event listener for clicks
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target) return

    const analyticId = target.getAttribute('data-analytic-id')
    if (analyticId) {
      trackClick(analyticId, currentPath || undefined)
    }

    const actionAttr = target.getAttribute('data-action')
    if (actionAttr) {
      trackAction(actionAttr as ActionId, currentPath || undefined)
    }
  })
}

/**
 * Auto-track page visibility changes and dwell
 */
export function autoTrackPage(path: string): (() => void) | undefined {
  trackView(path)

  if (typeof window === 'undefined') return

  // Track dwell on visibility change or page unload
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      trackDwell()
    }
  }

  const handleBeforeUnload = () => {
    trackDwell()
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('beforeunload', handleBeforeUnload)

  // Cleanup
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
}

/**
 * Track scroll depth (throttled)
 */
let lastScrollPct = 0
export function autoTrackScroll(path: string): (() => void) | undefined {
  if (typeof window === 'undefined') return

  const handleScroll = () => {
    const scrollPct = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    )
    const rounded = Math.floor(scrollPct / 10) * 10 // round to nearest 10%

    if (rounded > lastScrollPct) {
      lastScrollPct = rounded
      trackScroll(path, rounded)
    }
  }

  // Throttle scroll events
  let ticking = false
  const throttledScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll()
        ticking = false
      })
      ticking = true
    }
  }

  window.addEventListener('scroll', throttledScroll, { passive: true })

  // Cleanup
  return () => {
    window.removeEventListener('scroll', throttledScroll)
  }
}
