import { useState } from 'react'
import { Link } from 'react-router-dom'
import CardBanner from '../common/CardBanner'
import { resolveScheme } from '../../utils/marking'

const DIFF_COLOR = {
  Easy:   'text-emerald-400 bg-emerald-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  Hard:   'text-red-400 bg-red-400/10',
}

export default function TestSeriesCard({ test, courseColor, courseScheme }) {
  const scheme = resolveScheme(courseScheme, test.markingScheme)
  const fmt     = (n) => String(Math.round(Math.abs(n) * 100) / 100)
  const correct = fmt(scheme.default?.correct ?? 1)
  const wrong   = fmt(scheme.default?.wrong ?? 0)
  const [showLocked, setShowLocked] = useState(false)
  const date = test.datePublished ? new Date(test.datePublished).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : ''

  return (
    <div className="group card p-0 overflow-hidden h-full flex flex-col hover:border-gray-700 hover:-translate-y-0.5 transition-all duration-200">

      {/* Image banner */}
      <CardBanner src={test.img} alt={test.title} color={courseColor} height="h-36">
        {test.isFree ? (
          <span className="text-xs font-bold text-emerald-300 bg-gray-950/70 backdrop-blur px-2.5 py-1 rounded-full">FREE</span>
        ) : (
          <span className="text-xs font-bold text-violet-300 bg-gray-950/70 backdrop-blur px-2.5 py-1 rounded-full">🔒 PREMIUM</span>
        )}
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-950/70 backdrop-blur ${(DIFF_COLOR[test.difficulty] || DIFF_COLOR.Medium).split(' ')[0]}`}>
          {test.difficulty}
        </span>
      </CardBanner>

      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-white leading-tight mb-1 line-clamp-2">{test.title}</h3>
          <p className="text-gray-500 text-xs">{date}</p>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{test.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: '❓', label: 'Questions', value: test.totalQuestions },
            { icon: '⏱', label: 'Minutes',   value: test.duration       },
            { icon: '🏆', label: 'Max Marks', value: test.maxScore       },
          ].map(s => (
            <div key={s.label} className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <div className="text-base font-black text-white truncate">{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Marking scheme */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-xl px-3 py-2.5 mb-4">
          <span className="text-gray-500 text-xs font-medium mr-auto">Marking</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            ✓ Correct +{correct}
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
            wrong !== '0'
              ? 'text-red-400 bg-red-500/10 border-red-500/30'
              : 'text-gray-400 bg-gray-700/40 border-gray-600'
          }`}>
            ✗ Wrong {wrong !== '0' ? `−${wrong}` : '0'}
          </span>
        </div>

        {/* Tags */}
        {test.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {test.tags.map(tag => (
              <span key={tag} className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-md">{tag}</span>
            ))}
          </div>
        )}

        {/* CTA — pinned to the bottom so all cards in a row line up; premium tests don't navigate */}
        <div className="mt-auto">
        {test.isFree ? (
          <Link
            to={`/quiz/${test.id}`}
            className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
          >
            Start Test →
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowLocked(true)}
              aria-disabled="true"
              className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all bg-gray-800 text-gray-400 cursor-not-allowed"
            >
              🔒 Premium Test
            </button>
            {showLocked && (
              <p className="text-xs text-violet-300 text-center mt-2">
                This is a premium test — premium access is coming soon.
              </p>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}
