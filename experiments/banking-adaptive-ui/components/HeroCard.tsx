'use client'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface HeroCardProps {
  title: string
  subtitle?: string
}

export function HeroCard({ title, subtitle }: HeroCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {subtitle && <CardDescription className="text-blue-100">{subtitle}</CardDescription>}
      </CardHeader>
    </Card>
  )
}
