import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Timer from './components/Timer'
import Background from './components/Background'
import SettingsPanel from './components/SettingsPanel'
import AuthModal from './components/AuthModal'
import UserMenu from './components/UserMenu'
import StatsPanel from './components/StatsPanel'
import TaskNotesPanel from './components/TaskNotesPanel'
import MusicPlayer from './components/MusicPlayer'
import { requestNotificationPermission, sendNotification } from './utils/audio'
import { useStore } from './store/useStore'
import { useAuthStore } from './store/useAuthStore'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  const { use24h, theme } = useStore()
  const { secondsLeft, running, mode } = useStore()

  // Dynamic document title — shows timer in browser tab
  useEffect(() => {
    const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
    const seconds = String(secondsLeft % 60).padStart(2, '0')
    const modeLabel = mode === 'focus' ? '🍅' : mode === 'short' ? '☕' : '🌿'
    document.title = running
      ? `${modeLabel} ${minutes}:${seconds} - Pomodoro Timer`
      : 'Pomodoro Timer'
  }, [secondsLeft, running, mode])

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  const stats = useStore((s) => s.stats)
  const { init, user, loadStatsFromFirestore, profile } = useAuthStore()

  // Apply accent color CSS variable whenever profile changes
  useEffect(() => {
    const colorMap = {
      sky:     '199 89% 48%',
      violet:  '263 70% 58%',
      emerald: '160 60% 45%',
      rose:    '347 77% 50%',
      amber:   '38 92% 50%',
      pink:    '330 81% 60%',
    }
    const hsl = colorMap[profile?.accentColor] || colorMap.sky
    document.documentElement.style.setProperty('--accent', hsl)
  }, [profile?.accentColor])

  // Init Firebase auth listener
  useEffect(() => {
    const unsubscribe = init()
    return unsubscribe
  }, [init])

  // When user signs in, load their stats, tasks and notes from Firestore
  useEffect(() => {
    if (user) {
      loadStatsFromFirestore().then((data) => {
        if (data?.stats) useStore.setState({ stats: data.stats })
        if (data?.tasks) useStore.setState({ tasks: data.tasks })
        if (data?.notes !== undefined) useStore.setState({ notes: data.notes })
        if (data?.sessionHistory) useStore.setState({ sessionHistory: data.sessionHistory })
      })
    }
  }, [user, loadStatsFromFirestore])

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Notifications + fullscreen listener
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const timeString = currentDateTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24h
  })

  const dateString = currentDateTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  const weekLabel = stats.thisWeek >= 60
    ? `${Math.floor(stats.thisWeek / 60)}h ${stats.thisWeek % 60}m`
    : `${stats.thisWeek}m`

  const handleSessionEnd = (sessionMode) => {
    const label = sessionMode === 'focus' ? 'Focus session completed!' : 'Break time over!'
    sendNotification('Pomodoro', { body: label })
  }

  return (
    <div className="min-h-screen bg-ghibliBG text-gray-100 overflow-hidden">
      <Background />

      {/* ── Top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">
        {/* Clock — shrinks on small screens */}
        <div className="select-none shrink-0">
          <div className="rounded-xl sm:rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm px-3 py-1.5 sm:px-5 sm:py-3">
            <div className="text-lg sm:text-3xl font-semibold text-white/90 tabular-nums leading-tight">
              {timeString}
            </div>
            <div className="hidden sm:block text-xs text-white/50 mt-1 tracking-wide">
              {dateString}
            </div>
          </div>
        </div>

        {/* Right side — user menu + settings */}
        <div className="flex items-center gap-2 shrink-0">
          <UserMenu onSignInClick={() => setAuthOpen(true)} />
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center justify-center bg-white/10 text-white p-2 sm:p-3 rounded-full border border-white/10 hover:bg-white/15 backdrop-blur-sm transition"
            aria-label="Open settings"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-20 min-h-screen flex items-center justify-center px-3 pt-16 pb-16 sm:pt-24 sm:pb-24">
        <div className="flex justify-center">
          <Timer onSessionEnd={handleSessionEnd} />
        </div>
      </main>

      {/* ── Bottom bar — stats ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-end px-3 py-3 sm:px-6 sm:py-4 pointer-events-none">
        <div className="pointer-events-auto">
          <AnimatePresence>
            {statsOpen && (
              <motion.div
                className="mb-3 w-[min(320px,calc(100vw-1.5rem))]"
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <StatsPanel />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setStatsOpen((o) => !o)}
            className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-white/10 transition ml-auto"
          >
            <svg className="h-4 w-4 text-white/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span className="text-sm text-white/70 tabular-nums hidden xs:inline sm:inline">{weekLabel}</span>
            <span className="hidden sm:inline text-xs text-white/40">this week</span>
            <span className="text-xs text-white/40">·</span>
            <span className="text-sm text-white/70">{stats.streak}🔥</span>
          </button>
        </div>
      </div>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div className="hidden lg:block"><TaskNotesPanel /></div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <div className="hidden sm:block"><MusicPlayer /></div>
    </div>
  )
}
