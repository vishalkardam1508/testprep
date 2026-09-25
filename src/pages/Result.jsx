import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSeo } from '../hooks/useSeo'
import { useParams, Link } from 'react-router-dom'
import { getResultById, updateResult, getLang, saveLang } from '../utils/storage'
import { detectLang, isBilingual, localize } from '../utils/i18n'
import LangToggle from '../components/quiz/LangToggle'
import { groupBySection, sectionColor } from '../utils/sections'
import { getGrade, formatDuration, applyEssayGrades, isAnswered } from '../utils/calculator'
import { fetchJson } from '../utils/fetchJson'
import { requestEssayGrades } from '../utils/essayGrader'

const ALPHA = ['A','B','C','D','E','F']

const STATUS_INFO = {
  correct: { label: 'Correct',  bg: 'bg-emerald-500/10 border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-400' },
  wrong:   { label: 'Wrong',    bg: 'bg-red-500/10 border-red-500/30',         badge: 'bg-red-500/20 text-red-400'         },
  partial: { label: 'Partial',  bg: 'bg-yellow-500/10 border-yellow-500/30',   badge: 'bg-yellow-500/20 text-yellow-400'   },
  skipped: { label: 'Skipped',  bg: 'bg-gray-800/50 border-gray-700',          badge: 'bg-gray-800 text-gray-400'          },
  essay:   { label: 'Essay — pending review', bg: 'bg-orange-500/10 border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400' },
  aiGraded:{ label: '🤖 AI Graded', bg: 'bg-orange-500/10 border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400' },
}

