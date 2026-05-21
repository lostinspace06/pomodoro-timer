import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'

export default function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, error } = useAuthStore()

  // Clear stale error whenever modal opens
  useEffect(() => {
    if (isOpen) useAuthStore.setState({ error: null })
  }, [isOpen])

  const handleGoogle = async () => {
    setSubmitting(true)
    await signInWithGoogle()
    setSubmitting(false)
    // Only close if sign-in succeeded (no error)
    if (!useAuthStore.getState().error) onClose()
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    if (tab === 'signin') {
      await signInWithEmail(email, password)
    } else {
      await signUpWithEmail(email, password, displayName)
    }
    setSubmitting(false)
    if (!useAuthStore.getState().error) onClose()
  }

  const inputClass = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 focus:bg-white/8 transition"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-black/40 backdrop-blur-2xl p-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                {tab === 'signin' ? 'Sign in' : 'Create account'}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1 text-sm text-white/50 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white transition mb-4 disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl border border-white/15 bg-white/5 p-1 mb-4">
              {['signin', 'signup'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
                    tab === t ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {t === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {tab === 'signup' && (
                <input
                  type="text"
                  placeholder="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />

              {error && (
                <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                  {error.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim()}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
              >
                {submitting ? 'Please wait…' : tab === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
