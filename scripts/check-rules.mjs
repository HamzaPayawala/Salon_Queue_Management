// Fast, dependency-free checks for the queue rules. Browser checks are still
// required (docs/04-test-log.md); this script catches engine regressions early.
import assert from 'node:assert/strict'
import { createSeedState } from '../src/queue/seedData.js'
import * as engine from '../src/queue/queueEngine.js'

const now = new Date('2026-11-24T11:00:00').getTime()
const later = now + 11 * 60_000
let passed = 0

function check(name, fn) {
  fn()
  passed += 1
  console.log(`PASS ${name}`)
}

const apply = (state, result) => {
  assert.equal(result.ok, true, result.error)
  return result.state
}

check('phone numbers: 10 digits or +91, never truncated', () => {
  assert.equal(engine.normalizePhone('9876543210'), '9876543210')
  assert.equal(engine.normalizePhone('+91 98765 43210'), '9876543210')
  assert.equal(engine.isValidPhone('12345'), false)
  assert.equal(engine.isValidPhone('98765432101'), false)
  assert.equal(engine.isValidPhone('abcdefghij'), false)
})

check('join: services, duplicates and terminal phone reuse', () => {
  let state = createSeedState(now)
  const input = { name: 'Test', phone: '9000000001', serviceIds: ['s1'], preferredBarberId: 'any', source: 'online' }
  assert.equal(engine.canJoin(state, { ...input, serviceIds: [] }, now).error, 'join.noServices')
  assert.equal(engine.canJoin(state, { ...input, serviceIds: ['s1', 's2', 's3'] }, now).ok, true)
  assert.equal(engine.canJoin(state, { ...input, serviceIds: ['s1', 's2', 's3', 's4'] }, now).ok, false)
  assert.equal(engine.canJoin(state, { ...input, phone: '9876543210' }, now).error, 'join.duplicatePhone')
  assert.equal(engine.canJoin(state, { ...input, phone: '9876543216' }, now).ok, true)

  state = apply(state, engine.addEntry(state, input, now))
  assert.equal(state.entries.at(-1).token, 'A108')
  assert.equal(state.entries.at(-1).status, 'waiting')
  assert.equal(engine.canJoin(state, input, now).error, 'join.duplicatePhone')
})

check('calling: barber affinity, FCFS and one customer per chair', () => {
  let state = createSeedState(now)
  state = apply(state, engine.completeService(state, 'e101', now)) // free Arjun's chair
  const first = engine.callNext(state, 'b1', now)
  state = apply(state, first)
  assert.equal(first.entry.token, 'A102') // A101 is already in Arjun's chair
  assert.equal(first.entry.assignedBarberId, 'b1')
  assert.equal(engine.callNext(state, 'b1', now).error, 'reception.barberBusy')

  // Nina already has A105 called in the seed; finish it before testing her next pick.
  state = apply(state, engine.startService(state, 'e105', now))
  state = apply(state, engine.completeService(state, 'e105', later))
  const forNina = engine.callNext(state, 'b2', later)
  state = apply(state, forNina)
  assert.equal(forNina.entry.token, 'A103') // Any-Barber, older than A104
  assert.equal(forNina.entry.assignedBarberId, 'b2')
  assert.equal(engine.callNext(state, 'b3', now).error, 'reception.barberUnavailable')
  assert.equal(engine.callEntry(state, 'e104', 'b1', now).ok, false)
})

check('statuses: start, done, cancel and illegal transitions', () => {
  let state = createSeedState(now)
  state = apply(state, engine.completeService(state, 'e101', now))
  state = apply(state, engine.callNext(state, 'b1', now))
  const entryId = state.entries.find((entry) => entry.token === 'A102').id
  assert.equal(engine.startService(state, entryId, now).state.entries.find((e) => e.id === entryId).status, 'in_chair')
  state = apply(state, engine.startService(state, entryId, now))
  assert.equal(engine.cancelEntry(state, entryId, now).error, 'status.cancelStarted')
  assert.equal(engine.callEntry(state, entryId, 'b1', now).ok, false)
  state = apply(state, engine.completeService(state, entryId, later))
  assert.equal(engine.completeService(state, entryId, later).ok, false)
})

