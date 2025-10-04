'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Settings, RotateCcw, Users } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n/strings'
import { getPreferences, setPreferences } from '@/lib/analytics/storage'
import { resetAll } from '@/privacy/consent'
import {
  trackView,
  trackAction,
  trackSearch,
  trackJourney,
} from '@/lib/analytics/tracker'

interface ToolbarProps {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  onDarkModeChange: (dark: boolean) => void
  onDensityChange: (dense: boolean) => void
  onLLMChange: (useLLM: boolean) => void
  onReset: () => void
  darkMode: boolean
  prefersDense: boolean
  useLLM: boolean
}

export function Toolbar({
  locale,
  onLocaleChange,
  onDarkModeChange,
  onDensityChange,
  onLLMChange,
  onReset,
  darkMode,
  prefersDense,
  useLLM,
}: ToolbarProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showPersonas, setShowPersonas] = useState(false)

  const handleReset = async () => {
    if (confirm('Reset all personalization data?')) {
      await resetAll()
      onReset()
    }
  }

  const simulateUtilityPayer = () => {
    trackView('/payments/utilities')
    trackAction('PAY_BILL')
    setTimeout(() => trackAction('PAY_BILL'), 500)
    alert('Simulated: Utility Payer pattern. Reload to see changes.')
  }

  const simulateFXFan = () => {
    trackAction('FX')
    setTimeout(() => trackAction('FX'), 500)
    trackSearch('exchange rates')
    setTimeout(() => trackSearch('exchange rates'), 1000)
    alert('Simulated: FX Enthusiast pattern. Reload to see changes.')
  }

  const simulateSavingsExplorer = () => {
    trackView('/savings')
    setTimeout(() => trackView('/offers'), 500)
    trackAction('OPEN_SAVINGS')
    alert('Simulated: Savings Explorer pattern. Reload to see changes.')
  }

  const simulateBillPayInterrupted = () => {
    trackJourney('BILLPAY_STARTED')
    alert('Simulated: Incomplete Bill Pay. Reload to see reminder.')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {showPersonas && (
        <Card className="w-64">
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-2">{t(locale, 'personas')}</h3>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={simulateUtilityPayer}
            >
              {t(locale, 'utilityPayer')}
            </Button>
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={simulateFXFan}>
              {t(locale, 'fxFan')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={simulateSavingsExplorer}
            >
              {t(locale, 'savingsExplorer')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={simulateBillPayInterrupted}
            >
              {t(locale, 'billPayInterrupted')}
            </Button>
          </CardContent>
        </Card>
      )}

      {showSettings && (
        <Card className="w-64">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">{t(locale, 'settings')}</h3>

            <div className="flex items-center justify-between">
              <label className="text-sm">{t(locale, 'darkMode')}</label>
              <Switch checked={darkMode} onCheckedChange={onDarkModeChange} />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">{t(locale, 'density')}</label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDensityChange(!prefersDense)}
              >
                {prefersDense ? t(locale, 'compact') : t(locale, 'comfortable')}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">{t(locale, 'locale')}</label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLocaleChange(locale === 'en' ? 'tr' : 'en')}
              >
                {locale.toUpperCase()}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">{t(locale, 'useLLM')}</label>
              <Switch checked={useLLM} onCheckedChange={onLLMChange} />
            </div>

            <Button size="sm" variant="destructive" className="w-full" onClick={handleReset}>
              <RotateCcw className="h-3 w-3 mr-2" />
              {t(locale, 'reset')}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          size="icon"
          variant={showPersonas ? 'default' : 'secondary'}
          onClick={() => {
            setShowPersonas(!showPersonas)
            setShowSettings(false)
          }}
        >
          <Users className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={showSettings ? 'default' : 'secondary'}
          onClick={() => {
            setShowSettings(!showSettings)
            setShowPersonas(false)
          }}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
