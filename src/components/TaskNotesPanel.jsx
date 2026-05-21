import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'

export default function TaskNotesPanel() {
  const { tasks, notes, addTask, toggleTask, updateTaskTitle, removeTask, setNotes } = useStore()
  const [newTask, setNewTask] = useState('')
  const [notesOpen, setNotesOpen] = useState(false)

  const handleAdd = () => {
    if (!newTask.trim()) return
    addTask(newTask.trim())
    setNewTask('')
  }

  const done = tasks.filter((t) => t.done).length
  const total = tasks.length

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 w-72 flex flex-col gap-3">

      {/* Task list card — fixed height, tasks scroll inside */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white/80">Tasks</span>
          <span className="text-xs text-white/30">{done}/{total}</span>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white/30"
              animate={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}

        {/* Scrollable task list — fixed height, never grows */}
        <div className="overflow-y-auto" style={{ height: '240px' }}>
          {tasks.length === 0 ? (
            <p className="text-xs text-white/25 text-center py-6">No tasks yet</p>
          ) : (
            <div className="flex flex-col gap-1.5 pr-1">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 group">

                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={`h-4 w-4 shrink-0 rounded-full border transition-all flex items-center justify-center ${
                      task.done ? 'bg-white/25 border-white/35' : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {task.done && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Title */}
                  <input
                    className={`flex-1 bg-transparent text-xs outline-none transition min-w-0 ${
                      task.done ? 'line-through text-white/25' : 'text-white/70'
                    }`}
                    value={task.title}
                    onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                  />

                  {/* Remove — sits next to the title, not on top of anything */}
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="text-white/20 hover:text-rose-400 transition opacity-0 group-hover:opacity-100 text-sm leading-none shrink-0 w-4 text-center"
                    aria-label="Remove task"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add input */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add a task…"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-white/20 transition"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white transition"
          >
            +
          </button>
        </div>
      </div>

      {/* Notes toggle */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
        <button
          onClick={() => setNotesOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition"
        >
          <span className="text-xs font-semibold text-white/50">Notes</span>
          <motion.svg
            className="h-3 w-3 text-white/30"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            animate={{ rotate: notesOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </motion.svg>
        </button>

        <AnimatePresence initial={false}>
          {notesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Capture a thought…"
                className="w-full resize-none bg-transparent px-4 pb-3 text-xs text-white/60 placeholder:text-white/20 outline-none min-h-[100px]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