check('no-show: 10-minute window and fresh token on rejoin', () => {
  let state = createSeedState(now)
  const called = state.entries.find((entry) => entry.token === 'A105')
  assert.equal(engine.markNoShow(state, called.id, now).error, 'reception.noShowTooEarly')
  state = apply(state, engine.markNoShow(state, called.id, now + 10 * 60_000 + 1))
  assert.equal(state.entries.find((e) => e.id === called.id).status, 'no_show')
  const rejoin = engine.addEntry(state, {
    name: called.name, phone: called.phone, serviceIds: ['s2'],
    preferredBarberId: 'any', source: 'online',
  }, later)
  state = apply(state, rejoin)
  assert.equal(rejoin.entry.token, 'A108')
  assert.ok(rejoin.entry.createdAt > called.createdAt)
  assert.equal(state.entries.filter((e) => e.phone === called.phone && engine.ACTIVE_STATUSES.includes(e.status)).length, 1)
})

check('breaks: no calls, no selectable lane, existing customer untouched', () => {
  let state = createSeedState(now)
  state = apply(state, engine.toggleBarberBreak(state, 'b2'))
  assert.equal(engine.barberCanCall(state, 'b2').error, 'reception.barberUnavailable')
  assert.equal(engine.workingBarbersForLane(state, { preferredBarberId: 'b2' }).length, 0)
  const existing = state.entries.find((e) => e.token === 'A105')
  assert.equal(existing.status, 'called') // call was not cancelled by the break
  state = apply(state, engine.toggleBarberBreak(state, 'b2'))
  assert.equal(engine.barberCanCall(state, 'b2').error, 'reception.barberBusy') // A105 still in train
  const calledId = existing.id
  state = apply(state, engine.startService(state, calledId, now))
  state = apply(state, engine.completeService(state, calledId, later))
  assert.equal(engine.barberCanCall(state, 'b2').ok, true)
})

check('ETA: longer queues and active services increase the estimate', () => {
  const state = createSeedState(now)
  const waiting = engine.waitingEntries(state)
  const eta = engine.estimateWait(state, waiting.at(-1), now)
  assert.ok(eta > 0)
  assert.equal(engine.getPosition(state, waiting[1]), 2)
  // A newcomer's own service is not counted (docs §6); work ahead and active
  // chair time are. Compare the same seeker against a busier queue instead.
  const quiet = engine.estimateForJoin(state, ['s2'], 'any', now)
  const busier = apply(state, engine.addEntry(state, {
    name: 'Ahead', phone: '9000000009', serviceIds: ['s3'],
    preferredBarberId: 'any', source: 'online',
  }, now))
  assert.ok(engine.estimateForJoin(busier, ['s2'], 'any', now) > quiet)
  let idle = state
  idle = apply(idle, engine.completeService(idle, 'e101', now)) // e101 starts in_chair
  idle = apply(idle, engine.startService(idle, 'e105', now))
  idle = apply(idle, engine.completeService(idle, 'e105', now))
  assert.ok(engine.estimateForJoin(state, ['s2'], 'any', now) > engine.estimateForJoin(idle, ['s2'], 'any', now))
})

check('hours: closing must follow opening; online cutoff is 30 minutes before', () => {
  const state = createSeedState(now)
  assert.equal(engine.setSalonConfig(state, { openingTime: '20:00', closingTime: '19:00' }).error, 'owner.timeInvalid')
  const configured = apply(state, engine.setSalonConfig(state, { closingTime: '21:00' }))
  assert.equal(engine.onlineCutoffTime(configured.salon), '20:30')
  assert.equal(engine.isOnlineJoiningOpen(configured, now), true)
  assert.equal(engine.isOnlineJoiningOpen(configured, new Date('2026-11-24T20:31:00').getTime()), false)
})

check('owner guards and stats', () => {
  let state = createSeedState(now)
  assert.equal(engine.deleteService(state, 's1').error, 'owner.serviceInUse')
  assert.equal(engine.removeBarber(state, 'b1').error, 'owner.cannotRemoveBusy')
  assert.equal(engine.saveService(state, { nameEn: '', nameGu: '', durationMin: 0, price: -1 }).ok, false)
  state = apply(state, engine.saveService(state, { nameEn: 'Test', nameGu: 'ટેસ્ટ', durationMin: 10, price: 100 }))
  assert.equal(state.services.length, 7)
  const stats = engine.getStats(state, now)
  assert.ok(stats.served >= 1 && stats.noShows >= 1 && stats.avgWait >= 0)
})

console.log(`\n${passed}/9 rule groups passed.`)
