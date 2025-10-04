'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Info, X } from 'lucide-react'

export function DemoHelper() {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="fixed top-4 left-4 z-40"
        onClick={() => setVisible(true)}
      >
        <Info className="h-4 w-4 mr-2" />
        How it works
      </Button>
    )
  }

  return (
    <Card className="fixed top-4 left-4 right-4 z-40 border-blue-500 bg-blue-50 dark:bg-blue-950/20 max-w-2xl mx-auto">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 text-sm space-y-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Info className="h-4 w-4" />
              How This Demo Works
            </h3>
            <ol className="space-y-1 text-blue-800 dark:text-blue-200 list-decimal list-inside">
              <li>
                <strong>Click action buttons</strong> (Transfer, Pay Bill, etc.) — They track
                events but don&apos;t navigate
              </li>
              <li>
                <strong>Use Personas</strong> (bottom-right toolbar → Users icon) — Simulate
                behavior patterns
              </li>
              <li>
                <strong>Reload the page</strong> — See the UI adapt based on your tracked behavior
              </li>
              <li>
                <strong>Check Settings</strong> (gear icon) — Toggle dark mode, locale, density,
                etc.
              </li>
            </ol>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              💡 Tip: Try &quot;Utility Payer&quot; persona, then reload to see Pay Bill move to the top!
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-blue-700 hover:text-blue-900 dark:text-blue-300"
            onClick={() => setVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
