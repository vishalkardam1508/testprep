// "Add Test" page: a ChatGPT-ready prompt + sample format, and a forgiving checker that turns
// pasted / uploaded JSON into a test. No AI is called here — the student brings the questions.

export const MAX_QUESTIONS = 300
const MAX_TEXT = 2_000_000   // characters
const ALPHA = ['A', 'B', 'C', 'D', 'E', 'F']
const COLORS = ['violet', 'cyan', 'emerald', 'orange', 'pink', 'blue', 'yellow', 'red']

// ── Sample format ────────────────────────────────────────────

// One example of every question type the site supports. Line breaks (statements, lists) are kept.
const lines = (...l) => l.join('\n')

export const SAMPLES = {
  en: {
    title: 'UP Super TET 2026 — General Knowledge Practice',
    duration: 30,
    marking: { correct: 3, wrong: 1 },
    sections: [
      { id: 'polity', title: 'Indian Polity' },
      { id: 'history', title: 'History' },
      { id: 'culture', title: 'Art & Culture' },
    ],
    questions: [
      {
        section: 'polity',
        question: 'Which article of the Indian Constitution guarantees the Right to Equality before law?',
        options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
        answer: 0,
        explanation: 'Article 14 guarantees equality before law and equal protection of the laws.',
      },
      {
        section: 'polity',
        question: lines(
          'Consider the following statements:',
          '1. The Rajya Sabha is a permanent House and is not dissolved.',
          '2. One-third of the members of the Rajya Sabha retire every second year.',
          'Which of the statements given above is/are correct?',
        ),
        options: ['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'],
        answer: 2,
        explanation: 'The Rajya Sabha is a permanent House; members serve six years and one-third retire every two years.',
      },
      {
        section: 'culture',
        question: lines(
          'Match List I (Dance) with List II (State):',
          'a. Kathakali   b. Bharatanatyam   c. Kuchipudi   d. Sattriya',
          '1. Assam   2. Andhra Pradesh   3. Tamil Nadu   4. Kerala',
        ),
        options: ['a-3, b-4, c-1, d-2', 'a-4, b-2, c-3, d-1', 'a-1, b-3, c-2, d-4', 'a-4, b-3, c-2, d-1'],
        answer: 3,
        explanation: 'Kathakali – Kerala, Bharatanatyam – Tamil Nadu, Kuchipudi – Andhra Pradesh, Sattriya – Assam.',
      },
      {
        section: 'history',
        question: lines(
          'Assertion (A): Mahatma Gandhi called off the Non-Cooperation Movement in 1922.',
          'Reason (R): The Simon Commission arrived in India in 1928.',
        ),
        options: [
          'Both A and R are true, and R is the correct explanation of A',
          'Both A and R are true, but R is not the correct explanation of A',
          'A is true, but R is false',
          'A is false, but R is true',
        ],
        answer: 1,
        explanation: 'Both are true, but the movement was called off because of the Chauri Chaura incident (1922), not the Simon Commission.',
      },
      {
        section: 'history',
        question: lines(
          'Arrange the following events in chronological order (earliest first):',
          '1. Quit India Movement',
          '2. Salt Satyagraha',
          '3. Non-Cooperation Movement',
          '4. Formation of the Indian National Congress',
        ),
        options: ['3, 4, 2, 1', '4, 2, 3, 1', '4, 3, 2, 1', '2, 4, 3, 1'],
        answer: 2,
        explanation: 'INC 1885 → Non-Cooperation 1920 → Salt Satyagraha 1930 → Quit India 1942.',
      },
      {
        type: 'multiple_choice',
        section: 'polity',
        question: 'Which of the following are Fundamental Rights under the Indian Constitution? (Select all that apply)',
        options: ['Right to Equality', 'Right to Property', 'Right against Exploitation', 'Right to Work'],
        answers: [0, 2],
        explanation: 'Right to Property stopped being a Fundamental Right in 1978 (44th Amendment); Right to Work is a Directive Principle.',
      },
    ],
  },
  hi: {
    title: 'यूपी सुपर टीईटी 2026 — सामान्य ज्ञान अभ्यास',
    duration: 30,
    marking: { correct: 3, wrong: 1 },
    sections: [
      { id: 'polity', title: 'भारतीय राजव्यवस्था' },
      { id: 'history', title: 'इतिहास' },
      { id: 'culture', title: 'कला एवं संस्कृति' },
    ],
    questions: [
      {
        section: 'polity',
        question: 'भारतीय संविधान का कौन सा अनुच्छेद विधि के समक्ष समानता का अधिकार देता है?',
        options: ['अनुच्छेद 14', 'अनुच्छेद 19', 'अनुच्छेद 21', 'अनुच्छेद 32'],
        answer: 0,
        explanation: 'अनुच्छेद 14 विधि के समक्ष समानता और विधियों के समान संरक्षण की गारंटी देता है।',
      },
      {
        section: 'polity',
        question: lines(
          'निम्नलिखित कथनों पर विचार कीजिए:',
          '1. राज्यसभा एक स्थायी सदन है और इसका विघटन नहीं होता।',
          '2. राज्यसभा के एक-तिहाई सदस्य प्रत्येक दूसरे वर्ष सेवानिवृत्त होते हैं।',
          'उपर्युक्त में से कौन सा/से कथन सही है/हैं?',
        ),
        options: ['केवल 1', 'केवल 2', '1 और 2 दोनों', 'न तो 1 और न ही 2'],
        answer: 2,
        explanation: 'राज्यसभा स्थायी सदन है; सदस्यों का कार्यकाल छह वर्ष है और हर दो वर्ष में एक-तिहाई सदस्य सेवानिवृत्त होते हैं।',
      },
      {
        section: 'culture',
        question: lines(
          'सूची-I (नृत्य) को सूची-II (राज्य) से सुमेलित कीजिए:',
          'a. कथकली   b. भरतनाट्यम   c. कुचिपुड़ी   d. सत्रिया',
          '1. असम   2. आंध्र प्रदेश   3. तमिलनाडु   4. केरल',
        ),
        options: ['a-3, b-4, c-1, d-2', 'a-4, b-2, c-3, d-1', 'a-1, b-3, c-2, d-4', 'a-4, b-3, c-2, d-1'],
        answer: 3,
        explanation: 'कथकली – केरल, भरतनाट्यम – तमिलनाडु, कुचिपुड़ी – आंध्र प्रदेश, सत्रिया – असम।',
      },
      {
        section: 'history',
        question: lines(
          'अभिकथन (A): महात्मा गांधी ने 1922 में असहयोग आंदोलन वापस ले लिया।',
          'कारण (R): साइमन कमीशन 1928 में भारत आया।',
        ),
        options: [
          'A और R दोनों सही हैं तथा R, A की सही व्याख्या है',
          'A और R दोनों सही हैं, परंतु R, A की सही व्याख्या नहीं है',
          'A सही है, परंतु R गलत है',
          'A गलत है, परंतु R सही है',
        ],
        answer: 1,
        explanation: 'दोनों कथन सही हैं, परंतु आंदोलन चौरी-चौरा कांड (1922) के कारण वापस लिया गया था, साइमन कमीशन के कारण नहीं।',
      },
      {
        section: 'history',
        question: lines(
          'निम्नलिखित घटनाओं को कालक्रम में (सबसे पहले से) व्यवस्थित कीजिए:',
          '1. भारत छोड़ो आंदोलन',
          '2. नमक सत्याग्रह',
          '3. असहयोग आंदोलन',
          '4. भारतीय राष्ट्रीय कांग्रेस की स्थापना',
        ),
        options: ['3, 4, 2, 1', '4, 2, 3, 1', '4, 3, 2, 1', '2, 4, 3, 1'],
        answer: 2,
        explanation: 'कांग्रेस की स्थापना 1885 → असहयोग आंदोलन 1920 → नमक सत्याग्रह 1930 → भारत छोड़ो आंदोलन 1942।',
      },
      {
        type: 'multiple_choice',
        section: 'polity',
        question: 'निम्नलिखित में से कौन से भारतीय संविधान के अंतर्गत मौलिक अधिकार हैं? (सभी सही विकल्प चुनें)',
        options: ['समानता का अधिकार', 'संपत्ति का अधिकार', 'शोषण के विरुद्ध अधिकार', 'काम का अधिकार'],
        answers: [0, 2],
        explanation: 'संपत्ति का अधिकार 1978 (44वाँ संशोधन) में मौलिक अधिकार नहीं रहा; काम का अधिकार राज्य के नीति निदेशक तत्वों में है।',
      },
    ],
  },
}

