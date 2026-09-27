// Marking scheme resolution — shared by the app and the node scripts (no JSX / browser APIs).
//
// Priority (highest first):
//   question.marks / negativeMarks / partialMarks
//   → testSeries.markingScheme   (master.json)
//   → questions file markingScheme
//   → course.markingScheme       (master.json)
//   → DEFAULT_SCHEME
// Each level may be partial, e.g. { "default": { "wrong": -0.5 } }.

export const DEFAULT_SCHEME = {
  default:        { correct: 1, wrong: 0, skipped: 0 },
  multipleChoice: { partialCredit: 0 },
  essay:          { marks: 5, autoScore: false },
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function deepMerge(base, over) {
  if (!isObj(over)) return base
  const out = { ...base }
  for (const k of Object.keys(over)) {
    out[k] = isObj(base?.[k]) && isObj(over[k]) ? deepMerge(base[k], over[k]) : over[k]
  }
  return out
}

// Layers from LOWEST to HIGHEST priority: resolveScheme(course, file, test)
export const resolveScheme = (...layers) => layers.reduce((acc, l) => deepMerge(acc, l), DEFAULT_SCHEME)

// Effective marks for one question: { correct, negative, partial }
export function questionMarks(q, scheme) {
  const type = q.type || 'single_choice'
  const d  = scheme.default || {}
  const mc = scheme.multipleChoice || {}

  if (type === 'essay') {
    return { correct: q.marks ?? scheme.essay?.marks ?? 0, negative: 0, partial: 0 }
  }
  if (type === 'multiple_choice') {
    return {
      correct:  q.marks ?? mc.allCorrect ?? d.correct ?? 1,
      negative: Math.abs(q.negativeMarks ?? mc.anyWrong ?? d.wrong ?? 0),
      partial:  q.partialMarks ?? mc.partialCredit ?? 0,
    }
  }
  return {
    correct:  q.marks ?? d.correct ?? 1,
    negative: Math.abs(q.negativeMarks ?? d.wrong ?? 0),
    partial:  0,
  }
}

const num = (n) => String(Math.round(n * 100) / 100)

// "+3 / -1"
export function formatScheme(scheme) {
  const d = scheme?.default || {}
  const wrong = Math.abs(d.wrong ?? 0)
  return `+${num(d.correct ?? 1)} / ${wrong ? '-' + num(wrong) : '0'}`
}

export const totalMarks = (questions, scheme) =>
  Math.round(questions.reduce((s, q) => s + questionMarks(q, scheme).correct, 0) * 100) / 100

// "+3 / -1" for the course, or "Varies" when its tests use different schemes
export function courseMarkingLabel(course) {
  const labels = new Set(
    (course.testSeries?.length ? course.testSeries : [{}])
      .map(t => formatScheme(resolveScheme(course.markingScheme, t.markingScheme)))
  )
  return labels.size === 1 ? [...labels][0] : 'Varies'
}
