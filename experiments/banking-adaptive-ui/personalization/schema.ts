/**
 * UISchema types and Zod validators
 */

import { z } from 'zod'

export const ActionIdSchema = z.enum(['TRANSFER', 'PAY_BILL', 'FX', 'OPEN_SAVINGS'])
export type ActionId = z.infer<typeof ActionIdSchema>

const HeroCardSectionSchema = z.object({
  id: z.string(),
  component: z.literal('HeroCard'),
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
  }),
})

const ActionGridSectionSchema = z.object({
  id: z.string(),
  component: z.literal('ActionGrid'),
  props: z.object({
    actions: z.array(
      z.object({
        label: z.string(),
        actionId: ActionIdSchema,
      })
    ),
  }),
})

const FXRatesSectionSchema = z.object({
  id: z.string(),
  component: z.literal('FXRates'),
  props: z.object({
    expanded: z.boolean().optional(),
  }),
})

const BalancesSectionSchema = z.object({
  id: z.string(),
  component: z.literal('Balances'),
  props: z.object({}),
})

const OffersCardSectionSchema = z.object({
  id: z.string(),
  component: z.literal('OffersCard'),
  props: z.object({
    title: z.string(),
    body: z.string(),
    cta: z
      .object({
        text: z.string(),
        actionId: ActionIdSchema,
      })
      .optional(),
  }),
})

const RecentBeneficiariesSectionSchema = z.object({
  id: z.string(),
  component: z.literal('RecentBeneficiaries'),
  props: z.object({
    aliases: z.array(z.string()),
  }),
})

const ContinueBillPaySectionSchema = z.object({
  id: z.string(),
  component: z.literal('ContinueBillPay'),
  props: z.object({
    visible: z.boolean(),
  }),
})

const TransactionHistorySectionSchema = z.object({
  id: z.string(),
  component: z.literal('TransactionHistory'),
  props: z.object({
    compact: z.boolean().optional(),
  }),
})

const AccountCardSectionSchema = z.object({
  id: z.string(),
  component: z.literal('AccountCard'),
  props: z.object({
    accountType: z.enum(['checking', 'savings']).optional(),
  }),
})

const SectionSchema = z.discriminatedUnion('component', [
  HeroCardSectionSchema,
  AccountCardSectionSchema,
  ActionGridSectionSchema,
  TransactionHistorySectionSchema,
  FXRatesSectionSchema,
  BalancesSectionSchema,
  OffersCardSectionSchema,
  RecentBeneficiariesSectionSchema,
  ContinueBillPaySectionSchema,
])

export const UISchemaValidator = z.object({
  version: z.literal('1.0'),
  sections: z.array(SectionSchema).max(8), // ≤8 sections (more complex UI)
})

export type UISchema = z.infer<typeof UISchemaValidator>
export type Section = z.infer<typeof SectionSchema>

/**
 * Validate a UI schema
 */
export function validateUISchema(data: unknown): UISchema | null {
  try {
    return UISchemaValidator.parse(data)
  } catch (err) {
    console.error('UISchema validation failed:', err)
    return null
  }
}
