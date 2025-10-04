'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowRightLeft, FileText, Coins, PiggyBank } from 'lucide-react'
import type { ActionId } from '@/lib/analytics/events'
import { t, type Locale } from '@/lib/i18n/strings'

interface ActionGridProps {
  actions: Array<{ label: string; actionId: ActionId }>
  locale?: Locale
}

const iconMap: Record<ActionId, React.ReactNode> = {
  TRANSFER: <ArrowRightLeft className="h-5 w-5" />,
  PAY_BILL: <FileText className="h-5 w-5" />,
  FX: <Coins className="h-5 w-5" />,
  OPEN_SAVINGS: <PiggyBank className="h-5 w-5" />,
}

export function ActionGrid({ actions, locale = 'en' }: ActionGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(locale, 'quickActions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.actionId}
              variant="outline"
              className="h-20 flex-col gap-2"
              data-action={action.actionId}
              data-analytic-id={`action-${action.actionId.toLowerCase()}`}
            >
              {iconMap[action.actionId]}
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
