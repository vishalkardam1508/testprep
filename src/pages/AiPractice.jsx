import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useSeo } from '../hooks/useSeo'
import { sectionColor } from '../utils/sections'
import { CONTENT_TYPES, MONTHS, MAX_CA_FIELDS, QUESTION_COUNTS, LANGUAGES, formatPeriod, periodMonths } from '../utils/gsFields'
import {
  analyzeExam, analyzePyq, createAiTest, runGeneration, useAiTests, isGenerating,
  DAILY_TEST_LIMIT, aiTestsLeftToday, spendAiTestCredit, refundAiTestCredit,
} from '../utils/aiTests'
import PyqInsights from '../components/ai/PyqInsights'
import { saveLang } from '../utils/storage'
import { VedhaBadge, VedhaAvatar } from '../components/ai/Vedha'

const NOW   = new Date()
const YEARS = [0, 1, 2, 3].map(i => NOW.getFullYear() - i)

const inputCls = 'w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors'

function Chip({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-violet-600/20 border-violet-500 text-violet-300' : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
      }`}
    >
      {children}
    </button>
  )
}

const toggleIn = (set, v) => {
  const n = new Set(set)
  n.has(v) ? n.delete(v) : n.add(v)
  return n
}

// ── Step 1: exam + topics form ──
function ExamForm({ form, setForm, onSubmit, busy, error }) {
  const type   = CONTENT_TYPES.find(t => t.id === form.contentType)
  const hasCa  = form.contentType !== 'static'
  const isFuture = (m) => form.year === NOW.getFullYear() && m > NOW.getMonth()
  const set = (patch) => setForm(f => ({ ...f, ...patch }))

  const changeType = (id) => {
    const allowed = new Set(CONTENT_TYPES.find(t => t.id === id).fields.map(f => f.id))
    set({ contentType: id, fields: new Set([...form.fields].filter(f => allowed.has(f))) })
  }
  const changeYear = (y) => set({
    year: y,
    months: new Set([...form.months].filter(m => !(y === NOW.getFullYear() && m > NOW.getMonth()))),
  })

  const canSubmit = form.title.trim() && form.fields.size > 0 && !busy
  const caPicked  = type.fields.filter(f => f.kind === 'current' && form.fields.has(f.id)).length
  const caFull    = caPicked >= MAX_CA_FIELDS

  return (
    <form onSubmit={e => { e.preventDefault(); if (canSubmit) onSubmit() }} className="card p-5 sm:p-8 space-y-6">
      <div>
        <label className="block text-sm font-semibold text-white mb-2">Exam / Job title *</label>
        <input
          className={inputCls}
          value={form.title}
          maxLength={150}
          onChange={e => set({ title: e.target.value })}
          placeholder="e.g. SSC CGL 2026, UPSSSC PET, IBPS PO, RRB NTPC"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Job description / notification <span className="text-gray-500 font-normal">(optional, but makes the test match your exam)</span>
        </label>
        <textarea
          className={`${inputCls} min-h-[120px] resize-y`}
          value={form.description}
          maxLength={6000}
          onChange={e => set({ description: e.target.value })}
          placeholder="Paste the post name, eligibility, exam scheme or syllabus from the official notification…"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">What do you want to practise?</label>
        <div className="grid grid-cols-3 gap-2">
          {CONTENT_TYPES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => changeType(t.id)}
              className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                form.contentType === t.id ? 'bg-violet-600 border-violet-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Question language</label>
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          {LANGUAGES.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => set({ language: l.id })}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                form.language === l.id ? 'bg-violet-600/20 border-violet-500 text-violet-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Number of questions</label>
        <div className="grid grid-cols-3 gap-2 max-w-xs">
          {QUESTION_COUNTS.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => set({ count: n })}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                form.count === n ? 'bg-violet-600/20 border-violet-500 text-violet-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {hasCa && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-white">Current affairs period</label>
          <div className="flex flex-wrap gap-2">
            {YEARS.map(y => <Chip key={y} active={form.year === y} onClick={() => changeYear(y)}>{y}</Chip>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {MONTHS.map((m, i) => (
              <Chip key={m} active={form.months.has(i)} disabled={isFuture(i)} onClick={() => set({ months: toggleIn(form.months, i) })}>
                {m.slice(0, 3)}
              </Chip>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {formatPeriod(form.year, [...form.months])} · No month selected = whole year. Questions are built from a live web search for this period.
          </p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-white">Fields *</label>
          {form.fields.size > 0 && (
            <button type="button" className="text-xs text-violet-400 hover:text-violet-300" onClick={() => set({ fields: new Set() })}>
              Clear all
            </button>
          )}
        </div>
        {[['current', 'Current Affairs'], ['static', 'General Studies']].map(([kind, label]) => {
          const list = type.fields.filter(f => f.kind === kind)
          if (!list.length) return null
          return (
            <div key={kind} className="mb-3">
              {(form.contentType === 'both' || kind === 'current') && (
                <p className="text-xs text-gray-500 mb-2">
                  {form.contentType === 'both' && `${label} · `}
                  {kind === 'current' && `pick up to ${MAX_CA_FIELDS}${caFull ? ' — remove one to choose another' : ''}`}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {list.map(f => (
                  <Chip
                    key={f.id}
                    active={form.fields.has(f.id)}
                    disabled={kind === 'current' && caFull && !form.fields.has(f.id)}
                    onClick={() => set({ fields: toggleIn(form.fields, f.id) })}
                  >
                    {f.title}
                  </Chip>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

      <button type="submit" disabled={!canSubmit} className="btn-primary w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed">
        {busy || 'Analyse exam →'}
      </button>
      {busy
        ? <p className="text-xs text-gray-500">Searching the last 5 years of papers can take up to a minute.</p>
        : <p className="text-xs text-gray-500">{aiTestsLeftToday()} of {DAILY_TEST_LIMIT} free AI tests left today.</p>}
    </form>
  )
}

// ── Step 2: review the AI's exam analysis ──
function PlanReview({ plan, setPlan, period, count, onBack, onGenerate }) {
  const total = plan.sections.reduce((a, s) => a + s.weight, 0)
  const setSection = (id, patch) => setPlan(p => ({ ...p, sections: p.sections.map(s => s.id === id ? { ...s, ...patch } : s) }))
  const removeSection = (id) => setPlan(p => ({ ...p, sections: p.sections.filter(s => s.id !== id) }))
  const num = (v) => Math.max(0, Number(v) || 0)

  return (
    <div className="card p-5 sm:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <VedhaAvatar size="w-7 h-7 text-xs" />
          <p className="text-xs font-bold text-violet-400 tracking-widest uppercase">Vedha Tutor's exam analysis</p>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">{plan.examName}</h2>
        {plan.summary && <p className="text-gray-400 text-sm leading-relaxed">{plan.summary}</p>}
        {period && <p className="text-xs text-gray-500 mt-2">Current affairs: {period}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="bg-gray-800/60 rounded-xl p-3">
          <span className="block text-xs text-gray-500 mb-1">Difficulty</span>
          <select value={plan.difficulty} onChange={e => setPlan(p => ({ ...p, difficulty: e.target.value }))}
            className="w-full bg-transparent text-white font-semibold outline-none capitalize">
            {['easy', 'moderate', 'hard'].map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
          </select>
        </label>
        <label className="bg-gray-800/60 rounded-xl p-3">
          <span className="block text-xs text-gray-500 mb-1">Duration (min)</span>
          <input type="number" min={10} max={180} value={plan.duration}
            onChange={e => setPlan(p => ({ ...p, duration: Math.min(180, num(e.target.value)) }))}
            className="w-full bg-transparent text-white font-semibold outline-none" />
        </label>
        <label className="bg-gray-800/60 rounded-xl p-3">
          <span className="block text-xs text-gray-500 mb-1">Marks / correct</span>
          <input type="number" min={0} step={0.25} value={plan.marking.correct}
            onChange={e => setPlan(p => ({ ...p, marking: { ...p.marking, correct: num(e.target.value) } }))}
            className="w-full bg-transparent text-white font-semibold outline-none" />
        </label>
        <label className="bg-gray-800/60 rounded-xl p-3">
          <span className="block text-xs text-gray-500 mb-1">Negative / wrong</span>
          <input type="number" min={0} step={0.25} value={plan.marking.wrong}
            onChange={e => setPlan(p => ({ ...p, marking: { ...p.marking, wrong: num(e.target.value) } }))}
            className="w-full bg-transparent text-white font-semibold outline-none" />
        </label>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-white font-semibold">Sections</h3>
          <span className={`text-xs ${total === 100 ? 'text-gray-500' : 'text-yellow-400'}`}>
            Weights total {total}% {total !== 100 && `(scaled to ${count} questions)`}
          </span>
        </div>
        <div className="space-y-2">
          {plan.sections.map(s => {
            const c = sectionColor(s.color)
            return (
              <div key={s.id} className="bg-gray-800/40 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                  <span className="text-white text-sm font-medium flex-1 min-w-0 truncate">{s.title}</span>
                  {s.kind === 'current' && <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">Live search</span>}
                  <input type="number" min={1} max={100} value={s.weight}
                    onChange={e => setSection(s.id, { weight: Math.max(1, Math.min(100, num(e.target.value))) })}
                    className="w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-white text-sm text-right outline-none focus:border-violet-500" />
                  <span className="text-gray-500 text-sm">%</span>
                  {plan.sections.length > 1 && (
                    <button onClick={() => removeSection(s.id)} aria-label={`Remove ${s.title}`} className="text-gray-600 hover:text-red-400 px-1">✕</button>
                  )}
                </div>
                {s.topics.length > 0 && <p className="text-xs text-gray-500 mt-1.5 pl-5 leading-relaxed">{s.topics.join(' · ')}</p>}
              </div>
            )
          })}
        </div>
      </div>

      <PyqInsights pyq={plan.pyq} sections={plan.sections} />

      {plan.tips.length > 0 && (
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-violet-300 mb-2">Preparation tips</p>
          <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
            {plan.tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button onClick={onBack} className="btn-secondary">← Edit details</button>
        <button onClick={onGenerate} className="btn-primary flex-1 sm:flex-none">Generate {count} questions →</button>
      </div>
      <p className="text-xs text-gray-500">
        Questions are written 5 at a time — you can start the test as soon as the first 5 are ready, and the rest are added while you practise.
      </p>
    </div>
  )
}

function MyTests() {
  const tests = useAiTests().filter(t => t.source !== 'json')   // own JSON tests are listed on /add-test
  if (!tests.length) return null
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-white mb-4">My AI Tests</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map(t => {
          const live = isGenerating(t.id)
          return (
            <Link key={t.id} to={`/ai-practice/${t.id}`} className="card p-4 hover:border-gray-700 transition-all group">
              <p className="text-white font-semibold text-sm line-clamp-2 group-hover:text-violet-400 transition-colors">{t.plan.examName}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">{t.period || 'General Studies'}</p>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-gray-400">{t.questions.length}/{t.target} questions</span>
                <span className={live ? 'text-cyan-400' : t.status === 'error' ? 'text-red-400' : t.questions.length >= t.target ? 'text-emerald-400' : 'text-yellow-400'}>
                  {live ? 'Generating…' : t.status === 'error' ? 'Failed' : t.questions.length >= t.target ? 'Ready' : 'Paused'}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default function AiPractice() {
  useSeo({
    title: 'AI Practice — GS & Current Affairs Tests for Your Exam',
    description: 'Enter your exam and job description. AI studies the exam pattern and builds a GS and current affairs practice test of up to 100 questions, month-wise and field-wise.',
  })
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', contentType: 'current',
    year: NOW.getFullYear(), months: new Set([NOW.getMonth()]), fields: new Set(), count: QUESTION_COUNTS[0], language: 'en',
  })
  const [plan,  setPlan]  = useState(null)
  const [busy,  setBusy]  = useState(null)   // progress text while the AI works
  const [error, setError] = useState(null)

  const type    = CONTENT_TYPES.find(t => t.id === form.contentType)
  const fields  = type.fields.filter(f => form.fields.has(f.id))
  const period  = form.contentType !== 'static' ? formatPeriod(form.year, [...form.months]) : ''

  const analyse = async () => {
    setError(null)
    if (aiTestsLeftToday() === 0) {
      setError(`You've created ${DAILY_TEST_LIMIT} AI tests today — that's Vedha Tutor's daily limit. Practise your saved tests below, or come back tomorrow.`)
      return
    }
    const input = { title: form.title, description: form.description, fields, period, language: form.language }
    spendAiTestCredit()
    try {
      // Previous-year papers first, so the plan's weights and topics come from real papers.
      // Not finding them is fine — the plan then uses the AI's general knowledge.
      setBusy("Vedha Tutor is studying last 5 years' papers…")
      let pyq = null
      try { pyq = await analyzePyq(input) } catch (e) { if (e.daily || e.status === 422) throw e }   // 422 = not an education request
      setBusy('Vedha Tutor is planning your test…')
      // The AI plans timing for a 100-question paper; scale it to the chosen size
      const p = await analyzeExam({ ...input, pyq })
      setPlan({
        ...p,
        duration: Math.max(10, Math.round(p.duration * form.count / 100)),
        // Section names in the chosen language (the AI keeps our field ids)
        sections: p.sections.map(s => ({ ...s, title: form.language === 'hi' ? (fields.find(f => f.id === s.id)?.hi || s.title) : s.title })),
      })
    } catch (e) {
      refundAiTestCredit()
      setError(e.message)
    } finally {
      setBusy(null)
    }
  }

  const generate = () => {
    const test = createAiTest({
      title: form.title.trim(),
      description: form.description.trim().slice(0, 500),
      contentType: form.contentType,
      period,
      months: period ? periodMonths(form.year, [...form.months]) : [],
      target: form.count,
      language: form.language,
      plan,
    })
    saveLang(form.language)   // the exam opens in the language the student picked (EN / हिंदी toggle still works)
    runGeneration(test.id)
    navigate(`/ai-practice/${test.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
        <div className="mb-8">
          <span className="text-xs font-bold text-violet-400 tracking-[0.2em] uppercase mb-3 block">AI Practice</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">GS & Current Affairs for <span className="gradient-text">your exam</span></h1>
          <div className="mb-5"><VedhaBadge /></div>
          <p className="text-gray-400">Tell Vedha Tutor your exam. It studies the exam's pattern and last 5 years' papers, then builds a question bank of 25, 50 or 100 — month-wise and field-wise — to practise as a timed test or learn question by question.</p>
        </div>

        <MyTests />

        <Link to="/add-test" className="flex items-center justify-between gap-3 card px-5 py-4 mb-6 hover:border-gray-700 transition-all group">
          <span className="text-sm text-gray-300">📄 Have your own questions? <span className="text-gray-500">Paste JSON from ChatGPT or upload a file</span></span>
          <span className="text-violet-400 text-sm font-semibold group-hover:translate-x-0.5 transition-transform flex-shrink-0">Add Test →</span>
        </Link>

        {plan
          ? <PlanReview plan={plan} setPlan={setPlan} period={period} count={form.count} onBack={() => setPlan(null)} onGenerate={generate} />
          : <ExamForm form={form} setForm={setForm} onSubmit={analyse} busy={busy} error={error} />}
      </div>
      <Footer />
    </div>
  )
}
