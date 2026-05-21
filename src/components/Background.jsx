import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'

const builtInStyles = {
  'rainy-train': { gradient: 'from-slate-700 via-slate-800 to-slate-900' },
  'study-lofi':  { gradient: 'from-slate-800 via-slate-900 to-slate-950' },
  'forest-mist': { gradient: 'from-slate-700 via-emerald-900 to-slate-950' },
  'evening-glow':{ gradient: 'from-violet-900 via-slate-900 to-slate-950' },
  'capy1': { image: '/backgrounds/capy1.jpg' },
  'capy2': { image: '/backgrounds/capy2.jpg' },
  'capy3': { image: '/backgrounds/capy3.jpg' },
  'capy4': { image: '/backgrounds/capy4.jpg' },
}

export default function Background() {
  const { selectedBackground, backgroundBlur, customBackgrounds } = useStore()

  // Check built-in first, then custom
  const builtIn = builtInStyles[selectedBackground]
  const custom = !builtIn
    ? customBackgrounds.find((bg) => bg.id === selectedBackground)
    : null

  const imageSrc = builtIn?.image || custom?.dataUrl || null
  const gradient = builtIn?.gradient || null

  return (
    <div className="fixed inset-0 z-0">
      {imageSrc ? (
        <motion.img
          key={imageSrc}
          src={imageSrc}
          alt="background"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      ) : (
        <motion.div
          key={gradient}
          className={`absolute inset-0 bg-gradient-to-br ${gradient || 'from-slate-800 to-slate-950'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}

      <div
        className="absolute inset-0 pointer-events-none bg-black/20"
        style={imageSrc ? {} : { backdropFilter: `blur(${backgroundBlur}px)` }}
      />
    </div>
  )
}
