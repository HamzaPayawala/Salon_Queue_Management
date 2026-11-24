import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CircleUserRound, House, MonitorPlay, Scissors, Ticket, UserCog, Wifi, WifiOff } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useQueue } from '../hooks/useQueue.js'
import { getConnection } from '../queue/queueStore.js'
import { LanguageToggle } from './LanguageToggle.jsx'

const navItems = [
  { to: '/', key: 'nav.home', icon: House, end: true },
  { to: '/join', key: 'common.joinQueue', icon: Ticket },
  { to: '/status', key: 'common.viewStatus', icon: CircleUserRound },
  { to: '/reception', key: 'reception.title', icon: CircleUserRound },
  { to: '/barber/b1', key: 'barber.title', icon: Scissors },
  { to: '/tv', key: 'tv.nowServing', icon: MonitorPlay },
  { to: '/owner', key: 'owner.title', icon: UserCog },
]

export function Logo({ compact = false }) {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-base font-extrabold text-charcoal-950 shadow-lg shadow-gold/20">
        LS
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-white">{t('common.appName')}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold/80">Queue</p>
        </div>
      )}
    </div>
  )
}

function ConnectionBadge() {
  const { t } = useLanguage()
  useQueue() // re-render when connection mode changes
  const { mode } = getConnection()
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${mode === 'cloud' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-600 bg-slate-500/10 text-slate-400'}`}>
      {mode === 'cloud' ? <Wifi size={13} /> : <WifiOff size={13} />}
      {t(mode === 'cloud' ? 'common.live' : 'common.offline')}
    </span>
  )
}

export function AppShell() {
  const { pathname } = useLocation()
  const { t } = useLanguage()

  // The TV is a passive display with its own full-screen layout and controls.
  if (pathname === '/tv') return <Outlet />

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-charcoal-700 bg-charcoal-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <NavLink to="/" aria-label={t('common.appName')} className="flex min-h-11 items-center rounded-xl">
            <Logo />
          </NavLink>
          <div className="flex items-center gap-2">
            <ConnectionBadge />
            <LanguageToggle compact />
          </div>
        </div>
        <nav aria-label="Main navigation" className="mx-auto max-w-7xl overflow-x-auto px-2 pb-2 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max items-center gap-1">
            {navItems.map(({ to, key, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${isActive ? 'bg-gold/15 text-gold-light' : 'text-slate-400 hover:bg-charcoal-700 hover:text-white'}`
                  }
                >
                  <Icon size={14} aria-hidden="true" />
                  {t(key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-charcoal-800 px-4 py-4 text-center text-[11px] text-slate-600">
        {t('common.tagline')}
      </footer>
    </div>
  )
}
