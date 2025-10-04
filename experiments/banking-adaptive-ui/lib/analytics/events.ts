/**
 * Core event and trait types for the mini-CDP
 */

export type ActionId = 'TRANSFER' | 'PAY_BILL' | 'FX' | 'OPEN_SAVINGS'

export type JourneyId = 'BILLPAY_STARTED' | 'BILLPAY_CANCELLED' | 'BILLPAY_COMPLETED'

export type EventType =
  | 'view'
  | 'time'
  | 'scroll'
  | 'click'
  | 'action'
  | 'search'
  | 'journey'
  | 'balance_seen'

export interface BaseEvent {
  type: EventType
  timestamp: number
}

export interface ViewEvent extends BaseEvent {
  type: 'view'
  path: string
}

export interface TimeEvent extends BaseEvent {
  type: 'time'
  path: string
  ms: number
}

export interface ScrollEvent extends BaseEvent {
  type: 'scroll'
  path: string
  pct: number
}

export interface ClickEvent extends BaseEvent {
  type: 'click'
  id: string
  path?: string
}

export interface ActionEvent extends BaseEvent {
  type: 'action'
  name: ActionId
  path?: string
}

export interface SearchEvent extends BaseEvent {
  type: 'search'
  term: string
}

export interface JourneyEvent extends BaseEvent {
  type: 'journey'
  id: JourneyId
}

export interface BalanceSeenEvent extends BaseEvent {
  type: 'balance_seen'
}

export type Event =
  | ViewEvent
  | TimeEvent
  | ScrollEvent
  | ClickEvent
  | ActionEvent
  | SearchEvent
  | JourneyEvent
  | BalanceSeenEvent

/**
 * Derived user traits from behavioral events
 */
export interface UserTraits {
  // Affinities (0..1)
  fxAffinity: number
  transferAffinity: number
  explorerScore: number

  // Recency/Frequency
  lastPaths: string[] // last 5 visited paths
  topActions: ActionId[] // top 3 actions (recency-weighted)
  lastBalanceSeen: number | null // timestamp

  // Search patterns
  searchTerms: { term: string; count: number; lastSeen: number }[]

  // Journeys
  incompleteBillPay: { started: number } | null

  // Locale
  locale: 'en' | 'tr'

  // Explicit preferences
  prefersDense: boolean
  darkMode: boolean
  favoriteQuickActions: ActionId[]

  // Banner suppressions (offerId -> expiresAt)
  suppressions: Record<string, number>
}

export const DEFAULT_TRAITS: UserTraits = {
  fxAffinity: 0,
  transferAffinity: 0,
  explorerScore: 0,
  lastPaths: [],
  topActions: [],
  lastBalanceSeen: null,
  searchTerms: [],
  incompleteBillPay: null,
  locale: 'en',
  prefersDense: false,
  darkMode: false,
  favoriteQuickActions: [],
  suppressions: {},
}
