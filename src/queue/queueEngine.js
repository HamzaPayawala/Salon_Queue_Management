// Single source of truth for every queue rule (see docs/03-flows-rules.md).
// All functions are pure: they never mutate their arguments and return
// { ok, state, ... } so screens cannot accidentally bypass a rule.

export const ACTIVE_STATUSES = ['waiting', 'called', 'in_chair']
export const TERMINAL_STATUSES = ['done', 'cancelled', 'no_show']
export const MAX_SERVICES = 3
export const NO_SHOW_WINDOW_MIN = 10

const minute = 60_000
const byQueueOrder = (a, b) => a.createdAt - b.createdAt || a.token.localeCompare(b.token)

// Accept a plain 10-digit number or a 12-digit Indian (+91) number.
// Anything else is invalid — never silently truncate a longer number.
export function normalizePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
}

export function isValidPhone(value) {
  return /^\d{10}$/.test(normalizePhone(value))
}

export function serviceTotals(state, serviceIds) {
  return (serviceIds || []).reduce(
    (totals, id) => {
      const service = state.services.find((item) => item.id === id)
      if (service) {
        totals.duration += service.durationMin
        totals.price += service.price
      }
      return totals
    },
    { duration: 0, price: 0 },
  )
}

export function serviceName(service, language) {
  if (!service) return ''
  return language === 'gu' && service.nameGu ? service.nameGu : service.nameEn
}

export function barberName(barber, language) {
  if (!barber) return ''
  return language === 'gu' && barber.nameGu ? barber.nameGu : barber.name
}

export function waitingEntries(state) {
  return state.entries.filter((entry) => entry.status === 'waiting').sort(byQueueOrder)
}

export function getActiveEntryByPhone(state, phone) {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  return state.entries.find(
    (entry) => entry.phone === normalized && ACTIVE_STATUSES.includes(entry.status),
  ) || null
}

export function getEntryByToken(state, token) {
  if (!token) return null
  return state.entries.find((entry) => entry.token.toLowerCase() === String(token).toLowerCase()) || null
}

export function isEligibleForBarber(entry, barberId) {
  return entry.preferredBarberId === 'any' || entry.preferredBarberId === barberId
}

export function barberActiveCustomer(state, barberId) {
  return (
    state.entries.find(
      (entry) =>
        entry.assignedBarberId === barberId &&
        (entry.status === 'called' || entry.status === 'in_chair'),
    ) || null
  )
}

export function workingBarbers(state) {
  return state.barbers.filter((barber) => barber.onDuty && !barber.onBreak)
}

export function workingBarbersForLane(state, entry) {
  if (entry.preferredBarberId === 'any') return workingBarbers(state)
  return state.barbers.filter(
    (barber) => barber.id === entry.preferredBarberId && barber.onDuty && !barber.onBreak,
  )
}

// A specific-barber customer's lane contains that barber's customers and Any-Barber
// customers. An Any-Barber customer competes in the whole waiting list.
export function laneFor(state, entry) {
  const waiting = waitingEntries(state)
  if (entry.preferredBarberId === 'any') return waiting
  return waiting.filter(
    (candidate) =>
      candidate.preferredBarberId === 'any' || candidate.preferredBarberId === entry.preferredBarberId,
  )
}

export function getPosition(state, entry) {
  if (!entry || entry.status !== 'waiting') return 0
  const lane = laneFor(state, entry)
  const index = lane.findIndex((candidate) => candidate.id === entry.id)
  return index === -1 ? 0 : index + 1
}

function remainingMinutes(state, entry, now) {
  const { duration } = serviceTotals(state, entry.serviceIds)
  if (entry.status === 'in_chair' && entry.startedAt) {
    return Math.max(0, (duration * minute - (now - entry.startedAt)) / minute)
  }
  if (entry.status === 'called') return 1 // one minute to walk to the chair
  return duration
}

// Barbers whose current work blocks this lane, including someone on a break
// who is still finishing a service (that time must be counted in the ETA).
function laneBarberIds(state, entry) {
  if (entry.preferredBarberId === 'any') return new Set(state.barbers.map((barber) => barber.id))
  return new Set([entry.preferredBarberId])
}

// Shared ETA formula used by Home, Join, My Status, Reception and TV.
export function estimateWait(state, entry, now = Date.now()) {
  if (!entry) return 0
  const lane = laneFor(state, entry)
  const ahead = lane.filter((candidate) => byQueueOrder(candidate, entry) < 0)

  const waitingWork = ahead.reduce(
    (sum, candidate) => sum + serviceTotals(state, candidate.serviceIds).duration,
    0,
  )

  const barberIds = laneBarberIds(state, entry)
  const activeWork = state.entries
    .filter(
      (candidate) =>
        (candidate.status === 'called' || candidate.status === 'in_chair') &&
        barberIds.has(candidate.assignedBarberId),
    )
    .reduce((sum, candidate) => sum + remainingMinutes(state, candidate, now), 0)

  const barbers = workingBarbersForLane(state, entry).length || 1
  return Math.max(0, Math.ceil((waitingWork + activeWork) / barbers))
}

