export const getTodayDateString = () => new Date().toISOString().split('T')[0]

export const isYesterday = (previousDate, currentDate) => {
  if (!previousDate || !currentDate) return false
  const prev = new Date(previousDate)
  const current = new Date(currentDate)
  const diff = Math.round((current - prev) / (1000 * 60 * 60 * 24))
  return diff === 1
}
