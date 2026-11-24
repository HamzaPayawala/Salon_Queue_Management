import { useEffect, useMemo, useState } from 'react'
import {
  Activity, Clock3, Info, Pencil, Plus, RotateCcw, Scissors, Trash2, UserCog, UserX, Users,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useQueue } from '../hooks/useQueue.js'
import {
  deleteService,
  getRecentActivity,
  getStats,
  removeBarber,
  saveBarber,
  saveService,
  setSalonConfig,
} from '../queue/queueEngine.js'
import { dispatch, resetDemo } from '../queue/queueStore.js'
import { formatClock } from '../lib/time.js'
import {
  Button, Card, EmptyState, ErrorBanner, Field, Modal, PageHeader, StatCard,
  StatusPill, Switch, inputClass, useToast,
} from '../components/ui.jsx'

const tabs = [
  { key: 'services', labelKey: 'owner.tabServices', icon: Scissors },
  { key: 'barbers', labelKey: 'owner.tabBarbers', icon: Users },
  { key: 'queue', labelKey: 'owner.tabQueue', icon: Clock3 },
  { key: 'today', labelKey: 'owner.tabToday', icon: Activity },
]

function emptyService() {
  return { id: '', nameEn: '', nameGu: '', durationMin: '', price: '', enabled: true }
}

function emptyBarber() {
  return { id: '', name: '', nameGu: '', onDuty: true, onBreak: false }
}

