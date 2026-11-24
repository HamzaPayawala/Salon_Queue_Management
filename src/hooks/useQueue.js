import { useSyncExternalStore } from 'react'
import { getState, subscribe } from '../queue/queueStore.js'

export function useQueue() {
  return useSyncExternalStore(subscribe, getState, getState)
}
