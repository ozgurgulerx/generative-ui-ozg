'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserCircle } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n/strings'

interface RecentBeneficiariesProps {
  aliases: string[]
  locale?: Locale
}

export function RecentBeneficiaries({ aliases, locale = 'en' }: RecentBeneficiariesProps) {
  if (aliases.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t(locale, 'recentBeneficiaries')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {aliases.map((alias) => (
            <Button
              key={alias}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              data-analytic-id={`beneficiary-${alias}`}
            >
              <UserCircle className="h-4 w-4" />
              <span className="text-xs">{alias}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
