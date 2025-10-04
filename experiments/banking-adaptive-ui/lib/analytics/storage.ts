/**
 * Storage helpers using IndexedDB (via idb-keyval) for events
 * and localStorage for consent/preferences
 */

import { get, set, del } from 'idb-keyval'
import type { Event, UserTraits } from './events'

const EVENTS_KEY = 'banking_events'
const TRAITS_KEY = 'banking_traits'
const CONSENT_KEY = 'banking_consent'
const MAX_EVENTS = 1000

/**
 * Storage interface for events
 */
export async function getEvents(): Promise<Event[]> {
  try {
    const events = await get<Event[]>(EVENTS_KEY)
    return events || []
  } catch (err) {
    console.error('Failed to get events:', err)
    return []
  }
}

export async function appendEvent(event: Event): Promise<void> {
  try {
    const events = await getEvents()
    events.push(event)

    // Cap history to prevent unbounded growth
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS)
    }

    await set(EVENTS_KEY, events)
  } catch (err) {
    console.error('Failed to append event:', err)
  }
}

export async function clearEvents(): Promise<void> {
  try {
    await del(EVENTS_KEY)
  } catch (err) {
    console.error('Failed to clear events:', err)
  }
}

/**
 * Storage interface for derived traits
 */
export async function getTraits(): Promise<UserTraits | null> {
  try {
    const traits = await get<UserTraits>(TRAITS_KEY)
    return traits ?? null
  } catch (err) {
    console.error('Failed to get traits:', err)
    return null
  }
}

export async function setTraits(traits: UserTraits): Promise<void> {
  try {
    await set(TRAITS_KEY, traits)
  } catch (err) {
    console.error('Failed to set traits:', err)
  }
}

export async function clearTraits(): Promise<void> {
  try {
    await del(TRAITS_KEY)
  } catch (err) {
    console.error('Failed to clear traits:', err)
  }
}

/**
 * Consent management (localStorage)
 */
export function getConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(CONSENT_KEY) === 'true'
  } catch {
    return false
  }
}

export function setConsent(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONSENT_KEY, value.toString())
  } catch (err) {
    console.error('Failed to set consent:', err)
  }
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CONSENT_KEY)
  } catch (err) {
    console.error('Failed to clear consent:', err)
  }
}

/**
 * Preferences (localStorage)
 */
const PREFS_KEY = 'banking_prefs'

export interface Preferences {
  locale?: 'en' | 'tr'
  darkMode?: boolean
  prefersDense?: boolean
  useLLM?: boolean
}

export function getPreferences(): Preferences {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function setPreferences(prefs: Preferences): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch (err) {
    console.error('Failed to set preferences:', err)
  }
}

export function clearPreferences(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(PREFS_KEY)
  } catch (err) {
    console.error('Failed to clear preferences:', err)
  }
}