// Preview for the Join screen before an entry exists.
export function estimateForJoin(state, serviceIds, preferredBarberId, now = Date.now()) {
  const { duration } = serviceTotals(state, serviceIds)
  const waiting = waitingEntries(state)
  const ahead = preferredBarberId === 'any'
    ? waiting
    : waiting.filter(
        (entry) => entry.preferredBarberId === 'any' || entry.preferredBarberId === preferredBarberId,
      )
  const waitingWork = ahead.reduce(
    (sum, entry) => sum + serviceTotals(state, entry.serviceIds).duration,
    0,
  )
  const barberIds = laneBarberIds(state, { preferredBarberId })
  const activeWork = state.entries
    .filter(
      (entry) =>
        (entry.status === 'called' || entry.status === 'in_chair') &&
        barberIds.has(entry.assignedBarberId),
    )
    .reduce((sum, entry) => sum + remainingMinutes(state, entry, now), 0)

  const barbers = workingBarbersForLane(state, { preferredBarberId }).length || 1
  return Math.max(duration === 0 ? 0 : 1, Math.ceil((waitingWork + activeWork) / barbers))
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value || '0:0').split(':').map(Number)
  return hours * 60 + minutes
}

export function onlineCutoffTime(salon) {
  const close = timeToMinutes(salon.closingTime)
  const cutoff = Math.max(0, close - 30)
  return `${String(Math.floor(cutoff / 60)).padStart(2, '0')}:${String(cutoff % 60).padStart(2, '0')}`
}

export function isOnlineJoiningOpen(state, now = Date.now()) {
  const current = new Date(now)
  const nowMinutes = current.getHours() * 60 + current.getMinutes()
  return Boolean(
    state.salon.isOpen &&
      state.salon.onlineJoiningOpen &&
      state.services.some((service) => service.enabled) &&
      workingBarbers(state).length > 0 &&
      nowMinutes >= timeToMinutes(state.salon.openingTime) &&
      nowMinutes < timeToMinutes(onlineCutoffTime(state.salon)),
  )
}

export function isSalonOpenNow(state, now = Date.now()) {
  const current = new Date(now)
  const nowMinutes = current.getHours() * 60 + current.getMinutes()
  return (
    state.salon.isOpen &&
    nowMinutes >= timeToMinutes(state.salon.openingTime) &&
    nowMinutes < timeToMinutes(state.salon.closingTime)
  )
}

export function canJoin(state, input, now = Date.now()) {
  const { name, phone, serviceIds = [], preferredBarberId = 'any', source = 'online' } = input

  if (!String(name || '').trim()) return { ok: false, error: 'join.invalidName' }
  if (!isValidPhone(phone)) return { ok: false, error: 'join.invalidPhone' }
  if (serviceIds.length === 0 || serviceIds.length > MAX_SERVICES) {
    return { ok: false, error: 'join.noServices' }
  }
  if (serviceIds.some((id) => !state.services.some((service) => service.id === id && service.enabled))) {
    return { ok: false, error: 'join.noServices' }
  }
  if (preferredBarberId !== 'any') {
    const barber = state.barbers.find((item) => item.id === preferredBarberId)
    if (!barber || !barber.onDuty || barber.onBreak) {
      return { ok: false, error: 'join.noBarbersAvailable' }
    }
  } else if (workingBarbers(state).length === 0) {
    return { ok: false, error: 'join.noBarbersAvailable' }
  }

  const existing = getActiveEntryByPhone(state, phone)
  if (existing) return { ok: false, error: 'join.duplicatePhone', token: existing.token }

  if (source === 'walk-in') {
    if (!state.salon.isOpen) return { ok: false, error: 'join.joiningClosed' }
  } else if (!isOnlineJoiningOpen(state, now)) {
    return { ok: false, error: 'join.joiningClosed' }
  }

  return { ok: true }
}

function withEntry(state, id, changes) {
  return {
    ...state,
    entries: state.entries.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    updatedAt: Date.now(),
  }
}

export function addEntry(state, input, now = Date.now()) {
  const check = canJoin(state, input, now)
  if (!check.ok) return check

  const prefix = input.source === 'walk-in' ? 'W' : 'A'
  const token = `${prefix}${String(state.nextToken).padStart(3, '0')}`
  const entry = {
    id: `e${state.nextToken}`,
    token,
    name: String(input.name).trim(),
    phone: normalizePhone(input.phone),
    serviceIds: [...input.serviceIds],
    preferredBarberId: input.preferredBarberId || 'any',
    assignedBarberId: null,
    source: input.source || 'online',
    status: 'waiting',
    createdAt: now,
    calledAt: null,
    startedAt: null,
    completedAt: null,
    notifiedComingAt: null,
    notifiedTurnAt: null,
  }

  return {
    ok: true,
    entry,
    state: { ...state, entries: [...state.entries, entry], nextToken: state.nextToken + 1, updatedAt: now },
  }
}

