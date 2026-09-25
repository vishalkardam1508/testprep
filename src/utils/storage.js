const KEY          = 'testprep_data'
const PROGRESS_KEY = (testId) => `testprep_progress_${testId}`

function getData() {
  try {
    const d = localStorage.getItem(KEY)
    return d ? JSON.parse(d) : { student: null, results: [] }
  } catch { return { student: null, results: [] } }
}

function setData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function getStudent()  { return getData().student }
export function getResults()  { return getData().results || [] }

export function saveStudent(student) {
  const d = getData()
  d.student = student
  setData(d)
}

// Returns false if the result could not be stored at all
export function saveResult(result) {
  const d = getData()
  d.results = [result, ...(d.results || [])]
  // If storage is full, drop the oldest results until the new one fits
  while (!setData(d)) {
    if (d.results.length <= 1) return false
    d.results.pop()
  }
  return true
}

export function getResultById(id) {
  return getResults().find(r => r.id === id) || null
}

export function updateResult(id, patch) {
  const d = getData()
  const idx = (d.results || []).findIndex(r => r.id === id)
  if (idx === -1) return null
  d.results[idx] = { ...d.results[idx], ...patch }
  setData(d)
  return d.results[idx]
}

export function clearAll() {
  localStorage.removeItem(KEY)
}

// ── Preferred question language ('en' | 'hi') ──
const LANG_KEY = 'testprep_lang'
export function getLang()      { try { return localStorage.getItem(LANG_KEY) } catch { return null } }
export function saveLang(lang) { try { localStorage.setItem(LANG_KEY, lang) } catch { /* ignore */ } }

// ── In-progress test (survives refresh / back navigation) ──
export function getProgress(testId) {
  try {
    const d = localStorage.getItem(PROGRESS_KEY(testId))
    return d ? JSON.parse(d) : null
  } catch { return null }
}

export function saveProgress(testId, progress) {
  try { localStorage.setItem(PROGRESS_KEY(testId), JSON.stringify(progress)) } catch { /* ignore */ }
}

export function clearProgress(testId) {
  localStorage.removeItem(PROGRESS_KEY(testId))
}
