import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'

export default function StatsPanel() {
  const { stats } = useStore()

  const weekLabel = stats.thisWeek >= 60
    ? `${Math.floor(stats.thisWeek / 60)}h ${stats.thisWeek % 60}m`
    : `${stats.thisWeek}m`

  return (
    <motion.div
      className="glass p-6 rounded-xl backdrop-blur-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
    >
      <h3 className="text-sm font-semibold text-gray-200 mb-6">Today's Stats</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Focus Time" value={`${Math.floor(stats.today)}m`} subtext="today" />
        <StatCard label="Completed" value={stats.completed} subtext="sessions" />
        <StatCard label="This Week" value={weekLabel} subtext="recent" />
        <StatCard label="Streak" value={stats.streak} subtext="days" />
      </div>
    </motion.div>
  )
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="bg-white/4 rounded-lg p-4 border border-white/5">
      <div className="text-xs text-gray-400 font-medium mb-2">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{subtext}</div>
    </div>
  )
}
