// AI-generated practice tests: stored in this browser, generated 25 questions at a time via /api/gs.
// Generation runs at module level, so it keeps going while the student moves between pages
// (e.g. starts the exam after the first batch). A page reload pauses it; the test page offers Resume.
import { useEffect, useState } from 'react'
import { CURRENT_FIELDS, STATIC_FIELDS } from './gsFields'

const INDEX_KEY = 'testprep_ai_tests'
const TEST_KEY  = (id) => `testprep_ai_${id}`
// Small batches: the first questions are ready fast (the test can start at once), and each call
// stays under the free tier's 8k tokens-per-minute limit
export const BATCH = 5
const FACTS_PER_SEARCH = 15

export const AI_PREFIX = 'ai-'
export const isAiTestId = (id) => String(id || '').startsWith(AI_PREFIX)

// ── Storage (in-memory cache, written through to localStorage) ──
const cache     = new Map()
const running   = new Map()   // id → { stop }
const listeners = new Set()
const emit = () => listeners.forEach(fn => fn())

const readIndex = () => {
  try { return JSON.parse(localStorage.getItem(INDEX_KEY)) || [] } catch { return [] }
}
const writeIndex = (ids) => {
  try { localStorage.setItem(INDEX_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
}

export function getAiTest(id) {
  if (!cache.has(id)) {
    try {
      const raw = localStorage.getItem(TEST_KEY(id))
      if (raw) cache.set(id, JSON.parse(raw))
    } catch { /* ignore */ }
  }
  return cache.get(id) || null
}

export const getAiTests = () => readIndex().map(getAiTest).filter(Boolean)

function saveAiTest(test) {
  cache.set(test.id, test)
  try { localStorage.setItem(TEST_KEY(test.id), JSON.stringify(test)) }
  catch { /* storage full — test stays in memory for this session */ }
  emit()
  return test
}

const updateAiTest = (id, patch) => {
  const t = getAiTest(id)
  return t ? saveAiTest({ ...t, ...patch }) : null
}

export function createAiTest({ title, description, contentType, period, months = [], target = 100, language = 'en', plan }) {
  const id = `${AI_PREFIX}${Date.now().toString(36)}`
  const test = {
    id, title, description, contentType, period, months, language, plan,
    target,
    questions: [],
    facts: {},          // section id → { list: researched facts, used: how many went into questions }
    status: 'paused',
    error: null,
    createdAt: new Date().toISOString(),
  }
  saveAiTest(test)
  writeIndex([id, ...readIndex()])
  return test
}

// A test built from the student's own JSON (Add Test page) — complete at once, nothing to generate
export function createJsonTest({ title, duration, marking, sections, questions }) {
  const id = `${AI_PREFIX}u${Date.now().toString(36)}`
  const test = {
    id, title, description: '', contentType: 'json', source: 'json', period: '', months: [],
    language: questions.some(q => /[ऀ-ॿ]/.test(q.question)) ? 'hi' : 'en',
    plan: { examName: title, summary: '', difficulty: 'moderate', duration, marking, sections, tips: [] },
    target: questions.length,
    questions,
    facts: {},
    status: 'done',
    error: null,
    createdAt: new Date().toISOString(),
  }
  saveAiTest(test)
  writeIndex([id, ...readIndex()])
  return test
}

export function deleteAiTest(id) {
  stopGeneration(id)
  cache.delete(id)
  try { localStorage.removeItem(TEST_KEY(id)) } catch { /* ignore */ }
  writeIndex(readIndex().filter(x => x !== id))
  emit()
}

export const isGenerating = (id) => running.has(id)

// What Vedha Tutor is doing right now, for the loaders (in memory only)
const phases = new Map()   // id → { step: 'research' | 'writing', text }
const setPhase = (id, phase) => { phases.set(id, phase); emit() }
export const getPhase = (id) => phases.get(id) || null

// What the Quiz page needs from an AI test (same shape as master.json test + questions file)
export function aiTestInfo(t) {
  if (!t) return null
  return {
    course: { id: '', title: 'AI Practice' },
    test: {
      id: t.id,
      title: t.plan.examName || t.title,
      description: t.plan.summary,
      duration: t.plan.duration,
      totalQuestions: t.questions.length,
      isFree: true,
    },
  }
}

export const aiMarkingScheme = (t) => ({
  default: { correct: t.plan.marking.correct, wrong: -Math.abs(t.plan.marking.wrong), skipped: 0 },
})

export const aiSections = (t) => t.plan.sections.map(s => ({ id: s.id, title: s.title, color: s.color }))

// ── React hooks ──
function useStore(read) {
  const [value, setValue] = useState(read)
  useEffect(() => {
    const update = () => setValue(read())
    listeners.add(update)
    update()
    return () => listeners.delete(update)
  }, [read])
  return value
}

export function useAiTest(id) {
  const [state, setState] = useState(() => (id ? { test: getAiTest(id), generating: isGenerating(id), phase: getPhase(id) } : null))
  useEffect(() => {
    if (!id) { setState(null); return }
    const update = () => setState({ test: getAiTest(id), generating: isGenerating(id), phase: getPhase(id) })
    listeners.add(update)
    update()
    return () => listeners.delete(update)
  }, [id])
  return state || { test: null, generating: false, phase: null }
}

const readAll = () => getAiTests()
export const useAiTests = () => useStore(readAll)

// ── API ──
async function callGs(body, retries = 2) {
  const r = await fetch('/api/gs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    // Per-minute rate limit (free tier): wait the few seconds Groq asks for and try again
    if (r.status === 429 && !data.daily && retries > 0 && (data.retryAfter || 0) <= 60) {
      await sleep(((data.retryAfter || 15) + 1) * 1000)
      return callGs(body, retries - 1)
    }
    throw Object.assign(new Error(data.error || `AI request failed (HTTP ${r.status})`), {
      status: r.status, daily: !!data.daily, retryAfter: data.retryAfter || null,
    })
  }
  return data
}

// ── Daily limit per browser, so one student can't use up the shared AI quota ──
export const DAILY_TEST_LIMIT = 3
const DAILY_KEY = 'testprep_ai_daily'
const today = () => new Date().toISOString().slice(0, 10)

function readDaily() {
  try {
    const d = JSON.parse(localStorage.getItem(DAILY_KEY))
    return d?.date === today() ? d : { date: today(), count: 0 }
  } catch { return { date: today(), count: 0 } }
}
export const aiTestsLeftToday = () => Math.max(0, DAILY_TEST_LIMIT - readDaily().count)
export function spendAiTestCredit() {
  const d = readDaily()
  try { localStorage.setItem(DAILY_KEY, JSON.stringify({ ...d, count: d.count + 1 })) } catch { /* ignore */ }
}
// A request Vedha Tutor turned down (off-topic) or that failed before planning shouldn't cost a credit
export function refundAiTestCredit() {
  const d = readDaily()
  try { localStorage.setItem(DAILY_KEY, JSON.stringify({ ...d, count: Math.max(0, d.count - 1) })) } catch { /* ignore */ }
}

export const analyzeExam = (input) => callGs({ action: 'analyze', ...input })
export const analyzePyq  = (input) => callGs({ action: 'pyq', ...input }).then(r => r.pyq || null)

// Largest-remainder split of `total` by weights
function split(total, weights) {
  const sum   = weights.reduce((a, b) => a + b, 0) || 1
  const exact = weights.map(w => (w / sum) * total)
  const out   = exact.map(Math.floor)
  let left    = total - out.reduce((a, b) => a + b, 0)
  exact.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => { if (left > 0 && weights[i] > 0) { out[i]++; left-- } })
  return out
}

// Next batch: up to 25 questions, spread over sections in proportion to what each still needs,
// so even the first 25 is a complete mini-test
function nextBatch(t) {
  const secs    = t.plan.sections
  const targets = split(t.target, secs.map(s => s.weight))
  const have    = {}
  t.questions.forEach(q => { have[q.section] = (have[q.section] || 0) + 1 })
  const need    = secs.map((s, i) => Math.max(0, targets[i] - (have[s.id] || 0)))
  const size    = Math.min(BATCH, need.reduce((a, b) => a + b, 0))
  const counts  = split(size, need)
  return secs.map((s, i) => ({ ...s, count: counts[i] })).filter(s => s.count > 0)
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Web searches work best in English, even when the section is shown in Hindi
const englishTitle = (s) => [...CURRENT_FIELDS, ...STATIC_FIELDS].find(f => f.id === s.id)?.title || s.title

export function stopGeneration(id) {
  const ctl = running.get(id)
  if (ctl) ctl.stop = true
}

export async function runGeneration(id) {
  if (running.has(id) || !getAiTest(id)) return
  const ctl = { stop: false }
  running.set(id, ctl)
  updateAiTest(id, { status: 'generating', error: null })

  let failures = 0
  let waits    = 0
  let calls    = 0
  const maxCalls = Math.ceil(getAiTest(id).target / BATCH) * 2 + 2   // safety stop if batches keep coming back short
  try {
    while (!ctl.stop && calls < maxCalls) {
      const t     = getAiTest(id)
      const batch = t && nextBatch(t)
      if (!batch?.length) break
      try {
        const base  = { examName: t.plan.examName, difficulty: t.plan.difficulty, period: t.period || '', months: t.months || [], language: t.language || 'en' }
        const avoid = t.questions.map(q => q.topic || q.question.slice(0, 90))

        // Current-affairs sections need verified facts from a web search. Searches are the slow,
        // token-heavy part, so each section's facts are kept on the test and used up across batches.
        const facts = []
        const used  = {}
        for (const s of batch.filter(s => s.kind === 'current' && t.period)) {
          const need = s.count + 1   // one spare fact so the AI has a choice
          let pool = getAiTest(id).facts?.[s.id] || { list: [], used: 0 }
          if (pool.list.length - pool.used < need) {
            setPhase(id, { step: 'research', text: `Searching the news for ${s.title}…` })
            const res = await callGs({
              action: 'research', ...base, section: { id: s.id, title: englishTitle(s) }, count: FACTS_PER_SEARCH,
              avoid: pool.list.map(f => f.fact.slice(0, 90)),
            })
            if (ctl.stop) { updateAiTest(id, { status: 'paused' }); return }
            pool = { ...pool, list: [...pool.list, ...(res.facts || [])] }
            const cur = getAiTest(id)
            updateAiTest(id, { facts: { ...cur.facts, [s.id]: pool } })
          }
          facts.push(...pool.list.slice(pool.used, pool.used + need))
          used[s.id] = Math.min(pool.list.length, pool.used + need)
        }

        calls++
        const size = batch.reduce((a, s) => a + s.count, 0)
        setPhase(id, { step: 'writing', text: `Writing questions ${t.questions.length + 1}–${t.questions.length + size}…` })
        const { questions = [] } = await callGs({ action: 'questions', ...base, sections: batch, facts, avoid, pyq: t.plan.pyq })
        if (ctl.stop) break
        if (!questions.length) throw new Error('The AI returned no usable questions')

        const latest = getAiTest(id)
        if (!latest) break
        let nextId = latest.questions.reduce((m, q) => Math.max(m, q.id), 0) + 1
        const pools = { ...latest.facts }
        Object.entries(used).forEach(([sid, u]) => { pools[sid] = { ...pools[sid], used: u } })
        updateAiTest(id, { facts: pools, questions: [...latest.questions, ...questions.map(q => ({ ...q, id: nextId++ }))] })
        failures = 0
        waits    = 0
      } catch (e) {
        if (e.daily || e.status === 400) {
          updateAiTest(id, { status: 'error', error: e.message })
          return
        }
        // Per-minute rate limit: wait it out without counting it as a failure
        if (e.status === 429 && waits++ < 6) {
          setPhase(id, { step: 'waiting', text: 'Vedha Tutor is busy — continuing in a moment…' })
          await sleep(Math.min(60, e.retryAfter || 20) * 1000)
          continue
        }
        if (++failures >= 3) {
          updateAiTest(id, { status: 'error', error: e.message })
          return
        }
        await sleep(3000)
      }
    }
    const t = getAiTest(id)
    if (t) updateAiTest(id, { status: ctl.stop ? 'paused' : 'done' })
  } finally {
    running.delete(id)
    phases.delete(id)
    emit()
  }
}
