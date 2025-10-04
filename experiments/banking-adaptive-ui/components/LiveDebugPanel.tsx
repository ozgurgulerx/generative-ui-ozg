'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Brain, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { getEvents, getTraits } from '@/lib/analytics/storage'
import type { Event, UserTraits } from '@/lib/analytics/events'
import type { UISchema } from '@/personalization/schema'

interface LiveDebugPanelProps {
  schema: UISchema | null
  useLLM: boolean
  llmThinking?: { stage: string; message: string } | null
}

interface ActivityItem {
  id: string
  type: 'event' | 'trait' | 'layout' | 'llm'
  timestamp: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

export function LiveDebugPanel({ schema, useLLM, llmThinking }: LiveDebugPanelProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [traits, setTraits] = useState<UserTraits | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevEventCountRef = useRef(0)

  useEffect(() => {
    const loadAndUpdate = async () => {
      const evts = await getEvents()
      const trts = await getTraits()
      
      setEvents(evts)
      setTraits(trts)

      // Detect new events and add to activity stream
      if (evts.length > prevEventCountRef.current) {
        const newEvents = evts.slice(prevEventCountRef.current)
        newEvents.forEach((event) => {
          addActivity({
            type: 'event',
            data: event,
          })
        })
        prevEventCountRef.current = evts.length
      }

      // Check for trait changes
      if (trts && evts.length > 0) {
        const hasSignificantChange =
          trts.fxAffinity > 0.3 ||
          trts.transferAffinity > 0.3 ||
          trts.topActions.length > 0

        if (hasSignificantChange && activities.filter((a) => a.type === 'trait').length === 0) {
          addActivity({
            type: 'trait',
            data: {
              fxAffinity: trts.fxAffinity,
              transferAffinity: trts.transferAffinity,
              topActions: trts.topActions,
            },
          })
        }
      }
    }

    loadAndUpdate()
    const interval = setInterval(loadAndUpdate, 500)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new activities arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activities])

  useEffect(() => {
    // Add LLM thinking to activity stream
    if (llmThinking) {
      addActivity({
        type: 'llm',
        data: llmThinking,
      })
    }
  }, [llmThinking])

  useEffect(() => {
    // Add layout change to activity stream
    if (schema) {
      addActivity({
        type: 'layout',
        data: {
          sectionCount: schema.sections.length,
          useLLM,
          sections: schema.sections.map((s) => s.component),
        },
      })
    }
  }, [schema, useLLM])


  const addActivity = (item: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }

    setActivities((prev) => {
      const updated = [...prev, newActivity]
      // Keep last 50 activities
      return updated.slice(-50)
    })
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-slate-950 border-l border-slate-800 flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-blue-950 to-slate-950">
        <div className="flex items-center gap-2 text-white mb-2">
          <Activity className="h-5 w-5 animate-pulse text-blue-400" />
          <h3 className="font-semibold">Live Activity</h3>
        </div>
        <div className="text-xs text-slate-400">
          {useLLM ? '🤖 AI-Powered Layout' : '📐 Rule-Based Layout'}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="p-3 bg-slate-900/50 border-b border-slate-800 grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-xs text-slate-400">Events</div>
          <div className="text-lg font-bold text-blue-400">{events.length}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">FX Affinity</div>
          <div className="text-lg font-bold text-green-400">
            {traits ? `${(traits.fxAffinity * 100).toFixed(0)}%` : '0%'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Transfer</div>
          <div className="text-lg font-bold text-purple-400">
            {traits ? `${(traits.transferAffinity * 100).toFixed(0)}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Activity Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-slate-500 py-8 text-sm"
            >
              Waiting for activity...
            </motion.div>
          ) : (
            activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <ActivityCard activity={activity} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-xs text-slate-400 text-center">
        Updates every 500ms • Last {activities.length} activities
      </div>
    </div>
  )
}

function ActivityCard({ activity }: { activity: ActivityItem }) {
  const timeAgo = getTimeAgo(activity.timestamp)

  if (activity.type === 'event') {
    return (
      <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-3 hover:bg-blue-950/50 transition-colors">
        <div className="flex items-start gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-blue-400 uppercase">
                {activity.data.type}
              </span>
              <span className="text-xs text-slate-500">{timeAgo}</span>
            </div>
            {activity.data.type === 'action' && (
              <div className="text-sm text-slate-300">{activity.data.name}</div>
            )}
            {activity.data.type === 'view' && (
              <div className="text-sm text-slate-300 font-mono truncate">
                {activity.data.path}
              </div>
            )}
            {activity.data.type === 'search' && (
              <div className="text-sm text-slate-300">&quot;{activity.data.term}&quot;</div>
            )}
            {activity.data.type === 'journey' && (
              <div className="text-sm text-slate-300">{activity.data.id}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (activity.type === 'trait') {
    return (
      <div className="bg-green-950/30 border border-green-800/50 rounded-lg p-3 hover:bg-green-950/50 transition-colors">
        <div className="flex items-start gap-2">
          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-green-400 uppercase">
                Trait Updated
              </span>
              <span className="text-xs text-slate-500">{timeAgo}</span>
            </div>
            <div className="text-sm text-slate-300 space-y-1">
              {activity.data.topActions?.length > 0 && (
                <div>Top: {activity.data.topActions.join(', ')}</div>
              )}
              {activity.data.fxAffinity > 0.3 && (
                <div className="text-green-400">FX Interest Detected</div>
              )}
              {activity.data.transferAffinity > 0.3 && (
                <div className="text-purple-400">Transfer Pattern Detected</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activity.type === 'layout') {
    return (
      <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-3 hover:bg-purple-950/50 transition-colors">
        <div className="flex items-start gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-purple-400 uppercase">
                Layout Changed
              </span>
              <span className="text-xs text-slate-500">{timeAgo}</span>
            </div>
            <div className="text-sm text-slate-300 space-y-1">
              <div>
                {activity.data.useLLM ? '🤖 AI Generated' : '📐 Rule-Based'} • {activity.data.sectionCount} sections
              </div>
              <div className="text-xs text-slate-400">
                {activity.data.sections.join(' → ')}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activity.type === 'llm') {
    return (
      <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3 hover:bg-amber-950/50 transition-colors">
        <div className="flex items-start gap-2">
          <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-400 uppercase">
                {activity.data.stage}
              </span>
              <span className="text-xs text-slate-500">{timeAgo}</span>
            </div>
            <div className="text-sm text-slate-300">{activity.data.message}</div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}