export const sampleJson = (lang) => JSON.stringify(SAMPLES[lang] || SAMPLES.en, null, 2)

// ── ChatGPT prompt ───────────────────────────────────────────

const LANG_RULE = {
  en: 'Write everything in clear exam English.',
  hi: 'Write the questions, options, explanations, title and section titles in Hindi (Devanagari), using the standard terms of UP / state government exam papers (e.g. अभिकथन/कारण, मौलिक अधिकार, भारत छोड़ो आंदोलन). Keep numbers, years and abbreviations (RBI, GDP, ISRO) as they are.',
}

export function buildPrompt({ exam, topics, count, language, difficulty }) {
  const n = Math.max(1, Math.min(MAX_QUESTIONS, Number(count) || 25))
  return `You are an expert question setter for Indian competitive exams.

Make a practice test of exactly ${n} questions.
- Exam: ${exam || '(the exam I am preparing for)'}
- Topics: ${topics || 'the main General Studies topics of this exam'}
- Difficulty: ${difficulty || 'moderate'} — like the real exam and its previous-year papers
- ${LANG_RULE[language] || LANG_RULE.en}

QUESTION TYPES (one example of each is in the sample below — copy their exact style):
1. One-liner — a direct question.
2. Statements — "Consider the following statements… Which is/are correct?" with options 1 only / 2 only / Both / Neither.
3. Match the following — List I and List II, options like "a-4, b-3, c-2, d-1".
4. Assertion–Reason — Assertion (A) and Reason (R) with the 4 standard options, always in the same order.
5. Chronology — arrange events in order, options like "4, 3, 2, 1".
6. Multiple correct — "type": "multiple_choice" and "answers": [ ... ]. Use only if the exam has such questions.
Mix the types like the real exam; most questions should be types 1–5.

RULES
- Exactly ONE correct option (type 6: every listed answer must be correct and every other option wrong). If two options could be right, rewrite the question.
- 4 different options. No "All of the above" / "None of the above". No "A)" inside option text.
- "answer" counts from 0: A = 0, B = 1, C = 2, D = 3. Spread answers evenly over A–D.
- Only facts you are sure of. Give the month/year for current affairs. The explanation must agree with the answer.
- Put each statement / list item on its own line using \\n, as in the sample.
- Every "section" must match an "id" in "sections". Set "duration" and "marking" like the real exam.
- No repeated questions.

FORMAT — reply with ONLY valid JSON (no other text, no comments, no trailing commas), exactly like this sample (it has 6 questions; you write ${n}):

${sampleJson(language === 'hi' ? 'hi' : 'en')}

Before replying, re-check every question: one correct answer, right "answer" number, explanation agrees.
If ${n} questions don't fit in one reply, send parts of about 25 questions (each part complete JSON in the same format) and wait for me to say "continue".`
}

