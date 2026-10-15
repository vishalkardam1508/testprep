import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useSeo } from '../hooks/useSeo'
import { sectionColor } from '../utils/sections'
import { saveLang } from '../utils/storage'
import { buildPrompt, sampleJson, parseTestJson, MAX_QUESTIONS } from '../utils/jsonTest'
import { createJsonTest, useAiTests } from '../utils/aiTests'

const ALPHA = ['A', 'B', 'C', 'D', 'E', 'F']
const inputCls = 'w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors'

function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text) }
    catch {
      // Older browsers / non-https: fall back to a hidden textarea
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }
  return (
    <button type="button" onClick={copy} className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${done ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
      {done ? '✓ Copied' : `📋 ${label}`}
    </button>
  )
}

function Toggle({ value, onChange, options }) {
  return (
    <div className="inline-grid gap-1 p-1 bg-gray-800 rounded-xl" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(o => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${value === o.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

const LANG_OPTIONS = [{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिंदी' }]

// ── Step 1: prompt + format ──
function GetQuestions() {
  const [info, setInfo] = useState({ exam: '', topics: '', count: 25, language: 'en', difficulty: 'moderate' })
  const [view, setView] = useState('prompt')   // prompt | format
  const set = (patch) => setInfo(i => ({ ...i, ...patch }))
  const prompt = useMemo(() => buildPrompt(info), [info])
  const shown  = view === 'prompt' ? prompt : sampleJson(info.language)

  return (
    <section className="card p-5 sm:p-8 space-y-5">
      <div>
        <p className="text-xs font-bold text-violet-400 tracking-widest uppercase mb-2">Step 1</p>
        <h2 className="text-xl font-bold text-white mb-1">Get your questions from ChatGPT</h2>
        <p className="text-sm text-gray-400">Fill in your test details, copy the prompt, and paste it into ChatGPT, Gemini or any AI chat. It replies with questions in the right format.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputCls} placeholder="Exam, e.g. UP Super TET 2026" value={info.exam} maxLength={150} onChange={e => set({ exam: e.target.value })} />
        <input className={inputCls} placeholder="Topics, e.g. Polity, History, Current Affairs" value={info.topics} maxLength={300} onChange={e => set({ topics: e.target.value })} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          Questions
          <input type="number" min={1} max={MAX_QUESTIONS} value={info.count}
            onChange={e => set({ count: Math.max(1, Math.min(MAX_QUESTIONS, Number(e.target.value) || 1)) })}
            className="w-20 bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-lg px-3 py-2 text-white outline-none" />
        </label>
        <Toggle value={info.language} onChange={language => set({ language })} options={LANG_OPTIONS} />
        <Toggle value={info.difficulty} onChange={difficulty => set({ difficulty })}
          options={[{ id: 'easy', label: 'Easy' }, { id: 'moderate', label: 'Moderate' }, { id: 'hard', label: 'Hard' }]} />
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-800/60 px-3 py-2">
          <Toggle value={view} onChange={setView} options={[{ id: 'prompt', label: 'ChatGPT prompt' }, { id: 'format', label: 'JSON format only' }]} />
          <CopyButton text={shown} label={view === 'prompt' ? 'Copy prompt' : 'Copy format'} />
        </div>
        <pre className="text-xs text-gray-300 bg-gray-950 p-4 max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono leading-relaxed">{shown}</pre>
      </div>

      <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
        <li><b className="text-gray-400">answer</b> counts from 0: A = 0, B = 1, C = 2, D = 3. Letters like "B" also work.</li>
        <li>For 50–100+ questions ChatGPT may reply in parts — paste all the parts together below.</li>
        <li>Check a few answers yourself: AI chats can make mistakes.</li>
      </ul>
    </section>
  )
}

// ── Step 2: paste / upload → check → create ──
function CreateTest() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [text,   setText]   = useState('')
  const [result, setResult] = useState(null)   // { test, skipped, error }
  const [title,  setTitle]  = useState('')
  const [duration, setDuration] = useState(0)

  const check = (value = text) => {
    const r = parseTestJson(value)
    setResult(r)
    if (r.test) { setTitle(r.test.title); setDuration(r.test.duration) }
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2_000_000) return setResult({ error: 'This file is too large — keep it under 2 MB.' })
    const value = await file.text()
    setText(value)
    check(value)
  }

  const create = () => {
    const t = result.test
    const test = createJsonTest({ ...t, title: title.trim() || t.title, duration: Math.max(1, Number(duration) || t.duration) })
    saveLang(test.language)
    navigate(`/ai-practice/${test.id}`)
  }

  const t = result?.test
  const perSection = t ? Object.fromEntries(t.sections.map(s => [s.id, t.questions.filter(q => q.section === s.id).length])) : {}

  return (
    <section className="card p-5 sm:p-8 space-y-5">
      <div>
        <p className="text-xs font-bold text-violet-400 tracking-widest uppercase mb-2">Step 2</p>
        <h2 className="text-xl font-bold text-white mb-1">Paste or upload the JSON</h2>
        <p className="text-sm text-gray-400">Paste ChatGPT's reply as it is (extra text and ```json marks are fine), or upload a .json file.</p>
      </div>

      <textarea
        className={`${inputCls} min-h-[200px] font-mono text-xs resize-y`}
        value={text}
        onChange={e => { setText(e.target.value); setResult(null) }}
        placeholder={'{\n  "title": "...",\n  "questions": [ ... ]\n}'}
        spellCheck={false}
      />

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => check()} disabled={!text.trim()} className="btn-primary py-2.5 disabled:opacity-40 disabled:cursor-not-allowed">Check JSON</button>
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary py-2.5">📁 Upload .json file</button>
        <input ref={fileRef} type="file" accept=".json,application/json,text/plain" className="hidden" onChange={onFile} />
        {text && <button type="button" onClick={() => { setText(''); setResult(null) }} className="text-sm text-gray-500 hover:text-gray-300 px-2">Clear</button>}
      </div>

      {result?.error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{result.error}</p>}

      {result?.skipped?.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-300 mb-2">⚠ {result.skipped.length} skipped</p>
          <ul className="text-xs text-gray-400 space-y-1 max-h-40 overflow-auto">
            {result.skipped.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
        </div>
      )}

      {t && (
        <div className="space-y-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-emerald-300 mb-3">✓ {t.questions.length} questions ready</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input className={inputCls} value={title} maxLength={150} onChange={e => setTitle(e.target.value)} aria-label="Test title" />
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="number" min={1} max={600} value={duration} onChange={e => setDuration(e.target.value)}
                  className="w-20 bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-3 py-3 text-white outline-none" />
                min
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Marking: +{t.marking.correct} correct / {t.marking.wrong ? `−${t.marking.wrong}` : '0'} wrong</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {t.sections.map(s => {
                const c = sectionColor(s.color)
                return (
                  <span key={s.id} className={`inline-flex items-center gap-1.5 text-xs bg-gray-800 px-2.5 py-1 rounded-full ${c.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{s.title} · {perSection[s.id]}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Preview</p>
            {t.questions.slice(0, 3).map(q => (
              <div key={q.id} className="bg-gray-800/40 rounded-xl p-4 text-sm">
                <p className="text-white mb-2 whitespace-pre-line">{q.id}. {q.question}</p>
                <div className="grid sm:grid-cols-2 gap-1">
                  {q.options.map((o, i) => {
                    const right = q.type === 'multiple_choice' ? q.answers.includes(i) : q.answer === i
                    return <p key={i} className={right ? 'text-emerald-400' : 'text-gray-400'}>{ALPHA[i]}) {o} {right && '✓'}</p>
                  })}
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={create} className="btn-primary w-full sm:w-auto">Create test →</button>
        </div>
      )}
    </section>
  )
}

function MyTests() {
  const tests = useAiTests().filter(t => t.source === 'json')
  if (!tests.length) return null
  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-4">My Tests</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map(t => (
          <Link key={t.id} to={`/ai-practice/${t.id}`} className="card p-4 hover:border-gray-700 transition-all group">
            <p className="text-white font-semibold text-sm line-clamp-2 group-hover:text-violet-400 transition-colors">{t.title}</p>
            <p className="text-xs text-gray-500 mt-2">{t.questions.length} questions · {t.plan.duration} min · {new Date(t.createdAt).toLocaleDateString()}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function AddTest() {
  useSeo({
    title: 'Add Your Own Test — Paste JSON Questions',
    description: 'Create a practice test from your own questions: copy the ChatGPT prompt, paste the JSON reply or upload a file, and practise with timer and results.',
  })
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-6">
        <div>
          <span className="text-xs font-bold text-violet-400 tracking-[0.2em] uppercase mb-3 block">Add Test</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Make a test from <span className="gradient-text">your own questions</span></h1>
          <p className="text-gray-400">Get questions from ChatGPT (or write them yourself) in a simple JSON format, paste them here, and practise with the timer, sections and full results. Saved in this browser.</p>
        </div>
        <MyTests />
        <GetQuestions />
        <CreateTest />
      </div>
      <Footer />
    </div>
  )
}
