import { LANGS } from '../../utils/i18n'

export default function LangToggle({ lang, onChange }) {
  return (
    <div className="flex bg-gray-800 rounded-xl p-0.5 text-xs font-semibold">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          className={`px-2.5 py-1.5 rounded-lg transition-colors ${
            lang === l.code ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
