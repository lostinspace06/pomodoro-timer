import { useStore } from '../store/useStore'

// ─── Sound file map ───────────────────────────────────────────────────────────

const SOUND_FILES = {
  'tick-tock':     '/sounds/ticktock.mp3',
  'metronome':     '/sounds/metronome.mp3',
  'countdown':     '/sounds/countdown.mp3',
  'rain':          '/sounds/rain.mp3',
  'ocean-shore':   '/sounds/oceanshore.mp3',
  'stream':        '/sounds/stream.mp3',
  'wind':          '/sounds/wind.mp3',
  'wind-crickets': '/sounds/windandcrickets.mp3',
  'wilderness':    '/sounds/wilderness.mp3',
  'frogs-night':   '/sounds/frogsatnight.mp3',
  'cafe':          '/sounds/cafe.mp3',
  'library':       '/sounds/library.mp3',
  'classroom':     '/sounds/classroom.mp3',
  'bonfire':       '/sounds/bonfire.mp3',
  'brown-noise':   '/sounds/brownnoise.mp3',
  'white-noise':   '/sounds/whitenoise.mp3',
}

// ─── State ────────────────────────────────────────────────────────────────────

const audioState = {
  context: null,
  // ambient layer (looping noise/texture)
  ambientNodes: [],   // { source, gain, filter? }[]
  ambientMaster: null,
  ambienceType: null,
  // rhythmic layer (tick, metronome, countdown — scheduled repeating)
  rhythmTimer: null,
}

// ─── Context ──────────────────────────────────────────────────────────────────

