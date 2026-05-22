import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'

const GOAL_OPTIONS = [30, 60, 90, 120, 150, 180, 240]

const MODE_META = {
  focus: { label: 'Focus',       emoji: '🍅', color: 'text-orange-300' },
  short: { label: 'Short Break', emoji: '☕', color: 'text-sky-300'    },
  long:  { label: 'Long Break',  emoji: '🌿', color: 'text-emerald-300' },
}

function formatTime(minutes) {
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${minutes}m`
}

function formatTimestamp(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function StatsPanel() {
  const { stats, focusGoal, setFocusGoal, sessionHistory, clearHistory } = useStore()
  const [tab, setTab] = useState('stats') // 'stats' | 'history'

  const weekLabel = formatTime(stats.thisWeek)
  const goalPct = focusGoal > 0 ? Math.min(1, stats.today / focusGoal) : 0
  const goalMet = focusGoal > 0 && stats.today >= focusGoal

  // Group history by date for display
  const todayStr = new Date().toISOString().split('T')[0]
  const todayHistory = sessionHistory.filter((e) => e.date === todayStr)
  const olderHistory = sessionHistory.filter((e) => e.date !== todayStr)

  return (
    <motion.div
      className="rounded-2xl border border-white/15 bg-black/40 backdrop-blur-2xl overflow-hidden"
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-white/10">
        {['stats', 'history'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-widest transition ${
              tab === t ? 'text-white border-b-2 border-white/40' : 'text-white/35 hover:text-white/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'stats' ? (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="p-5 space-y-4"
          >
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Focus Time"  value={`${Math.floor(stats.today)}m`} subtext="today" />
              <StatCard label="Completed"   value={stats.completed}               subtext="sessions" />
              <StatCard label="This Week"   value={weekLabel}                     subtext="total" />
              <StatCard label="Streak"      value={`${stats.streak}🔥`}           subtext="days" />
            </div>

            {/* Focus goal */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Daily Goal</span>
                {goalMet && (
                  <span className="text-xs text-emerald-400 font-semibold">✓ Done</span>
                )}
              </div>

              {/* Goal selector */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setFocusGoal(0)}
                  className={`rounded-lg px-2.5 py-1 text-xs transition border ${
                    focusGoal === 0
                      ? 'bg-white/15 border-white/30 text-white'
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                  }`}
                >
                  Off
                </button>
                {GOAL_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setFocusGoal(g)}
                    className={`rounded-lg px-2.5 py-1 text-xs transition border ${
                      focusGoal === g
                        ? 'bg-white/15 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {formatTime(g)}
                  </button>
                ))}
              </div>

              {/* Progress bar */}
              {focusGoal > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${goalMet ? 'bg-emerald-400' : 'bg-orange-400'}`}
                      animate={{ width: `${goalPct * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/30">
                    <span>{Math.floor(stats.today)}m done</span>
                    <span>{focusGoal}m goal</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col"
          >
            {sessionHistory.length === 0 ? (
              <p className="text-xs text-white/25 text-center py-10">No sessions yet</p>
            ) : (
              <>
                <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-4">
                  {todayHistory.length > 0 && (
                    <HistoryGroup label="Today" entries={todayHistory} />
                  )}
                  {olderHistory.length > 0 && (
                    <HistoryGroup label="Earlier" entries={olderHistory} />
                  )}
                </div>
                <div className="border-t border-white/10 px-4 py-2.5">
                  <button
                    onClick={clearHistory}
                    className="text-xs text-white/25 hover:text-rose-400 transition"
                  >
                    Clear history
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function HistoryGroup({ label, entries }) {
  return (
    <div>
      <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">{label}</p>
      <div className="space-y-1.5">
        {entries.map((entry) => {
          const meta = MODE_META[entry.mode] || MODE_META.focus
          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2"
            >
              <span className="text-base shrink-0">{meta.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${meta.color}`}>
                  {entry.label || meta.label}
                </p>
                <p className="text-xs text-white/30">{entry.minutes}m · {formatTimestamp(entry.timestamp)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/40 font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/25 mt-0.5">{subtext}</div>
    </div>
  )
}
