'use client'

import { useEffect, useState } from 'react'
import { ConsentDialog } from '@/components/ConsentDialog'
import { Toolbar } from '@/components/Toolbar'
import { SchemaRenderer } from '@/personalization/renderer'
import { validateUISchema, type UISchema } from '@/personalization/schema'
import { chooseLayout } from '@/lib/analytics/layout'
import { deriveTraits } from '@/lib/analytics/derive'
import { getEvents, getPreferences, setPreferences } from '@/lib/analytics/storage'
import { autoTrackPage, wireClickTracking, autoTrackScroll } from '@/lib/analytics/tracker'
import type { Locale } from '@/lib/i18n/strings'
import { DEFAULT_TRAITS } from '@/lib/analytics/events'

export default function HomePage() {
  const [schema, setSchema] = useState<UISchema | null>(null)
  const [locale, setLocale] = useState<Locale>('en')
  const [darkMode, setDarkMode] = useState(false)
  const [prefersDense, setPrefersDense] = useState(false)
  const [useLLM, setUseLLM] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize
    const init = async () => {
      // Load preferences
      const prefs = getPreferences()
      const detectedLocale =
        prefs.locale ||
        (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('tr')
          ? 'tr'
          : 'en')
      setLocale(detectedLocale)
      setDarkMode(prefs.darkMode ?? false)
      setPrefersDense(prefs.prefersDense ?? false)
      setUseLLM(prefs.useLLM ?? false)

      // Apply dark mode
      if (prefs.darkMode) {
        document.documentElement.classList.add('dark')
      }

      // Load events and derive traits
      const events = await getEvents()
      const traits = events.length > 0 ? deriveTraits(events) : DEFAULT_TRAITS

      // Choose layout
      let selectedSchema: UISchema

      if (prefs.useLLM) {
        // Try to load LLM-generated schema
        const llmSchema = await fetchLLMSchema()
        if (llmSchema) {
          selectedSchema = llmSchema
        } else {
          // Fallback to rule-based
          selectedSchema = chooseLayout(traits)
        }
      } else {
        // Rule-based layout
        selectedSchema = chooseLayout(traits)
      }

      setSchema(selectedSchema)
      setLoading(false)

      // Setup tracking
      wireClickTracking()
      autoTrackPage('/')
      autoTrackScroll('/')
    }

    init()
  }, [])

  const fetchLLMSchema = async (): Promise<UISchema | null> => {
    try {
      const response = await fetch('/llm_schema.json')
      if (!response.ok) return null
      const data = await response.json()
      return validateUISchema(data)
    } catch (err) {
      console.warn('Failed to fetch LLM schema:', err)
      return null
    }
  }

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    const prefs = getPreferences()
    setPreferences({ ...prefs, locale: newLocale })
  }

  const handleDarkModeChange = (dark: boolean) => {
    setDarkMode(dark)
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    const prefs = getPreferences()
    setPreferences({ ...prefs, darkMode: dark })
  }

  const handleDensityChange = (dense: boolean) => {
    setPrefersDense(dense)
    const prefs = getPreferences()
    setPreferences({ ...prefs, prefersDense: dense })
  }

  const handleLLMChange = (useLLM: boolean) => {
    setUseLLM(useLLM)
    const prefs = getPreferences()
    setPreferences({ ...prefs, useLLM })
    // Reload to apply new layout
    window.location.reload()
  }

  const handleReset = () => {
    window.location.reload()
  }

  const handleConsentAccept = () => {
    window.location.reload()
  }

  const handleConsentDecline = () => {
    // Continue with defaults
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <ConsentDialog
        locale={locale}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {schema ? <SchemaRenderer schema={schema} locale={locale} /> : <div>No schema</div>}
        </div>

        <Toolbar
          locale={locale}
          onLocaleChange={handleLocaleChange}
          onDarkModeChange={handleDarkModeChange}
          onDensityChange={handleDensityChange}
          onLLMChange={handleLLMChange}
          onReset={handleReset}
          darkMode={darkMode}
          prefersDense={prefersDense}
          useLLM={useLLM}
        />
      </main>
    </>
  )
}
