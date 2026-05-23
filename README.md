# Pomodoro Timer

A cozy, feature-rich Pomodoro timer with a bubbly-inspired aesthetic. Built with React, Vite, and Firebase — works as a PWA and runs entirely in the browser.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase) ![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38BFF8?logo=tailwindcss)

---

## Features

### Timer
- Focus, Short Break, and Long Break modes
- Click the timer display to set a custom duration inline
- Circular SVG progress ring with animated dot indicator
- Keyboard shortcuts: `Space` (start/pause), `R` (reset), `N` (next session)

### Session Automation
- Auto-switch between focus and break sessions
- Auto-start breaks and/or focus sessions
- Configurable long break interval (every 2–5 pomodoros)

### Ambient Sounds
16 built-in sounds across four categories, all synthesized or played via the Web Audio API / HTMLAudioElement:

| Category | Sounds |
|----------|--------|
| Rhythm   | Tick Tock, Metronome, Countdown |
| Nature   | Rain, Ocean Shore, Stream, Wind, Wind & Crickets, Wilderness, Frogs at Night |
| Spaces   | Café, Library, Classroom, Bonfire |
| Noise    | Brown Noise, White Noise |

A Spotify-style now-playing widget appears when a sound is active, with prev/next/play-pause controls and a volume slider.

### Alarm Sounds
Three synthesized alarm styles (Chime, Soft, Long) with independent volume control and a test button.

### Backgrounds
- 4 built-in capybara photo backgrounds
- Upload and manage your own custom backgrounds (resized to ≤1920px, stored in localStorage)
- Adjustable background blur (0–60px)

### Tasks & Notes
- Lightweight task list with checkboxes, inline editing, and a progress bar
- Collapsible session notes textarea
- Tasks and notes sync to Firestore when signed in, debounced to avoid excessive writes

### Statistics
- Today's focus time, completed sessions, current streak, and weekly total
- Last 7-day history tracked per day
- Stats synced to Firestore when signed in

### Auth & Profile (Firebase)
- Sign in with Google or email/password
- Profile customization: display name, bio, avatar photo (resized to ≤200px), accent color (6 options)
- Accent color applies a CSS custom property (`--accent`) globally across the UI

### Display & Accessibility
- Dark/light theme toggle
- 24-hour or 12-hour clock
- Toggle smooth animations on/off
- Browser notifications on session end
- PWA installable on desktop and mobile

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI |
| Vite 5 | Dev server & bundler |
| Tailwind CSS 3 | Styling |
| Framer Motion | Animations |
| Zustand | State management (with `persist` middleware) |
| Firebase Auth | Authentication (Google + email/password) |
| Firestore | Cloud sync for stats, tasks, notes, and profile |
| Web Audio API | Synthesized ambient sounds & alarm tones |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
pomodoro-timer/
├── public/
│   ├── backgrounds/        # Built-in capybara background images
│   ├── sounds/             # Ambient sound MP3 files (16 tracks)
│   ├── icon.svg
│   ├── lofi-poster.svg
│   ├── maskable-icon.svg
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker (offline caching)
├── src/
│   ├── components/
│   │   ├── Timer.jsx           # Circular timer, mode switcher, inline edit
│   │   ├── SettingsPanel.jsx   # Slide-out settings panel
│   │   ├── MusicPlayer.jsx     # Ambient sound picker + now-playing widget
│   │   ├── TaskNotesPanel.jsx  # Task list + collapsible notes
│   │   ├── StatsPanel.jsx      # Stats widget (today / week / streak)
│   │   ├── Background.jsx      # Background image/gradient renderer
│   │   ├── AuthModal.jsx       # Sign in / sign up modal
│   │   ├── UserMenu.jsx        # Avatar button + profile trigger
│   │   └── ProfileModal.jsx    # Profile view & edit modal
│   ├── store/
│   │   ├── useStore.js         # Zustand store — timer, settings, tasks, stats
│   │   └── useAuthStore.js     # Zustand store — Firebase auth & Firestore sync
│   ├── utils/
│   │   ├── audio.js            # Web Audio engine (ambient, alarm, notifications)
│   │   └── helpers.js          # Date utilities (streak logic)
│   ├── firebase.js             # Firebase app init (Auth, Firestore)
│   ├── App.jsx                 # Root layout, clock, theme/accent effects
│   ├── main.jsx                # React entry point + SW registration
│   └── index.css               # Tailwind base + global styles + scrollbar
├── index.html
├── vite.config.js
├── tailwind.config.cjs
├── postcss.config.cjs
└── package.json
```

---

## Firebase Setup

The app uses Firebase for auth and Firestore sync. The config in `src/firebase.js` points to the `pomodoro-timer` project. To use your own Firebase project:
|i-qc e`1  q xc=-06c .p\-=
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Google + Email/Password providers)
3. Enable **Firestore** in Native mode
4. Replace the `firebaseConfig` object in `src/firebase.js` with your own credentials

> **Note:** The Firebase config values (API key, project ID, etc.) in this repo are client-side identifiers, not secrets. Secure your data using Firestore Security Rules.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start / Pause |
| `R` | Reset timer |
| `N` | Skip to next session |

---

## PWA

The app registers a service worker (`public/sw.js`) on load and includes a `manifest.json` for installability.

- **Desktop:** Chrome → address bar install icon or Menu → Install app
- **Mobile:** Chrome → bottom menu → Add to Home Screen

---

## License

MIT

ah okay blah blah lots of stuff, anyways :3