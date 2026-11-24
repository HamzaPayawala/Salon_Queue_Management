import { useEffect, useRef, useState } from 'react'
import { Clock3, Maximize2, MonitorPlay, Volume2, VolumeX } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useNow } from '../hooks/useNow.js'
import { useQueue } from '../hooks/useQueue.js'
import {
  barberActiveCustomer,
  barberName,
  eligibleWaitingForBarber,
  estimateWait,
  serviceName,
} from '../queue/queueEngine.js'
import { enableSound, playChime, soundEnabled } from '../lib/sound.js'
import { formatClock } from '../lib/time.js'
import { LanguageToggle } from '../components/LanguageToggle.jsx'
import { Logo } from '../components/AppShell.jsx'
import { Card, EmptyState } from '../components/ui.jsx'

export function WaitingTV() {
  const state = useQueue()
  const { t, language } = useLanguage()
  const now = useNow(1000)
  const [soundOn, setSoundOn] = useState(false)
  const lastPlayed = useRef(null)

  useEffect(() => {
    const at = state.lastCall?.at
    if (!at || lastPlayed.current === at) return
    lastPlayed.current = at
    if (soundEnabled()) playChime()
  }, [state.lastCall?.at])

  const onDuty = state.barbers.filter((barber) => barber.onDuty)

  const toggleSound = () => {
    const ok = enableSound()
    setSoundOn(ok && soundEnabled())
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.()
  }

  return (
    <div className="flex min-h-screen flex-col bg-charcoal-950">
      <header className="border-b border-charcoal-700 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-2 text-2xl font-bold tabular-nums text-white sm:text-3xl">
            <Clock3 size={22} className="text-gold" aria-hidden="true" />
            {formatClock(now, language)}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-xs font-semibold ${soundOn ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-charcoal-600 text-slate-400'}`}
            >
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="hidden sm:inline">{soundOn ? t('tv.soundOn') : t('tv.enableSound')}</span>
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-charcoal-600 px-3 text-xs font-semibold text-slate-400 hover:text-white"
            >
              <Maximize2 size={16} />
              <span className="hidden sm:inline">{t('tv.fullscreen')}</span>
            </button>
            <LanguageToggle compact />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1800px] flex-1 px-3 py-5 sm:px-8 sm:py-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold/80">{t('tv.nowServing')}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{t('common.appName')}</h1>
        </div>

        {onDuty.length === 0 ? (
          <Card className="mx-auto max-w-xl"><EmptyState icon={MonitorPlay} title={t('tv.noBarbers')} /></Card>
        ) : (
          <div className={`grid gap-4 sm:gap-6 ${onDuty.length <= 2 ? 'lg:grid-cols-2' : onDuty.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2 xl:grid-cols-4'}`}>
            {onDuty.map((barber) => {
              const current = barberActiveCustomer(state, barber.id)
              // Break rule: no new calls are pending, so hide this barber's next tokens.
              const next = barber.onBreak ? [] : eligibleWaitingForBarber(state, barber.id).slice(0, 5)
              const eta = next.length ? estimateWait(state, next[0], now) : 0
              const justCalled = Boolean(
                state.lastCall?.barberId === barber.id &&
                now - state.lastCall.at < 30_000,
              )
              return (
                <Card key={barber.id} className={`relative overflow-hidden p-5 sm:p-7 ${justCalled ? 'animate-gold-pulse border-gold' : 'border-charcoal-700'}`}>
                  {justCalled && (
                    <div className="absolute right-0 top-0 rounded-bl-xl bg-gold px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-charcoal-950">
                      {t('tv.justCalled')}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-white sm:text-2xl">{barberName(barber, language)}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${barber.onBreak ? 'border-orange-500/40 bg-orange-500/10 text-orange-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'}`}>
                      {barber.onBreak ? t('common.onBreak') : t('common.available')}
                    </span>
                  </div>

                  <div className="mt-5 min-h-[110px] rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/10 to-transparent px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-gold/80">{t('tv.nowServing')}</p>
                    {current ? (
                      <>
                        <p className="mt-1 text-5xl font-extrabold leading-none text-gold-light sm:text-6xl">{current.token}</p>
                        <p className="mt-2 truncate text-sm text-slate-300">{current.name}</p>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">{t('tv.allCaughtUp')}</p>
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('tv.nextFive')}</p>
                      {next.length > 0 && <p className="text-xs text-gold-light">{t('tv.estWait', { n: eta })}</p>}
                    </div>
                    {next.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-charcoal-700 px-3 py-4 text-center text-xs text-slate-600">
                        {t(barber.onBreak ? 'tv.breakHint' : 'tv.noNext')}
                      </p>
                    ) : (
                      <ol className="flex flex-wrap gap-2">
                        {next.map((entry) => (
                          <li key={entry.id} className="rounded-lg border border-charcoal-600 bg-charcoal-900 px-3 py-2">
                            <span className="text-sm font-bold text-white">{entry.token}</span>
                            <span className="ml-2 text-[11px] text-slate-500">
                              {entry.serviceIds.map((id) => serviceName(state.services.find((s) => s.id === id), language)).join(', ')}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-charcoal-700 bg-charcoal-900 px-4 py-3 text-center text-xs text-slate-400 sm:text-sm">
        {t('tv.ticker')}
      </footer>
    </div>
  )
}
