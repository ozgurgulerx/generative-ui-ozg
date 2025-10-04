'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bug, ChevronDown, ChevronUp, Activity, Brain, Layers } from 'lucide-react'
import { getEvents, getTraits } from '@/lib/analytics/storage'
import type { Event, UserTraits } from '@/lib/analytics/events'
import type { UISchema } from '@/personalization/schema'

interface DebugPanelProps {
  schema: UISchema | null
  useLLM: boolean
  locale: string
}

export function DebugPanel({ schema, useLLM, locale }: DebugPanelProps) {
  const [visible, setVisible] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [traits, setTraits] = useState<UserTraits | null>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'traits' | 'layout'>('events')

  useEffect(() => {
    if (visible) {
      loadData()
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return

    const interval = setInterval(loadData, 1000)
    return () => clearInterval(interval)
  }, [visible])

  const loadData = async () => {
    const evts = await getEvents()
    const trts = await getTraits()
    setEvents(evts)
    setTraits(trts)
  }

  if (!visible) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="fixed bottom-20 left-4 z-40 shadow-lg"
        onClick={() => setVisible(true)}
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug Panel
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-20 left-4 w-96 max-h-[70vh] z-40 shadow-2xl overflow-hidden flex flex-col">
      <CardHeader className="pb-3 bg-slate-100 dark:bg-slate-900 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Panel
          </CardTitle>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setVisible(false)}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1 mt-2">
          <Button
            size="sm"
            variant={activeTab === 'events' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setActiveTab('events')}
          >
            <Activity className="h-3 w-3 mr-1" />
            Events
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'traits' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setActiveTab('traits')}
          >
            <Brain className="h-3 w-3 mr-1" />
            Traits
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'layout' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setActiveTab('layout')}
          >
            <Layers className="h-3 w-3 mr-1" />
            Layout
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 overflow-y-auto flex-1">
        {activeTab === 'events' && <EventsTab events={events} />}
        {activeTab === 'traits' && <TraitsTab traits={traits} />}
        {activeTab === 'layout' && <LayoutTab schema={schema} useLLM={useLLM} traits={traits} />}
      </CardContent>
    </Card>
  )
}

