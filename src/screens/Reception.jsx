import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, Ban, CircleUserRound, Clock3, Plus, Scissors,
  Timer, UserRound, UserX, Users,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useNow } from '../hooks/useNow.js'
import { useQueue } from '../hooks/useQueue.js'
import {
  MAX_SERVICES,
  addEntry,
  barberActiveCustomer,
  barberCanCall,
  barberName,
  cancelEntry,
  callEntry,
  callNext,
  eligibleWaitingForBarber,
  getStats,
  isValidPhone,
  markNoShow,
  noShowEligible,
  normalizePhone,
  serviceName,
  serviceTotals,
  waitingEntries,
} from '../queue/queueEngine.js'
import { dispatch } from '../queue/queueStore.js'
import { formatClock, formatWaitDuration } from '../lib/time.js'
import {
  BarberStatusPill, Button, Card, EmptyState, Field, Modal, PageHeader,
  StatCard, StatusPill, inputClass, useToast,
} from '../components/ui.jsx'

function emptyWalkin() {
  return { name: '', phone: '', serviceIds: [], preferredBarberId: 'any' }
}

export function Reception() {
  const state = useQueue()
  const { t, language } = useLanguage()
  const now = useNow(1000)
  const showToast = useToast()
  const [tab, setTab] = useState('barbers')
  const [walkinOpen, setWalkinOpen] = useState(false)
  const [walkin, setWalkin] = useState(emptyWalkin)
  const [walkinError, setWalkinError] = useState('')
  const [confirm, setConfirm] = useState(null)

  const waiting = waitingEntries(state)
  const stats = useMemo(() => getStats(state, now), [state, now])
  const longestWait = waiting.length ? Math.max(...waiting.map((entry) => (now - entry.createdAt) / 60_000)) : 0

  const run = (action, successMessage) => {
    const result = dispatch(action)
    if (!result.ok) {
      showToast(t(result.error, { token: result.token }), 'error')
      return result
    }
    if (successMessage) showToast(successMessage)
    return result
  }

  const submitWalkin = (event) => {
    event.preventDefault()
    setWalkinError('')
    const result = dispatch((current) =>
      addEntry(
        current,
        { ...walkin, phone: normalizePhone(walkin.phone), source: 'walk-in' },
        Date.now(),
      ),
    )
    if (!result.ok) {
      const message = t(result.error, { token: result.token })
      setWalkinError(message)
      showToast(message, 'error')
      return
    }
    setWalkinOpen(false)
    setWalkin(emptyWalkin())
    showToast(`${t('reception.addWalkin')} · ${result.entry.token}`)
  }

  const confirmAction = () => {
    if (!confirm) return
    const { kind, entry } = confirm
    if (kind === 'cancel') {
      run((current) => cancelEntry(current, entry.id, Date.now()), t('status.cancelledTitle'))
    } else {
      run((current) => markNoShow(current, entry.id, Date.now()), t('status.noShowTitle'))
    }
    setConfirm(null)
  }

  const barberPanel = (
    <div className="space-y-3">
      {state.barbers.length === 0 ? (
        <Card><EmptyState icon={Scissors} title={t('reception.noBarbersDuty')} /></Card>
      ) : (
        state.barbers.map((barber) => {
          const current = barberActiveCustomer(state, barber.id)
          const next = eligibleWaitingForBarber(state, barber.id)[0]
          const check = barberCanCall(state, barber.id)
          const serviceIds = current?.serviceIds || []
          const total = serviceTotals(state, serviceIds).duration
          const remaining = current?.status === 'in_chair' && current.startedAt
            ? Math.max(0, Math.ceil(total - (now - current.startedAt) / 60_000))
            : total
          return (
            <Card key={barber.id} className="border-gold/15 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">{barberName(barber, language)}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {t('reception.next')}: {next ? next.token : t('reception.none')}
                  </p>
                </div>
                <BarberStatusPill barber={barber} current={current} />
              </div>

              {current ? (
                <div className="mt-4 rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gold-light">{current.token}</span>
                    <StatusPill status={current.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-200">{current.name}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {current.serviceIds.map((id) => serviceName(state.services.find((s) => s.id === id), language)).join(', ')}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Timer size={14} aria-hidden="true" />
                    {current.status === 'in_chair' ? `${remaining} ${t('common.min')}` : t('barber.calledBadge')}
                  </p>
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-charcoal-700 px-4 py-5 text-center text-xs text-slate-500">
                  {t('barber.noCurrent')}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  disabled={!check.ok}
                  title={check.ok ? undefined : t(check.error)}
                  onClick={() => run((currentState) => callNext(currentState, barber.id, Date.now()))}
                  icon={ArrowRight}
                >
                  {t('reception.callNext')}
                </Button>
                <Link to={`/barber/${barber.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full" icon={Scissors}>{t('barber.title')}</Button>
                </Link>
              </div>
              {!check.ok && <p className="mt-2 text-[11px] text-slate-500">{t(check.error)}</p>}
            </Card>
          )
        })
      )}
    </div>
  )

  const waitingPanel = (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-charcoal-700 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-bold text-white">{t('reception.queueOrder')}</h2>
        <span className="rounded-full border border-charcoal-600 px-2 py-0.5 text-xs text-slate-400">{waiting.length}</span>
      </div>
      {waiting.length === 0 ? (
        <EmptyState icon={Users} title={t('reception.noWaiting')} />
      ) : (
        <ul className="divide-y divide-charcoal-800">
          {waiting.map((entry, index) => {
            const waited = Math.round((now - entry.createdAt) / 60_000)
            const overHour = waited > 60
            const preferred = entry.preferredBarberId === 'any'
              ? t('common.anyBarber')
              : barberName(state.barbers.find((b) => b.id === entry.preferredBarberId), language)
            return (
              <li key={entry.id} className={`p-4 sm:px-5 ${overHour ? 'bg-orange-500/5' : ''}`}>
                <div className="flex flex-wrap items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-charcoal-600 bg-charcoal-900 text-xs font-bold text-slate-400">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gold-light">{entry.token}</span>
                      <span className="text-sm font-semibold text-white">{entry.name}</span>
                      {entry.source === 'walk-in' && (
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300">{t('reception.walkinBadge')}</span>
                      )}
                      {overHour && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-300">
                          <AlertTriangle size={11} />{t('reception.over60')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {entry.serviceIds.map((id) => serviceName(state.services.find((s) => s.id === id), language)).join(' · ')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span>{t('reception.maskPhone', { last4: entry.phone.slice(-4) })}</span>
                      <span>{t('common.preferredBarber')}: {preferred}</span>
                      <span>{t('common.joinedAt')}: {formatClock(entry.createdAt, language)}</span>
                      <span className={overHour ? 'font-semibold text-orange-300' : ''}>
                        {t('common.waitTime')}: {formatWaitDuration(entry.createdAt, now, language)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      variant="outlineGold"
                      className="px-3 py-2 text-xs"
                      icon={ArrowRight}
                      onClick={() => run((current) =>
                        callEntry(current, entry.id, entry.preferredBarberId === 'any' ? undefined : entry.preferredBarberId, Date.now()),
                      )}
                    >
                      {t('reception.call')}
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2.5 py-2 text-xs"
                      icon={Ban}
                      aria-label={t('reception.cancel')}
                      onClick={() => setConfirm({ kind: 'cancel', entry })}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )

  const calledEntries = state.entries.filter((entry) => entry.status === 'called')

  return (
    <div className="animate-fade-in">
      <PageHeader title={t('reception.title')} subtitle={t('reception.subtitle')}>
        <Button icon={Plus} onClick={() => setWalkinOpen(true)}>{t('reception.addWalkin')}</Button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label={t('common.peopleWaiting')} value={waiting.length} />
        <StatCard icon={Clock3} label={t('reception.longestWait')} value={`${Math.round(longestWait)}`} hint={t('common.min')} accent={longestWait > 60} />
        <StatCard icon={Scissors} label={t('reception.servedToday')} value={stats.served} />
        <StatCard icon={UserX} label={t('reception.noShowsToday')} value={stats.noShows} />
      </div>

      <div className="mb-4 flex lg:hidden" role="tablist" aria-label={t('reception.title')}>
        {[
          { key: 'barbers', label: t('reception.barbers'), icon: Scissors },
          { key: 'waiting', label: t('reception.waitingList'), icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === key ? 'bg-gold text-charcoal-950' : 'border border-charcoal-700 text-slate-400'}`}
          >
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className={tab === 'barbers' ? 'block' : 'hidden lg:block'}>
          <h2 className="mb-3 hidden text-sm font-bold uppercase tracking-wide text-slate-500 lg:block">{t('reception.barbers')}</h2>
          {barberPanel}
        </div>
        <div className={tab === 'waiting' ? 'block' : 'hidden lg:block'}>
          {waitingPanel}

          {calledEntries.length > 0 && (
            <Card className="mt-4 p-4">
              <h2 className="mb-3 text-sm font-bold text-white">{t('status.called')}</h2>
              <ul className="space-y-2">
                {calledEntries.map((entry) => {
                  const eligible = noShowEligible(state, entry, now)
                  return (
                    <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{entry.token} · {entry.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {t('reception.calledAt', { time: formatClock(entry.calledAt, language) })}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          className="px-2.5 py-2 text-xs"
                          icon={Ban}
                          onClick={() => setConfirm({ kind: 'cancel', entry })}
                        >
                          {t('reception.cancel')}
                        </Button>
                        <Button
                          variant="danger"
                          className="px-3 py-2 text-xs"
                          icon={UserX}
                          disabled={!eligible}
                          title={eligible ? undefined : t('reception.noShowTooEarly')}
                          onClick={() => setConfirm({ kind: 'noShow', entry })}
                        >
                          {t('reception.noShow')}
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {calledEntries.some((entry) => !noShowEligible(state, entry, now)) && (
                <p className="mt-2 text-[11px] text-slate-500">{t('reception.noShowTooEarly')}</p>
              )}
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={walkinOpen}
        title={t('reception.walkinTitle')}
        onClose={() => setWalkinOpen(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setWalkinOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" form="walkin-form">{t('reception.addWalkinSubmit')}</Button>
          </>
        }
      >
        <form id="walkin-form" onSubmit={submitWalkin} className="space-y-4">
          {walkinError && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{walkinError}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('common.name')}>
              <input className={inputClass(false)} value={walkin.name} onChange={(event) => setWalkin({ ...walkin, name: event.target.value })} placeholder={t('join.namePlaceholder')} />
            </Field>
            <Field label={t('common.phone')}>
              <input className={inputClass(false)} value={walkin.phone} onChange={(event) => setWalkin({ ...walkin, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" placeholder={t('join.mobilePlaceholder')} />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-300">{t('join.chooseServices')} ({walkin.serviceIds.length}/{MAX_SERVICES})</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {state.services.filter((service) => service.enabled).map((service) => {
                const selected = walkin.serviceIds.includes(service.id)
                return (
                  <button
                    key={service.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setWalkin((current) => ({
                      ...current,
                      serviceIds: selected
                        ? current.serviceIds.filter((id) => id !== service.id)
                        : current.serviceIds.length >= MAX_SERVICES
                          ? current.serviceIds
                          : [...current.serviceIds, service.id],
                    }))}
                    className={`rounded-xl border px-3 py-2 text-left text-xs ${selected ? 'border-gold bg-gold/10 text-white' : 'border-charcoal-600 text-slate-300'}`}
                  >
                    {serviceName(service, language)} · {service.durationMin} {t('common.min')}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <Field label={t('common.preferredBarber')}>
            <select
              className={inputClass(false)}
              value={walkin.preferredBarberId}
              onChange={(event) => setWalkin({ ...walkin, preferredBarberId: event.target.value })}
            >
              <option value="any">{t('common.anyBarber')}</option>
              {state.barbers.filter((barber) => barber.onDuty && !barber.onBreak).map((barber) => (
                <option key={barber.id} value={barber.id}>{barberName(barber, language)}</option>
              ))}
            </select>
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        title={confirm?.kind === 'noShow' ? t('reception.confirmNoShow') : t('reception.confirmCancel')}
        onClose={() => setConfirm(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>{t('common.no')}</Button>
            <Button variant={confirm?.kind === 'noShow' ? 'danger' : 'secondary'} onClick={confirmAction}>
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <p>{confirm?.kind === 'noShow' ? t('reception.noShowBody') : t('reception.cancelBody')}</p>
        {confirm && <p className="mt-3 font-semibold text-white">{confirm.entry.token} · {confirm.entry.name}</p>}
      </Modal>
    </div>
  )
}
