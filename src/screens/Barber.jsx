import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Clock3, Coffee, Play, Scissors, Timer, UserRound } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useNow } from '../hooks/useNow.js'
import { useQueue } from '../hooks/useQueue.js'
import {
  barberActiveCustomer,
  barberName,
  completeService,
  eligibleWaitingForBarber,
  serviceName,
  serviceTotals,
  startService,
  toggleBarberBreak,
} from '../queue/queueEngine.js'
import { dispatch } from '../queue/queueStore.js'
import { formatClock, formatTimer } from '../lib/time.js'
import {
  Button, Card, EmptyState, Modal, PageHeader, StatusPill, Switch, useToast,
} from '../components/ui.jsx'

export function Barber() {
  const { barberId } = useParams()
  const state = useQueue()
  const { t, language } = useLanguage()
  const now = useNow(1000)
  const showToast = useToast()
  const [confirm, setConfirm] = useState(null)

  const barber = state.barbers.find((item) => item.id === barberId)
  if (!barber) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title={t('barber.notFound')} />
        <Card><EmptyState icon={Scissors} title={t('barber.notFound')} action={<Link to="/"><Button>{t('common.backHome')}</Button></Link>} /></Card>
      </div>
    )
  }

  const current = barberActiveCustomer(state, barber.id)
  const next = eligibleWaitingForBarber(state, barber.id)[0]
  const totals = serviceTotals(state, current?.serviceIds || [])
  const elapsedMs = current?.status === 'in_chair' && current.startedAt ? now - current.startedAt : 0
  const remainingSeconds = Math.max(0, totals.duration * 60 - elapsedMs / 1000)
  const progress = totals.duration ? Math.min(100, (elapsedMs / 60_000 / totals.duration) * 100) : 0

  const run = (action, message) => {
    const result = dispatch(action)
    if (!result.ok) {
      showToast(t(result.error), 'error')
      return
    }
    if (message) showToast(message)
  }

  const toggleBreak = () => {
    if (!barber.onBreak && current) {
      setConfirm({ kind: 'break' })
      return
    }
    run((currentState) => toggleBarberBreak(currentState, barber.id))
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={`${t('barber.title')} · ${barberName(barber, language)}`} subtitle={t('status.arrivalHint')}>
        <div className="flex items-center gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900 px-4 py-2.5">
          <Coffee size={17} className={barber.onBreak ? 'text-orange-300' : 'text-emerald-300'} aria-hidden="true" />
          <span className="text-sm text-slate-300">{barber.onBreak ? t('common.onBreak') : t('common.available')}</span>
          <Switch checked={!barber.onBreak} onChange={() => toggleBreak()} label={t('owner.onDuty')} />
        </div>
      </PageHeader>

      {barber.onBreak && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">
          <Coffee size={17} aria-hidden="true" />
          {t('barber.onBreakBanner')}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className={`p-5 sm:p-7 ${current?.status === 'in_chair' ? 'border-emerald-500/30' : 'border-gold/30'}`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <UserRound size={18} className="text-gold" aria-hidden="true" />
              {t('barber.currentCustomer')}
            </h2>
            {current && <StatusPill status={current.status} />}
          </div>

          {!current ? (
            <EmptyState icon={UserRound} title={t('barber.noCurrent')} description={t('barber.noCurrentHint')} />
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-4xl font-extrabold tracking-tight text-gold-light">{current.token}</span>
                <span className="text-xl font-semibold text-white">{current.name}</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {current.serviceIds.map((id) => {
                  const service = state.services.find((item) => item.id === id)
                  return (
                    <span key={id} className="rounded-lg border border-charcoal-600 bg-charcoal-900 px-3 py-1.5 text-xs text-slate-300">
                      {serviceName(service, language)} · {service?.durationMin || 0} {t('common.min')}
                    </span>
                  )
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-charcoal-700 bg-charcoal-900/70 p-5">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                  <Timer size={15} aria-hidden="true" /> {t('barber.timer')}
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className={`font-mono text-5xl font-bold tabular-nums sm:text-6xl ${current.status === 'in_chair' ? 'text-white' : 'text-slate-500'}`}>
                    {current.status === 'in_chair' ? formatTimer(remainingSeconds) : `${totals.duration}:00`}
                  </p>
                  <span className="pb-1 text-sm text-slate-400">{totals.duration} {t('common.min')}</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-charcoal-700">
                  <div className="h-full rounded-full bg-gold transition-all duration-1000" style={{ width: `${current.status === 'in_chair' ? progress : 0}%` }} />
                </div>
              </div>

              {current.status === 'called' ? (
                <>
                  <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    <Clock3 size={14} aria-hidden="true" />
                    {t('barber.calledWaitingArrival', { time: formatClock(current.calledAt, language) })}
                  </p>
                  <Button className="mt-4 w-full py-3.5 text-base" icon={Play} onClick={() => run((currentState) => startService(currentState, current.id, Date.now()))}>
                    {t('barber.startService')}
                  </Button>
                </>
              ) : (
                <Button variant="outlineGold" className="mt-4 w-full py-3.5 text-base" icon={CheckCircle2} onClick={() => setConfirm({ kind: 'done' })}>
                  {t('barber.done')}
                </Button>
              )}
            </>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
              <Scissors size={18} className="text-gold" aria-hidden="true" />
              {t('barber.nextCustomer')}
            </h2>
            {!next ? (
              <EmptyState icon={Scissors} title={t('barber.noNext')} />
            ) : (
              <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl font-bold text-gold-light">{next.token}</span>
                  <StatusPill status={next.status} />
                </div>
                <p className="mt-1 text-sm font-semibold text-white">{next.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {next.serviceIds.map((id) => serviceName(state.services.find((s) => s.id === id), language)).join(' · ')}
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  {t('common.preferredBarber')}: {next.preferredBarberId === 'any' ? t('common.anyBarber') : barberName(state.barbers.find((b) => b.id === next.preferredBarberId), language)}
                </p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="text-xs leading-relaxed text-slate-500">{t('barber.noCurrentHint')}</p>
          </Card>
        </div>
      </div>

      <Modal
        open={Boolean(confirm)}
        title={confirm?.kind === 'done' ? t('barber.doneConfirm') : t('barber.breakConfirm')}
        onClose={() => setConfirm(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>{t('common.no')}</Button>
            <Button
              onClick={() => {
                if (confirm.kind === 'done') run((currentState) => completeService(currentState, current.id, Date.now()), t('barber.serviceComplete'))
                else run((currentState) => toggleBarberBreak(currentState, barber.id))
                setConfirm(null)
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        {t(confirm?.kind === 'done' ? 'barber.doneConfirmBody' : 'barber.breakConfirmBody')}
      </Modal>
    </div>
  )
}
