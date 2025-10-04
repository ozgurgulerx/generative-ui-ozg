/**
 * Privacy and consent management
 */

import {
  clearEvents,
  clearTraits,
  clearConsent,
  clearPreferences,
  getConsent,
  setConsent,
} from '@/lib/analytics/storage'

/**
 * Ensure consent is captured before tracking
 */
export function ensureConsent(): boolean {
  return getConsent()
}

/**
 * Accept consent
 */
export function acceptConsent(): void {
  setConsent(true)
}

/**
 * Decline consent
 */
export function declineConsent(): void {
  setConsent(false)
}

/**
 * Reset all personalization data
 */
export async function resetAll(): Promise<void> {
  await clearEvents()
  await clearTraits()
  clearConsent()
  clearPreferences()
}
