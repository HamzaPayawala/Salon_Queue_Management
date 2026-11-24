import { Link } from 'react-router-dom'
import { ArrowRight, Clock3, Users, Scissors, Sparkles, MapPin } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useNow } from '../hooks/useNow.js'
import { useQueue } from '../hooks/useQueue.js'
import {
  barberActiveCustomer,
  barberName,
  estimateWait,
  isOnlineJoiningOpen,
  onlineCutoffTime,
  waitingEntries,
  workingBarbers,
} from '../queue/queueEngine.js'
import { getConnection } from '../queue/queueStore.js'
import { getSavedToken } from '../lib/session.js'
import { BarberStatusPill, Button, Card, EmptyState, ErrorBanner, StatCard } from '../components/ui.jsx'

export function Home() {
  const state = useQueue()
  const { t, language } = useLanguage()
  const now = useNow(30_000)
  const { cloudError } = getConnection()
  const savedToken = getSavedToken()

  const waiting = waitingEntries(state)
  const eta = waiting.length ? estimateWait(state, waiting[0], now) : 0
  const working = workingBarbers(state)
  const freeBarbers = working.filter((barber) => !barberActiveCustomer(state, barber.id))
  const onlineOpen = isOnlineJoiningOpen(state, now)
  const cutOff = onlineCutoffTime(state.salon)

  return (
    <div className="space-y-6 animate-fade-in">
      <ErrorBanner message={cloudError} />

      <section className="relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-charcoal-900 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <span className={`h-2 w-2 rounded-full bg-current ${state.salon.isOpen ? 'animate-live-pulse' : ''}`} aria-hidden="true" />
              {t(state.salon.isOpen ? 'common.open' : 'common.closed')} · {t('home.openUntil', { time: state.salon.closingTime })}
            </div>
            <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {state.salon.isOpen ? t('home.heroTitle') : t('home.closedTitle')}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {state.salon.isOpen ? t('home.heroSubtitle') : t('home.closedBody')}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {onlineOpen ? (
                <Link to="/join">
                  <Button icon={Sparkles} className="px-6 py-3 text-base">
                    {t('home.joinNow')}
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </Link>
              ) : (
                <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-light">
                  <p className="font-semibold">{t('home.onlineClosed')}</p>
                  <p className="mt-0.5 text-xs text-slate-300">{t('home.walkinsWelcome')}</p>
                </div>
              )}
              {savedToken && (
                <Link to="/status">
                  <Button variant="secondary" className="px-5 py-3 text-base">
                    {t('common.trackMySpot')}
                  </Button>
                </Link>
              )}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
              <Clock3 size={14} aria-hidden="true" />
              {t('home.onlineClosesAt', { time: cutOff })}
            </p>
          </div>

          <Card className="border-gold/20 bg-charcoal-950/80 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold/80">{t('home.liveSummary')}</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-charcoal-800 pb-4">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-slate-400" aria-hidden="true" />
                  <span className="text-sm text-slate-300">{t('home.peopleWaitingNow')}</span>
                </div>
                <span className="text-3xl font-extrabold leading-none text-white">{waiting.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-charcoal-800 pb-4">
                <div className="flex items-center gap-3">
                  <Clock3 size={20} className="text-slate-400" aria-hidden="true" />
                  <span className="text-sm text-slate-300">{t('home.avgWaitShort')}</span>
                </div>
                <span className="text-xl font-bold text-gold-light">
                  {waiting.length ? `${Math.max(0, eta - 2)}–${eta + 2} ${t('common.min')}` : `0 ${t('common.min')}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Scissors size={20} className="text-slate-400" aria-hidden="true" />
                  <span className="text-sm text-slate-300">{t('home.availability')}</span>
                </div>
                <span className="text-xl font-bold text-emerald-300">
                  {freeBarbers.length} / {working.length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label={t('common.peopleWaiting')} value={waiting.length} />
        <StatCard icon={Clock3} label={t('common.estimatedWait')} value={`${eta}`} hint={t('common.min')} accent />
        <StatCard icon={Scissors} label={t('common.barbersAvailable')} value={`${freeBarbers.length}`} />
      </div>

      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">{t('home.availability')}</h2>
          <span className="text-xs text-slate-500">{t('common.live')}</span>
        </div>
        {state.barbers.length === 0 ? (
          <EmptyState icon={Scissors} title={t('home.noBarbers')} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {state.barbers.map((barber) => {
              const current = barberActiveCustomer(state, barber.id)
              return (
                <li key={barber.id} className="flex items-center justify-between gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{barberName(barber, language)}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {current ? `${t('reception.current')}: ${current.token}` : t('home.barberFree')}
                    </p>
                  </div>
                  <BarberStatusPill barber={barber} current={current} />
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <MapPin size={14} aria-hidden="true" />
        {t('home.seeFullQueue')}
      </p>
    </div>
  )
}
