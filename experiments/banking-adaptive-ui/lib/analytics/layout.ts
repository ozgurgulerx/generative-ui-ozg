/**
 * Rule-based layout selection from user traits
 */

import type { UserTraits, ActionId } from './events'
import type { UISchema } from '@/personalization/schema'

/**
 * Choose layout based on user traits (fallback when LLM is not used)
 */
export function chooseLayout(traits: UserTraits): UISchema {
  const sections: UISchema['sections'] = []

  // Always include HeroCard at top
  sections.push({
    id: 'hero',
    component: 'HeroCard',
    props: {
      title: traits.locale === 'tr' ? 'Hesabınıza Hoş Geldiniz' : 'Welcome to Your Account',
      subtitle:
        traits.locale === 'tr'
          ? 'Kişiselleştirilmiş bankacılık deneyimi'
          : 'Your personalized banking experience',
    },
  })

  // Continue incomplete Bill Pay journey if present
  if (traits.incompleteBillPay) {
    sections.push({
      id: 'continue-billpay',
      component: 'ContinueBillPay',
      props: { visible: true },
    })
  }

  // Prioritize ActionGrid based on affinities and last paths
  const actions = buildActionOrder(traits)
  sections.push({
    id: 'actions',
    component: 'ActionGrid',
    props: { actions },
  })

  // Include FX widget if affinity is high or searched recently
  if (shouldShowFX(traits)) {
    const expanded = shouldExpandFX(traits)
    sections.push({
      id: 'fx-rates',
      component: 'FXRates',
      props: { expanded },
    })
  }

  // Always include Balances
  sections.push({
    id: 'balances',
    component: 'Balances',
    props: {},
  })

  // Show recent beneficiaries if transfer affinity is high
  if (traits.transferAffinity > 0.3) {
    sections.push({
      id: 'recent-beneficiaries',
      component: 'RecentBeneficiaries',
      props: {
        aliases: ['Alias-A', 'Alias-B'], // Mock aliases
      },
    })
  }

  // Show offers card if explorer score is high or Savings path visited
  if (shouldShowOffers(traits)) {
    sections.push({
      id: 'offers',
      component: 'OffersCard',
      props: {
        title: traits.locale === 'tr' ? 'Otomatik Tasarruf Başlat' : 'Set up Auto-Save',
        body:
          traits.locale === 'tr'
            ? 'Her ay otomatik olarak tasarruf edin'
            : 'Automatically save every month',
        cta: { text: traits.locale === 'tr' ? 'Başlat' : 'Get Started', actionId: 'OPEN_SAVINGS' },
      },
    })
  }

  return {
    version: '1.0',
    sections,
  }
}

/**
 * Build action order based on traits
 */
function buildActionOrder(traits: UserTraits): Array<{ label: string; actionId: ActionId }> {
  const labelMap: Record<ActionId, { en: string; tr: string }> = {
    TRANSFER: { en: 'Transfer', tr: 'Transfer' },
    PAY_BILL: { en: 'Pay Bill', tr: 'Fatura Öde' },
    FX: { en: 'Exchange', tr: 'Döviz' },
    OPEN_SAVINGS: { en: 'Savings', tr: 'Tasarruf' },
  }

  const locale = traits.locale
  const defaultOrder: ActionId[] = ['TRANSFER', 'PAY_BILL', 'FX', 'OPEN_SAVINGS']

  // If user visited /payments/utilities, prioritize PAY_BILL
  if (traits.lastPaths.some((p) => p.includes('/payments/utilities'))) {
    const reordered: ActionId[] = [
      'PAY_BILL',
      ...defaultOrder.filter((a) => a !== 'PAY_BILL'),
    ]
    return reordered.map((id) => ({
      label: labelMap[id][locale],
      actionId: id,
    }))
  }

  // Otherwise, use topActions if available
  if (traits.topActions.length > 0) {
    const top = traits.topActions
    const rest = defaultOrder.filter((a) => !top.includes(a))
    const ordered: ActionId[] = [...top, ...rest]
    return ordered.map((id) => ({
      label: labelMap[id][locale],
      actionId: id,
    }))
  }

  // Default order
  return defaultOrder.map((id) => ({
    label: labelMap[id][locale],
    actionId: id,
  }))
}

/**
 * Determine if FX widget should be shown
 */
function shouldShowFX(traits: UserTraits): boolean {
  return traits.fxAffinity > 0.2 || traits.searchTerms.some((s) => s.term.includes('exchange'))
}

/**
 * Determine if FX widget should be pre-expanded
 */
function shouldExpandFX(traits: UserTraits): boolean {
  const fxSearches = traits.searchTerms.filter((s) => s.term.includes('exchange'))
  return fxSearches.length >= 2 || traits.fxAffinity > 0.4
}

/**
 * Determine if offers card should be shown
 */
function shouldShowOffers(traits: UserTraits): boolean {
  return (
    traits.explorerScore > 0.5 ||
    traits.lastPaths.some((p) => p.includes('/savings')) ||
    traits.lastPaths.some((p) => p.includes('/offers'))
  )
}
