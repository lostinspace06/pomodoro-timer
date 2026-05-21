import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { ensureAudioUnlocked, playAlarmSound } from '../utils/audio'

export default function Timer({ onSessionEnd }) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef(null)

  const {
    mode,
    running,
    secondsLeft,
    durations,
    round,
    focusCount,
    longAfter,
    autoSwitch,
    autoStartBreak,
    autoStartFocus,
    alarmSound,
    toggleRunning,
    nextSession,
    setSecondsLeft,
    setMode,
    setDurations,
    incrementRound,
    reset,
    animationsEnabled
  } = useStore()

  const intervalRef = useRef(null)

  const buttonBase = 'rounded-full px-9 py-4 text-lg font-semibold transition border border-white/20 shadow-sm shadow-black/20 backdrop-blur-sm'
  const themedButton = (bgClass, textClass = 'text-white') =>
    `${buttonBase} ${bgClass} ${textClass} hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30`

  const modeButtonClass = (buttonMode) =>
    `rounded-full px-7 py-3.5 text-base font-semibold transition border border-white/15 ${mode === buttonMode ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10'} focus:outline-none focus:ring-2 focus:ring-white/20`

  const changeMode = async (newMode) => {
    if (running) toggleRunning()
    setMode(newMode)
  }

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      const current = useStore.getState().secondsLeft
      if (current > 0) {
        setSecondsLeft(current - 1)
      }
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [running, setSecondsLeft])

  useEffect(() => {
    if (secondsLeft === 0 && running) {
      toggleRunning()
      playAlarmSound(alarmSound)
      if (onSessionEnd) onSessionEnd(mode)
      incrementRound()

      if (autoSwitch) {
        setTimeout(() => {
          // focusCount has already been incremented by incrementRound above
          const newFocusCount = useStore.getState().focusCount
          const nextMode =
            mode === 'focus'
              ? newFocusCount % longAfter === 0
                ? 'long'
                : 'short'
              : 'focus'
          setMode(nextMode)

          if (
            (nextMode === 'short' && autoStartBreak) ||
            (nextMode === 'long' && autoStartBreak) ||
            (nextMode === 'focus' && autoStartFocus)
          ) {
            toggleRunning()
          }
        }, 1400)
      }
    }
  }, [secondsLeft, running, mode, round, longAfter, autoSwitch, autoStartBreak, autoStartFocus, onSessionEnd, toggleRunning, setMode, incrementRound])

  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Don't intercept shortcuts when typing in an input/textarea
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        if (!running) await ensureAudioUnlocked()
        toggleRunning()
      }
      if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        reset()
      }
      if (e.code === 'KeyN' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        nextSession()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [running, reset, nextSession, toggleRunning])

  const pct = Math.min(1, Math.max(0, 1 - secondsLeft / durations[mode]))
  const timerGradientColors = running ? ['#fb923c', '#f97316'] : ['#7dd3fc', '#60a5fa']
  const progressAngle = -Math.PI / 2 + pct * 2 * Math.PI
  const dotX = 130 + 110 * Math.cos(progressAngle)
  const dotY = 130 + 110 * Math.sin(progressAngle)
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  const formattedTime = `${minutes}:${seconds}`

  useEffect(() => {
    if (!editing) {
      setEditValue(formattedTime)
    }
  }, [editing, formattedTime])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const parseTimeValue = (value) => {
    const input = value.trim()
    if (!input) return null

    const colonMatch = input.match(/^(\d+):(\d{1,2})$/)
    if (colonMatch) {
      const mins = Number(colonMatch[1])
      const secs = Number(colonMatch[2])
      if (secs >= 0 && secs < 60) {
        return mins * 60 + secs
      }
      return null
    }

    const digitsMatch = input.match(/^\d+$/)
    if (digitsMatch) {
      return Number(input) * 60
    }

    return null
  }

  const applyEdit = () => {
    const newSeconds = parseTimeValue(editValue)
    if (newSeconds && newSeconds > 0) {
      setDurations({ [mode]: newSeconds })
      setSecondsLeft(newSeconds)
    } else {
      setEditValue(formattedTime)
    }
    setEditing(false)
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-10 py-10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex gap-3 mb-2">
        <button type="button" onClick={() => changeMode('focus')} className={modeButtonClass('focus')}>
          Focus
        </button>
        <button type="button" onClick={() => changeMode('short')} className={modeButtonClass('short')}>
          Short Break
        </button>
        <button type="button" onClick={() => changeMode('long')} className={modeButtonClass('long')}>
          Long Break
        </button>
      </div>
      <div className="relative">
        {running && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/25 blur-3xl"
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <svg width="260" height="260" viewBox="0 0 260 260" className="drop-shadow-lg">
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={timerGradientColors[0]} />
              <stop offset="100%" stopColor={timerGradientColors[1]} />
            </linearGradient>
          </defs>

          <circle cx="130" cy="130" r="110" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="4" fill="none" />
          <motion.circle
            cx="130"
            cy="130"
            r="110"
            stroke="url(#timerGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={2 * Math.PI * 110}
            animate={{ strokeDashoffset: (1 - pct) * 2 * Math.PI * 110 }}
            style={{ rotate: -90 }}
            transition={animationsEnabled ? { type: 'tween', duration: 0.5 } : { duration: 0 }}
          />
          {running && (
            <circle
              cx={dotX}
              cy={dotY}
              r="9"
              fill="#fb923c"
              opacity="0.98"
            />
          )}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={applyEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyEdit()
                }
                if (e.key === 'Escape') {
                  setEditing(false)
                  setEditValue(formattedTime)
                }
              }}
              className="w-40 text-center text-6xl font-bold text-white bg-black/60 border border-white/20 rounded-lg outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-6xl font-bold text-white"
            >
              {formattedTime}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-6 -translate-y-2">
        {!running ? (
          <button
            type="button"
            onClick={async () => {
              await ensureAudioUnlocked()
              toggleRunning()
            }}
            className={themedButton('bg-emerald-500/20', 'text-emerald-100')}
          >
            Start
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => toggleRunning()}
              className={themedButton('bg-amber-500/20', 'text-amber-100')}
            >
              Pause
            </button>
            <button
              type="button"
              onClick={() => {
                if (running) toggleRunning()
                reset()
              }}
              className={themedButton('bg-white/10', 'text-white/60')}
            >
              Reset
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
