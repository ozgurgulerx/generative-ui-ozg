'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownLeft, Store, Zap } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n/strings'

interface TransactionHistoryProps {
  locale?: Locale
  compact?: boolean
}

const mockTransactions = [
  {
    id: '1',
    type: 'debit',
    merchant: 'Amazon',
    category: 'Shopping',
    amount: -89.99,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    icon: Store,
  },
  {
    id: '2',
    type: 'credit',
    merchant: 'Salary Deposit',
    category: 'Income',
    amount: 5430.0,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    icon: ArrowDownLeft,
  },
  {
    id: '3',
    type: 'debit',
    merchant: 'Utility Bill',
    category: 'Bills',
    amount: -156.78,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    icon: Zap,
  },
  {
    id: '4',
    type: 'debit',
    merchant: 'Transfer to Savings',
    category: 'Transfer',
    amount: -500.0,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    icon: ArrowUpRight,
  },
]

export function TransactionHistory({ locale = 'en', compact = false }: TransactionHistoryProps) {
  const transactions = compact ? mockTransactions.slice(0, 3) : mockTransactions

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          {compact && (
            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.map((tx) => {
          const Icon = tx.icon
          return (
            <div key={tx.id} className="flex items-center gap-3 group hover:bg-slate-50 dark:hover:bg-slate-900 p-2 -mx-2 rounded-lg transition-colors cursor-pointer">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                tx.type === 'credit' 
                  ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{tx.merchant}</div>
                <div className="text-xs text-muted-foreground">{tx.category}</div>
              </div>
              <div className="text-right">
                <div className={`font-semibold text-sm ${
                  tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-foreground'
                }`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} USD
                </div>
                <div className="text-xs text-muted-foreground">
                  {tx.date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
