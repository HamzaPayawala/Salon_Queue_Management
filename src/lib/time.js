export function formatClock(timestamp, language = 'en') {
  if (!timestamp) return '—'
  return new Date(timestamp).toLocaleTimeString(language === 'gu' ? 'gu-IN' : 'en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatMinutes(totalMinutes, language = 'en') {
  const value = Math.max(0, Math.round(totalMinutes))
  const unit = language === 'gu' ? ' મિ.' : ' min'
  return `${value}${unit}`
}

export function formatWaitDuration(timestamp, now, language = 'en') {
  if (!timestamp) return formatMinutes(0, language)
  return formatMinutes((now - timestamp) / 60_000, language)
}

export function formatPrice(amount, language = 'en') {
  return new Intl.NumberFormat(language === 'gu' ? 'gu-IN' : 'en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function formatTimer(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