// ── Reading pasted text ──────────────────────────────────────

// Finds every top-level JSON object/array in the text — handles ```json fences, text around the
// JSON, and several parts pasted one after another
export function extractJsonBlocks(text) {
  const blocks = []
  let depth = 0, start = -1, inString = false, escaped = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (c === '\\') escaped = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"' && depth > 0) inString = true
    else if (c === '{' || c === '[') { if (depth++ === 0) start = i }
    else if ((c === '}' || c === ']') && depth > 0 && --depth === 0) blocks.push(text.slice(start, i + 1))
  }
  return blocks
}

const str = (v, max = 2000) => (typeof v === 'string' || typeof v === 'number') ? String(v).replace(/\s+/g, ' ').trim().slice(0, max) : ''
// Like str(), but keeps line breaks — statement and match-the-following questions need them
const NL = String.fromCharCode(10)
const strLines = (v, max = 2000) => typeof v !== 'string' ? str(v, max) : v
  .split(NL).map(l => l.replace(/\s+/g, ' ').trim())   // tidy each line, keep the line breaks
  .join(NL).replace(/\n{3,}/g, NL + NL).trim().slice(0, max)
const slug = (s) => str(s, 60).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'general'
const normText = (s) => str(s).toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim()

// "B" / "b" / "Option B" / 1 / "1" / the option's text → index
function answerIndex(raw, options) {
  if (Number.isInteger(raw)) return raw
  const s = str(raw)
  if (/^\d+$/.test(s)) return Number(s)
  const letter = s.match(/^(?:option\s*)?\(?([a-f])\)?[.)]?$/i)
  if (letter) return ALPHA.indexOf(letter[1].toUpperCase())
  const byText = options.findIndex(o => normText(o) === normText(s))
  return byText
}

