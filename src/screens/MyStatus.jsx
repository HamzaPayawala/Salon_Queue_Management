import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BellRing, CheckCircle2, Clock3, Copy, MapPin, Search, Ticket, TriangleAlert, UserRound, Users, XCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useNow } from '../hooks/useNow.js'
import { useQueue } from '../hooks/useQueue.js'
import {
  barberName,
  cancelEntry,
  estimateWait,
  getActiveEntryByPhone,
  getEntryByToken,
  getPosition,
  isValidPhone,
  markNotified,
  serviceName,
  serviceTotals,
} from '../queue/queueEngine.js'
import { dispatch } from '../queue/queueStore.js'
import { getSavedToken, saveToken } from '../lib/session.js'
import { formatClock, formatPrice } from '../lib/time.js'
import { notifyTurn } from '../lib/notifications.js'
import { Button, Card, EmptyState, ErrorBanner, Field, Modal, PageHeader, StatusPill, inputClass, useToast } from '../components/ui.jsx'

const steps = ['waiting', 'called', 'in_chair', 'done']
const stepKeys = ['status.waitingStep', 'status.calledStep', 'status.chairStep', 'status.doneStep']

function notificationFor(entry, position, t, language, state) {
  if (!entry) return null
  const barber = state.barbers.find((item) => item.id === entry.assignedBarberId)
  const body = barber
    ? t('status.turnBodyBarber', { barber: barberName(barber, language) })
    : t('status.turnBody')

  if (entry.status === 'waiting' && position === 2) {
    return { tone: 'coming', title: t('status.startComingTitle'), body: t('status.startComingBody'), icon: MapPin }
  }
  if (entry.status === 'called') {
    return { tone: 'turn', title: t('status.turnTitle'), body, icon: BellRing }
  }
  if (entry.status === 'in_chair') {
    return { tone: 'chair', title: t('status.chairStep'), body: t('status.arrivalHint'), icon: CheckCircle2 }
  }
  if (entry.status === 'done') {
    return { tone: 'done', title: t('status.doneTitle'), body: t('status.doneBody'), icon: CheckCircle2 }
  }
  if (entry.status === 'cancelled') {
    return { tone: 'muted', title: t('status.cancelledTitle'), body: t('status.cancelledBody'), icon: XCircle }
  }
  if (entry.status === 'no_show') {
    return { tone: 'error', title: t('status.noShowTitle'), body: t('status.noShowBody'), icon: TriangleAlert }
  }
  return null
}

