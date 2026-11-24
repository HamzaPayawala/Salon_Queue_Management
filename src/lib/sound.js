let audioContext = null

// Browsers require a user gesture before audio plays. TV's "Enable sound" calls this.
export function enableSound() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext
    if (!Context) return false
    if (!audioContext) audioContext = new Context()
    if (audioContext.state === 'suspended') audioContext.resume()
    playChime()
    return true
  } catch {
    return false
  }
}

export function soundEnabled() {
  return Boolean(audioContext && audioContext.state === 'running')
}

// A short two-note chime generated in code — no audio file or external service.
export function playChime() {
  if (!audioContext || audioContext.state !== 'running') return
  const start = audioContext.currentTime
  ;[
    { frequency: 784, at: 0 },
    { frequency: 1046, at: 0.16 },
  ].forEach(({ frequency, at }) => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start + at)
    gain.gain.exponentialRampToValueAtTime(0.16, start + at + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.28)
    oscillator.connect(gain).connect(audioContext.destination)
    oscillator.start(start + at)
    oscillator.stop(start + at + 0.3)
  })
}
