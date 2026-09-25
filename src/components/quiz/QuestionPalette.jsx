import { isAnswered } from '../../utils/calculator'
import { sectionColor } from '../../utils/sections'

function getStatus(q, answers, visited, marked) {
  const answered = isAnswered(answers[q.id])
  const isMarked = marked.has(q.id)

  if (isMarked && answered) return 'answeredMarked'
  if (isMarked)             return 'marked'
  if (answered)             return 'answered'
  if (visited.has(q.id))    return 'visited'
  return 'notvisited'
}

const STATUS_STYLE = {
  notvisited:     'bg-gray-800 text-gray-500 border border-gray-700',
  visited:        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  answered:       'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
  marked:         'bg-violet-500/20 text-violet-400 border border-violet-500/40',
  answeredMarked: 'bg-violet-500/20 text-emerald-400 border-2 border-emerald-500/70',
}

// groups: output of groupBySection(questions, sections)
export default function QuestionPalette({ groups, answers, visited, marked, currentIndex, onJump }) {
  const counts = { answered: 0, answeredMarked: 0, marked: 0, visited: 0, notvisited: 0 }
  groups.forEach(g => g.items.forEach(({ q }) => counts[getStatus(q, answers, visited, marked)]++))

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Question Palette</h3>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-1.5 mb-4 text-xs">
        {[
          { key: 'answered',       label: `Answered (${counts.answered})`             },
          { key: 'marked',         label: `Marked (${counts.marked})`                 },
          { key: 'answeredMarked', label: `Ans + Marked (${counts.answeredMarked})`   },
          { key: 'visited',        label: `Not Answered (${counts.visited})`          },
          { key: 'notvisited',     label: `Not Visited (${counts.notvisited})`        },
        ].map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded flex-shrink-0 ${STATUS_STYLE[s.key]}`} />
            <span className="text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Section-wise grid */}
      <div className="space-y-4">
        {groups.map(g => {
          const c    = sectionColor(g.color)
          const done = g.items.filter(({ q }) => isAnswered(answers[q.id])).length
          const isCurrentSection = g.items.some(i => i.index === currentIndex)
          return (
            <div key={g.id}>
              <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b ${isCurrentSection ? c.border : 'border-gray-800'}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                <span className={`text-xs font-semibold truncate ${isCurrentSection ? c.text : 'text-gray-400'}`}>{g.title}</span>
                <span className="text-xs text-gray-600 ml-auto flex-shrink-0">{done}/{g.items.length}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {g.items.map(({ q, index }) => {
                  const status    = getStatus(q, answers, visited, marked)
                  const isCurrent = index === currentIndex
                  return (
                    <button
                      key={q.id}
                      onClick={() => onJump(index)}
                      className={`w-full aspect-square rounded-lg text-xs font-bold transition-all ${STATUS_STYLE[status]} ${
                        isCurrent ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900' : 'hover:opacity-80'
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
