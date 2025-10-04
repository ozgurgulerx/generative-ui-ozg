'use client'

import { useEffect, useState } from 'react'
import { ConsentDialog } from '@/components/ConsentDialog'
import { Toolbar } from '@/components/Toolbar'
import { DemoHelper } from '@/components/DemoHelper'
import { LiveDebugPanel } from '@/components/LiveDebugPanel'
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
  const [llmThinking, setLlmThinking] = useState<{ stage: string; message: string } | null>(null)

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
      setLlmThinking({ stage: 'Loading', message: 'Fetching AI-generated layout...' })
      const response = await fetch('/llm_schema.json')
      if (!response.ok) {
        setLlmThinking({ stage: 'Fallback', message: 'AI layout not found, using rules' })
        setTimeout(() => setLlmThinking(null), 3000)
        return null
      }
      setLlmThinking({ stage: 'Parsing', message: 'Validating AI schema...' })
      const data = await response.json()
      const validated = validateUISchema(data)
      if (validated) {
        setLlmThinking({ stage: 'Success', message: `AI layout loaded: ${validated.sections.length} sections` })
        setTimeout(() => setLlmThinking(null), 3000)
      } else {
        setLlmThinking({ stage: 'Error', message: 'AI schema validation failed' })
        setTimeout(() => setLlmThinking(null), 3000)
      }
      return validated
    } catch (err) {
      console.warn('Failed to fetch LLM schema:', err)
      setLlmThinking({ stage: 'Error', message: 'Failed to load AI layout' })
      setTimeout(() => setLlmThinking(null), 3000)
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

      <DemoHelper />
      <LiveDebugPanel schema={schema} useLLM={useLLM} llmThinking={llmThinking} />

      <main className="min-h-screen bg-background pr-80">
        <div className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
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
