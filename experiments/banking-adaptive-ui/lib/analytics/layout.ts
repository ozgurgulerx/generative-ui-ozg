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

  // Hero card with personalized message
  const greeting = getPersonalizedGreeting(traits)
  sections.push({
    id: 'hero',
    component: 'HeroCard',
    props: {
      title: greeting.title,
      subtitle: greeting.subtitle,
    },
  })

  // Show prominent account card if high engagement
  if (traits.explorerScore > 0.3 || traits.transferAffinity > 0.4) {
    sections.push({
      id: 'account-card',
      component: 'AccountCard',
      props: {
        accountType: 'checking',
      },
    })
  }

  // Continue incomplete journeys (high priority)
  if (traits.incompleteBillPay) {
    sections.push({
      id: 'continue-billpay',
      component: 'ContinueBillPay',
      props: { visible: true },
    })
  }

  // Prioritized ActionGrid based on behavior
  const actions = buildActionOrder(traits)
  sections.push({
    id: 'actions',
    component: 'ActionGrid',
    props: { actions },
  })

  // Transaction history - show compact if explorer, full if frequent user
  if (traits.topActions.length > 0 || traits.explorerScore > 0.2) {
    sections.push({
      id: 'transactions',
      component: 'TransactionHistory',
      props: { compact: traits.explorerScore < 0.5 },
    })
  }

  // FX widget if interested
  if (shouldShowFX(traits)) {
    const expanded = shouldExpandFX(traits)
    sections.push({
      id: 'fx-rates',
      component: 'FXRates',
      props: { expanded },
    })
  }

  // Balances (always show but position varies)
  sections.push({
    id: 'balances',
    component: 'Balances',
    props: {},
  })

  // Recent beneficiaries for frequent transferrers
  if (traits.transferAffinity > 0.3) {
    sections.push({
      id: 'recent-beneficiaries',
      component: 'RecentBeneficiaries',
      props: {
        aliases: ['John D.', 'Alice M.', 'Rent Payment'],
      },
    })
  }

  // Offers for engaged users
  if (shouldShowOffers(traits)) {
    sections.push({
      id: 'offers',
      component: 'OffersCard',
      props: {
        title: traits.locale === 'tr' ? 'Otomatik Tasarruf Başlat' : 'Set up Auto-Save',
        body:
          traits.locale === 'tr'
            ? 'Her ay otomatik olarak tasarruf edin ve hedeflerinize daha hızlı ulaşın'
            : 'Automatically save every month and reach your goals faster',
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
 * Get personalized greeting based on user behavior
 */
function getPersonalizedGreeting(traits: UserTraits): { title: string; subtitle: string } {
  const isActiveTR = traits.locale === 'tr'
  
  // Highly engaged user
  if (traits.explorerScore > 0.6 || traits.topActions.length >= 3) {
    return {
      title: isActiveTR ? 'Tekrar Hoş Geldiniz!' : 'Welcome Back!',
      subtitle: isActiveTR 
        ? 'Size özel bankacılık deneyiminiz hazır'
        : 'Your personalized banking experience is ready',
    }
  }
  
  // Frequent FX user
  if (traits.fxAffinity > 0.5) {
    return {
      title: isActiveTR ? 'Döviz İşlemleriniz' : 'Your Currency Exchange',
      subtitle: isActiveTR
        ? 'Güncel kurlar ve hızlı işlem imkanı'
        : 'Live rates and quick exchange',
    }
  }
  
  // Frequent transferrer
  if (traits.transferAffinity > 0.5) {
    return {
      title: isActiveTR ? 'Hızlı Transfer' : 'Quick Transfer',
      subtitle: isActiveTR
        ? 'En sık kullandığınız alıcılar hazır'
        : 'Your frequent recipients are ready',
    }
  }
  
  // Default
  return {
    title: isActiveTR ? 'Hesabınıza Hoş Geldiniz' : 'Welcome to Your Account',
    subtitle: isActiveTR
      ? 'Kişiselleştirilmiş bankacılık deneyimi'
      : 'Your personalized banking experience',
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