const createAudioContext = () => {
  if (!audioState.context) {
    audioState.context = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioState.context
}

export const ensureAudioUnlocked = async () => {
  const ctx = createAudioContext()
  if (ctx.state === 'suspended') await ctx.resume()
  return ctx
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const whiteNoiseBuffer = (ctx, seconds = 4) => {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

// Brown noise: integrate white noise
const brownNoiseBuffer = (ctx, seconds = 4) => {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    d[i] = last * 3.5
  }
  return buf
}

const loopNoise = (ctx, buffer, masterGain) => {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  src.connect(masterGain)
  src.start()
  return src
}

const loopNoiseFiltered = (ctx, buffer, masterGain, filterType, freq, Q = 1) => {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = filterType
  f.frequency.value = freq
  f.Q.value = Q
  src.connect(f)
  f.connect(masterGain)
  src.start()
  return { source: src, filter: f }
}

const playClick = (ctx, masterGain, freq = 1000, dur = 0.012, vol = 0.6) => {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  g.gain.setValueAtTime(vol, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
  osc.connect(g)
  g.connect(masterGain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + dur)
}

const scheduleRhythm = (fn, intervalMs) => {
  fn()
  const id = setInterval(fn, intervalMs)
  audioState.rhythmTimer = id
  return id
}

const stopRhythm = () => {
  if (audioState.rhythmTimer !== null) {
    clearInterval(audioState.rhythmTimer)
    audioState.rhythmTimer = null
  }
}

// ─── Stop all ambient ─────────────────────────────────────────────────────────

const stopAmbientNodes = () => {
  stopRhythm()
  for (const node of audioState.ambientNodes) {
    try { node.source?.stop() } catch {}
    node.source?.disconnect?.()
    node.filter?.disconnect?.()
  }
  audioState.ambientNodes = []
  if (audioState.ambientMaster) {
    audioState.ambientMaster.disconnect?.()
    audioState.ambientMaster = null
  }
  audioState.ambienceType = null
}

export const stopAmbient = () => stopAmbientNodes()

export const setAmbientVolume = async (value) => {
  // HTMLAudioElement path
  if (audioState.ambientMaster?._audio) {
    audioState.ambientMaster._audio.volume = Math.max(0, Math.min(1, value))
    return
  }
  // Web Audio path
  const ctx = createAudioContext()
  if (audioState.ambientMaster) {
    audioState.ambientMaster.gain.setTargetAtTime(value, ctx.currentTime, 0.05)
  }
}

// ─── Sound definitions ────────────────────────────────────────────────────────

const buildAmbient = async (type, ctx, master) => {
  const white = whiteNoiseBuffer(ctx, 4)
  const brown = brownNoiseBuffer(ctx, 4)

  switch (type) {

    case 'white-noise': {
      const src = loopNoise(ctx, white, master)
      audioState.ambientNodes.push({ source: src })
      break
    }

    case 'brown-noise': {
      const src = loopNoise(ctx, brown, master)
      audioState.ambientNodes.push({ source: src })
      break
    }

    case 'rain': {
      // heavy rain: lowpass white noise
      const n = loopNoiseFiltered(ctx, white, master, 'lowpass', 1400, 0.8)
      audioState.ambientNodes.push(n)
      break
    }

    case 'ocean-shore': {
      // slow rolling waves: lowpass brown + LFO on gain
      const n = loopNoiseFiltered(ctx, brown, master, 'lowpass', 600, 0.5)
      // LFO for wave rhythm
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 0.18
      lfoGain.gain.value = 0.4
      lfo.connect(lfoGain)
      lfoGain.connect(n.filter.gain ?? master.gain)
      lfo.start()
      audioState.ambientNodes.push(n, { source: lfo })
      break
    }

    case 'stream': {
      // babbling brook: bandpass white, mid-high freq
      const n = loopNoiseFiltered(ctx, white, master, 'bandpass', 1800, 2.5)
      const n2 = loopNoiseFiltered(ctx, white, master, 'bandpass', 900, 1.5)
      audioState.ambientNodes.push(n, n2)
      break
    }

    case 'wind': {
      // wind: lowpass white with slow LFO sweep
      const n = loopNoiseFiltered(ctx, white, master, 'lowpass', 800, 0.6)
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.type = 'sine'
      lfo.frequency.value = 0.08
      lfoGain.gain.value = 300
      lfo.connect(lfoGain)
      lfoGain.connect(n.filter.frequency)
      lfo.start()
      audioState.ambientNodes.push(n, { source: lfo })
      break
    }

    case 'wind-crickets': {
      // wind layer
      const wind = loopNoiseFiltered(ctx, white, master, 'lowpass', 700, 0.5)
      // cricket chirps: high-freq bandpass bursts via oscillator
      const cricketGain = ctx.createGain()
      cricketGain.gain.value = 0.15
      cricketGain.connect(master)
      const chirp = () => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.value = 4200 + Math.random() * 400
        g.gain.setValueAtTime(0.3, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
        o.connect(g)
        g.connect(cricketGain)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.08)
      }
      scheduleRhythm(chirp, 120)
      audioState.ambientNodes.push(wind)
      break
    }

    case 'wilderness': {
      // distant wind + occasional bird-like tones
      const wind = loopNoiseFiltered(ctx, white, master, 'lowpass', 500, 0.4)
      const birdGain = ctx.createGain()
      birdGain.gain.value = 0.12
      birdGain.connect(master)
      const bird = () => {
        if (Math.random() > 0.3) return
        const freq = 1800 + Math.random() * 1200
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(freq, ctx.currentTime)
        o.frequency.linearRampToValueAtTime(freq * 1.15, ctx.currentTime + 0.12)
        g.gain.setValueAtTime(0.4, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
        o.connect(g)
        g.connect(birdGain)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.25)
      }
      scheduleRhythm(bird, 800)
      audioState.ambientNodes.push(wind)
      break
    }

    case 'frogs-night': {
      // night ambience: very low wind + frog croaks
      const night = loopNoiseFiltered(ctx, brown, master, 'lowpass', 300, 0.3)
      const frogGain = ctx.createGain()
      frogGain.gain.value = 0.18
      frogGain.connect(master)
      const frog = () => {
        if (Math.random() > 0.4) return
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.value = 280 + Math.random() * 80
        g.gain.setValueAtTime(0.5, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
        o.connect(g)
        g.connect(frogGain)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.18)
      }
      scheduleRhythm(frog, 600)
      audioState.ambientNodes.push(night)
      break
    }

    case 'bonfire': {
      // crackling fire: bandpass brown noise + random pops
      const fire = loopNoiseFiltered(ctx, brown, master, 'bandpass', 320, 1.2)
      const popGain = ctx.createGain()
      popGain.gain.value = 0.2
      popGain.connect(master)
      const pop = () => {
        if (Math.random() > 0.5) return
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
        const src = ctx.createBufferSource()
        src.buffer = buf
        const g = ctx.createGain()
        g.gain.value = 0.6
        src.connect(g)
        g.connect(popGain)
        src.start()
      }
      scheduleRhythm(pop, 300)
      audioState.ambientNodes.push(fire)
      break
    }

    case 'cafe': {
      // murmur: bandpass white mid + low hum
      const murmur = loopNoiseFiltered(ctx, white, master, 'bandpass', 500, 1.8)
      const hum = loopNoiseFiltered(ctx, brown, master, 'bandpass', 180, 0.8)
      audioState.ambientNodes.push(murmur, hum)
      break
    }

    case 'library': {
      // very quiet: faint low hum + occasional page turn
      const hum = loopNoiseFiltered(ctx, brown, master, 'lowpass', 200, 0.3)
      const pageGain = ctx.createGain()
      pageGain.gain.value = 0.08
      pageGain.connect(master)
      const page = () => {
        if (Math.random() > 0.15) return
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.5
        const src = ctx.createBufferSource()
        src.buffer = buf
        const g = ctx.createGain()
        g.gain.value = 0.5
        src.connect(g)
        g.connect(pageGain)
        src.start()
      }
      scheduleRhythm(page, 3000)
      audioState.ambientNodes.push(hum)
      break
    }

    case 'classroom': {
      // chalk + low chatter hum
      const chatter = loopNoiseFiltered(ctx, white, master, 'bandpass', 600, 1.2)
      const chalkGain = ctx.createGain()
      chalkGain.gain.value = 0.1
      chalkGain.connect(master)
      const chalk = () => {
        if (Math.random() > 0.2) return
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sawtooth'
        o.frequency.value = 2400 + Math.random() * 600
        g.gain.setValueAtTime(0.15, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
        o.connect(g)
        g.connect(chalkGain)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.06)
      }
      scheduleRhythm(chalk, 400)
      audioState.ambientNodes.push(chatter)
      break
    }

    case 'tick-tock': {
      // clock tick-tock: two alternating clicks
      let beat = 0
      const tick = () => {
        const freq = beat % 2 === 0 ? 1100 : 900
        playClick(ctx, master, freq, 0.015, 0.5)
        beat++
      }
      scheduleRhythm(tick, 500)
      break
    }

    case 'metronome': {
      // metronome at 60bpm, accented beat 1
      let beat = 0
      const tick = () => {
        const isAccent = beat % 4 === 0
        playClick(ctx, master, isAccent ? 1400 : 1000, 0.018, isAccent ? 0.7 : 0.45)
        beat++
      }
      scheduleRhythm(tick, 1000)
      break
    }

    case 'countdown': {
      // soft beep every second, higher pitch on beat 1 of 4
      let beat = 0
      const tick = () => {
        const isAccent = beat % 4 === 0
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.value = isAccent ? 880 : 660
        g.gain.setValueAtTime(isAccent ? 0.35 : 0.2, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
        o.connect(g)
        g.connect(master)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.08)
        beat++
      }
      scheduleRhythm(tick, 1000)
      break
    }

    default:
      break
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

const createAmbientSource = async (type) => {
  stopAmbientNodes()

  const filePath = SOUND_FILES[type]
  if (filePath) {
    // Use HTMLAudioElement for real audio files
    const audio = new Audio(filePath)
    audio.loop = true
    audio.volume = useStore.getState().ambienceVolume
    await audio.play().catch(() => {})
    // Store as a fake node so stopAmbientNodes can clean it up
    audioState.ambientNodes.push({ source: { stop: () => { audio.pause(); audio.currentTime = 0 }, disconnect: () => {} }, _audio: audio })
    audioState.ambientMaster = { gain: { setTargetAtTime: () => {}, value: audio.volume }, _audio: audio }
    audioState.ambienceType = type
    return
  }

  // Fallback to synthesis for any missing files
  const ctx = await ensureAudioUnlocked()
  const master = ctx.createGain()
  master.gain.value = useStore.getState().ambienceVolume
  master.connect(ctx.destination)
  audioState.ambientMaster = master
  await buildAmbient(type, ctx, master)
  audioState.ambienceType = type
}

export const startAmbient = async (type) => {
  const { soundEnabled, ambienceVolume } = useStore.getState()
  if (!soundEnabled) { stopAmbientNodes(); return }
  if (audioState.ambienceType === type) { setAmbientVolume(ambienceVolume); return }
  await createAmbientSource(type)
}

// ─── Alarm sounds ─────────────────────────────────────────────────────────────

const playOscillator = (ctx, frequency, duration, gainValue, type = 'sine', startAt = 0) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  osc.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(gainValue, ctx.currentTime + startAt)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration)
  osc.start(ctx.currentTime + startAt)
  osc.stop(ctx.currentTime + startAt + duration)
}

export const playAlarmSound = async (type = 'chime') => {
  const { soundEnabled, alarmVolume } = useStore.getState()
  if (!soundEnabled) return
  const ctx = await ensureAudioUnlocked()
  const baseGain = alarmVolume * 0.25

  if (type === 'soft') {
    playOscillator(ctx, 520, 0.25, baseGain, 'triangle')
    playOscillator(ctx, 620, 0.25, baseGain * 0.9, 'triangle', 0.25)
    playOscillator(ctx, 720, 0.25, baseGain * 0.8, 'triangle', 0.5)
    return
  }
  if (type === 'long') {
    playOscillator(ctx, 400, 0.35, baseGain, 'sine')
    playOscillator(ctx, 520, 0.35, baseGain, 'sine', 0.3)
    playOscillator(ctx, 620, 0.4, baseGain * 0.9, 'sine', 0.6)
    return
  }
  for (let i = 0; i < 4; i++) {
    playOscillator(ctx, 660 + i * 30, 0.18, baseGain, i % 2 === 0 ? 'triangle' : 'sine', i * 0.18)
  }
}

export const testAlarmSound = async (type) => playAlarmSound(type)

// ─── Notifications ────────────────────────────────────────────────────────────

export const sendNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { icon: '/icon.svg', badge: '/icon.svg', ...options })
  }
}

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}
