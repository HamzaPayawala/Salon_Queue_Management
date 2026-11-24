import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'

const statusStyles = {
  waiting: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  called: 'bg-gold/15 text-gold-light border-gold/40',
  in_chair: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  done: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  cancelled: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  no_show: 'bg-red-500/15 text-red-300 border-red-500/30',
}

export function Card({ className = '', children }) {
  return (
    <section className={`rounded-2xl border border-charcoal-700 bg-charcoal-950/70 shadow-lg ${className}`}>
      {children}
    </section>
  )
}

const buttonVariants = {
  primary: 'bg-gold text-charcoal-950 hover:bg-gold-light shadow-md shadow-gold/10 font-semibold',
  secondary: 'border border-charcoal-600 bg-charcoal-700/60 text-slate-100 hover:bg-charcoal-600',
  ghost: 'text-slate-300 hover:bg-charcoal-700/70 hover:text-white',
  danger: 'border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
  outlineGold: 'border border-gold/60 bg-gold/10 text-gold-light hover:bg-gold/20',
}

export function Button({ variant = 'primary', className = '', icon: Icon, children, disabled, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={17} aria-hidden="true" />}
      {children}
    </button>
  )
}

export function StatusPill({ status, className = '' }) {
  const { t } = useLanguage()
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.waiting} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(`status.${status}`)}
    </span>
  )
}

export function BarberStatusPill({ barber, current }) {
  const { t } = useLanguage()
  const label = !barber?.onDuty
    ? t('common.offDuty')
    : barber.onBreak
      ? t('common.onBreak')
      : current
        ? t('common.busy')
        : t('common.available')
  const style = !barber?.onDuty
    ? 'bg-slate-500/15 text-slate-400 border-slate-500/30'
    : barber.onBreak
      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
      : current
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center animate-fade-in">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-charcoal-700 bg-charcoal-800 text-gold">
          <Icon size={26} aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  const { t } = useLanguage()
  if (!message) return null
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <AlertCircle size={18} aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-lg px-2 py-1 font-semibold underline underline-offset-2">
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}

export function Modal({ open, title, children, onClose, actions }) {
  const { t } = useLanguage()
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-lg rounded-t-2xl border border-charcoal-600 bg-charcoal-900 p-6 shadow-2xl animate-fade-in sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="rounded-lg p-2 text-slate-400 hover:bg-charcoal-700 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="text-sm leading-relaxed text-slate-300">{children}</div>
        {actions && <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${checked ? 'bg-gold' : 'bg-charcoal-600'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  )
}

export function inputClass(error) {
  return `w-full rounded-xl border bg-charcoal-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-gold ${error ? 'border-red-500/60' : 'border-charcoal-600'}`
}

export function StatCard({ icon: Icon, label, value, hint, accent = false }) {
  return (
    <Card className={`p-4 ${accent ? 'border-gold/40 bg-gradient-to-br from-gold/10 to-transparent' : ''}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent ? 'bg-gold/20 text-gold-light' : 'bg-charcoal-800 text-slate-300'}`}>
            <Icon size={19} aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold leading-none text-white">{value}</p>
          {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
        </div>
      </div>
    </Card>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

// Lightweight toast system used for "Saved", "Token copied", blocked actions, etc.
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), [])

  const showToast = useCallback(
    (message, tone = 'success') => {
      const id = `${Date.now()}-${Math.random()}`
      setToasts((items) => [...items, { id, message, tone }])
      window.setTimeout(() => dismiss(id), 3200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-xl animate-fade-in ${toast.tone === 'error' ? 'border-red-500/40 bg-red-950 text-red-200' : 'border-gold/40 bg-charcoal-900 text-slate-100'}`}>
            {toast.tone === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} className="text-gold" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context.showToast
}
