import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'
import { groupBySection, sectionColor } from '../utils/sections'
import { useAiTest, aiSections } from '../utils/aiTests'
import { STYLE_LABEL } from '../components/ai/PyqInsights'
import VedhaLoader from '../components/ai/VedhaLoader'
import LangToggle from '../components/quiz/LangToggle'
import { detectLang, isBilingual, localize } from '../utils/i18n'
import { getLang, saveLang } from '../utils/storage'

const ALPHA = ['A', 'B', 'C', 'D']

// Practice one question at a time: the answer and explanation show as soon as an option is picked
export default function AiLearn() {
  const { id } = useParams()
  const { test, generating, phase } = useAiTest(id)
  useSeo({ title: test ? `Learn: ${test.plan.examName}` : 'Learn', noindex: true })

  const [sectionId, setSectionId] = useState('all')
  const [pos,    setPos]    = useState(0)
  const [picked, setPicked] = useState({})   // question id → option index
  const [langPref, setLangPref] = useState(() => getLang())
  const bilingual = useMemo(() => isBilingual(test?.questions || []), [test])
  const lang = langPref || test?.language || detectLang(test?.questions[0]?.question)
  const changeLang = (l) => { setLangPref(l); saveLang(l) }

  const groups = useMemo(() => test ? groupBySection(test.questions, aiSections(test)) : [], [test])
  // Written order, so questions that arrive while studying always come at the end
  const list   = useMemo(() => {
    if (!test) return []
    return sectionId === 'all' ? test.questions : test.questions.filter(q => q.section === sectionId)
  }, [test, sectionId])

  if (!test) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-gray-400 text-lg">This AI test isn't saved in this browser.</p>
      <Link to="/ai-practice" className="btn-primary">Create a new test</Link>
    </div>
  )

  const idx      = Math.min(pos, Math.max(0, list.length - 1))
  const q        = list[idx] && localize(list[idx], lang)   // same answer index in both languages
  const choice   = q ? picked[q.id] : undefined
  const answered = choice !== undefined
  const done     = list.filter(x => picked[x.id] !== undefined)
  const correct  = done.filter(x => picked[x.id] === x.answer).length
  const section  = q && groups.find(g => g.id === q.section)
  const sc       = sectionColor(section?.color)

  const go = (i) => { setPos(Math.max(0, Math.min(list.length - 1, i))); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const pickSection = (sid) => { setSectionId(sid); setPos(0) }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <Link to={`/ai-practice/${id}`} aria-label="Back" className="w-10 h-10 flex-shrink-0 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center">←</Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-white truncate">📖 {test.plan.examName}</h1>
            <p className="text-xs text-gray-500 truncate">
              {correct}/{done.length} correct{generating && ` · generating more (${test.questions.length}/${test.target})`}
            </p>
          </div>
          {bilingual && <div className="flex-shrink-0"><LangToggle lang={lang} onChange={changeLang} /></div>}
          <Link to={`/quiz/${id}`} className="hidden sm:inline-flex btn-primary py-2 px-3 sm:px-4 text-sm flex-shrink-0">Timed exam</Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Section filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
          {[{ id: 'all', title: 'All', items: groups.flatMap(g => g.items) }, ...groups].map(g => (
            <button key={g.id} onClick={() => pickSection(g.id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-all ${
                sectionId === g.id ? 'bg-violet-600/20 border-violet-500 text-violet-300' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}>
              {g.title} <span className="text-gray-500">({g.items.length})</span>
            </button>
          ))}
        </div>

        {q ? (
          <div className="card p-4 sm:p-6 md:p-8">
            <div className={`flex items-center gap-2 text-xs font-semibold mb-4 ${sc.text}`}>
              <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
              {section?.title}
              <span className="text-gray-500 font-normal ml-auto">{idx + 1} / {list.length}</span>
            </div>

            {(q.repeated || q.style) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {q.repeated && <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">🔁 Frequently asked concept</span>}
                {q.style && q.style !== 'one-liner' && <span className="text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">{STYLE_LABEL[q.style] || q.style}</span>}
              </div>
            )}

            <p className="text-white text-base md:text-lg font-medium leading-relaxed mb-5 whitespace-pre-line">{q.question}</p>

            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isRight = i === q.answer
                const isPick  = i === choice
                const cls = !answered
                  ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                  : isRight ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200'
                  : isPick  ? 'bg-red-500/10 border-red-500 text-red-200'
                  :           'bg-gray-800/30 border-gray-800 text-gray-500'
                return (
                  <button key={i} disabled={answered} onClick={() => setPicked(p => ({ ...p, [q.id]: i }))}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${cls}`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      answered && isRight ? 'bg-emerald-600 text-white' : answered && isPick ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {answered && isRight ? '✓' : answered && isPick ? '✗' : ALPHA[i]}
                    </span>
                    <span className="text-sm leading-relaxed">{opt}</span>
                  </button>
                )
              })}
            </div>

            {answered && (
              <div className={`mt-5 rounded-xl p-4 border ${choice === q.answer ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <p className={`text-sm font-semibold mb-1 ${choice === q.answer ? 'text-emerald-400' : 'text-red-400'}`}>
                  {choice === q.answer ? 'Correct!' : `Wrong — the answer is ${ALPHA[q.answer]}`}
                </p>
                {q.explanation && <p className="text-sm text-gray-300 leading-relaxed"><span className="text-violet-300 font-semibold">Vedha Tutor explains: </span>{q.explanation}</p>}
              </div>
            )}
          </div>
        ) : generating ? (
          <div className="card p-6"><VedhaLoader phase={phase} count={test.questions.length} target={test.target} /></div>
        ) : (
          <div className="card p-10 text-center text-gray-500">No questions in this section.</div>
        )}

        {q && generating && idx >= list.length - 1 && (
          <div className="card p-4"><VedhaLoader phase={phase} count={test.questions.length} target={test.target} /></div>
        )}

        {q && (
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => go(idx - 1)} disabled={idx === 0} className="btn-secondary py-2.5 px-5 text-sm disabled:opacity-30">← Prev</button>
            {!answered && <button onClick={() => go(idx + 1)} disabled={idx >= list.length - 1} className="text-sm text-gray-500 hover:text-gray-300 disabled:opacity-30">Skip</button>}
            <button onClick={() => go(idx + 1)} disabled={idx >= list.length - 1} className="btn-primary py-2.5 px-5 text-sm disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