function checkQuestion(q, n) {
  const where = `Question ${n}`
  if (!q || typeof q !== 'object' || Array.isArray(q)) return { error: `${where}: not a question object` }
  const question = strLines(q.question ?? q.q ?? q.text, 1500)
  if (!question) return { error: `${where}: "question" text is missing` }
  if (q.type === 'essay') return { error: `${where}: essay questions can't be added here (only questions with options)` }

  const options = (Array.isArray(q.options) ? q.options : []).map(o => str(o, 400))
  if (options.length < 2 || options.length > 6) return { error: `${where}: needs 2–6 options (found ${options.length})` }
  if (options.some(o => !o)) return { error: `${where}: an option is empty` }
  // Signs and symbols matter here: "+5 D" / "-5 D" and "ΔH < 0" / "ΔH > 0" are different options
  if (new Set(options.map(o => o.toLowerCase())).size !== options.length) return { error: `${where}: two options are the same` }

  const type = q.type === 'multiple_choice' || Array.isArray(q.answers) ? 'multiple_choice' : 'single_choice'
  const out = { type, section: q.section !== undefined ? slug(q.section) : null, question, options, explanation: str(q.explanation, 1500) }

  if (type === 'multiple_choice') {
    const answers = (Array.isArray(q.answers) ? q.answers : [q.answer]).map(a => answerIndex(a, options))
    if (!answers.length || answers.some(a => a < 0 || a >= options.length)) return { error: `${where}: "answers" must be option positions 0–${options.length - 1}` }
    out.answers = [...new Set(answers)]
  } else {
    const answer = answerIndex(q.answer ?? q.correct ?? q.correctAnswer, options)
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
      return { error: `${where}: "answer" must be 0–${options.length - 1} (or A–${ALPHA[options.length - 1]}); found ${JSON.stringify(q.answer ?? null)}` }
    }
    out.answer = answer
  }

  // Bilingual questions (same shape as the site's own test files) keep both languages for the EN / हिंदी toggle
  const i18n = {}
  for (const lang of ['en', 'hi']) {
    const t = q.i18n?.[lang]
    if (t && str(t.question) && Array.isArray(t.options) && t.options.length === options.length) {
      i18n[lang] = { question: strLines(t.question, 1500), options: t.options.map(o => str(o, 400)), explanation: str(t.explanation, 1500) }
    }
  }
  if (i18n.en && i18n.hi) out.i18n = i18n
  return { question: out }
}

