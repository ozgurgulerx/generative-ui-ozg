'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { t, type Locale } from '@/lib/i18n/strings'
import { trackJourney } from '@/lib/analytics/tracker'

interface ContinueBillPayProps {
  visible: boolean
  locale?: Locale
}

export function ContinueBillPay({ visible, locale = 'en' }: ContinueBillPayProps) {
  const [dismissed, setDismissed] = useState(!visible)

  if (dismissed) return null

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="text-base">{t(locale, 'continueBillPay')}</CardTitle>
        <CardDescription>{t(locale, 'continueBillPayBody')}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            trackJourney('BILLPAY_COMPLETED')
            setDismissed(true)
          }}
          data-analytic-id="continue-billpay"
        >
          {t(locale, 'continueAction')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            trackJourney('BILLPAY_CANCELLED')
            setDismissed(true)
          }}
          data-analytic-id="dismiss-billpay"
        >
          {t(locale, 'dismissAction')}
        </Button>
      </CardContent>
    </Card>
  )
}
