import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { startAmbient, stopAmbient, setAmbientVolume, testAlarmSound, ensureAudioUnlocked } from '../utils/audio'

const backgrounds = [
  { id: 'capy1', name: 'Capybara 1', thumb: `${import.meta.env.BASE_URL}backgrounds/capy1.jpg` },
  { id: 'capy2', name: 'Capybara 2', thumb: `${import.meta.env.BASE_URL}backgrounds/capy2.jpg` },
  { id: 'capy3', name: 'Capybara 3', thumb: `${import.meta.env.BASE_URL}backgrounds/capy3.jpg` },
  { id: 'capy4', name: 'Capybara 4', thumb: `${import.meta.env.BASE_URL}backgrounds/capy4.jpg` },
]

const AMBIENCE_OPTIONS = [
  'tick-tock', 'countdown', 'metronome',
  'wind-crickets', 'classroom', 'wilderness',
  'stream', 'ocean-shore', 'rain', 'cafe',
  'bonfire', 'library', 'wind', 'frogs-night',
  'brown-noise', 'white-noise'
]

export default function SettingsPanel({ isOpen, onClose }) {
  const {
    durations, setDurations, setSetting,
    autoSwitch, autoStartBreak, autoStartFocus, longAfter,
    use24h, soundEnabled, alarmVolume, ambienceVolume,
    selectedAmbience, selectedBackground, alarmSound,
    customBackgrounds, removeCustomBackground,
    builtInBackgroundNames, renameBackground,
  } = useStore()

  const bgFileRef = React.useRef(null)

  const handleBgUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const name = file.name.replace(/\.[^.]+$/, '')
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1920
      const scale = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      const newId = `custom-${Date.now()}`
      // Add and immediately select
      useStore.setState((state) => ({
        customBackgrounds: [...state.customBackgrounds, { id: newId, name, dataUrl }],
        selectedBackground: newId
      }))
      URL.revokeObjectURL(url)
    }
    img.src = url
    e.target.value = ''
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 h-screen w-full sm:max-w-md bg-black/40 backdrop-blur-2xl border-l border-white/15 overflow-y-auto z-50"
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, x: 400, transition: { duration: 0.2 } }}
          >
            <div className="p-6 space-y-6">

              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Settings</h2>
                <button
                  onClick={onClose}
                  className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1 text-sm text-white/60 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* ── Timer Durations ── */}
              <Section title="Timer Durations">
                {[
                  { key: 'focus', label: 'Focus', max: 60 },
                  { key: 'short', label: 'Short Break', max: 30 },
                  { key: 'long',  label: 'Long Break',  max: 60 },
                ].map(({ key, label, max }) => (
                  <Row key={key} label={label}>
                    <div className="flex items-center gap-2">
                      <DurationInput
                        value={Math.round(durations[key] / 60)}
                        min={1}
                        max={max}
                        onCommit={(val) => setDurations({ [key]: val * 60 })}
                      />
                      <span className="text-xs text-white/40">min</span>
                    </div>
                  </Row>
                ))}
              </Section>

              {/* ── Session ── */}
              <Section title="Session">
                <ToggleSetting label="Auto-switch sessions" checked={autoSwitch}     onChange={() => setSetting('autoSwitch', !autoSwitch)} />
                <ToggleSetting label="Auto-start breaks"    checked={autoStartBreak} onChange={() => setSetting('autoStartBreak', !autoStartBreak)} />
                <ToggleSetting label="Auto-start focus"     checked={autoStartFocus} onChange={() => setSetting('autoStartFocus', !autoStartFocus)} />
                <Row label="Long break after">
                  <select
                    value={longAfter}
                    onChange={(e) => setSetting('longAfter', Number(e.target.value))}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white outline-none"
                  >
                    {[2, 3, 4, 5].map((n) => (
                      <option key={n} value={n} className="bg-slate-900">{n} sessions</option>
                    ))}
                  </select>
                </Row>
              </Section>

              {/* ── Display ── */}
              <Section title="Display">
                <ToggleSetting label="24-hour format" checked={use24h} onChange={() => setSetting('use24h', !use24h)} />

                {/* Background picker */}
                <div className="pt-1 space-y-3">
                  <span className="text-sm text-white/70">Background</span>
                  <div className="grid grid-cols-2 gap-3">
                    {backgrounds.map((bg) => {
                      const displayName = builtInBackgroundNames[bg.id] || bg.name
                      return (
                        <BackgroundCard
                          key={bg.id}
                          id={bg.id}
                          name={displayName}
                          thumb={bg.thumb}
                          selected={selectedBackground === bg.id}
                          onSelect={() => setSetting('selectedBackground', bg.id)}
                          onRename={(name) => renameBackground(bg.id, name)}
                        />
                      )
                    })}

                    {customBackgrounds.map((bg) => (
                      <BackgroundCard
                        key={bg.id}
                        id={bg.id}
                        name={bg.name}
                        thumb={bg.dataUrl}
                        selected={selectedBackground === bg.id}
                        onSelect={() => setSetting('selectedBackground', bg.id)}
                        onRename={(name) => renameBackground(bg.id, name)}
                        onDelete={() => removeCustomBackground(bg.id)}
                      />
                    ))}
                  </div>

                  {/* Upload button */}
                  <button
                    type="button"
                    onClick={() => bgFileRef.current?.click()}
                    className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/8 px-4 py-3 text-sm text-white/50 hover:text-white/80 transition flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload your own
                  </button>
                  <input
                    ref={bgFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBgUpload}
                  />
                </div>
              </Section>
              <Section title="Audio">
                <ToggleSetting
                  label="Sound enabled"
                  checked={soundEnabled}
                  onChange={async () => {
                    const next = !soundEnabled
                    setSetting('soundEnabled', next)
                    if (!next) stopAmbient()
                    else { await ensureAudioUnlocked(); startAmbient(selectedAmbience) }
                  }}
                />

                <SliderRow
                  label="Alarm volume"
                  value={alarmVolume}
                  onChange={(v) => setSetting('alarmVolume', v)}
                />

                <SliderRow
                  label="Ambience volume"
                  value={ambienceVolume}
                  onChange={async (v) => { setSetting('ambienceVolume', v); await setAmbientVolume(v) }}
                />

                <Row label="Ambience">
                  <select
                    value={selectedAmbience}
                    onChange={async (e) => {
                      setSetting('selectedAmbience', e.target.value)
                      await ensureAudioUnlocked()
                      startAmbient(e.target.value)
                    }}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white outline-none max-w-[160px]"
                  >
                    {AMBIENCE_OPTIONS.map((a) => (
                      <option key={a} value={a} className="bg-slate-900">
                        {a.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </Row>

                <Row label="Alarm sound">
                  <select
                    value={alarmSound}
                    onChange={(e) => setSetting('alarmSound', e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white outline-none"
                  >
                    {['chime', 'soft', 'long'].map((s) => (
                      <option key={s} value={s} className="bg-slate-900">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </Row>

                <button
                  type="button"
                  onClick={async () => { await ensureAudioUnlocked(); testAlarmSound(alarmSound) }}
                  className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition"
                >
                  Test alarm sound
                </button>
              </Section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/70">{label}</span>
      {children}
    </div>
  )
}

function SliderRow({ label, value, min = 0, max = 1, step = 0.05, display, onChange }) {
  const pct = display ?? `${Math.round(value * 100)}%`
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-white/70">{label}</span>
        <span className="text-xs text-white/40">{pct}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

function ToggleSetting({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/70">{label}</span>
      <button
        onClick={onChange}
        className={`relative inline-flex items-center h-6 w-11 rounded-full border transition-colors ${
          checked ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/15'
        }`}
      >
        <motion.span
          className="h-4 w-4 rounded-full shadow-sm bg-white"
          animate={{ x: checked ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}

function DurationInput({ value, min, max, onCommit }) {
  const [local, setLocal] = useState(String(value))
  const [focused, setFocused] = useState(false)

  // Sync external value when not focused
  React.useEffect(() => {
    if (!focused) setLocal(String(value))
  }, [value, focused])

  const commit = () => {
    const parsed = parseInt(local, 10)
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onCommit(parsed)
    } else {
      // revert to last valid value
      setLocal(String(value))
    }
    setFocused(false)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={local}
      onFocus={() => setFocused(true)}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
      className="no-spinner w-14 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-right text-sm text-white outline-none focus:border-white/30"
    />
  )
}

// ── BackgroundCard ─────────────────────────────────────────────────────────────
function BackgroundCard({ id, name, thumb, selected, onSelect, onRename, onDelete }) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(name)
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renaming])

  const commitRename = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== name) onRename(trimmed)
    else setDraft(name)
    setRenaming(false)
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all ${
        selected ? 'border-white/40 ring-2 ring-white/20' : 'border-white/15 hover:border-white/25'
      }`}
    >
      {/* Thumbnail — clicking selects */}
      <button type="button" onClick={onSelect} className="w-full block">
        <img src={thumb} alt={name} className="h-20 w-full object-cover" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
      </button>

      {/* Name bar — click pencil to rename */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1 px-2 py-1.5 bg-black/30">
        {renaming ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setDraft(name); setRenaming(false) }
            }}
            className="flex-1 min-w-0 bg-transparent text-xs text-white outline-none border-b border-white/30"
            maxLength={30}
          />
        ) : (
          <span className="flex-1 min-w-0 text-xs font-semibold text-white drop-shadow truncate">
            {name}
          </span>
        )}

        {/* Pencil rename button */}
        {!renaming && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDraft(name); setRenaming(true) }}
            className="shrink-0 text-white/30 hover:text-white/80 transition opacity-0 group-hover:opacity-100"
            aria-label="Rename"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Delete button — custom only */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 hover:bg-rose-500/80 flex items-center justify-center text-white/70 hover:text-white transition opacity-0 group-hover:opacity-100"
          aria-label="Delete background"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}