function AiFeedback({ grade }) {
  return (
    <div className="mt-3 bg-gray-800/50 rounded-lg p-3 space-y-2 text-xs">
      {grade.feedback && <p className="text-gray-300 leading-relaxed">{grade.feedback}</p>}
      {grade.strengths.length > 0 && (
        <div>
          <p className="text-emerald-400 font-semibold mb-1">Strengths</p>
          <ul className="list-disc list-inside text-gray-400 space-y-0.5">
            {grade.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {grade.improvements.length > 0 && (
        <div>
          <p className="text-yellow-400 font-semibold mb-1">How to improve</p>
          <ul className="list-disc list-inside text-gray-400 space-y-0.5">
            {grade.improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

function MultiAnswerDisplay({ options, answers = [], correct = [] }) {
  return (
    <div className="space-y-1.5 mt-2">
      {options.map((opt, i) => {
        const isUser    = answers.includes(i)
        const isCorrect = correct.includes(i)
        return (
          <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
            isCorrect ? 'bg-emerald-500/10 text-emerald-300' :
            isUser    ? 'bg-red-500/10 text-red-300' :
                        'text-gray-500'
          }`}>
            <span className="font-bold w-5">{ALPHA[i]}</span>
            <span className="flex-1">{opt}</span>
            {isUser && !isCorrect && <span className="text-red-400 text-xs">✗ Your answer</span>}
            {isUser && isCorrect  && <span className="text-emerald-400 text-xs">✓ Your answer</span>}
            {!isUser && isCorrect && <span className="text-emerald-400 text-xs">✓ Correct</span>}
          </div>
        )
      })}
    </div>
  )
}

export default function Result() {
  const { resultId } = useParams()
  const [result, setResult] = useState(() => getResultById(resultId))
  useSeo({ title: result ? `Result: ${result.testTitle}` : 'Result', noindex: true })   // private, stored in this browser

  useEffect(() => { setResult(getResultById(resultId)) }, [resultId])

  // Older results stored the questions inline; newer ones only store the URL
  const [questions, setQuestions] = useState(result?.questions || null)
  const [sections, setSections] = useState([])
  const [qError, setQError] = useState(null)
  const questionsUrl = result?.questions ? null : result?.questionsUrl

  useEffect(() => {
    if (!questionsUrl) return
    let alive = true
    fetchJson(questionsUrl)
      .then(d => { if (alive) { setQuestions(d.questions || []); setSections(d.sections || []) } })
      .catch(e => { if (alive) setQError(e.message) })
    return () => { alive = false }
  }, [questionsUrl])

  const qMap = useMemo(() => new Map((questions || []).map(q => [q.id, q])), [questions])

  const [langPref, setLangPref] = useState(() => getLang())
  const bilingual  = useMemo(() => isBilingual(questions || []), [questions])
  const lang       = langPref || detectLang(questions?.[0]?.question)
  const changeLang = (l) => { setLangPref(l); saveLang(l) }

  // ── AI essay grading (Groq, via /api/grade-essay) ──
  const [gradeStatus, setGradeStatus] = useState('idle')   // idle | grading | error
  const [gradeError,  setGradeError]  = useState(null)
  const gradingRef = useRef(false)

  // Only results created with the new calculator have essayMarks kept out of maxScore
  const needsGrading = !!result && result.essayMarks > 0 && !result.essaysGraded

  const runGrading = useCallback(async () => {
    if (gradingRef.current || !result || !questions) return
    gradingRef.current = true
    setGradeStatus('grading')
    setGradeError(null)
    try {
      const items = result.details
        .filter(d => d.type === 'essay' && isAnswered(d.userAnswer))
        .map(d => {
          const q = qMap.get(d.id) || {}
          return {
            id: d.id,
            question: q.question,
            modelAnswer: q.explanation,
            wordLimit: q.wordLimit,
            maxMarks: d.marks,
            answer: d.userAnswer,
          }
        })
      const grades  = items.length ? await requestEssayGrades(items) : []
      const patch   = applyEssayGrades(result, grades)
      const updated = updateResult(result.id, patch) || { ...result, ...patch }
      setResult(updated)
      setGradeStatus('idle')
    } catch (e) {
      setGradeError(e.message)
      setGradeStatus('error')
    } finally {
      gradingRef.current = false
    }
  }, [result, questions, qMap])

  useEffect(() => {
    if (needsGrading && questions && gradeStatus === 'idle') runGrading()
  }, [needsGrading, questions, gradeStatus, runGrading])

  if (!result) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-400 text-xl">Result not found</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  )

  const grade    = getGrade(result.percentage)
  const date     = new Date(result.dateTaken).toLocaleString('en-IN')
  const pct      = parseFloat(result.percentage)
  const ring     = Math.min(100, Math.max(0, pct))
  const details  = result.details || []
  const groups   = groupBySection(details, sections)

  // Per-section score (essays count only once AI-graded)
  const sectionStats = groups.map(g => {
    const ds = g.items.map(i => i.q)
    const counted = ds.filter(d => d.type !== 'essay' || result.essaysGraded)
    return {
      ...g,
      correct: ds.filter(d => d.status === 'correct').length,
      wrong:   ds.filter(d => d.status === 'wrong').length,
      skipped: ds.filter(d => d.status === 'skipped').length,
      score:   Math.round(counted.reduce((s, d) => s + (d.score || 0), 0) * 100) / 100,
      max:     Math.round(counted.reduce((s, d) => s + (d.marks || 0), 0) * 100) / 100,
    }
  })

  const stats = [
    { value: result.correct,  label: 'Correct',  color: 'text-emerald-400' },
    { value: result.wrong,    label: 'Wrong',    color: 'text-red-400'     },
    result.partial    > 0 && { value: result.partial,    label: 'Partial', color: 'text-yellow-400' },
    { value: result.skipped,  label: 'Skipped',  color: 'text-gray-400'    },
    result.essayCount > 0 && { value: result.essayCount, label: 'Essays',  color: 'text-orange-400' },
    { value: formatDuration(result.timeTaken), label: 'Time Taken', color: 'text-cyan-400' },
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Home</Link>
          <div className="flex items-center gap-3">
            {bilingual && <LangToggle lang={lang} onChange={changeLang} />}
            <Link to="/summary" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">My Results →</Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Score card */}
        <div className="card p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 to-gray-900 pointer-events-none" />
          <div className="relative">

            <h2 className="text-lg font-medium text-gray-400 mb-2">{result.testTitle}</h2>
            <p className="text-gray-600 text-sm mb-6">{date}</p>

            {/* Main score */}
            <div className="mb-6">
              <div className="text-8xl font-black text-white leading-none mb-2">
                {result.score}
                <span className="text-4xl text-gray-600 font-normal">/{result.maxScore}</span>
              </div>
              <div className={`text-3xl font-bold ${grade.color}`}>{pct}%</div>
              <div className={`inline-block mt-2 text-sm font-semibold px-4 py-1.5 rounded-full ${grade.color} bg-gray-800`}>
                {grade.label}
              </div>
              {result.essayMarks > 0 && result.essaysGraded && (
                <p className="text-orange-400/80 text-xs mt-3">
                  🤖 Includes {result.essayScore}/{result.essayMarks} marks from AI-evaluated essays
                </p>
              )}
              {needsGrading && gradeStatus !== 'error' && (
                <p className="text-orange-400/80 text-xs mt-3 animate-pulse">
                  🤖 AI is evaluating your essay answers… ({result.essayMarks} marks pending)
                </p>
              )}
              {needsGrading && gradeStatus === 'error' && (
                <div className="mt-3 text-xs">
                  <p className="text-red-400 mb-2">AI essay evaluation failed: {gradeError}</p>
                  <button onClick={runGrading} className="btn-secondary text-xs py-1.5 px-4 rounded-lg">
                    Retry AI Evaluation
                  </button>
                </div>
              )}
            </div>

            {/* Circular progress */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="url(#grad)" strokeWidth="10"
                    strokeDasharray={`${2.51 * ring} ${251 - 2.51 * ring}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">{pct}%</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map(s => (
                <div key={s.label} className="bg-gray-800/60 rounded-xl p-4">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <Link to={`/quiz/${result.testId}`} className="btn-secondary text-sm py-2.5 px-6 rounded-xl">
                Retake Test
              </Link>
              <Link to="/" className="btn-primary text-sm py-2.5 px-6 rounded-xl">
                More Tests →
              </Link>
            </div>
          </div>
        </div>

        {/* Section-wise analysis */}
        {sectionStats.length > 1 && (
          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Section-wise Analysis</h3>
            <div className="space-y-3">
              {sectionStats.map(s => {
                const c   = sectionColor(s.color)
                const pct = s.max > 0 ? Math.max(0, Math.min(100, (s.score / s.max) * 100)) : 0
                return (
                  <div key={s.id}>
                    <div className="flex items-center gap-2 text-sm mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      <span className={`font-semibold ${c.text}`}>{s.title}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        <span className="text-emerald-400">✓ {s.correct}</span>{'  '}
                        <span className="text-red-400">✗ {s.wrong}</span>{'  '}
                        <span className="text-gray-500">— {s.skipped}</span>
                      </span>
                      <span className="ml-auto font-bold text-white">{s.score}<span className="text-gray-500 font-normal">/{s.max}</span></span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${c.dot}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Answer Review */}
        {details.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Answer Review</h3>

            {qError && <p className="text-red-400 text-sm mb-4">Could not load questions for review: {qError}</p>}
            {!questions && !qError && <p className="text-gray-500 text-sm animate-pulse">Loading review...</p>}

            {questions && (
              <div className="space-y-8">
                {groups.map(g => (
                <div key={g.id} className="space-y-4">
                  {groups.length > 1 && (
                    <div className={`flex items-center gap-2 text-sm font-bold ${sectionColor(g.color).text}`}>
                      <span className={`w-2 h-2 rounded-full ${sectionColor(g.color).dot}`} />
                      {g.title}
                      <span className="text-gray-600 font-normal text-xs">({g.items.length} questions)</span>
                    </div>
                  )}
                {g.items.map(({ q: d, index: i }) => {
                  const info = d.aiGrade ? STATUS_INFO.aiGraded : (STATUS_INFO[d.status] || STATUS_INFO.skipped)
                  const q    = localize(qMap.get(d.id), lang) || {}
                  const text        = q.question    ?? d.question
                  const options     = q.options     ?? d.options ?? []
                  const explanation = q.explanation ?? d.explanation
                  const correctAns  = q.answer ?? q.answers ?? d.correctAnswer

                  return (
                    <div key={d.id} className={`card p-5 border ${info.bg}`}>
                      {/* Question header */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded flex-shrink-0">Q{i+1}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${info.badge}`}>{info.label}</span>
                        <span className={`text-xs font-bold ml-auto flex-shrink-0 ${d.score > 0 ? 'text-emerald-400' : d.score < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                          {d.type === 'essay'
                            ? `${d.aiGrade ? d.score : '—'} / ${d.marks}`
                            : `${d.score > 0 ? '+' : ''}${d.score}`}
                        </span>
                      </div>

                      {/* Question */}
                      <p className="text-white text-sm mb-3 leading-relaxed">{text}</p>

                      {/* Answer display by type */}
                      {d.type === 'essay' ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Your answer:</p>
                          <p className="text-gray-300 text-sm bg-gray-800/50 rounded-lg p-3 italic whitespace-pre-wrap">
                            {d.userAnswer || 'Not attempted'}
                          </p>
                          {d.aiGrade && <AiFeedback grade={d.aiGrade} />}
                        </div>
                      ) : d.type === 'multiple_choice' ? (
                        <MultiAnswerDisplay
                          options={options}
                          answers={Array.isArray(d.userAnswer) ? d.userAnswer : []}
                          correct={Array.isArray(correctAns) ? correctAns : []}
                        />
                      ) : (
                        <div className="space-y-1.5">
                          {options.map((opt, idx) => {
                            const isUser    = d.userAnswer === idx
                            const isCorrect = correctAns === idx
                            return (
                              <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                                isCorrect ? 'bg-emerald-500/10 text-emerald-300' :
                                isUser    ? 'bg-red-500/10 text-red-300' : 'text-gray-500'
                              }`}>
                                <span className="font-bold w-5">{ALPHA[idx]}</span>
                                <span className="flex-1">{opt}</span>
                                {isUser && !isCorrect && <span className="text-red-400">✗</span>}
                                {isCorrect && <span className="text-emerald-400">✓</span>}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Explanation */}
                      {explanation && (
                        <details className="mt-3">
                          <summary className="text-xs text-violet-400 cursor-pointer hover:text-violet-300 transition-colors">
                            {d.type === 'essay' ? 'View Model Answer' : 'View Explanation'}
                          </summary>
                          <p className="text-gray-400 text-xs mt-2 leading-relaxed bg-gray-800/50 rounded-lg p-3">
                            {explanation}
                          </p>
                        </details>
                      )}
                    </div>
                  )
                })}
                </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