function EventsTab({ events }: { events: Event[] }) {
  const recentEvents = events.slice(-10).reverse()

  if (recentEvents.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No events tracked yet. Click action buttons or use persona simulators.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">
        Last 10 Events (newest first):
      </div>
      {recentEvents.map((event, i) => (
        <div
          key={i}
          className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
              {event.type.toUpperCase()}
            </span>
            <span className="text-muted-foreground">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
          {event.type === 'action' && (
            <div className="text-muted-foreground">
              Action: <span className="font-semibold">{event.name}</span>
            </div>
          )}
          {event.type === 'view' && (
            <div className="text-muted-foreground">
              Path: <span className="font-mono">{event.path}</span>
            </div>
          )}
          {event.type === 'search' && (
            <div className="text-muted-foreground">
              Query: &quot;<span className="font-semibold">{event.term}</span>&quot;
            </div>
          )}
          {event.type === 'journey' && (
            <div className="text-muted-foreground">
              Journey: <span className="font-semibold">{event.id}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function TraitsTab({ traits }: { traits: UserTraits | null }) {
  if (!traits) {
    return (
      <div className="text-xs text-muted-foreground">
        No traits derived yet. Interact with the app and reload.
      </div>
    )
  }

  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="font-semibold mb-1">Affinities:</div>
        <div className="space-y-1 pl-2">
          <div className="flex justify-between">
            <span>FX Affinity:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {(traits.fxAffinity * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Transfer Affinity:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {(traits.transferAffinity * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Explorer Score:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {(traits.explorerScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Top Actions:</div>
        <div className="pl-2 space-y-1">
          {traits.topActions.length > 0 ? (
            traits.topActions.map((action, i) => (
              <div key={i} className="font-mono text-green-600 dark:text-green-400">
                {i + 1}. {action}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">None yet</div>
          )}
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Last Paths Visited:</div>
        <div className="pl-2 space-y-1">
          {traits.lastPaths.length > 0 ? (
            traits.lastPaths.map((path, i) => (
              <div key={i} className="font-mono text-purple-600 dark:text-purple-400 truncate">
                {path}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">None yet</div>
          )}
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Search Terms:</div>
        <div className="pl-2 space-y-1">
          {traits.searchTerms.length > 0 ? (
            traits.searchTerms.slice(0, 3).map((s, i) => (
              <div key={i} className="text-orange-600 dark:text-orange-400">
                &quot;{s.term}&quot; ({s.count}×)
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">None yet</div>
          )}
        </div>
      </div>

      {traits.incompleteBillPay && (
        <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded">
          <div className="font-semibold text-amber-800 dark:text-amber-200">
            ⚠️ Incomplete Journey
          </div>
          <div className="text-amber-700 dark:text-amber-300">Bill Pay started but not completed</div>
        </div>
      )}

      <div>
        <div className="font-semibold mb-1">Preferences:</div>
        <div className="pl-2 space-y-1 text-muted-foreground">
          <div>Locale: {traits.locale.toUpperCase()}</div>
          <div>Dark Mode: {traits.darkMode ? 'Yes' : 'No'}</div>
          <div>Dense Layout: {traits.prefersDense ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  )
}

function LayoutTab({
  schema,
  useLLM,
  traits,
}: {
  schema: UISchema | null
  useLLM: boolean
  traits: UserTraits | null
}) {
  if (!schema) {
    return <div className="text-xs text-muted-foreground">No schema loaded yet.</div>
  }

  return (
    <div className="space-y-3 text-xs">
      <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
        <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
          {useLLM ? '🤖 AI-Generated Layout (GPT-5)' : '📐 Rule-Based Layout'}
        </div>
        <div className="text-blue-700 dark:text-blue-300">
          {useLLM
            ? 'Layout composed by GPT-5 based on user traits. The LLM analyzes behavior and preferences to create a personalized schema.'
            : 'Layout determined by programmatic rules. Actions are prioritized based on frequency and recency.'}
        </div>
      </div>

      <div>
        <div className="font-semibold mb-2">Section Order & Reasoning:</div>
        <div className="space-y-2">
          {schema.sections.map((section, i) => (
            <div
              key={section.id}
              className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-slate-500">#{i + 1}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {section.component}
                </span>
              </div>
              <div className="text-muted-foreground">{getReasoningForSection(section, traits)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
        <div className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
          💡 How Adaptation Works:
        </div>
        <ul className="text-purple-700 dark:text-purple-300 space-y-1 list-disc list-inside">
          <li>Click actions → Events stored in IndexedDB</li>
          <li>Reload → Traits derived from events</li>
          <li>Layout engine decides section order</li>
          <li>Frequently-used actions move to top</li>
        </ul>
      </div>
    </div>
  )
}

function getReasoningForSection(
  section: UISchema['sections'][number],
  traits: UserTraits | null
): string {
  switch (section.component) {
    case 'HeroCard':
      return 'Always shown at top as welcome banner'

    case 'ContinueBillPay':
      return 'Shown because Bill Pay journey was started but not completed'

    case 'ActionGrid':
      if (!traits) return 'Quick actions for common tasks'
      const actions = section.props.actions.map((a) => a.actionId)
      if (actions[0] === 'PAY_BILL') {
        return 'Pay Bill prioritized (user visited /payments/utilities)'
      }
      if (traits.topActions.length > 0) {
        return `Order based on usage: ${traits.topActions.join(' > ')}`
      }
      return 'Default action order'

    case 'FXRates':
      if (!traits) return 'Exchange rate widget'
      const expanded = section.props.expanded
      if (expanded) {
        return 'Pre-expanded (user searched "exchange rates" ≥2× or high FX affinity)'
      }
      return 'Shown due to FX interest (clicks or searches)'

    case 'Balances':
      return 'Always included to show account balances'

    case 'RecentBeneficiaries':
      return 'Shown due to high transfer affinity (frequent transfers)'

    case 'OffersCard':
      if (!traits) return 'Promotional offer'
      if (traits.explorerScore > 0.5) {
        return 'Shown due to high explorer score (visited many sections)'
      }
      if (traits.lastPaths.some((p) => p.includes('/savings'))) {
        return 'Shown because user visited savings section'
      }
      return 'Auto-Save offer for engaged users'

    default:
      return 'Part of personalized layout'
  }
}
