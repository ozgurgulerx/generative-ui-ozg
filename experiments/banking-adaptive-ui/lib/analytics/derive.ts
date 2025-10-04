/**
 * Derive user traits from behavioral events
 */

import type {
  Event,
  UserTraits,
  ActionId,
  ActionEvent,
  ViewEvent,
  SearchEvent,
  JourneyEvent,
} from './events'
import { getPreferences } from './storage'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Derive traits from event history
 */
export function deriveTraits(events: Event[]): UserTraits {
  const now = Date.now()
  const prefs = getPreferences()

  // Filter recent events (last 30 days for most, 7 days for searches)
  const recentEvents = events.filter((e) => now - e.timestamp < 30 * ONE_DAY_MS)
  const recentSearches = events.filter(
    (e) => e.type === 'search' && now - e.timestamp < SEVEN_DAYS_MS
  ) as SearchEvent[]

  // Action events
  const actionEvents = recentEvents.filter((e) => e.type === 'action') as ActionEvent[]
  const fxCount = actionEvents.filter((e) => e.name === 'FX').length
  const transferCount = actionEvents.filter((e) => e.name === 'TRANSFER').length

  // View events
  const viewEvents = recentEvents.filter((e) => e.type === 'view') as ViewEvent[]

  // Journey events
  const journeyEvents = recentEvents.filter((e) => e.type === 'journey') as JourneyEvent[]
  const billPayStarted = journeyEvents.find((e) => e.id === 'BILLPAY_STARTED')
  const billPayCompleted = journeyEvents.find((e) => e.id === 'BILLPAY_COMPLETED')
  const incompleteBillPay =
    billPayStarted && !billPayCompleted && now - billPayStarted.timestamp < ONE_DAY_MS
      ? { started: billPayStarted.timestamp }
      : null

  // Balance seen
  const balanceSeenEvents = recentEvents.filter((e) => e.type === 'balance_seen')
  const lastBalanceSeen =
    balanceSeenEvents.length > 0
      ? balanceSeenEvents[balanceSeenEvents.length - 1].timestamp
      : null

  // Compute affinities (normalized 0..1)
  const totalActions = actionEvents.length || 1
  const fxAffinity = Math.min(fxCount / totalActions, 1)
  const transferAffinity = Math.min(transferCount / totalActions, 1)

  // Explorer score: variety of views
  const uniquePaths = new Set(viewEvents.map((e) => e.path))
  const explorerScore = Math.min(uniquePaths.size / 10, 1) // normalize by 10 unique paths

  // Last 5 visited paths (unique, recent first)
  const lastPaths = [...new Set(viewEvents.slice(-10).map((e) => e.path))]
    .reverse()
    .slice(0, 5)

  // Top 3 actions (recency-weighted)
  const topActions = rankActions(actionEvents)

  // Search terms
  const searchTermsMap = new Map<string, { count: number; lastSeen: number }>()
  recentSearches.forEach((e) => {
    const existing = searchTermsMap.get(e.term) || { count: 0, lastSeen: 0 }
    searchTermsMap.set(e.term, {
      count: existing.count + 1,
      lastSeen: Math.max(existing.lastSeen, e.timestamp),
    })
  })
  const searchTerms = Array.from(searchTermsMap.entries())
    .map(([term, data]) => ({ term, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Locale from preferences or navigator
  let locale: 'en' | 'tr' = prefs.locale || 'en'
  if (!prefs.locale && typeof navigator !== 'undefined') {
    const nav = navigator.language.toLowerCase()
    if (nav.startsWith('tr')) locale = 'tr'
  }

  // Merge with explicit preferences
  const prefersDense = prefs.prefersDense ?? false
  const darkMode = prefs.darkMode ?? false

  return {
    fxAffinity,
    transferAffinity,
    explorerScore,
    lastPaths,
    topActions,
    lastBalanceSeen,
    searchTerms,
    incompleteBillPay,
    locale,
    prefersDense,
    darkMode,
    favoriteQuickActions: [], // could be set explicitly
    suppressions: {}, // managed separately
  }
}

/**
 * Rank actions by recency-weighted frequency
 * Recent actions get higher weight
 */
function rankActions(actionEvents: ActionEvent[]): ActionId[] {
  const now = Date.now()
  const weights = new Map<ActionId, number>()

  actionEvents.forEach((e) => {
    const ageMs = now - e.timestamp
    const ageDays = ageMs / ONE_DAY_MS
    // Exponential decay: more recent = higher weight
    const weight = Math.exp(-ageDays / 7) // half-life ~5 days
    const existing = weights.get(e.name) || 0
    weights.set(e.name, existing + weight)
  })

  return Array.from(weights.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([action]) => action)
    .slice(0, 3)
}
