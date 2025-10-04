'use client'

import { useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { trackBalanceSeen } from '@/lib/analytics/tracker'
import { t, type Locale } from '@/lib/i18n/strings'

interface BalancesProps {
  locale?: Locale
}

export function Balances({ locale = 'en' }: BalancesProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackBalanceSeen()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle>{t(locale, 'balances')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t(locale, 'checking')}</span>
          <span className="font-semibold">$12,345.67</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t(locale, 'savings')}</span>
          <span className="font-semibold">$5,432.10</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t(locale, 'credit')}</span>
          <span className="font-semibold text-red-600">-$892.34</span>
        </div>
      </CardContent>
    </Card>
  )
}
