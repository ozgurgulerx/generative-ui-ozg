/**
 * Render UISchema sections to React components
 */

import type { UISchema, Section } from './schema'
import type { Locale } from '@/lib/i18n/strings'
import { HeroCard } from '@/components/HeroCard'
import { AccountCard } from '@/components/AccountCard'
import { ActionGrid } from '@/components/ActionGrid'
import { TransactionHistory } from '@/components/TransactionHistory'
import { FXRates } from '@/components/FXRates'
import { Balances } from '@/components/Balances'
import { OffersCard } from '@/components/OffersCard'
import { RecentBeneficiaries } from '@/components/RecentBeneficiaries'
import { ContinueBillPay } from '@/components/ContinueBillPay'

interface RendererProps {
  schema: UISchema
  locale: Locale
}

export function SchemaRenderer({ schema, locale }: RendererProps) {
  return (
    <div className="space-y-4">
      {schema.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} locale={locale} />
      ))}
    </div>
  )
}

function SectionRenderer({ section, locale }: { section: Section; locale: Locale }) {
  switch (section.component) {
    case 'HeroCard':
      return <HeroCard {...section.props} />

    case 'AccountCard':
      return <AccountCard {...section.props} locale={locale} />

    case 'ActionGrid':
      return <ActionGrid {...section.props} locale={locale} />

    case 'TransactionHistory':
      return <TransactionHistory {...section.props} locale={locale} />

    case 'FXRates':
      return <FXRates {...section.props} locale={locale} />

    case 'Balances':
      return <Balances locale={locale} />

    case 'OffersCard':
      return <OffersCard {...section.props} />

    case 'RecentBeneficiaries':
      return <RecentBeneficiaries {...section.props} locale={locale} />

    case 'ContinueBillPay':
      return <ContinueBillPay {...section.props} locale={locale} />

    default:
      // Exhaustive check
      const _exhaustive: never = section
      return null
  }
}
