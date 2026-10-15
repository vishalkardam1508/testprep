import { sectionColor } from '../../utils/sections'

const ALPHA = ['A', 'B', 'C', 'D', 'E', 'F']

// ── Single Choice / MCQ ───────────────────────────────────
function SingleChoice({ question, answer, onChange }) {
  return (
    <div className="space-y-3">
      {question.options.map((opt, i) => {
        const selected = answer === i
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 group ${
              selected
                ? 'bg-violet-600/15 border-violet-500 text-white'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
            }`}
          >
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
              selected ? 'bg-violet-600 text-white' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'
            }`}>
              {ALPHA[i]}
            </span>
            <span className="text-sm leading-relaxed">{opt}</span>
            {selected && (
              <span className="ml-auto flex-shrink-0">
                <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Multiple Choice ───────────────────────────────────────
function MultipleChoice({ question, answer = [], onChange }) {
  const toggle = (i) => {
    const current = answer || []
    if (current.includes(i)) onChange(current.filter(x => x !== i))
    else onChange([...current, i])
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-lg inline-block mb-1">
        ✓ Select all correct answers
      </p>
      {question.options.map((opt, i) => {
        const selected = (answer || []).includes(i)
        return (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 group ${
              selected
                ? 'bg-cyan-600/15 border-cyan-500 text-white'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
            }`}
          >
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors border-2 ${
              selected ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-gray-600 bg-gray-700 text-gray-400 group-hover:border-gray-500'
            }`}>
              {selected ? '✓' : ALPHA[i]}
            </span>
            <span className="text-sm leading-relaxed">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Essay ─────────────────────────────────────────────────
function Essay({ question, answer = '', onChange, marks }) {
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const limit = question.wordLimit || 300
  const overLimit = words > limit

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-orange-400 bg-orange-400/10 px-3 py-1.5 rounded-lg">
          📝 Essay Question — {marks} marks
        </span>
        <span className="text-gray-500">Word limit: {limit}</span>
      </div>
      <textarea
        value={answer}
        onChange={e => onChange(e.target.value)}
        placeholder="Type your answer here..."
        rows={8}
        className={`w-full bg-gray-800 border rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none transition-colors leading-relaxed ${
          overLimit ? 'border-red-500 focus:border-red-400' : 'border-gray-700 focus:border-violet-500'
        }`}
      />
      <div className={`text-xs flex justify-end ${overLimit ? 'text-red-400' : 'text-gray-500'}`}>
        {words} / {limit} words {overLimit && '— over limit!'}
      </div>
    </div>
  )
}

// ── Main QuestionCard ─────────────────────────────────────
// marks: { correct, negative, partial } from utils/marking.questionMarks
export default function QuestionCard({ question, answer, onChange, index, total, section, marks }) {
  const m = marks || { correct: question.marks || 0, negative: question.negativeMarks || 0, partial: 0 }
  const sc = section ? sectionColor(section.color) : null
  const type = question.type || 'single_choice'

  const typeLabel = {
    single_choice:   { label: 'Single Choice', color: 'text-violet-400 bg-violet-400/10' },
    mcq:             { label: 'MCQ',           color: 'text-violet-400 bg-violet-400/10' },
    multiple_choice: { label: 'Multi Choice',  color: 'text-cyan-400   bg-cyan-400/10'   },
    essay:           { label: 'Essay',         color: 'text-orange-400 bg-orange-400/10' },
  }[type] || { label: type, color: 'text-gray-400 bg-gray-800' }

  return (
    <div className="card p-4 sm:p-6 md:p-8">
      {/* Section label */}
      {section && (
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold mb-4 ${sc.text}`}>
          <span className="inline-flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
            Section {section.number} of {section.count}: {section.title}
          </span>
          <span className="text-gray-500 font-normal">Question {section.position} of {section.items.length}</span>
        </div>
      )}

      {/* Question header */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
        <span className="text-xs font-bold text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg">
          Q {index + 1} / {total}
        </span>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${typeLabel.color}`}>
          {typeLabel.label}
        </span>
        <span className="text-xs text-gray-500 ml-auto">
          <span className="text-emerald-400">+{m.correct}</span>
          {' / '}
          <span className={m.negative ? 'text-red-400' : ''}>-{m.negative}</span>
          {m.partial > 0 && <span className="text-yellow-400"> · partial +{m.partial}</span>}
        </span>
      </div>

      {/* Question text */}
      <p className="text-white text-base md:text-lg font-medium leading-relaxed mb-5 sm:mb-6 whitespace-pre-line">
        {question.question}
      </p>

      {/* Answer input based on type */}
      {(type === 'single_choice' || type === 'mcq') && (
        <SingleChoice question={question} answer={answer} onChange={onChange} />
      )}
      {type === 'multiple_choice' && (
        <MultipleChoice question={question} answer={answer} onChange={onChange} />
      )}
      {type === 'essay' && (
        <Essay question={question} answer={answer} onChange={onChange} marks={m.correct} />
      )}
    </div>
  )
}
