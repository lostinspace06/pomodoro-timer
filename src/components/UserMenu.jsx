import React, { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import ProfileModal from './ProfileModal'

export default function UserMenu({ onSignInClick }) {
  const { user, profile } = useAuthStore()
  const [profileOpen, setProfileOpen] = useState(false)

  if (!user) {
    return (
      <button
        onClick={onSignInClick}
        className="fixed top-6 right-20 z-40 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        Sign in
      </button>
    )
  }

  const displayName = profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User'
  const avatarUrl = profile?.avatarUrl || user.photoURL || ''
  const initials = displayName
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const accentBgMap = {
    sky: 'bg-sky-500/60', violet: 'bg-violet-500/60', emerald: 'bg-emerald-500/60',
    rose: 'bg-rose-500/60', amber: 'bg-amber-500/60', pink: 'bg-pink-500/60'
  }
  const avatarBg = accentBgMap[profile?.accentColor] || 'bg-sky-500/60'

  return (
    <>
      <button
        onClick={() => setProfileOpen(true)}
        className="fixed top-6 right-20 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-3 py-1.5 hover:bg-white/10 transition"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <div className={`h-7 w-7 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold text-white`}>
            {initials}
          </div>
        )}
        <span className="text-sm text-white/80 max-w-[120px] truncate">{displayName}</span>
      </button>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
