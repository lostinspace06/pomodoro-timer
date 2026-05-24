import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { ensureAudioUnlocked, playAlarmSound } from '../utils/audio'

export default function Timer({ onSessionEnd }) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [labelEditing, setLabelEditing] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')
  const inputRef = useRef(null)
  const labelInputRef = useRef(null)

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
    sessionLabel,
    toggleRunning,
    nextSession,
    setSecondsLeft,
    setMode,
    setDurations,
    incrementRound,
    reset,
    animationsEnabled,
    setSessionLabel,
  } = useStore()

  const intervalRef = useRef(null)

  const buttonBase = 'rounded-full px-6 py-2.5 sm:px-9 sm:py-4 text-base sm:text-lg font-semibold transition border border-white/20 shadow-sm shadow-black/20 backdrop-blur-sm'
  const themedButton = (bgClass, textClass = 'text-white') =>
    `${buttonBase} ${bgClass} ${textClass} hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30`

  const modeButtonClass = (buttonMode) =>
    `rounded-full px-3 py-2 sm:px-7 sm:py-3.5 text-xs sm:text-base font-semibold transition border border-white/15 ${mode === buttonMode ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10'} focus:outline-none focus:ring-2 focus:ring-white/20`

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
      } else {
        // No auto-switch: still reset the timer to the next logical session duration
        // so it doesn't sit stuck at 0:00
        setTimeout(() => {
          const newFocusCount = useStore.getState().focusCount
          const nextMode =
            mode === 'focus'
              ? newFocusCount % longAfter === 0
                ? 'long'
                : 'short'
              : 'focus'
          setMode(nextMode)
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

  useEffect(() => {
    if (labelEditing && labelInputRef.current) {
      labelInputRef.current.focus()
      labelInputRef.current.select()
    }
  }, [labelEditing])

  const openLabelEdit = () => {
    setLabelDraft(sessionLabel)
    setLabelEditing(true)
  }

  const commitLabel = () => {
    setSessionLabel(labelDraft.trim())
    setLabelEditing(false)
  }

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
      className="flex flex-col items-center gap-4 sm:gap-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-5 py-6 sm:px-10 sm:py-10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Mode buttons */}
      <div className="flex gap-2 sm:gap-3 mb-0 sm:mb-2">
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

      {/* Session label chip — only in focus mode */}
      {mode === 'focus' && (
        <div className="flex items-center justify-center -mt-4 min-h-[28px]">
          <AnimatePresence mode="wait">
            {labelEditing ? (
              <motion.input
                key="label-input"
                ref={labelInputRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitLabel()
                  if (e.key === 'Escape') setLabelEditing(false)
                }}
                placeholder="What are you working on?"
                maxLength={60}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-white/25 transition text-center w-64"
              />
            ) : sessionLabel ? (
              <motion.button
                key="label-chip"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                onClick={openLabelEdit}
                className="group flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-white/70 hover:text-white hover:border-white/25 transition"
              >
                <span className="text-white/40"></span>
                <span className="max-w-[200px] truncate">{sessionLabel}</span>
                <svg className="h-3 w-3 text-white/30 group-hover:text-white/60 transition shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </motion.button>
            ) : (
              <motion.button
                key="label-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                onClick={openLabelEdit}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3 py-1 text-xs text-white/25 hover:text-white/50 hover:border-white/25 transition"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add session label
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
      <div className="relative w-[200px] h-[200px] sm:w-[260px] sm:h-[260px]">
        {running && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-20 w-20 sm:h-28 sm:w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/25 blur-3xl"
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <svg width="100%" height="100%" viewBox="0 0 260 260" className="drop-shadow-lg">
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
              className="text-4xl sm:text-6xl font-bold text-white"
            >
              {formattedTime}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-2 sm:mt-6 sm:-translate-y-2">
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
