'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { ActionId } from '@/lib/analytics/events'

interface OffersCardProps {
  title: string
  body: string
  cta?: {
    text: string
    actionId: ActionId
  }
  onDismiss?: () => void
}

export function OffersCard({ title, body, cta, onDismiss }: OffersCardProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{body}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            setDismissed(true)
            onDismiss?.()
          }}
          data-analytic-id="offer-dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      {cta && (
        <CardContent>
          <Button size="sm" data-action={cta.actionId} data-analytic-id="offer-cta">
            {cta.text}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
