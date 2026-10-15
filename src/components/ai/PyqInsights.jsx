// "Previous years pattern" card: what the AI found in the exam's last 5 years of papers
export const STYLE_LABEL = {
  'one-liner':           'One-liner',
  'statement-based':     'Statement-based',
  'match-the-following': 'Match the following',
  'assertion-reason':    'Assertion–Reason',
  'chronology/order':    'Chronology / Order',
  'odd-one-out':         'Odd one out',
  'numerical/data':      'Numerical / Data',
}

export default function PyqInsights({ pyq, sections = [] }) {
  if (!pyq) return (
    <div className="bg-gray-800/40 rounded-xl p-4 text-sm text-gray-500">
      📚 Previous-year papers for this exam couldn't be found online, so the pattern is based on the AI's general knowledge of the exam.
    </div>
  )

  const total = pyq.styles.reduce((a, s) => a + s.share, 0) || 1
  const titleOf = (id) => sections.find(s => s.id === id)?.title || id
  const hot = pyq.sections.filter(s => s.hotTopics.length)

  return (
    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 sm:p-5 space-y-5">
      <div>
        <p className="text-sm font-semibold text-cyan-300">
          📚 Previous years pattern {pyq.years.length > 0 && <span className="text-gray-500 font-normal">({Math.min(...pyq.years)}–{Math.max(...pyq.years)})</span>}
        </p>
        {pyq.difficulty && <p className="text-xs text-gray-400 mt-1">{pyq.difficulty}</p>}
      </div>

      {pyq.styles.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Question styles asked</p>
          <div className="space-y-1.5">
            {pyq.styles.map(s => (
              <div key={s.name} className="flex items-center gap-3 text-xs">
                <span className="w-32 sm:w-40 text-gray-300 flex-shrink-0 truncate">{STYLE_LABEL[s.name] || s.name}</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(s.share / total) * 100}%` }} />
                </div>
                <span className="w-9 text-right text-gray-500 tabular-nums">{Math.round((s.share / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pyq.repeated.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">🔁 Frequently repeated concepts</p>
          <div className="flex flex-wrap gap-1.5">
            {pyq.repeated.map(r => <span key={r} className="text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-md">{r}</span>)}
          </div>
        </div>
      )}

      {hot.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Most asked topics by field</p>
          <div className="space-y-1">
            {hot.map(s => (
              <p key={s.id} className="text-xs text-gray-400 leading-relaxed">
                <span className="text-gray-200 font-medium">{titleOf(s.id)}:</span> {s.hotTopics.join(' · ')}
              </p>
            ))}
          </div>
        </div>
      )}

      {pyq.trends.length > 0 && (
        <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
          {pyq.trends.map(t => <li key={t}>{t}</li>)}
        </ul>
      )}

      <p className="text-[11px] text-gray-600">
        Questions are written in this style and focus on these concepts — they are not copies of real past questions.
        {pyq.sources.length > 0 && ` Sources: ${pyq.sources.join(', ')}.`}
      </p>
    </div>
  )
}
