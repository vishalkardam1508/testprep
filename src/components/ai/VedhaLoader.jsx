import { VedhaAvatar } from './Vedha'

// Shows what Vedha Tutor is doing while questions are prepared, with live progress
export default function VedhaLoader({ phase, count = 0, target, compact = false }) {
  const text = phase?.text || (count ? 'Preparing more questions…' : 'Getting ready…')
  const icon = phase?.step === 'research' ? '🔎' : phase?.step === 'waiting' ? '⏳' : '✍️'
  const pct  = target ? Math.min(100, Math.round((count / target) * 100)) : 0

  if (compact) return (
    <span className="inline-flex items-center gap-2">
      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      <span>{text}</span>
    </span>
  )

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <span className="absolute inset-0 rounded-xl bg-violet-500/40 animate-ping" />
        <div className="relative"><VedhaAvatar size="w-12 h-12 text-lg" /></div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-semibold truncate">{icon} {text}</p>
        {target > 0 && (
          <>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-700" style={{ width: `${Math.max(pct, 3)}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1.5 tabular-nums">{count} of {target} questions ready</p>
          </>
        )}
      </div>
    </div>
  )
}
