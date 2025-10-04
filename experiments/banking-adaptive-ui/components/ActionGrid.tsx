'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowRightLeft, FileText, Coins, PiggyBank } from 'lucide-react'
import type { ActionId } from '@/lib/analytics/events'
import { t, type Locale } from '@/lib/i18n/strings'
import { TransferModal } from './TransferModal'
import { trackJourney } from '@/lib/analytics/tracker'

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
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  const handleClick = (actionId: ActionId) => {
    if (actionId === 'TRANSFER') {
      trackJourney('TRANSFER_STARTED')
      setTransferModalOpen(true)
    } else if (actionId === 'PAY_BILL') {
      trackJourney('BILLPAY_STARTED')
      // Mock: show alert for now
      alert('Bill payment flow would open here. This interaction is tracked!')
    } else if (actionId === 'FX') {
      alert('FX exchange flow would open here. Tracked!')
    } else if (actionId === 'OPEN_SAVINGS') {
      alert('Savings account flow would open here. Tracked!')
    }
  }

  return (
    <>
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
                className="h-24 flex-col gap-2 relative transition-all hover:scale-105 hover:shadow-md"
                data-action={action.actionId}
                data-analytic-id={`action-${action.actionId.toLowerCase()}`}
                onClick={() => handleClick(action.actionId)}
              >
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  {iconMap[action.actionId]}
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <TransferModal open={transferModalOpen} onOpenChange={setTransferModalOpen} />
    </>
  )
}
