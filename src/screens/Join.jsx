import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Clock3, IndianRupee, Info, Scissors, Ticket, UserRound } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useNow } from '../hooks/useNow.js'
import { useQueue } from '../hooks/useQueue.js'
import {
  MAX_SERVICES,
  addEntry,
  barberName,
  estimateForJoin,
  getActiveEntryByPhone,
  isOnlineJoiningOpen,
  isValidPhone,
  normalizePhone,
  onlineCutoffTime,
  serviceName,
  serviceTotals,
} from '../queue/queueEngine.js'
import { dispatch } from '../queue/queueStore.js'
import { getSavedDetails, saveDetails, saveToken } from '../lib/session.js'
import { formatPrice } from '../lib/time.js'
import { useToast } from '../components/ui.jsx'
import { BarberStatusPill, Button, Card, EmptyState, ErrorBanner, Field, PageHeader, StatusPill, inputClass } from '../components/ui.jsx'

export function Join() {
  const state = useQueue()
  const { t, language } = useLanguage()
  const now = useNow(30_000)
  const showToast = useToast()
  const savedDetails = useMemo(() => getSavedDetails(), [])

  const [name, setName] = useState(savedDetails?.name || '')
  const [phone, setPhone] = useState(savedDetails?.phone || '')
  const [serviceIds, setServiceIds] = useState([])
  const [barberId, setBarberId] = useState('any')
  const [message, setMessage] = useState('')
  const [created, setCreated] = useState(null)
  const [createdEta, setCreatedEta] = useState(0)
  const [touched, setTouched] = useState({})

  const enabledServices = state.services.filter((service) => service.enabled)
  const totals = serviceTotals(state, serviceIds)
  const eta = serviceIds.length ? estimateForJoin(state, serviceIds, barberId, now) : 0
  const nameError = touched.name && !String(name).trim() ? t('join.invalidName') : ''
  const phoneError = touched.phone && !isValidPhone(phone) ? t('join.invalidPhone') : ''
  const duplicate = isValidPhone(phone) ? getActiveEntryByPhone(state, phone) : null
  const joiningOpen = isOnlineJoiningOpen(state, now)
  const chosenBarber = state.barbers.find((barber) => barber.id === barberId)
  const barberBlocked = barberId !== 'any' && (!chosenBarber || !chosenBarber.onDuty || chosenBarber.onBreak)
  const anyAvailable = state.barbers.some((barber) => barber.onDuty && !barber.onBreak)

  const toggleService = (id) => {
    setServiceIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= MAX_SERVICES) {
        showToast(t('join.maxThreeError'), 'error')
        return current
      }
      return [...current, id]
    })
  }

  const submit = (event) => {
    event.preventDefault()
    setMessage('')
    setTouched({ name: true, phone: true })
    setCreatedEta(estimateForJoin(state, serviceIds, barberId, Date.now()))
    const result = dispatch((current) =>
      addEntry(
        current,
        { name, phone, serviceIds, preferredBarberId: barberId, source: 'online' },
        Date.now(),
      ),
    )
    if (!result.ok) {
      const text = t(result.error, { token: result.token })
      setMessage(text)
      showToast(text, 'error')
      return
    }
    saveToken(result.entry.token)
    saveDetails({ name: result.entry.name, phone: result.entry.phone })
    setCreated(result.entry)
  }

  if (created) {
    return (
      <div className="mx-auto max-w-xl animate-fade-in">
        <Card className="overflow-hidden border-gold/40">
          <div className="bg-gradient-to-br from-gold/20 to-transparent px-6 py-9 text-center">
            <p className="text-4xl font-extrabold tracking-tight text-gold-light">{created.token}</p>
            <h1 className="mt-3 text-2xl font-bold text-white">{t('join.joinedSuccess')}</h1>
            <p className="mt-2 text-sm text-slate-300">{t('join.successSubtitle')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-charcoal-700 p-6 text-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('status.yourPosition')}</p>
              <p className="mt-1 text-xl font-bold text-white">#1</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('common.estimatedWait')}</p>
              <p className="mt-1 text-xl font-bold text-white">{createdEta} {t('common.min')}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-charcoal-700 p-6 sm:flex-row">
            <Link to="/status" className="flex-1"><Button className="w-full">{t('common.viewStatus')}</Button></Link>
            <Link to="/" className="flex-1"><Button variant="secondary" className="w-full">{t('common.backHome')}</Button></Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!joiningOpen) {
    return (
      <div className="mx-auto max-w-xl animate-fade-in">
        <PageHeader title={t('join.title')} subtitle={t('join.subtitle')} />
        <Card>
          <EmptyState
            icon={Clock3}
            title={t('join.closedTitle')}
            description={t('join.closedBody', { time: onlineCutoffTime(state.salon) })}
            action={<Link to="/"><Button>{t('common.backHome')}</Button></Link>}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={t('join.title')} subtitle={t('join.subtitle')}>
        <Link to="/">
          <Button variant="ghost" icon={ArrowLeft}>{t('common.backHome')}</Button>
        </Link>
      </PageHeader>

      <ErrorBanner message={message} />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-white">
              <UserRound size={18} className="text-gold" aria-hidden="true" />
              {t('common.name')} &amp; {t('common.phone')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('join.yourName')} error={nameError}>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                  placeholder={t('join.namePlaceholder')}
                  className={inputClass(Boolean(nameError))}
                  autoComplete="name"
                />
              </Field>
              <Field label={t('join.mobile')} error={phoneError} hint={t('join.mobileHint')}>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/[^\d\s+\-]/g, '').slice(0, 15))}
                  onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
                  placeholder={t('join.mobilePlaceholder')}
                  inputMode="tel"
                  className={inputClass(Boolean(phoneError || duplicate))}
                  autoComplete="tel"
                />
              </Field>
            </div>
            {duplicate && (
              <div className="mt-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-light">
                {t('join.duplicatePhone', { token: duplicate.token })}{' '}
                <Link to="/status" className="font-semibold underline underline-offset-2">{t('common.trackMySpot')}</Link>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-white">
                <Scissors size={18} className="text-gold" aria-hidden="true" />
                {t('join.chooseServices')}
              </h2>
              <span className="rounded-full border border-charcoal-600 px-2.5 py-1 text-xs text-slate-400">
                {t('join.maxThree')} ({serviceIds.length}/{MAX_SERVICES})
              </span>
            </div>

            {enabledServices.length === 0 ? (
              <EmptyState icon={Scissors} title={t('join.noServicesAvailable')} />
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {enabledServices.map((service) => {
                  const selected = serviceIds.includes(service.id)
                  return (
                    <button
                      key={service.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleService(service.id)}
                      className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${selected ? 'border-gold bg-gold/10 shadow-md shadow-gold/10' : 'border-charcoal-700 bg-charcoal-900/60 hover:border-charcoal-600'}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{serviceName(service, language)}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {service.durationMin} {t('common.min')} · {formatPrice(service.price, language)}
                        </p>
                      </div>
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? 'border-gold bg-gold text-charcoal-950' : 'border-slate-600'}`}>
                        {selected && <Check size={14} strokeWidth={3} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
              <UserRound size={18} className="text-gold" aria-hidden="true" />
              {t('join.chooseBarber')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setBarberId('any')}
                aria-pressed={barberId === 'any'}
                disabled={!anyAvailable}
                className={`rounded-xl border p-4 text-left transition-all duration-200 disabled:opacity-50 ${barberId === 'any' ? 'border-gold bg-gold/10' : 'border-charcoal-700 bg-charcoal-900/60 hover:border-charcoal-600'}`}
              >
                <p className="text-sm font-semibold text-white">{t('common.anyBarber')}</p>
                <p className="mt-1 text-xs text-slate-400">{t('home.barberFree')}</p>
              </button>
              {state.barbers.map((barber) => {
                const blocked = !barber.onDuty || barber.onBreak
                return (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => setBarberId(barber.id)}
                    disabled={blocked}
                    aria-pressed={barberId === barber.id}
                    className={`rounded-xl border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${barberId === barber.id ? 'border-gold bg-gold/10' : 'border-charcoal-700 bg-charcoal-900/60 hover:border-charcoal-600'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{barberName(barber, language)}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {blocked ? t('join.barberBreakMessage') : t('home.barberFree')}
                        </p>
                      </div>
                      <BarberStatusPill barber={barber} current={null} />
                    </div>
                  </button>
                )
              })}
            </div>
            {barberBlocked && (
              <p className="mt-3 flex items-center gap-2 text-xs text-orange-300">
                <Info size={14} aria-hidden="true" />
                {t('join.barberBreakMessage')}
              </p>
            )}
          </Card>
        </div>

        <Card className="border-gold/30 bg-gradient-to-b from-gold/5 to-transparent p-5 lg:sticky lg:top-40">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
            <Ticket size={18} className="text-gold" aria-hidden="true" />
            {t('join.summary')}
          </h2>
          {serviceIds.length === 0 ? (
            <p className="rounded-xl border border-dashed border-charcoal-600 px-4 py-6 text-center text-sm text-slate-500">
              {t('join.selectRichText')}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {serviceIds.map((id) => {
                const service = state.services.find((item) => item.id === id)
                return (
                  <li key={id} className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-300">{serviceName(service, language)}</span>
                    <span className="shrink-0 text-slate-400">{formatPrice(service?.price || 0, language)}</span>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-5 space-y-3 border-t border-charcoal-700 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="flex items-center gap-2 text-slate-400"><Clock3 size={15} />{t('join.totalDuration')}</span>
              <span className="font-semibold text-white">{totals.duration} {t('common.min')}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="flex items-center gap-2 text-slate-400"><IndianRupee size={15} />{t('join.totalPrice')}</span>
              <span className="font-semibold text-white">{formatPrice(totals.price, language)}</span>
            </div>
            <div className="flex justify-between gap-3 rounded-xl border border-gold/25 bg-gold/10 px-3 py-2.5">
              <span className="text-gold-light">{t('join.estWait')}</span>
              <span className="font-bold text-gold-light">{eta} {t('common.min')}</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{t('join.estWaitNote')}</p>

          <Button type="submit" disabled={enabledServices.length === 0 || !anyAvailable} className="mt-5 w-full py-3 text-base">
            {t('join.confirmJoin')}
          </Button>
          <div className="mt-4 text-center">
            <Link to="/status" className="text-xs text-slate-400 underline underline-offset-2 hover:text-white">
              {t('join.findMyToken')}
            </Link>
          </div>
        </Card>
      </form>
    </div>
  )
}
