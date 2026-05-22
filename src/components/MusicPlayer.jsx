import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { startAmbient, stopAmbient, setAmbientVolume, ensureAudioUnlocked } from '../utils/audio'

const SOUNDS = [
  { id: 'tick-tock',     label: 'Tick Tock',        emoji: '🕐', group: 'Rhythm' },
  { id: 'metronome',     label: 'Metronome',         emoji: '🎵', group: 'Rhythm' },
  { id: 'countdown',     label: 'Countdown',         emoji: '⏱️', group: 'Rhythm' },
  { id: 'rain',          label: 'Rain',              emoji: '🌧️', group: 'Nature' },
  { id: 'ocean-shore',   label: 'Ocean Shore',       emoji: '🌊', group: 'Nature' },
  { id: 'stream',        label: 'Stream',            emoji: '💧', group: 'Nature' },
  { id: 'wind',          label: 'Wind',              emoji: '🌬️', group: 'Nature' },
  { id: 'wind-crickets', label: 'Wind & Crickets',   emoji: '🦗', group: 'Nature' },
  { id: 'wilderness',    label: 'Wilderness',        emoji: '🌿', group: 'Nature' },
  { id: 'frogs-night',   label: 'Frogs at Night',    emoji: '🐸', group: 'Nature' },
  { id: 'cafe',          label: 'Café',              emoji: '☕', group: 'Spaces' },
  { id: 'library',       label: 'Library',           emoji: '📚', group: 'Spaces' },
  { id: 'classroom',     label: 'Classroom',         emoji: '🏫', group: 'Spaces' },
  { id: 'bonfire',       label: 'Bonfire',           emoji: '🔥', group: 'Spaces' },
  { id: 'brown-noise',   label: 'Brown Noise',       emoji: '🟤', group: 'Noise' },
  { id: 'white-noise',   label: 'White Noise',       emoji: '⬜', group: 'Noise' },
]

const GROUPS = ['Noise', 'Rhythm', 'Nature', 'Spaces']

export default function MusicPlayer() {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const { selectedAmbience, ambienceVolume, setSetting } = useStore()

  const currentSound = SOUNDS.find((s) => s.id === selectedAmbience) || SOUNDS[3]

  const handleSelect = async (id) => {
    setSetting('selectedAmbience', id)
    await ensureAudioUnlocked()
    await startAmbient(id)
    setPlaying(true)
    setPickerOpen(false)
  }

  const handlePlayPause = async () => {
    if (playing) {
      stopAmbient()
      setPlaying(false)
    } else {
      await ensureAudioUnlocked()
      await startAmbient(selectedAmbience)
      setPlaying(true)
    }
  }

  const handleVolume = async (e) => {
    const val = Number(e.target.value)
    setSetting('ambienceVolume', val)
    await setAmbientVolume(val)
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3">

      {/* Sound picker panel */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            className="w-72 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-2xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <div className="px-4 pt-3 pb-2 border-b border-white/5">
              <p className="text-sm font-semibold text-white">Sounds</p>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {GROUPS.map((group) => (
                <div key={group}>
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group}
                  </p>
                  {SOUNDS.filter((s) => s.group === group).map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => handleSelect(sound.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition hover:bg-white/5 ${
                        selectedAmbience === sound.id ? 'text-white bg-white/10' : 'text-gray-300'
                      }`}
                    >
                      <span className="text-base w-6 text-center">{sound.emoji}</span>
                      <span className="flex-1 text-left">{sound.label}</span>
                      {selectedAmbience === sound.id && playing && (
                        <EqBars />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spotify-style now-playing widget — only when playing */}
      <AnimatePresence>
        {playing && (
          <motion.div
            className="w-64 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-2xl shadow-xl px-4 py-3"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            {/* Track info */}
            <div className="flex items-center gap-3 mb-3">
              {/* Album art placeholder */}
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center text-xl shrink-0">
                {currentSound.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{currentSound.label}</p>
                <p className="text-xs text-gray-400">Ambient · Pomodoro</p>
              </div>
              {/* Animated eq */}
              <EqBars />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-3">
              {/* Prev */}
              <button
                onClick={() => {
                  const idx = SOUNDS.findIndex((s) => s.id === selectedAmbience)
                  const prev = SOUNDS[(idx - 1 + SOUNDS.length) % SOUNDS.length]
                  handleSelect(prev.id)
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="19,20 9,12 19,4"/>
                  <rect x="5" y="4" width="2" height="16" rx="1"/>
                </svg>
              </button>

              {/* Play / Pause */}
              <button
                onClick={handlePlayPause}
                className="h-9 w-9 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                {playing ? (
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 3l14 9-14 9V3z"/>
                  </svg>
                )}
              </button>

              {/* Next */}
              <button
                onClick={() => {
                  const idx = SOUNDS.findIndex((s) => s.id === selectedAmbience)
                  const next = SOUNDS[(idx + 1) % SOUNDS.length]
                  handleSelect(next.id)
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,4 15,12 5,20"/>
                  <rect x="17" y="4" width="2" height="16" rx="1"/>
                </svg>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={ambienceVolume}
                  onChange={handleVolume}
                  className="w-16"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Music icon button — always visible */}
      <button
        onClick={() => setPickerOpen((o) => !o)}
        className={`rounded-full border border-white/15 backdrop-blur-sm px-5 py-3 flex items-center gap-2.5 justify-center transition ${
          pickerOpen ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
        }`}
        aria-label="Open sound picker"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <span className="text-sm font-medium">Sounds</span>
      </button>
    </div>
  )
}

// Animated equalizer bars
function EqBars() {
  return (
    <span className="flex gap-0.5 items-end h-3.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-0.5 bg-sky-400 rounded-full"
          animate={{ height: ['3px', '10px', '3px'] }}
          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}


