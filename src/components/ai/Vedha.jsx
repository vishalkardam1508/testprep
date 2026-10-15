// Vedha Tutor — the name of the AI in AI Practice (only used on AI Practice screens)
export const VEDHA = 'Vedha Tutor'

export function VedhaAvatar({ size = 'w-10 h-10 text-base' }) {
  return (
    <div className={`${size} rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-black text-white flex-shrink-0 shadow-lg shadow-violet-500/20`}>
      V
    </div>
  )
}

// "Vedha Tutor · Your AI exam tutor" chip
export function VedhaBadge({ subtitle = 'Your AI exam tutor' }) {
  return (
    <div className="inline-flex items-center gap-3">
      <VedhaAvatar />
      <div className="text-left">
        <p className="text-white font-bold text-sm leading-tight">{VEDHA}</p>
        <p className="text-gray-500 text-xs">{subtitle}</p>
      </div>
    </div>
  )
}
