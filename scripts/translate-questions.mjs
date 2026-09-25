#!/usr/bin/env node
// Adds Hindi + English versions to every question using Groq.
//
//   npm run translate                         → all files in public/data/questions
//   npm run translate -- nda-test-1.json      → only this file
//   npm run translate -- --force              → re-translate questions that already have both languages
//
// Result per question:
//   "i18n": { "hi": { question, options, explanation }, "en": { ... } }
// The original fields (question/options/explanation) are left untouched.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const QUESTIONS_DIR = path.join(ROOT, 'public', 'data', 'questions')
try { process.loadEnvFile(path.join(ROOT, '.env')) } catch { /* rely on real env vars */ }

const API_KEY = process.env.GROQ_API_KEY
const MODEL   = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
const BATCH   = 10
const LANG_NAME = { hi: 'Hindi', en: 'English' }

if (!API_KEY) {
  console.error('GROQ_API_KEY is missing. Add it to .env')
  process.exit(1)
}

const args  = process.argv.slice(2)
const force = args.includes('--force')
const files = args.filter(a => !a.startsWith('--'))

const detectLang = (text = '') => /[ऀ-ॿ]/.test(text) ? 'hi' : 'en'

const pickText = (q) => ({
  question: q.question,
  ...(Array.isArray(q.options) ? { options: q.options } : {}),
  ...(q.explanation ? { explanation: q.explanation } : {}),
})

const SYSTEM_PROMPT = (from, to) => `You translate Indian competitive exam questions (TET, Super TET, UPTET, NDA) from ${LANG_NAME[from]} to ${LANG_NAME[to]}.

Rules:
- Translate faithfully. Do not add, remove, explain, or "fix" anything. Do not reveal or hint at the answer.
- Keep numbers, formulas, symbols (√, ², °, ×, =), units, and variable names exactly as they are.
- Use the standard terminology used in official ${LANG_NAME[to]} exam papers and NCERT books
  (e.g. Cognitive development ↔ संज्ञानात्मक विकास, Zone of Proximal Development ↔ समीपस्थ विकास क्षेत्र).
- Transliterate people's names (Piaget ↔ पियाजे, Vygotsky ↔ वाइगोत्स्की, Kohlberg ↔ कोहलबर्ग).
- Keep the same number of options in the same order.
- Only translate the fields you are given.

Reply ONLY with JSON: {"items":[{"id": <same id>, "question": "...", "options": ["..."], "explanation": "..."}]}`

async function translateBatch(batch, from, to) {
  const payload = batch.map(q => ({ id: q.id, ...pickText(q) }))

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(from, to) },
        { role: 'user',   content: JSON.stringify({ items: payload }) },
      ],
    }),
  })
  if (!r.ok) throw new Error(`Groq API error ${r.status}: ${(await r.text()).slice(0, 300)}`)

  const data  = await r.json()
  const items = JSON.parse(data.choices?.[0]?.message?.content || '{}').items || []
  const byId  = new Map(items.map(i => [String(i.id), i]))

  // Validate: every question back, same option count, no empty strings
  return batch.map(q => {
    const t = byId.get(String(q.id))
    if (!t || typeof t.question !== 'string' || !t.question.trim()) {
      throw new Error(`Missing translation for question ${q.id}`)
    }
    if (Array.isArray(q.options)) {
      if (!Array.isArray(t.options) || t.options.length !== q.options.length || t.options.some(o => !String(o).trim())) {
        throw new Error(`Option count mismatch for question ${q.id}`)
      }
    }
    return [q.id, {
      question: t.question.trim(),
      ...(Array.isArray(q.options) ? { options: t.options.map(o => String(o).trim()) } : {}),
      ...(q.explanation ? { explanation: String(t.explanation || '').trim() } : {}),
    }]
  })
}

async function withRetry(fn, tries = 3) {
  for (let i = 1; ; i++) {
    try { return await fn() } catch (e) {
      if (i >= tries) throw e
      console.warn(`   retry ${i}/${tries - 1}: ${e.message}`)
      await new Promise(r => setTimeout(r, 1500 * i))
    }
  }
}

async function processFile(file) {
  const full = path.isAbsolute(file) ? file : path.join(QUESTIONS_DIR, path.basename(file))
  const data = JSON.parse(fs.readFileSync(full, 'utf8'))
  const questions = data.questions || []

  // Group questions needing work by translation direction
  const todo = { 'hi>en': [], 'en>hi': [] }
  for (const q of questions) {
    const from = detectLang(q.question)
    const to   = from === 'hi' ? 'en' : 'hi'
    if (!force && q.i18n?.[from] && q.i18n?.[to]) continue
    todo[`${from}>${to}`].push(q)
  }

  const total = todo['hi>en'].length + todo['en>hi'].length
  console.log(`\n📄 ${path.basename(full)} — ${questions.length} questions, ${total} to translate`)
  if (total === 0) return

  for (const [dir, list] of Object.entries(todo)) {
    const [from, to] = dir.split('>')
    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH)
      console.log(`   ${LANG_NAME[from]} → ${LANG_NAME[to]}: questions ${batch.map(q => q.id).join(', ')}`)
      const results = await withRetry(() => translateBatch(batch, from, to))
      for (const [id, translated] of results) {
        const q = questions.find(x => x.id === id)
        q.i18n = { ...(q.i18n || {}), [from]: pickText(q), [to]: translated }
      }
      // Save after every batch so a failure doesn't lose finished work
      fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n', 'utf8')
    }
  }
  console.log(`   ✓ saved`)
}

const targets = files.length
  ? files
  : fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'))

let failed = 0
for (const f of targets) {
  try { await processFile(f) } catch (e) {
    failed++
    console.error(`   ✗ ${f}: ${e.message}`)
  }
}
console.log(failed ? `\nDone with ${failed} failed file(s).` : '\nAll done.')
process.exit(failed ? 1 : 0)
