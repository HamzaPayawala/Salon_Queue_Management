import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useQueue } from '../hooks/useQueue.js'
import { Button, Card, Field, inputClass } from './ui.jsx'

function remembered(role) {
  try {
    return sessionStorage.getItem(`salon-pin-${role}`) === '1'
  } catch {
    return false
  }
}

export function PinGate({ role, children }) {
  const state = useQueue()
  const { t } = useLanguage()
  const roleLabel = t(`role.${role}`)
  const [unlocked, setUnlocked] = useState(() => remembered(role))
  const [pin, setPin] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

  if (unlocked) return children

  const submit = (event) => {
    event.preventDefault()
    const expected = state.salon.staffPins?.[role]
    if (pin === expected) {
      if (remember) {
        try {
          sessionStorage.setItem(`salon-pin-${role}`, '1')
        } catch {
          // Session storage can be blocked; unlocking still works for this page.
        }
      }
      setUnlocked(true)
      setError('')
      return
    }
    setError(t('common.pinIncorrect'))
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10">
      <Card className="w-full p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-gold">
            <LockKeyhole size={26} />
          </div>
          <h1 className="text-xl font-bold text-white">{t('common.staffArea')}</h1>
          <p className="mt-1.5 text-sm text-slate-400">{roleLabel}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label={t('common.enterPin', { role: roleLabel })} error={error}>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value.replace(/\D/g, ''))
                  setError('')
                }}
                className={`${inputClass(error)} pr-12 tracking-[0.4em]`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((current) => !current)}
                aria-label={t(show ? 'common.hide' : 'common.show')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:text-white"
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 accent-[#D4A017]"
            />
            {t('common.rememberDevice')}
          </label>

          <Button type="submit" className="w-full">
            {t('common.unlock')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