export function barberCanCall(state, barberId) {
  const barber = state.barbers.find((item) => item.id === barberId)
  if (!barber || !barber.onDuty || barber.onBreak) return { ok: false, error: 'reception.barberUnavailable' }
  if (barberActiveCustomer(state, barberId)) return { ok: false, error: 'reception.barberBusy' }
  return { ok: true }
}

export function eligibleWaitingForBarber(state, barberId) {
  return waitingEntries(state).filter((entry) => isEligibleForBarber(entry, barberId))
}

export function callEntry(state, entryId, barberId, now = Date.now()) {
  const entry = state.entries.find((item) => item.id === entryId)
  if (!entry || entry.status !== 'waiting') return { ok: false, error: 'reception.noEligible' }

  const chosenBarberId = barberId || entry.preferredBarberId
  if (chosenBarberId === 'any') {
    // Reception called an Any-Barber row: choose the free working barber with
    // the shortest eligible waiting lane. FCFS for customers is unaffected.
    const free = workingBarbers(state)
      .filter((barber) => isEligibleForBarber(entry, barber.id) && !barberActiveCustomer(state, barber.id))
      .sort(
        (a, b) =>
          eligibleWaitingForBarber(state, a.id).length - eligibleWaitingForBarber(state, b.id).length ||
          state.barbers.findIndex((item) => item.id === a.id) - state.barbers.findIndex((item) => item.id === b.id),
      )[0]
    if (!free) return { ok: false, error: 'reception.barberBusy' }
    return callEntry(state, entryId, free.id, now)
  }

  const barberCheck = barberCanCall(state, chosenBarberId)
  if (!barberCheck.ok) return barberCheck
  if (!isEligibleForBarber(entry, chosenBarberId)) return { ok: false, error: 'reception.noEligible' }

  return {
    ok: true,
    entry: { ...entry, status: 'called', assignedBarberId: chosenBarberId, calledAt: now },
    state: {
      ...withEntry(state, entryId, { status: 'called', assignedBarberId: chosenBarberId, calledAt: now }),
      lastCall: { token: entry.token, barberId: chosenBarberId, at: now },
    },
  }
}

export function callNext(state, barberId, now = Date.now()) {
  const barberCheck = barberCanCall(state, barberId)
  if (!barberCheck.ok) return barberCheck
  const next = eligibleWaitingForBarber(state, barberId)[0]
  if (!next) return { ok: false, error: 'reception.noEligible' }
  return callEntry(state, next.id, barberId, now)
}

export function startService(state, entryId, now = Date.now()) {
  const entry = state.entries.find((item) => item.id === entryId)
  if (!entry || entry.status !== 'called') return { ok: false, error: 'status.tokenNotFound' }
  return { ok: true, state: withEntry(state, entryId, { status: 'in_chair', startedAt: now }) }
}

export function completeService(state, entryId, now = Date.now()) {
  const entry = state.entries.find((item) => item.id === entryId)
  if (!entry || entry.status !== 'in_chair') return { ok: false, error: 'status.tokenNotFound' }
  return { ok: true, state: withEntry(state, entryId, { status: 'done', completedAt: now }) }
}

export function cancelEntry(state, entryId, now = Date.now()) {
  const entry = state.entries.find((item) => item.id === entryId)
  if (!entry) return { ok: false, error: 'status.tokenNotFound' }
  if (entry.status === 'in_chair') return { ok: false, error: 'status.cancelStarted' }
  if (!['waiting', 'called'].includes(entry.status)) {
    return { ok: false, error: 'status.tokenNotFound' }
  }
  return { ok: true, state: withEntry(state, entryId, { status: 'cancelled', completedAt: now }) }
}

export function noShowEligible(state, entry, now = Date.now()) {
  return entry?.status === 'called' && entry.calledAt && now - entry.calledAt >= NO_SHOW_WINDOW_MIN * minute
}

export function markNoShow(state, entryId, now = Date.now()) {
  const entry = state.entries.find((item) => item.id === entryId)
  if (!entry || entry.status !== 'called') return { ok: false, error: 'status.tokenNotFound' }
  if (!noShowEligible(state, entry, now)) return { ok: false, error: 'reception.noShowTooEarly' }
  return { ok: true, state: withEntry(state, entryId, { status: 'no_show', completedAt: now }) }
}

