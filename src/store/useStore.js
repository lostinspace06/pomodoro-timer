import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTodayDateString, isYesterday } from '../utils/helpers'

// Debounce helper — delays Firestore task sync to avoid writing on every keystroke
let taskSyncTimer = null
const debouncedTaskSync = (tasks, notes) => {
  clearTimeout(taskSyncTimer)
  taskSyncTimer = setTimeout(() => {
    import('../store/useAuthStore').then(({ useAuthStore }) => {
      useAuthStore.getState().syncTasksToFirestore(tasks, notes)
    })
  }, 1000)
}

const defaultStats = {
  today: 0,
  thisWeek: 0,
  completed: 0,
  streak: 0,
  lastSessionDate: null,
  weekHistory: []
}

// Debounce helper for history sync
let historySyncTimer = null
const debouncedHistorySync = (history) => {
  clearTimeout(historySyncTimer)
  historySyncTimer = setTimeout(() => {
    import('../store/useAuthStore').then(({ useAuthStore }) => {
      useAuthStore.getState().syncHistoryToFirestore(history)
    })
  }, 1000)
}

const createWeekHistory = (history, date, minutes) => {
  const existing = history.find((entry) => entry.date === date)
  if (existing) {
    return history.map((entry) =>
      entry.date === date ? { ...entry, minutes: entry.minutes + minutes } : entry
    )
  }
  return [...history, { date, minutes }]
}

const getThisWeekTotal = (weekHistory) => {
  const today = new Date(getTodayDateString())
  return weekHistory.reduce((sum, entry) => {
    const entryDate = new Date(entry.date)
    const diffDays = Math.round((today - entryDate) / (1000 * 60 * 60 * 24))
    if (diffDays >= 0 && diffDays < 7) {
      return sum + entry.minutes
    }
    return sum
  }, 0)
}