export function Owner() {
  const state = useQueue()
  const { t, language } = useLanguage()
  const showToast = useToast()
  const [tab, setTab] = useState('services')
  const [serviceForm, setServiceForm] = useState(null)
  const [barberForm, setBarberForm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formError, setFormError] = useState('')
  const [resetStep, setResetStep] = useState(0)
  const [hours, setHours] = useState({
    openingTime: state.salon.openingTime,
    closingTime: state.salon.closingTime,
  })

  useEffect(() => {
    setHours({ openingTime: state.salon.openingTime, closingTime: state.salon.closingTime })
  }, [state.salon.openingTime, state.salon.closingTime])

  const stats = useMemo(() => getStats(state), [state])
  const activity = useMemo(() => getRecentActivity(state), [state])
  const hoursDirty =
    hours.openingTime !== state.salon.openingTime || hours.closingTime !== state.salon.closingTime

  const run = (action, successKey) => {
    setFormError('')
    const result = dispatch(action)
    if (!result.ok) {
      const message = t(result.error, { token: result.token })
      setFormError(message)
      showToast(message, 'error')
      return false
    }
    if (successKey) showToast(t(successKey))
    return true
  }

  const saveServiceForm = (event) => {
    event.preventDefault()
    if (
      run(
        (current) => saveService(current, { ...serviceForm, id: serviceForm.id || undefined }),
        'owner.serviceSaved',
      )
    ) {
      setServiceForm(null)
    }
  }

  const saveBarberForm = (event) => {
    event.preventDefault()
    if (
      run(
        (current) => saveBarber(current, { ...barberForm, id: barberForm.id || undefined }),
        'common.saved',
      )
    ) {
      setBarberForm(null)
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const action =
      deleteTarget.kind === 'service'
        ? (current) => deleteService(current, deleteTarget.item.id)
        : (current) => removeBarber(current, deleteTarget.item.id)
    run(action, 'common.saved')
    setDeleteTarget(null)
  }

  const submitHours = (event) => {
    event.preventDefault()
    if (run((current) => setSalonConfig(current, hours), 'common.saved')) setFormError('')
  }

  const performReset = () => {
    resetDemo()
    setResetStep(0)
    setTab('services')
    showToast(t('owner.resetDone'))
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={t('owner.title')} subtitle={t('reception.subtitle')}>
        <Button variant="danger" icon={RotateCcw} onClick={() => setResetStep(1)}>
          {t('owner.resetDemo')}
        </Button>
      </PageHeader>

      <ErrorBanner
        message={formError}
        onRetry={() => {
          setFormError('')
          setHours({ openingTime: state.salon.openingTime, closingTime: state.salon.closingTime })
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav
          role="tablist"
          aria-label={t('owner.title')}
          className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map(({ key, labelKey, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${tab === key ? 'bg-gold text-charcoal-950' : 'border border-charcoal-700 text-slate-300 hover:bg-charcoal-700'}`}
            >
              <Icon size={16} aria-hidden="true" />
              {t(labelKey)}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === 'services' && (
            <Card className="p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">{t('owner.tabServices')}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Info size={13} aria-hidden="true" />
                    {t('join.maxThree')}
                  </p>
                </div>
                <Button
                  icon={Plus}
                  onClick={() => {
                    setFormError('')
                    setServiceForm(emptyService())
                  }}
                >
                  {t('owner.addService')}
                </Button>
              </div>

              {state.services.length === 0 ? (
                <EmptyState
                  icon={Scissors}
                  title={t('owner.noServicesYet')}
                  action={<Button icon={Plus} onClick={() => setServiceForm(emptyService())}>{t('owner.addService')}</Button>}
                />
              ) : (
                <ul className="space-y-3">
                  {state.services.map((service) => (
                    <li
                      key={service.id}
                      className="rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-white">{service.nameEn}</span>
                            <span className="text-sm text-slate-400">{service.nameGu}</span>
                            {!service.enabled && (
                              <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] text-slate-400">
                                {t('common.disabled')}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {service.durationMin} {t('common.min')} · ₹{service.price}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2 text-xs text-slate-400">
                            {t('common.enabled')}
                            <Switch
                              checked={service.enabled}
                              label={`${t('common.enabled')} · ${service.nameEn}`}
                              onChange={() =>
                                run((current) => saveService(current, { ...service, enabled: !service.enabled }))
                              }
                            />
                          </label>
                          <Button
                            variant="ghost"
                            className="px-2.5 py-2 text-xs"
                            icon={Pencil}
                            onClick={() => {
                              setFormError('')
                              setServiceForm({ ...service })
                            }}
                          >
                            {t('common.edit')}
                          </Button>
                          <Button
                            variant="danger"
                            className="px-2.5 py-2 text-xs"
                            icon={Trash2}
                            onClick={() => setDeleteTarget({ kind: 'service', item: service })}
                          >
                            {t('common.delete')}
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {tab === 'barbers' && (
            <Card className="p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold text-white">{t('owner.tabBarbers')}</h2>
                <Button
                  icon={Plus}
                  onClick={() => {
                    setFormError('')
                    setBarberForm(emptyBarber())
                  }}
                >
                  {t('owner.addBarber')}
                </Button>
              </div>

              {state.barbers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={t('owner.noBarbersYet')}
                  action={<Button icon={Plus} onClick={() => setBarberForm(emptyBarber())}>{t('owner.addBarber')}</Button>}
                />
              ) : (
                <ul className="space-y-3">
                  {state.barbers.map((barber) => (
                    <li
                      key={barber.id}
                      className="rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">
                            {barber.name} <span className="text-sm text-slate-400">{barber.nameGu}</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {t(barber.onDuty ? 'common.available' : 'common.offDuty')} · {t(barber.onBreak ? 'common.onBreak' : 'common.available')}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          {[
                            { key: 'onDuty', label: t('owner.onDuty') },
                            { key: 'onBreak', label: t('common.onBreak') },
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 text-xs text-slate-400">
                              {label}
                              <Switch
                                checked={barber[key]}
                                label={`${label} · ${barber.name}`}
                                onChange={() =>
                                  run((current) => saveBarber(current, { ...barber, [key]: !barber[key] }))
                                }
                              />
                            </label>
                          ))}
                          <Button
                            variant="danger"
                            className="px-2.5 py-2 text-xs"
                            icon={UserX}
                            onClick={() => setDeleteTarget({ kind: 'barber', item: barber })}
                          >
                            {t('owner.removeBarber')}
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {tab === 'queue' && (
            <Card className="p-5 sm:p-6">
              <h2 className="mb-5 text-base font-bold text-white">{t('owner.tabQueue')}</h2>
              <div className="space-y-4">
                {[
                  { key: 'isOpen', label: t('common.open'), hint: t('home.closedBody') },
                  { key: 'onlineJoiningOpen', label: t('owner.onlineJoining'), hint: t('home.onlineClosed') },
                ].map(({ key, label, hint }) => (
                  <div
                    key={key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
                    </div>
                    <Switch
                      checked={state.salon[key]}
                      label={label}
                      onChange={() => run((current) => setSalonConfig(current, { [key]: !state.salon[key] }), 'common.saved')}
                    />
                  </div>
                ))}

                <form onSubmit={submitHours} className="rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('owner.openingTime')}>
                      <input
                        type="time"
                        value={hours.openingTime}
                        onChange={(event) => setHours({ ...hours, openingTime: event.target.value })}
                        className={inputClass(false)}
                      />
                    </Field>
                    <Field label={t('owner.closingTime')}>
                      <input
                        type="time"
                        value={hours.closingTime}
                        onChange={(event) => setHours({ ...hours, closingTime: event.target.value })}
                        className={inputClass(false)}
                      />
                    </Field>
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                    <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {t('owner.cutOffNote')}
                  </p>
                  {hoursDirty && (
                    <div className="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/40 bg-charcoal-900/95 p-3 shadow-xl backdrop-blur">
                      <span className="flex items-center gap-2 text-xs font-semibold text-gold-light">
                        <Info size={14} aria-hidden="true" />
                        {t('owner.unsavedChanges')}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="px-3 py-2 text-xs"
                          onClick={() =>
                            setHours({ openingTime: state.salon.openingTime, closingTime: state.salon.closingTime })
                          }
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button type="submit" className="px-3 py-2 text-xs" icon={Clock3}>
                          {t('owner.saveChanges')}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </Card>
          )}

          {tab === 'today' && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard icon={Users} label={t('owner.statsServed')} value={stats.served} accent />
                <StatCard
                  icon={Clock3}
                  label={t('owner.statsAvgWait')}
                  value={stats.avgWait}
                  hint={t('common.min')}
                />
                <StatCard icon={UserX} label={t('owner.statsNoShows')} value={stats.noShows} />
              </div>
              <Card className="p-5 sm:p-6">
                <h2 className="mb-4 text-base font-bold text-white">{t('owner.recentActivity')}</h2>
                {activity.length === 0 ? (
                  <EmptyState icon={Activity} title={t('owner.noActivity')} />
                ) : (
                  <ul className="divide-y divide-charcoal-800">
                    {activity.map((entry) => (
                      <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">
                            <span className="text-gold-light">{entry.token}</span> · {entry.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatClock(entry.calledAt || entry.createdAt, language)}
                          </p>
                        </div>
                        <StatusPill status={entry.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(serviceForm)}
        title={serviceForm?.id ? t('owner.editService') : t('owner.addService')}
        onClose={() => setServiceForm(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setServiceForm(null)}>{t('common.cancel')}</Button>
            <Button type="submit" form="owner-service-form">{t('common.save')}</Button>
          </>
        }
      >
        {serviceForm && (
          <form id="owner-service-form" onSubmit={saveServiceForm} className="space-y-4">
            <ErrorBanner message={formError} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('owner.serviceNameEn')}>
                <input
                  className={inputClass(false)}
                  value={serviceForm.nameEn}
                  onChange={(event) => setServiceForm({ ...serviceForm, nameEn: event.target.value })}
                />
              </Field>
              <Field label={t('owner.serviceNameGu')}>
                <input
                  className={inputClass(false)}
                  value={serviceForm.nameGu}
                  onChange={(event) => setServiceForm({ ...serviceForm, nameGu: event.target.value })}
                  dir="rtl"
                />
              </Field>
              <Field label={t('owner.durationMin')}>
                <input
                  type="number"
                  min="1"
                  className={inputClass(false)}
                  value={serviceForm.durationMin}
                  onChange={(event) => setServiceForm({ ...serviceForm, durationMin: event.target.value })}
                />
              </Field>
              <Field label={t('owner.price')}>
                <input
                  type="number"
                  min="0"
                  className={inputClass(false)}
                  value={serviceForm.price}
                  onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })}
                />
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm text-slate-300">
              {t('common.enabled')}
              <Switch
                checked={serviceForm.enabled}
                label={t('common.enabled')}
                onChange={(checked) => setServiceForm({ ...serviceForm, enabled: checked })}
              />
            </label>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(barberForm)}
        title={barberForm?.id ? t('common.edit') : t('owner.addBarber')}
        onClose={() => setBarberForm(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setBarberForm(null)}>{t('common.cancel')}</Button>
            <Button type="submit" form="owner-barber-form">{t('common.save')}</Button>
          </>
        }
      >
        {barberForm && (
          <form id="owner-barber-form" onSubmit={saveBarberForm} className="space-y-4">
            <ErrorBanner message={formError} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('owner.barberName')}>
                <input
                  className={inputClass(false)}
                  value={barberForm.name}
                  onChange={(event) => setBarberForm({ ...barberForm, name: event.target.value })}
                />
              </Field>
              <Field label={t('owner.barberNameGu')}>
                <input
                  className={inputClass(false)}
                  value={barberForm.nameGu}
                  onChange={(event) => setBarberForm({ ...barberForm, nameGu: event.target.value })}
                  dir="rtl"
                />
              </Field>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title={deleteTarget?.kind === 'service' ? t('owner.deleteService') : t('owner.removeBarber')}
        onClose={() => setDeleteTarget(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.no')}</Button>
            <Button variant="danger" onClick={confirmDelete}>{t('common.confirm')}</Button>
          </>
        }
      >
        <p>
          {deleteTarget?.kind === 'service'
            ? t('owner.deleteServiceConfirm')
            : t('owner.removeBarberConfirm')}
        </p>
        {deleteTarget && <p className="mt-3 font-semibold text-white">{deleteTarget.item.nameEn || deleteTarget.item.name}</p>}
      </Modal>

      <Modal
        open={resetStep > 0}
        title={t('owner.resetConfirm')}
        onClose={() => setResetStep(0)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setResetStep(0)}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              onClick={() => (resetStep === 1 ? setResetStep(2) : performReset())}
            >
              {t(resetStep === 1 ? 'common.continue' : 'common.yes')}
            </Button>
          </>
        }
      >
        <p>{t('owner.resetConfirmBody')}</p>
        {resetStep === 2 && <p className="mt-3 font-semibold text-red-300">{t('owner.resetConfirm')}</p>}
      </Modal>
    </div>
  )
}