export function MyStatus() {
  const { token: urlToken } = useParams()
  const state = useQueue()
  const { t, language } = useLanguage()
  const now = useNow(30_000)
  const showToast = useToast()
  const [lookupToken, setLookupToken] = useState(null)
  const [phone, setPhone] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  const token = urlToken || lookupToken || getSavedToken()
  const entry = token ? getEntryByToken(state, token) : null
  const position = entry ? getPosition(state, entry) : 0
  const eta = entry ? estimateWait(state, entry, now) : 0
  const notice = notificationFor(entry, position, t, language, state)
  const totals = entry ? serviceTotals(state, entry.serviceIds) : { duration: 0, price: 0 }
  const active = entry && ['waiting', 'called', 'in_chair'].includes(entry.status)

  // Persist "shown" markers so a notification is not repeated on every render.
  useEffect(() => {
    if (!entry) return
    if (entry.status === 'waiting' && position === 2 && !entry.notifiedComingAt) {
      dispatch((current) => markNotified(current, entry.id, 'coming', Date.now()))
    }
    if (entry.status === 'called' && !entry.notifiedTurnAt) {
      dispatch((current) => markNotified(current, entry.id, 'turn', Date.now()))
      notifyTurn(t('status.turnTitle'), notice?.body || t('status.turnBody'))
    }
  }, [entry?.id, entry?.status, position, entry?.notifiedComingAt, entry?.notifiedTurnAt, t, notice?.body])

  const submitLookup = (event) => {
    event.preventDefault()
    setLookupError('')
    if (!isValidPhone(phone)) {
      setLookupError(t('join.invalidPhone'))
      return
    }
    const found = getActiveEntryByPhone(state, phone)
    if (!found) {
      setLookupError(t('status.tokenNotFound'))
      return
    }
    saveToken(found.token)
    setLookupToken(found.token)
  }

  const cancelSpot = () => {
    const result = dispatch((current) => cancelEntry(current, entry.id, Date.now()))
    setConfirmCancel(false)
    if (!result.ok) {
      showToast(t(result.error), 'error')
      return
    }
    // Keep the token so the cancelled state remains visible. A new join overwrites it.
    showToast(t('status.cancelledTitle'))
  }

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(entry.token)
      showToast(t('common.tokenCopied'))
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  if (!entry) {
    return (
      <div className="mx-auto max-w-lg animate-fade-in">
        <PageHeader title={t('status.title')} subtitle={t('status.noToken')} />
        <Card className="p-6">
          <EmptyState icon={Ticket} title={t('status.noToken')} description={t('status.tokenNotFound')} />
          <form onSubmit={submitLookup} className="mt-2 space-y-4 border-t border-charcoal-700 pt-5">
            <Field label={t('status.phoneLookup')} error={lookupError}>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                  placeholder={t('join.mobilePlaceholder')}
                  className={`${inputClass(Boolean(lookupError))} pl-9`}
                />
              </div>
            </Field>
            <Button type="submit" className="w-full" icon={Search}>{t('status.find')}</Button>
          </form>
          <Link to="/join" className="mt-5 block text-center text-sm text-gold-light underline underline-offset-2">
            {t('common.joinQueue')}
          </Link>
        </Card>
      </div>
    )
  }

  const currentStep = steps.indexOf(entry.status)
  const noticeStyles = {
    coming: 'border-gold/50 bg-gold/15 text-gold-light',
    turn: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200',
    chair: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
    done: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    muted: 'border-slate-600 bg-slate-500/10 text-slate-300',
    error: 'border-red-500/40 bg-red-500/10 text-red-200',
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fade-in">
      <PageHeader title={t('status.title')} subtitle={t('status.arrivalHint')} />

      {notice && (
        <div role="status" aria-live="polite" className={`flex items-start gap-3 rounded-2xl border p-5 ${noticeStyles[notice.tone]}`}>
          <notice.icon size={24} className={`mt-0.5 shrink-0 ${notice.tone === 'turn' ? 'animate-live-pulse' : ''}`} aria-hidden="true" />
          <div>
            <p className="text-lg font-bold">{notice.title}</p>
            <p className="mt-1 text-sm opacity-90">{notice.body}</p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-gold/30">
        <div className="bg-gradient-to-br from-gold/15 to-transparent px-6 py-8 text-center sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">{t('status.yourToken')}</p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <p className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">{entry.token}</p>
            <button type="button" onClick={copyToken} aria-label={t('common.copyToken')} className="rounded-xl border border-charcoal-600 p-2.5 text-slate-400 hover:text-white">
              <Copy size={18} />
            </button>
          </div>
          <div className="mt-4"><StatusPill status={entry.status} /></div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-charcoal-700 border-t border-charcoal-700 sm:grid-cols-4">
          <div className="p-4 text-center">
            <Users size={17} className="mx-auto mb-1.5 text-slate-500" aria-hidden="true" />
            <p className="text-xs text-slate-500">{t('status.yourPosition')}</p>
            <p className="mt-1 text-xl font-bold text-white">{entry.status === 'waiting' ? t('status.positionValue', { n: position }) : '—'}</p>
          </div>
          <div className="p-4 text-center">
            <Clock3 size={17} className="mx-auto mb-1.5 text-slate-500" aria-hidden="true" />
            <p className="text-xs text-slate-500">{t('common.estimatedWait')}</p>
            <p className="mt-1 text-xl font-bold text-gold-light">{entry.status === 'waiting' ? eta : '—'}</p>
          </div>
          <div className="p-4 text-center">
            <UserRound size={17} className="mx-auto mb-1.5 text-slate-500" aria-hidden="true" />
            <p className="text-xs text-slate-500">{t('status.yourBarber')}</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {entry.assignedBarberId
                ? barberName(state.barbers.find((b) => b.id === entry.assignedBarberId), language)
                : entry.preferredBarberId === 'any'
                  ? t('common.anyBarber')
                  : barberName(state.barbers.find((b) => b.id === entry.preferredBarberId), language)}
            </p>
          </div>
          <div className="p-4 text-center">
            <Ticket size={17} className="mx-auto mb-1.5 text-slate-500" aria-hidden="true" />
            <p className="text-xs text-slate-500">{t('common.joinedAt')}</p>
            <p className="mt-1 text-sm font-semibold text-white">{formatClock(entry.createdAt, language)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-bold text-white">{t('status.progress')}</h2>
        <ol className="grid grid-cols-4 gap-2">
          {stepKeys.map((key, index) => {
            const reached = currentStep >= index && currentStep >= 0
            return (
              <li key={key} className="text-center">
                <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${reached ? 'border-gold bg-gold text-charcoal-950' : 'border-charcoal-600 text-slate-500'}`}>
                  {index + 1}
                </div>
                <p className={`text-[11px] ${reached ? 'text-gold-light' : 'text-slate-500'}`}>{t(key)}</p>
              </li>
            )
          })}
        </ol>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="mb-3 text-sm font-bold text-white">{t('status.yourServices')}</h2>
        <ul className="space-y-2">
          {entry.serviceIds.map((id) => {
            const service = state.services.find((item) => item.id === id)
            return (
              <li key={id} className="flex items-center justify-between gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 px-4 py-3 text-sm">
                <span className="text-slate-200">{serviceName(service, language)}</span>
                <span className="shrink-0 text-slate-400">{service?.durationMin || 0} {t('common.min')}</span>
              </li>
            )
          })}
          <li className="flex justify-between px-4 pt-1 text-sm font-semibold text-white">
            <span>{t('common.total')}</span>
            <span>{formatPrice(serviceTotals(state, entry.serviceIds).price, language)} · {totals.duration} {t('common.min')}</span>
          </li>
        </ul>
      </Card>

      {active && (
        <div className="flex justify-center pb-4">
          <Button variant="danger" icon={XCircle} onClick={() => setConfirmCancel(true)}>
            {t('status.cancelSpot')}
          </Button>
        </div>
      )}

      {!active && (
        <div className="flex justify-center pb-4">
          <Link to="/join"><Button icon={Ticket}>{t('status.joinAnother')}</Button></Link>
        </div>
      )}

      <Modal
        open={confirmCancel}
        title={t('status.cancelConfirmTitle')}
        onClose={() => setConfirmCancel(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmCancel(false)}>{t('status.keepSpot')}</Button>
            <Button variant="danger" onClick={cancelSpot}>{t('status.yesCancel')}</Button>
          </>
        }
      >
        {t('status.cancelConfirmBody')}
      </Modal>
    </div>
  )
}
