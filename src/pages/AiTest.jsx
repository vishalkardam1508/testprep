import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useSeo } from '../hooks/useSeo'
import { sectionColor } from '../utils/sections'
import { getResults } from '../utils/storage'
import { useAiTest, runGeneration, stopGeneration, deleteAiTest, BATCH } from '../utils/aiTests'
import PyqInsights from '../components/ai/PyqInsights'
import LangToggle from '../components/quiz/LangToggle'
import { isBilingual, detectLang } from '../utils/i18n'
import { getLang, saveLang } from '../utils/storage'
import VedhaLoader from '../components/ai/VedhaLoader'

export default function AiTest() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { test, generating, phase } = useAiTest(id)
  useSeo({ title: test ? test.plan.examName : 'AI Test', noindex: true })   // lives in this browser only

  const results = useMemo(() => getResults().filter(r => r.testId === id), [id])
  const [langPref, setLangPref] = useState(() => getLang())

  if (!test) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-gray-400 text-lg">This AI test isn't saved in this browser.</p>
      <Link to="/ai-practice" className="btn-primary">Create a new test</Link>
    </div>
  )

  const { plan } = test
  const count = test.questions.length
  const ready = count >= BATCH || (count > 0 && !generating)
  const full  = count >= test.target
  const pct   = Math.min(100, Math.round((count / test.target) * 100))
  const perSection = {}
  test.questions.forEach(q => { perSection[q.section] = (perSection[q.section] || 0) + 1 })

  const remove = () => {
    if (!window.confirm('Delete this AI test? Your results stay in My Results.')) return
    deleteAiTest(id)
    navigate('/ai-practice', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
          {test.source === 'json'
            ? <Link to="/add-test" className="hover:text-gray-300 transition-colors flex-shrink-0">My Tests</Link>
            : <Link to="/ai-practice" className="hover:text-gray-300 transition-colors flex-shrink-0">AI Practice</Link>}
          <span>/</span>
          <span className="text-gray-300 truncate">{plan.examName}</span>
        </nav>

        <div className="card p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 break-words">{plan.examName}</h1>
          <p className="text-sm text-gray-500 mb-4">
            {test.source === 'json' ? `${count} questions · your own test` : <>{test.period || 'General Studies'} · <span className="capitalize">{plan.difficulty}</span></>} · {plan.duration} min · +{plan.marking.correct} / {plan.marking.wrong ? `-${plan.marking.wrong}` : '0'}
          </p>
          {plan.summary && <p className="text-gray-400 text-sm leading-relaxed mb-4">{plan.summary}</p>}

          {/* Language: Hindi tests carry English too, so the student can pick either for the exam and Learn mode */}
          {count > 0 && (
            <div className="flex items-center gap-3 mb-6 text-sm">
              <span className="text-gray-500">Language</span>
              {isBilingual(test.questions)
                ? <LangToggle lang={langPref || test.language || 'hi'} onChange={l => { setLangPref(l); saveLang(l) }} />
                : <span className="text-white font-medium">{(test.language || detectLang(test.questions[0]?.question)) === 'hi' ? 'हिंदी' : 'English'}</span>}
            </div>
          )}

          {/* Generation progress */}
          {generating ? (
            <div className="mb-6 bg-gray-800/40 border border-gray-800 rounded-xl p-4">
              <VedhaLoader phase={phase} count={count} target={test.target} />
              {!ready && <p className="text-xs text-gray-500 mt-3">The first {BATCH} questions are usually ready in under a minute — then you can start while the rest are written.</p>}
            </div>
          ) : (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white font-semibold">{count} / {test.target} questions</span>
              <span className={test.status === 'error' ? 'text-red-400' : full ? 'text-emerald-400' : 'text-yellow-400'}>
                {test.status === 'error' ? 'Generation failed' : full ? 'Question bank ready' : 'Paused'}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${full ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${pct}%` }} />
            </div>
            {test.status === 'error' && test.error && <p className="text-xs text-red-400 mt-2">{test.error}</p>}
          </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/quiz/${id}`}
              onClick={e => !ready && e.preventDefault()}
              aria-disabled={!ready}
              className={`btn-primary text-center ${ready ? '' : 'opacity-40 cursor-not-allowed'}`}
            >
              {ready ? 'Start timed exam →' : `Starts when ${BATCH} questions are ready…`}
            </Link>
            <Link
              to={`/ai-practice/${id}/learn`}
              onClick={e => !count && e.preventDefault()}
              aria-disabled={!count}
              className={`btn-secondary text-center ${count ? '' : 'opacity-40 cursor-not-allowed'}`}
            >
              📖 Learn mode
            </Link>
            <div className="sm:ml-auto flex gap-3">
              {generating
                ? <button onClick={() => stopGeneration(id)} className="btn-secondary flex-1">Stop</button>
                : !full && <button onClick={() => runGeneration(id)} className="btn-secondary flex-1">{test.status === 'error' ? 'Retry' : 'Resume'}</button>}
              <button onClick={remove} className="btn-secondary px-4 hover:text-red-400" aria-label="Delete test">🗑</button>
            </div>
          </div>
          {generating && ready && !full && (
            <p className="text-xs text-emerald-400/80 mt-3">✓ You can start now — new questions are added to the exam as Vedha Tutor writes them.</p>
          )}
        </div>

        {/* Sections */}
        <div className="card p-5 sm:p-8">
          <h2 className="text-lg font-bold text-white mb-4">Exam pattern</h2>
          <div className="space-y-3">
            {plan.sections.map(s => {
              const c = sectionColor(s.color)
              return (
                <div key={s.id}>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                    <span className="text-white flex-1 min-w-0 truncate">{s.title}</span>
                    <span className="text-gray-500 tabular-nums">{perSection[s.id] || 0} Q · {s.weight}%</span>
                  </div>
                  {s.topics.length > 0 && <p className="text-xs text-gray-500 mt-1 pl-5">{s.topics.join(' · ')}</p>}
                </div>
              )
            })}
          </div>
          {'pyq' in plan && <div className="mt-6"><PyqInsights pyq={plan.pyq} sections={plan.sections} /></div>}
          {plan.tips.length > 0 && (
            <ul className="mt-6 list-disc list-inside text-sm text-gray-400 space-y-1">
              {plan.tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
        </div>

        {/* Past attempts */}
        {results.length > 0 && (
          <div className="card p-5 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-4">Your attempts</h2>
            <div className="divide-y divide-gray-800">
              {results.map(r => (
                <Link key={r.id} to={`/result/${r.id}`} className="flex items-center justify-between py-3 text-sm hover:text-violet-400 group">
                  <span className="text-gray-400 group-hover:text-violet-400">{new Date(r.dateTaken).toLocaleString()}</span>
                  <span className="text-white font-semibold">{r.score}/{r.maxScore} · {r.percentage}%</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-600 leading-relaxed">
          {test.source === 'json' ? 'These questions were added by you — check answers you are unsure about against your book or official sources.' : <>Questions are written by Vedha Tutor (AI){test.period ? ' from a live web search' : ''} and checked automatically, but can still contain mistakes. Verify important facts from official sources.</>}
        </p>
      </div>
      <Footer />
    </div>
  )
}
