import { create } from 'zustand'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null, // { displayName, bio, avatarUrl, accentColor }
  loading: true,
  error: null,

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const ref = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          const defaultProfile = {
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email,
            bio: '',
            avatarUrl: firebaseUser.photoURL || '',
            accentColor: 'sky',
            createdAt: new Date().toISOString(),
            stats: {
              today: 0,
              thisWeek: 0,
              completed: 0,
              streak: 0,
              lastSessionDate: null,
              weekHistory: []
            }
          }
          await setDoc(ref, defaultProfile)
          set({ user: firebaseUser, profile: defaultProfile, loading: false, error: null })
        } else {
          const data = snap.data()
          set({ user: firebaseUser, profile: data, loading: false, error: null })
        }
      } else {
        set({ user: null, profile: null, loading: false, error: null })
      }
    })
    return unsubscribe
  },

  signInWithGoogle: async () => {
    set({ error: null })
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      set({ error: err.message })
    }
  },

  signInWithEmail: async (email, password) => {
    set({ error: null })
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      set({ error: err.message })
    }
  },

  signUpWithEmail: async (email, password, displayName) => {
    set({ error: null })
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        await updateProfile(cred.user, { displayName })
      }
    } catch (err) {
      set({ error: err.message })
    }
  },

  signOut: async () => {
    await signOut(auth)
    set({ user: null, profile: null })
  },

  updateUserProfile: async ({ displayName, bio, avatarUrl, accentColor }) => {
    const { user } = get()
    if (!user) return
    try {
      // Update Firebase Auth display name
      if (displayName !== undefined) {
        await updateProfile(user, { displayName })
      }
      // Update Firestore profile doc
      const ref = doc(db, 'users', user.uid)
      const updates = {}
      if (displayName !== undefined) updates.displayName = displayName
      if (bio !== undefined) updates.bio = bio
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl
      if (accentColor !== undefined) updates.accentColor = accentColor
      await updateDoc(ref, updates)
      // Update local profile state
      set((state) => ({
        profile: { ...state.profile, ...updates }
      }))
    } catch (err) {
      console.error('Failed to update profile:', err)
      throw err
    }
  },

  syncStatsToFirestore: async (stats) => {
    const { user } = get()
    if (!user) return
    try {
      const ref = doc(db, 'users', user.uid)
      await updateDoc(ref, { stats })
    } catch (err) {
      console.error('Failed to sync stats:', err)
    }
  },

  syncTasksToFirestore: async (tasks, notes) => {
    const { user } = get()
    if (!user) return
    try {
      const ref = doc(db, 'users', user.uid)
      await updateDoc(ref, { tasks, notes })
    } catch (err) {
      console.error('Failed to sync tasks:', err)
    }
  },

  loadStatsFromFirestore: async () => {
    const { user } = get()
    if (!user) return null
    try {
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        return snap.data() || null
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
    return null
  }
}))