// Turns pasted text into { test, skipped, error }. Valid questions are kept; bad ones are listed.
export function parseTestJson(text) {
  if (!text?.trim()) return { error: 'Paste the JSON first.' }
  if (text.length > MAX_TEXT) return { error: 'This is too large — keep it under 2 MB.' }

  const blocks = extractJsonBlocks(text)
  const cutOff = /[{[]/.test(text.slice(text.lastIndexOf(blocks[blocks.length - 1] || '') + (blocks[blocks.length - 1] || '').length))
  const CUT_MSG = 'The JSON looks cut off at the end — ChatGPT probably stopped mid-way. Type "continue" in ChatGPT and paste the rest, or ask it to send the questions in parts of 25.'
  if (!blocks.length) return { error: text.includes('{') ? CUT_MSG : 'No JSON found. It should start with { and end with }.' }

  const parts = []
  const skipped = []
  blocks.forEach((b, i) => {
    try { parts.push(JSON.parse(b)) }
    catch (e) { skipped.push(`Part ${i + 1}: not valid JSON (${e.message.replace(/^JSON\.parse: /, '')}) — often a missing comma or quote`) }
  })
  if (!parts.length) return { error: skipped[0] || 'The JSON could not be read.', skipped }
  if (cutOff) skipped.push('The last part looks cut off — its questions are missing. ' + CUT_MSG.split(' — ')[1])

  // The first part with test details provides title / duration / marking; questions from all parts are merged
  const head = parts.find(p => p && !Array.isArray(p) && (p.title || p.duration || p.marking || p.markingScheme)) || {}
  const rawQuestions = parts.flatMap(p => Array.isArray(p) ? p : Array.isArray(p?.questions) ? p.questions : [])
  if (!rawQuestions.length) return { error: 'No "questions" list found in the JSON.', skipped }

  const sections = new Map()
  parts.forEach(p => (Array.isArray(p?.sections) ? p.sections : []).forEach(s => {
    const id = slug(s?.id ?? s?.title)
    if (!sections.has(id)) sections.set(id, { id, title: str(s?.title, 80) || str(s?.id, 80) || id })
  }))

  const seen = new Set()
  const questions = []
  rawQuestions.forEach((raw, i) => {
    const { question, error } = checkQuestion(raw, i + 1)
    if (error) return skipped.push(error)
    const key = normText(question.question) + '|' + question.options.map(o => o.toLowerCase()).join('|')
    if (seen.has(key)) return skipped.push(`Question ${i + 1}: same as an earlier question — skipped`)
    if (questions.length >= MAX_QUESTIONS) return skipped.push(`Question ${i + 1}: over the ${MAX_QUESTIONS}-question limit`)
    seen.add(key)
    // Unknown or missing section → create it, so nothing is lost
    const sid = question.section || 'general'
    const pretty = (s) => s.replace(/[-_]+/g, ' ').replace(/(^|\s)\p{Ll}/gu, m => m.toUpperCase())   // "general-studies" -> "General Studies"
    if (!sections.has(sid)) sections.set(sid, { id: sid, title: sid === 'general' ? 'General' : pretty(str(raw.section, 80) || sid) })
    questions.push({ ...question, section: sid, id: questions.length + 1 })
  })
  if (!questions.length) return { error: 'None of the questions could be used — see the list below.', skipped }

  const used = new Set(questions.map(q => q.section))
  const secs = [...sections.values()].filter(s => used.has(s.id)).map((s, i) => ({ ...s, color: COLORS[i % COLORS.length] }))

  // Marking: simple { correct, wrong } or the site's markingScheme.default
  const m = head.marking || head.markingScheme?.default || {}
  const num = (v, d) => Number.isFinite(Number(v)) ? Math.abs(Number(v)) : d
  const marking = { correct: num(m.correct, 1) || 1, wrong: num(m.wrong, 0) }
  const duration = Math.round(Math.min(600, Math.max(1, num(head.duration, questions.length))))

  return {
    test: {
      title: str(head.title, 150) || 'My Test',
      duration,
      marking,
      sections: secs,
      questions,
    },
    skipped,
  }
}
