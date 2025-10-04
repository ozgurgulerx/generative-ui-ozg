'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { t, type Locale } from '@/lib/i18n/strings'

interface AccountCardProps {
  locale?: Locale
  accountType?: 'checking' | 'savings'
}

export function AccountCard({ locale = 'en', accountType = 'checking' }: AccountCardProps) {
  const [visible, setVisible] = useState(true)
  
  const balance = accountType === 'checking' ? 12345.67 : 5432.10
  const accountNumber = accountType === 'checking' ? '****4291' : '****8832'
  const change = accountType === 'checking' ? 234.56 : 89.23

  return (
    <Card className="overflow-hidden relative bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white border-0 shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-sm text-slate-300 mb-1">
              {accountType === 'checking' ? t(locale, 'checking') : t(locale, 'savings')}
            </div>
            <div className="font-mono text-xs text-slate-400">{accountNumber}</div>
          </div>
          <button 
            onClick={() => setVisible(!visible)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
        
        <div className="mb-4">
          <div className="text-3xl font-bold mb-1">
            {visible ? `$${balance.toFixed(2)}` : '••••••'}
          </div>
          <div className="flex items-center gap-1 text-sm text-green-400">
            <TrendingUp className="h-3 w-3" />
            <span>+${change.toFixed(2)} this month</span>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 opacity-10">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="40" stroke="white" strokeWidth="2" />
            <circle cx="60" cy="60" r="50" stroke="white" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
