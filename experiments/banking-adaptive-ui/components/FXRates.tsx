'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n/strings'

interface FXRatesProps {
  expanded?: boolean
  locale?: Locale
}

export function FXRates({ expanded = false, locale = 'en' }: FXRatesProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{t(locale, 'fxRates')}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          data-analytic-id="fx-toggle"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">EUR/USD</span>
            <span className="font-mono">1.0945</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">GBP/USD</span>
            <span className="font-mono">1.2678</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">USD/TRY</span>
            <span className="font-mono">34.12</span>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
