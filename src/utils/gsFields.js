// Fields a student can pick on the AI Practice form. `kind` decides how questions are made:
// current → web research for the chosen period first, static → model knowledge.
export const CURRENT_FIELDS = [
  { id: 'ca-national',      title: 'National Affairs', hi: 'राष्ट्रीय घटनाक्रम' },
  { id: 'ca-international', title: 'International / Global', hi: 'अंतरराष्ट्रीय घटनाक्रम' },
  { id: 'ca-economy',       title: 'Economy & Banking', hi: 'अर्थव्यवस्था और बैंकिंग' },
  { id: 'ca-polity',        title: 'Polity & Governance', hi: 'राजव्यवस्था और शासन' },
  { id: 'ca-schemes',       title: 'Govt Schemes', hi: 'सरकारी योजनाएँ' },
  { id: 'ca-science',       title: 'Science & Tech', hi: 'विज्ञान और प्रौद्योगिकी' },
  { id: 'ca-environment',   title: 'Environment', hi: 'पर्यावरण' },
  { id: 'ca-defence',       title: 'Defence', hi: 'रक्षा' },
  { id: 'ca-sports',        title: 'Sports', hi: 'खेल' },
  { id: 'ca-awards',        title: 'Awards & Honours', hi: 'पुरस्कार और सम्मान' },
  { id: 'ca-appointments',  title: 'Appointments', hi: 'नियुक्तियाँ' },
  { id: 'ca-reports',       title: 'Reports & Indices', hi: 'रिपोर्ट और सूचकांक' },
  { id: 'ca-days',          title: 'Important Days & Books', hi: 'महत्वपूर्ण दिवस और पुस्तकें' },
].map(f => ({ ...f, kind: 'current' }))

export const STATIC_FIELDS = [
  { id: 'gs-history',     title: 'History', hi: 'इतिहास' },
  { id: 'gs-geography',   title: 'Geography', hi: 'भूगोल' },
  { id: 'gs-polity',      title: 'Indian Polity', hi: 'भारतीय राजव्यवस्था' },
  { id: 'gs-economy',     title: 'Indian Economy', hi: 'भारतीय अर्थव्यवस्था' },
  { id: 'gs-science',     title: 'General Science', hi: 'सामान्य विज्ञान' },
  { id: 'gs-environment', title: 'Environment & Ecology', hi: 'पर्यावरण और पारिस्थितिकी' },
  { id: 'gs-culture',     title: 'Art & Culture', hi: 'कला और संस्कृति' },
  { id: 'gs-computer',    title: 'Computer Awareness', hi: 'कंप्यूटर ज्ञान' },
  { id: 'gs-static',      title: 'Static GK', hi: 'स्थैतिक सामान्य ज्ञान' },
].map(f => ({ ...f, kind: 'static' }))

// Each current-affairs field needs its own web search (the expensive part), so a test can have at most 2
export const MAX_CA_FIELDS = 2

export const QUESTION_COUNTS = [25, 50, 100]

export const CONTENT_TYPES = [
  { id: 'current', label: 'Current Affairs', fields: CURRENT_FIELDS },
  { id: 'static',  label: 'General Studies', fields: STATIC_FIELDS },
  { id: 'both',    label: 'Both',            fields: [...CURRENT_FIELDS, ...STATIC_FIELDS] },
]

// Language the questions are written in
export const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
]

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

// The months a period covers as "YYYY-MM" (no months = the whole year up to this month).
// The server uses this to drop researched facts that fall outside the period.
export function periodMonths(year, months = []) {
  const now  = new Date()
  const last = year === now.getFullYear() ? now.getMonth() : 11
  const list = months.length ? months : Array.from({ length: last + 1 }, (_, i) => i)
  return [...list].sort((a, b) => a - b).map(m => `${year}-${String(m + 1).padStart(2, '0')}`)
}

// "March–May 2026", "January, April 2026" or "2026 (full year)"
export function formatPeriod(year, months = []) {
  if (!months.length) return `${year} (full year)`
  const m = [...months].sort((a, b) => a - b)
  const contiguous = m.every((v, i) => i === 0 || v === m[i - 1] + 1)
  if (m.length > 2 && contiguous) return `${MONTHS[m[0]]}–${MONTHS[m[m.length - 1]]} ${year}`
  return `${m.map(i => MONTHS[i]).join(', ')} ${year}`
}
