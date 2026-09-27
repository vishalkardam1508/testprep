import { useState } from 'react'

const Check = () => (
  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

// Key points shown in the course header (course.about)
export function CourseHighlights({ points }) {
  if (!points?.length) return null
  return (
    <ul className="mt-5 space-y-2 max-w-2xl">
      {points.map((p, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-gray-300 leading-relaxed">
          <Check />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  )
}

function ExamPattern({ rows }) {
  if (!rows?.length) return null
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4">Exam Pattern</h2>
      <div className="card overflow-hidden">
        <dl className="divide-y divide-gray-800">
          {rows.map(r => (
            <div key={r.label} className="grid grid-cols-5 gap-4 px-5 py-3 text-sm">
              <dt className="col-span-2 sm:col-span-1 text-gray-500 font-medium">{r.label}</dt>
              <dd className="col-span-3 sm:col-span-4 text-white">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function SyllabusSection({ section, open, onToggle }) {
  return (
    <div className={`card overflow-hidden transition-colors ${open ? 'border-gray-700' : ''}`}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-800/40 transition-colors"
      >
        <span className="text-white font-semibold flex-1">{section.title}</span>
        {section.badge && (
          <span className="text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full flex-shrink-0">
            {section.badge}
          </span>
        )}
        <span className="text-xs text-gray-500 flex-shrink-0 hidden sm:inline">{section.points.length} topics</span>
        <svg className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ol className="px-5 pb-5 pt-1 grid gap-2 md:grid-cols-2">
          {section.points.map((p, i) => {
            // "Unit name — details": show the unit name in bold
            const [head, ...rest] = p.split(' — ')
            return (
              <li key={i} className="flex gap-3 text-sm leading-relaxed bg-gray-800/40 rounded-lg px-3 py-2">
                <span className="text-gray-600 font-mono text-xs mt-0.5 w-5 flex-shrink-0 text-right">{i + 1}.</span>
                <span className="text-gray-300">
                  <span className="text-white font-medium">{head}</span>
                  {rest.length > 0 && <span className="text-gray-400"> — {rest.join(' — ')}</span>}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function Syllabus({ sections, note }) {
  const [openSet, setOpenSet] = useState(() => new Set([0]))
  if (!sections?.length) return null

  const allOpen = openSet.size === sections.length
  const toggle = (i) => setOpenSet(s => {
    const n = new Set(s)
    n.has(i) ? n.delete(i) : n.add(i)
    return n
  })

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold text-white">Syllabus</h2>
        <button
          onClick={() => setOpenSet(allOpen ? new Set() : new Set(sections.map((_, i) => i)))}
          className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      {note && <p className="text-xs text-gray-500 mb-4 leading-relaxed">ℹ️ {note}</p>}
      <div className="space-y-3">
        {sections.map((s, i) => (
          <SyllabusSection key={s.title} section={s} open={openSet.has(i)} onToggle={() => toggle(i)} />
        ))}
      </div>
    </section>
  )
}

// Exam pattern + syllabus block for the course page
export default function CourseDetails({ course }) {
  if (!course.examPattern?.length && !course.syllabus?.length) return null
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">
      <ExamPattern rows={course.examPattern} />
      <Syllabus sections={course.syllabus} note={course.syllabusNote} />
    </div>
  )
}
