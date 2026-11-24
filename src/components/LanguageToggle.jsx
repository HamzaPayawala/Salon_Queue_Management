import { Languages } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'

export function LanguageToggle({ compact = false }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className={`flex items-center gap-1 rounded-xl border border-charcoal-700 bg-charcoal-900/80 p-1 ${compact ? '' : 'px-1'}`} aria-label={t('common.language')}>
      <Languages size={15} className="mx-1 text-slate-500" aria-hidden="true" />
      {[
        { code: 'en', label: 'EN' },
        { code: 'gu', label: 'ગુ' },
      ].map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLanguage(option.code)}
          aria-pressed={language === option.code}
          className={`min-h-11 min-w-11 rounded-lg px-2.5 text-xs font-semibold transition-colors ${language === option.code ? 'bg-gold text-charcoal-950' : 'text-slate-400 hover:text-white'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