export const useStore = create(
  persist(
    (set, get) => ({
      mode: 'focus',
      running: false,
      secondsLeft: 25 * 60,
      durations: { focus: 25 * 60, short: 5 * 60, long: 15 * 60 },
      round: 0,
      focusCount: 0, // counts only completed focus sessions

      autoSwitch: false,
      longAfter: 4,
      autoStartBreak: false,
      autoStartFocus: false,
      use24h: true,
      soundEnabled: true,
      alarmVolume: 0.8,
      ambienceVolume: 0.5,
      animationsEnabled: true,
      backgroundBlur: 28,
      theme: 'dark',
      selectedBackground: 'capy1',
      selectedAmbience: 'rain',
      alarmSound: 'chime',

      tasks: [
        { id: 'task-1', title: 'Write a short session note', done: false },
        { id: 'task-2', title: 'Keep the space quiet and warm', done: false }
      ],
      notes: '',
      customBackgrounds: [], // [{ id, name, dataUrl }]
      builtInBackgroundNames: {}, // { [id]: customName } overrides for built-in backgrounds

      stats: defaultStats,

      // Focus goal: daily target in minutes (0 = not set)
      focusGoal: 0,
      // Label for the current/next session
      sessionLabel: '',
      // History log: [{ id, mode, label, minutes, date, timestamp }]
      sessionHistory: [],

      setDurations: (d) =>
        set((state) => {
          const durations = { ...state.durations, ...d }
          return {
            durations,
            secondsLeft: state.mode in d ? durations[state.mode] : state.secondsLeft
          }
        }),

      toggleRunning: () => set((state) => ({ running: !state.running })),

      setMode: (mode) =>
        set((state) => ({
          mode,
          secondsLeft: state.durations[mode]
        })),

      setSecondsLeft: (secondsLeft) =>
        set({ secondsLeft: Math.max(0, secondsLeft) }),

      incrementRound: () =>
        set((state) => {
          const nextRound = state.round + 1
          const isFocus = state.mode === 'focus'
          const sessionMinutes = Math.round(state.durations[state.mode] / 60)
          const currentDate = getTodayDateString()
          const lastSessionDate = state.stats.lastSessionDate

          // Only focus sessions affect streak, today's time, and week history
          const isNextStreak = lastSessionDate && isYesterday(lastSessionDate, currentDate)
          const streak = isFocus
            ? isNextStreak
              ? state.stats.streak + 1
              : lastSessionDate === currentDate
              ? state.stats.streak
              : 1
            : state.stats.streak

          const weekHistory = isFocus
            ? createWeekHistory(state.stats.weekHistory, currentDate, sessionMinutes)
            : state.stats.weekHistory

          // today resets if the last session was on a different day
          const todayBase = lastSessionDate === currentDate ? state.stats.today : 0
          const today = isFocus ? todayBase + sessionMinutes : state.stats.today

          const thisWeek = getThisWeekTotal(weekHistory)

          // completed counts all sessions (focus + breaks)
          const completed = state.stats.completed + 1

          // Only update lastSessionDate on focus sessions so breaks don't break streaks
          const newLastSessionDate = isFocus ? currentDate : lastSessionDate

          const newStats = {
            ...state.stats,
            completed,
            today,
            thisWeek,
            streak,
            lastSessionDate: newLastSessionDate,
            weekHistory
          }

          // Push to session history log
          const historyEntry = {
            id: `h-${Date.now()}`,
            mode: state.mode,
            label: state.sessionLabel.trim() || null,
            minutes: sessionMinutes,
            date: currentDate,
            timestamp: Date.now(),
          }
          const sessionHistory = [historyEntry, ...state.sessionHistory].slice(0, 100)

          // Sync to Firestore if signed in
          import('../store/useAuthStore').then(({ useAuthStore }) => {
            useAuthStore.getState().syncStatsToFirestore(newStats)
          })
          debouncedHistorySync(sessionHistory)

          return {
            round: nextRound,
            focusCount: isFocus ? state.focusCount + 1 : state.focusCount,
            stats: newStats,
            sessionHistory,
            // Clear label after focus session completes
            sessionLabel: isFocus ? '' : state.sessionLabel,
          }
        }),

      reset: () =>
        set((state) => ({
          running: false,
          mode: 'focus',
          secondsLeft: state.durations.focus,
          round: 0,
          focusCount: 0
        })),

      nextSession: () =>
        set((state) => {
          const nextMode = state.mode === 'focus'
            ? state.focusCount % state.longAfter === 0 && state.focusCount > 0
              ? 'long'
              : 'short'
            : 'focus'
          return {
            mode: nextMode,
            secondsLeft: state.durations[nextMode],
            running: false
          }
        }),

      setSetting: (key, value) => set({ [key]: value }),

      setSessionLabel: (label) => set({ sessionLabel: label }),

      setFocusGoal: (minutes) => set({ focusGoal: minutes }),

      clearHistory: () => set({ sessionHistory: [] }),

      addTask: (title) =>
        set((state) => {
          const tasks = [
            ...state.tasks,
            { id: `task-${Date.now()}`, title, done: false }
          ]
          debouncedTaskSync(tasks, state.notes)
          return { tasks }
        }),

      toggleTask: (id) =>
        set((state) => {
          const tasks = state.tasks.map((task) =>
            task.id === id ? { ...task, done: !task.done } : task
          )
          debouncedTaskSync(tasks, state.notes)
          return { tasks }
        }),

      updateTaskTitle: (id, title) =>
        set((state) => {
          const tasks = state.tasks.map((task) =>
            task.id === id ? { ...task, title } : task
          )
          debouncedTaskSync(tasks, state.notes)
          return { tasks }
        }),

      removeTask: (id) =>
        set((state) => {
          const tasks = state.tasks.filter((task) => task.id !== id)
          debouncedTaskSync(tasks, state.notes)
          return { tasks }
        }),

      setNotes: (notes) => {
        set({ notes })
        const tasks = useStore.getState().tasks
        debouncedTaskSync(tasks, notes)
      },

      renameBackground: (id, name) =>
        set((state) => {
          // Check if it's a custom background
          const isCustom = state.customBackgrounds.some((bg) => bg.id === id)
          if (isCustom) {
            return {
              customBackgrounds: state.customBackgrounds.map((bg) =>
                bg.id === id ? { ...bg, name } : bg
              )
            }
          }
          // Built-in — store name override
          return {
            builtInBackgroundNames: { ...state.builtInBackgroundNames, [id]: name }
          }
        }),

      addCustomBackground: (name, dataUrl) =>
        set((state) => ({
          customBackgrounds: [
            ...state.customBackgrounds,
            { id: `custom-${Date.now()}`, name, dataUrl }
          ]
        })),

      removeCustomBackground: (id) =>
        set((state) => ({
          customBackgrounds: state.customBackgrounds.filter((bg) => bg.id !== id),
          // If the deleted bg was selected, fall back to first capy
          selectedBackground: state.selectedBackground === id ? 'capy1' : state.selectedBackground
        })),

      resetStats: () => set({ stats: defaultStats })
    }),
    {
      name: 'pomodoroState',
      partialize: (state) => ({
        mode: state.mode,
        running: false, // never persist running state — always start paused on reload
        secondsLeft: state.secondsLeft,
        durations: state.durations,
        round: state.round,
        focusCount: state.focusCount,
        autoSwitch: state.autoSwitch,
        longAfter: state.longAfter,
        autoStartBreak: state.autoStartBreak,
        autoStartFocus: state.autoStartFocus,
        use24h: state.use24h,
        soundEnabled: state.soundEnabled,
        alarmVolume: state.alarmVolume,
        ambienceVolume: state.ambienceVolume,
        animationsEnabled: state.animationsEnabled,
        backgroundBlur: state.backgroundBlur,
        theme: state.theme,
        selectedBackground: state.selectedBackground,
        selectedAmbience: state.selectedAmbience,
        alarmSound: state.alarmSound,
        tasks: state.tasks,
        notes: state.notes,
        customBackgrounds: state.customBackgrounds,
        builtInBackgroundNames: state.builtInBackgroundNames,
        stats: state.stats,
        focusGoal: state.focusGoal,
        sessionLabel: state.sessionLabel,
        sessionHistory: state.sessionHistory,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        stats: {
          ...currentState.stats,
          ...persistedState.stats
        }
      })
    }
  )
)
