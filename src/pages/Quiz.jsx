import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSeo } from '../hooks/useSeo'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Timer from '../components/quiz/Timer'
import QuestionCard from '../components/quiz/QuestionCard'
import QuestionPalette from '../components/quiz/QuestionPalette'
import LangToggle from '../components/quiz/LangToggle'
import { useMaster } from '../hooks/useMaster'
import { calculateScore, isAnswered } from '../utils/calculator'
import { fetchJson } from '../utils/fetchJson'
import { detectLang, isBilingual, localize } from '../utils/i18n'
import { groupBySection, orderBySection, sectionColor } from '../utils/sections'
import { resolveScheme, questionMarks } from '../utils/marking'
import {
  saveResult, getStudent, saveStudent,
  getProgress, saveProgress, clearProgress,
  getLang, saveLang,
} from '../utils/storage'

function FullScreenMessage({ children }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-center px-4">
      {children}
    </div>
  )
}

export default function Quiz() {
  const { testId } = useParams()
  const navigate   = useNavigate()
  const { getTest, loading: masterLoading, error: masterError } = useMaster()
  const testInfo   = useMemo(() => getTest(testId), [getTest, testId])

  const t = testInfo?.test
  useSeo(masterLoading ? { title: null } : t ? {
    title: `${t.title} — Free Online Mock Test`,
    description: `${t.description}. ${t.totalQuestions} questions, ${t.duration} minutes, ${t.maxScore} marks. Free ${testInfo.course.title} practice test in Hindi & English with solutions.`,
    image: t.img || testInfo.course.img,
    noindex: !t.isFree,
  } : { title: 'Test not found', noindex: true })

  const isLocked     = testInfo ? !testInfo.test.isFree : false
  const questionsUrl = testInfo && !isLocked ? testInfo.test.questionsUrl : null
  const duration     = testInfo?.test.duration || 60

  const [questions,  setQuestions]  = useState([])   // sorted section-wise
  const [sections,   setSections]   = useState([])
  const [fileScheme, setFileScheme] = useState(null)   // markingScheme inside the questions file
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers,    setAnswers]    = useState({})
  const [visited,    setVisited]    = useState(new Set())   // question ids
  const [marked,     setMarked]     = useState(new Set())   // question ids
  const [startedAt,  setStartedAt]  = useState(null)
  const [submitted,  setSubmitted]  = useState(false)
  const [showPalette,setShowPalette]= useState(false)
  const [studentName,setStudentName]= useState(() => getStudent()?.name || '')
  const [nameInput,  setNameInput]  = useState('')
  const [langPref,   setLangPref]   = useState(() => getLang())
  const submitRef = useRef(false)

  // course → questions file → test (master.json); per-question marks still win
  const scheme = useMemo(
    () => resolveScheme(testInfo?.course?.markingScheme, fileScheme, testInfo?.test?.markingScheme),
    [testInfo, fileScheme]
  )

  const bilingual = useMemo(() => isBilingual(questions), [questions])
  const groups    = useMemo(() => groupBySection(questions, sections), [questions, sections])
  // question index → index of its section in `groups`
  const sectionOf = useMemo(() => {
    const map = []
    groups.forEach((g, gi) => g.items.forEach(i => { map[i.index] = gi }))
    return map
  }, [groups])
  const lang      = langPref || detectLang(questions[0]?.question)
  const changeLang = (l) => { setLangPref(l); saveLang(l) }

  // Load questions (and restore saved progress, if any)
  useEffect(() => {
    if (!questionsUrl) return
    let alive = true
    setLoading(true)
    setError(null)
    fetchJson(questionsUrl)
      .then(d => {
        if (!alive) return
        const secs = d.sections || []
        const qs   = orderBySection(d.questions || [], secs)
        setSections(secs)
        setFileScheme(d.markingScheme || null)
        setQuestions(qs)

        const saved = getProgress(testId)
        if (saved) {
          setAnswers(saved.answers || {})
          setVisited(new Set(saved.visited || []))
          setMarked(new Set(saved.marked || []))
          setCurrentIdx(Math.min(saved.currentIdx || 0, Math.max(0, qs.length - 1)))
          setStartedAt(saved.startedAt || null)
        } else if (qs[0]) {
          setVisited(new Set([qs[0].id]))
        }
        setLoading(false)
      })
      .catch(e => { if (alive) { setError(e.message); setLoading(false) } })
    return () => { alive = false }
  }, [questionsUrl, testId])

  // Start the clock only once questions are ready and the student has entered a name
  useEffect(() => {
    if (!loading && !error && questions.length > 0 && studentName && !startedAt && !submitRef.current) {
      setStartedAt(Date.now())
    }
  }, [loading, error, questions.length, studentName, startedAt])

  // Persist progress so a refresh / back navigation doesn't lose answers
  useEffect(() => {
    if (!startedAt || submitRef.current) return
    saveProgress(testId, {
      startedAt,
      currentIdx,
      answers,
      visited: [...visited],
      marked:  [...marked],
    })
  }, [testId, startedAt, currentIdx, answers, visited, marked])

  // Warn before closing / reloading the tab during a running test
  useEffect(() => {
    if (!startedAt || submitted) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [startedAt, submitted])

  const saveName = () => {
    const name = nameInput.trim()
    if (!name) return
    saveStudent({ name })
    setStudentName(name)
  }

  const handleAnswer = useCallback((answer) => {
    const q = questions[currentIdx]
    if (!q) return
    setAnswers(prev => ({ ...prev, [q.id]: answer }))
  }, [questions, currentIdx])

  const goTo = useCallback((idx) => {
    const q = questions[idx]
    if (!q) return
    setCurrentIdx(idx)
    setVisited(v => new Set(v).add(q.id))
    setShowPalette(false)
  }, [questions])

  const toggleMark = () => {
    const id = questions[currentIdx]?.id
    if (id === undefined) return
    setMarked(m => {
      const n = new Set(m)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const handleSubmit = useCallback(() => {
    if (submitRef.current) return
    submitRef.current = true
    setSubmitted(true)

    const result = calculateScore(questions, answers, scheme)
    const timeTaken = startedAt
      ? Math.min(Math.round((Date.now() - startedAt) / 1000), duration * 60)
      : 0

    const id = `result_${Date.now()}`
    const ok = saveResult({
      id,
      testId,
      testTitle:    testInfo?.test?.title   || '',
      courseId:     testInfo?.course?.id    || '',
      courseTitle:  testInfo?.course?.title || '',
      questionsUrl: testInfo?.test?.questionsUrl || '',
      markingScheme: scheme,
      dateTaken:    new Date().toISOString(),
      timeTaken,
      ...result,
    })

    if (!ok) {
      // Keep progress so the student can free up space and submit again
      submitRef.current = false
      setSubmitted(false)
      window.alert('Could not save your result — browser storage is full. Clear old results in "My Results" and submit again.')
      return
    }

    clearProgress(testId)
    navigate(`/result/${id}`, { replace: true })
  }, [questions, answers, scheme, testInfo, testId, startedAt, duration, navigate])

  // ── Guards ────────────────────────────────────────────────
  if (masterLoading) return (
    <FullScreenMessage>
      <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </FullScreenMessage>
  )

  if (masterError) return (
    <FullScreenMessage>
      <p className="text-red-400">Error: {masterError}</p>
      <Link to="/" className="btn-secondary">← Back Home</Link>
    </FullScreenMessage>
  )

  if (!testInfo) return (
    <FullScreenMessage>
      <p className="text-gray-400 text-lg">Test not found</p>
      <Link to="/" className="btn-secondary">← Back Home</Link>
    </FullScreenMessage>
  )

  if (isLocked) return (
    <FullScreenMessage>
      <div className="text-6xl">🔒</div>
      <h1 className="text-2xl font-bold text-white">Premium Test</h1>
      <p className="text-gray-400 max-w-sm">
        <span className="text-white font-medium">{testInfo.test.title}</span> is a premium test and is not available yet.
      </p>
      <Link to={`/course/${testInfo.course.id}`} className="btn-primary">← Back to {testInfo.course.title}</Link>
    </FullScreenMessage>
  )

  if (loading) return (
    <FullScreenMessage>
      <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400">Loading questions...</p>
    </FullScreenMessage>
  )

  if (error) return (
    <FullScreenMessage>
      <p className="text-red-400">Error: {error}</p>
      <Link to={`/course/${testInfo.course.id}`} className="btn-secondary">← Back</Link>
    </FullScreenMessage>
  )

  if (questions.length === 0) return (
    <FullScreenMessage>
      <p className="text-gray-400 text-lg">This test has no questions yet.</p>
      <Link to={`/course/${testInfo.course.id}`} className="btn-secondary">← Back</Link>
    </FullScreenMessage>
  )

  const q         = questions[currentIdx]
  const ua        = answers[q?.id]
  const isLast    = currentIdx === questions.length - 1
  const isFirst   = currentIdx === 0
  const attempted = questions.filter(qq => isAnswered(answers[qq.id])).length

  const curGroupIdx     = sectionOf[currentIdx] ?? 0
  const curGroup        = groups[curGroupIdx]
  const nextGroup       = !isLast && sectionOf[currentIdx + 1] !== curGroupIdx ? groups[sectionOf[currentIdx + 1]] : null
  const showSectionTabs = groups.length > 1

  const confirmSubmit = () => {
    const left = questions.length - attempted
    const msg = left > 0 ? `Submit test? ${left} question${left > 1 ? 's' : ''} unanswered.` : 'Submit test?'
    if (window.confirm(msg)) handleSubmit()
  }

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Name popup — timer does not start until this is done */}
      {!studentName && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-8 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-2">Welcome!</h2>
            <p className="text-gray-400 text-sm mb-6">Enter your name to track your results. The timer starts after this.</p>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              placeholder="Your name"
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none mb-4 transition-colors"
            />
            <button onClick={saveName} disabled={!nameInput.trim()} className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
              Start Test →
            </button>
          </div>
        </div>
      )}

      {/* Quiz header */}
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">{testInfo.test.title}</h1>
            <p className="text-xs text-gray-500">{studentName && `${studentName} • `}{attempted}/{questions.length} Attempted</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {bilingual && <LangToggle lang={lang} onChange={changeLang} />}
            <Timer
              endTime={startedAt ? startedAt + duration * 60 * 1000 : null}
              durationMinutes={duration}
              onExpire={handleSubmit}
            />
            <button onClick={() => setShowPalette(p => !p)} className="btn-secondary py-2 px-3 text-sm md:hidden">
              ☰
            </button>
            <button onClick={confirmSubmit} disabled={submitted} className="btn-primary py-2 px-4 text-sm disabled:opacity-50">
              Submit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-300"
            style={{ width: `${(attempted / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Sidebar palette (left) */}
          <div className="hidden md:block w-64 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
            <QuestionPalette
              groups={groups}
              answers={answers}
              visited={visited}
              marked={marked}
              currentIndex={currentIdx}
              onJump={goTo}
            />
          </div>

          {/* Question area */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Section tabs */}
            {showSectionTabs && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {groups.map((g, gi) => {
                  const c      = sectionColor(g.color)
                  const active = gi === curGroupIdx
                  const done   = g.items.filter(({ q }) => isAnswered(answers[q.id])).length
                  return (
                    <button
                      key={g.id}
                      onClick={() => goTo(g.items[0].index)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${
                        active ? `${c.bg} ${c.border} ${c.text}` : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      {g.title}
                      <span className="text-xs opacity-70">{done}/{g.items.length}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {q && (
              <QuestionCard
                question={localize(q, lang)}
                marks={questionMarks(q, scheme)}
                answer={ua}
                onChange={handleAnswer}
                index={currentIdx}
                total={questions.length}
                section={showSectionTabs ? {
                  ...curGroup,
                  number: curGroupIdx + 1,
                  count: groups.length,
                  position: curGroup.items.findIndex(i => i.index === currentIdx) + 1,
                } : null}
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => goTo(currentIdx - 1)} disabled={isFirst}
                className="btn-secondary py-2.5 px-5 text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                ← Prev
              </button>

              <button onClick={toggleMark}
                className={`py-2.5 px-5 rounded-xl text-sm font-medium transition-all border ${
                  marked.has(q?.id)
                    ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}>
                {marked.has(q?.id) ? '🔖 Marked' : '🔖 Mark'}
              </button>

              {!isLast ? (
                <button onClick={() => goTo(currentIdx + 1)} className="btn-primary py-2.5 px-5 text-sm">
                  {nextGroup ? `Next Section: ${nextGroup.title} →` : 'Next →'}
                </button>
              ) : (
                <button
                  onClick={confirmSubmit}
                  disabled={submitted}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all disabled:opacity-50">
                  Submit ✓
                </button>
              )}
            </div>
          </div>

          {/* Mobile palette overlay (slides in from the left) */}
          {showPalette && (
            <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setShowPalette(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-gray-950 border-r border-gray-800 p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <QuestionPalette
                  groups={groups}
                  answers={answers}
                  visited={visited}
                  marked={marked}
                  currentIndex={currentIdx}
                  onJump={goTo}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
