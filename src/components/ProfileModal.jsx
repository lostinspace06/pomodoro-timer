import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'
import { useStore } from '../store/useStore'

const ACCENT_COLORS = [
  { id: 'sky',     label: 'Sky',     bg: 'bg-sky-500',     ring: 'ring-sky-400' },
  { id: 'violet',  label: 'Violet',  bg: 'bg-violet-500',  ring: 'ring-violet-400' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { id: 'rose',    label: 'Rose',    bg: 'bg-rose-500',    ring: 'ring-rose-400' },
  { id: 'amber',   label: 'Amber',   bg: 'bg-amber-500',   ring: 'ring-amber-400' },
  { id: 'pink',    label: 'Pink',    bg: 'bg-pink-500',    ring: 'ring-pink-400' },
]

const inputClass = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 focus:bg-white/8 transition"

export default function ProfileModal({ isOpen, onClose }) {
  const { user, profile, updateUserProfile, signOut } = useAuthStore()
  const stats = useStore((s) => s.stats)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const fileRef = useRef(null)
  const [form, setForm] = useState({})

  const enterEdit = () => {
    setForm({
      displayName: profile?.displayName || user?.displayName || '',
      bio: profile?.bio || '',
      avatarUrl: profile?.avatarUrl || user?.photoURL || '',
      accentColor: profile?.accentColor || 'sky',
    })
    setSaveError(null)
    setEditing(true)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      // Resize to max 200×200 before storing
      const MAX = 200
      const scale = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      setForm((f) => ({ ...f, avatarUrl: dataUrl }))
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await updateUserProfile(form)
      setEditing(false)
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User'
  const avatarUrl = profile?.avatarUrl || user?.photoURL || ''
  const bio = profile?.bio || ''
  const accentColor = profile?.accentColor || 'sky'
  const accentDef = ACCENT_COLORS.find((c) => c.id === accentColor) || ACCENT_COLORS[0]
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const weekLabel = stats.thisWeek >= 60
    ? `${Math.floor(stats.thisWeek / 60)}h ${stats.thisWeek % 60}m`
    : `${stats.thisWeek}m`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { if (!editing) onClose() }}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-black/40 backdrop-blur-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {!editing ? (
                <ViewMode
                  key="view"
                  displayName={displayName}
                  avatarUrl={avatarUrl}
                  bio={bio}
                  accentDef={accentDef}
                  initials={initials}
                  stats={stats}
                  weekLabel={weekLabel}
                  user={user}
                  onEdit={enterEdit}
                  onClose={onClose}
                  onSignOut={async () => { onClose(); await signOut() }}
                />
              ) : (
                <EditMode
                  key="edit"
                  form={form}
                  setForm={setForm}
                  saving={saving}
                  saveError={saveError}
                  fileRef={fileRef}
                  onAvatarChange={handleAvatarChange}
                  onSave={handleSave}
                  onCancel={() => setEditing(false)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ViewMode({ displayName, avatarUrl, bio, accentDef, initials, stats, weekLabel, user, onEdit, onClose, onSignOut }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18 }}
    >
      {/* Accent banner */}
      <div className={`h-16 w-full ${accentDef.bg} opacity-20`} />

      <div className="px-6 pb-6">
        {/* Avatar + close */}
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="h-16 w-16 rounded-full object-cover border-2 border-white/15 shadow-lg"
              />
            ) : (
              <div className={`h-16 w-16 rounded-full ${accentDef.bg} opacity-80 border-2 border-white/15 shadow-lg flex items-center justify-center text-xl font-bold text-white`}>
                {initials}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1 text-sm text-white/50 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Name + email + bio */}
        <h2 className="text-lg font-semibold text-white leading-tight">{displayName}</h2>
        <p className="text-xs text-white/35 mt-0.5">{user?.email}</p>
        {bio && <p className="text-sm text-white/60 mt-2">{bio}</p>}

        {/* Accent badge */}
        <div className="flex items-center gap-2 mt-3 mb-4">
          <div className={`h-2.5 w-2.5 rounded-full ${accentDef.bg}`} />
          <span className="text-xs text-white/35">{accentDef.label} accent</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'This week', value: weekLabel },
            { label: 'Sessions',  value: stats.completed },
            { label: 'Streak',    value: `${stats.streak}d` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center">
              <div className="text-base font-bold text-white">{value}</div>
              <div className="text-xs text-white/35 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={onEdit}
          className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition mb-2"
        >
          Customise profile
        </button>
        <button
          onClick={onSignOut}
          className="w-full rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition"
        >
          Sign out
        </button>
      </div>
    </motion.div>
  )
}

function EditMode({ form, setForm, saving, saveError, fileRef, onAvatarChange, onSave, onCancel }) {
  const accentDef = ACCENT_COLORS.find((c) => c.id === form.accentColor) || ACCENT_COLORS[0]
  const initials = (form.displayName || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.18 }}
      className="p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">Customise profile</h2>
        <button
          onClick={onCancel}
          className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1 text-sm text-white/50 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Avatar picker */}
      <div className="flex flex-col items-center mb-5">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative group">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="avatar" className="h-20 w-20 rounded-full object-cover border-2 border-white/15" />
          ) : (
            <div className={`h-20 w-20 rounded-full ${accentDef.bg} opacity-70 flex items-center justify-center text-2xl font-bold text-white border-2 border-white/15`}>
              {initials}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        </button>
        <p className="text-xs text-white/30 mt-2">Click to upload photo</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
      </div>

      {/* Fields */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Display name</label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="A short line about you…"
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Accent color */}
      <div className="mb-5">
        <label className="text-xs text-white/40 mb-2 block">Accent color</label>
        <div className="flex gap-2 flex-wrap">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, accentColor: c.id }))}
              className={`h-7 w-7 rounded-full ${c.bg} transition ring-offset-2 ring-offset-black/40 ${
                form.accentColor === c.id ? `ring-2 ${c.ring} opacity-100` : 'opacity-50 hover:opacity-80'
              }`}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {saveError && (
        <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 mb-3">
          {saveError}
        </p>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </motion.div>
  )
}
