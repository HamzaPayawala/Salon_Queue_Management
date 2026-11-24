// Shared store with one interface for every screen.
// Local mode: localStorage + BroadcastChannel (cross-window, same device).
// Cloud mode: Firestore document (cross-device), automatically used when .env is configured.
import { createSeedState } from './seedData.js'

const STORAGE_KEY = 'salon-queue-v1'
const CHANNEL_NAME = 'salon-queue'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.version === 1 && Array.isArray(parsed.entries)) return parsed
    }
  } catch {
    // Corrupt or blocked storage: fall back to seed data.
  }
  return createSeedState()
}

let state = loadState()
let mode = 'local'
let cloudRef = null
let unsubscribeCloud = null
let cloudError = null
const listeners = new Set()
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null

function emit() {
  listeners.forEach((listener) => listener())
}

function saveLocal(next) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage quota/private mode should not break the live session.
  }
  emit()
}

// Applies a state written by another window/device without echoing it back.
function applyRemote(next) {
  if (!next || next.version !== 1 || (next.updatedAt ?? 0) < (state.updatedAt ?? 0)) return
  saveLocal(next)
}

if (channel) {
  channel.onmessage = (event) => {
    if (event.data?.type === 'state') applyRemote(event.data.state)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try {
      applyRemote(JSON.parse(event.newValue))
    } catch {
      // Ignore a malformed concurrent write.
    }
  })
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState() {
  return state
}

export function getConnection() {
  return { mode, cloudError }
}

// Every queue change goes through here. `action` is a pure engine function.
export function dispatch(action) {
  const result = action(state)
  if (!result?.ok || !result.state || result.state === state) return result

  saveLocal(result.state)
  if (channel) channel.postMessage({ type: 'state', state: result.state })

  if (cloudRef) {
    import('firebase/firestore')
      .then(({ setDoc }) => setDoc(cloudRef, result.state))
      .catch((error) => {
        cloudError = error?.message || 'Cloud write failed'
      })
  }
  return result
}

export function resetDemo() {
  return dispatch(() => ({ ok: true, state: createSeedState() }))
}

// Called once from main.jsx. Absent env vars intentionally keep local mode.
export async function initCloud() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  if (!config.apiKey || !config.projectId || !config.appId) return

  try {
    const { initializeApp } = await import('firebase/app')
    const { getFirestore, doc, setDoc, getDoc, onSnapshot } = await import('firebase/firestore')
    const db = getFirestore(initializeApp(config))
    const ref = doc(db, 'salons', 'default', 'queue', 'state')
    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) await setDoc(ref, state)
    else applyRemote(snapshot.data())

    cloudRef = ref
    unsubscribeCloud = onSnapshot(ref, (next) => {
      if (next.exists()) applyRemote(next.data())
    })
    mode = 'cloud'
    emit()
  } catch (error) {
    cloudError = error?.message || 'Cloud connection failed'
    mode = 'local'
    emit()
  }
}

export function stopCloud() {
  if (unsubscribeCloud) unsubscribeCloud()
  unsubscribeCloud = null
  cloudRef = null
  mode = 'local'
}