export function markNotified(state, entryId, kind, now = Date.now()) {
  const field = kind === 'turn' ? 'notifiedTurnAt' : 'notifiedComingAt'
  const entry = state.entries.find((item) => item.id === entryId)
  if (!entry || entry[field]) return { ok: true, state }
  return { ok: true, state: withEntry(state, entryId, { [field]: now }) }
}

export function toggleBarberBreak(state, barberId) {
  const barber = state.barbers.find((item) => item.id === barberId)
  if (!barber) return { ok: false, error: 'barber.notFound' }
  return {
    ok: true,
    state: {
      ...state,
      barbers: state.barbers.map((item) =>
        item.id === barberId ? { ...item, onBreak: !item.onBreak } : item,
      ),
      updatedAt: Date.now(),
    },
  }
}

export function setSalonConfig(state, changes) {
  const opening = changes.openingTime ?? state.salon.openingTime
  const closing = changes.closingTime ?? state.salon.closingTime
  if (!/^\d{2}:\d{2}$/.test(opening) || !/^\d{2}:\d{2}$/.test(closing)) {
    return { ok: false, error: 'validation.invalidTime' }
  }
  if (timeToMinutes(closing) <= timeToMinutes(opening)) {
    return { ok: false, error: 'owner.timeInvalid' }
  }
  return { ok: true, state: { ...state, salon: { ...state.salon, ...changes }, updatedAt: Date.now() } }
}

export function saveService(state, service) {
  const valid =
    String(service.nameEn || '').trim() &&
    String(service.nameGu || '').trim() &&
    Number(service.durationMin) > 0 &&
    Number(service.price) >= 0
  if (!valid) return { ok: false, error: 'owner.serviceValidation' }

  const record = {
    id: service.id || `s${Date.now()}`,
    nameEn: String(service.nameEn).trim(),
    nameGu: String(service.nameGu).trim(),
    durationMin: Number(service.durationMin),
    price: Number(service.price),
    enabled: service.enabled !== false,
  }
  const duplicate = state.services.some(
    (item) =>
      item.id !== record.id &&
      (item.nameEn.toLowerCase() === record.nameEn.toLowerCase() ||
        item.nameGu === record.nameGu),
  )
  if (duplicate) return { ok: false, error: 'validation.duplicateService' }

  const exists = state.services.some((item) => item.id === record.id)
  return {
    ok: true,
    state: {
      ...state,
      services: exists
        ? state.services.map((item) => (item.id === record.id ? record : item))
        : [...state.services, record],
      updatedAt: Date.now(),
    },
  }
}

export function deleteService(state, serviceId) {
  const used = state.entries.some(
    (entry) => ACTIVE_STATUSES.includes(entry.status) && entry.serviceIds.includes(serviceId),
  )
  if (used) return { ok: false, error: 'owner.serviceInUse' }
  return {
    ok: true,
    state: { ...state, services: state.services.filter((item) => item.id !== serviceId), updatedAt: Date.now() },
  }
}

export function saveBarber(state, barber) {
  const valid = String(barber.name || '').trim() && String(barber.nameGu || '').trim()
  if (!valid) return { ok: false, error: 'validation.requiredField' }
  const record = {
    id: barber.id || `b${Date.now()}`,
    name: String(barber.name).trim(),
    nameGu: String(barber.nameGu).trim(),
    onDuty: barber.onDuty !== false,
    onBreak: Boolean(barber.onBreak),
  }
  const exists = state.barbers.some((item) => item.id === record.id)
  return {
    ok: true,
    state: {
      ...state,
      barbers: exists
        ? state.barbers.map((item) => (item.id === record.id ? record : item))
        : [...state.barbers, record],
      updatedAt: Date.now(),
    },
  }
}

export function removeBarber(state, barberId) {
  if (barberActiveCustomer(state, barberId)) return { ok: false, error: 'owner.cannotRemoveBusy' }
  return {
    ok: true,
    state: { ...state, barbers: state.barbers.filter((item) => item.id !== barberId), updatedAt: Date.now() },
  }
}

export function getStats(state, now = Date.now()) {
  const today = new Date(now).toDateString()
  const isToday = (timestamp) => Boolean(timestamp) && new Date(timestamp).toDateString() === today
  const todays = state.entries.filter((entry) => isToday(entry.createdAt))
  const served = todays.filter((entry) => entry.status === 'done')
  const waits = todays
    .filter((entry) => entry.calledAt)
    .map((entry) => (entry.calledAt - entry.createdAt) / minute)
  const avgWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0
  const noShows = todays.filter((entry) => entry.status === 'no_show').length
  return { served: served.length, avgWait, noShows }
}

export function getRecentActivity(state, limit = 6) {
  return [...state.entries]
    .sort((a, b) => (b.calledAt || b.createdAt) - (a.calledAt || a.createdAt))
    .slice(0, limit)
}
