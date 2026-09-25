import { Link } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'
import Footer from '../components/layout/Footer'
import { getResults, getStudent, clearAll } from '../utils/storage'
import { getGrade } from '../utils/calculator'

export default function Summary() {
  useSeo({ title: 'My Results', noindex: true })
  const student = getStudent()
  const results = getResults()

  const avg     = results.length ? (results.reduce((s, r) => s + parseFloat(r.percentage), 0) / results.length).toFixed(1) : 0
  const best    = results.length ? Math.max(...results.map(r => parseFloat(r.percentage))).toFixed(1) : 0
  const attemptedTotal = results.reduce((s, r) => s + (r.attempted || 0), 0)

  const handleClear = () => {
    if (window.confirm('Clear all results? This cannot be undone.')) {
      clearAll()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Home</Link>
          <span className="text-white font-semibold">My Results</span>
          {results.length > 0 && (
            <button onClick={handleClear} className="text-red-400 hover:text-red-300 text-xs transition-colors">Clear All</button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Student card */}
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
              {student?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{student?.name || 'Student'}</h1>
              <p className="text-gray-500 text-sm">{results.length} tests taken</p>
            </div>
          </div>
        </div>

        {/* Overall stats */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: results.length, label: 'Tests Taken',   color: 'text-violet-400' },
              { value: `${avg}%`,      label: 'Average Score', color: 'text-cyan-400'    },
              { value: `${best}%`,     label: 'Best Score',    color: 'text-emerald-400' },
              { value: attemptedTotal, label: 'Questions Attempted', color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="card p-5 text-center">
                <div className={`text-3xl font-black ${s.color} mb-1`}>{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Results list */}
        {results.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-white mb-2">No tests taken yet</h3>
            <p className="text-gray-500 mb-6">Start practicing to see your results here</p>
            <Link to="/" className="btn-primary inline-block px-8 py-3 rounded-xl">Browse Tests →</Link>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Test History</h2>
            <div className="space-y-3">
              {results.map(r => {
                const grade = getGrade(r.percentage)
                const date  = new Date(r.dateTaken).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                const pct   = parseFloat(r.percentage)
                const ring  = Math.min(100, Math.max(0, pct))
                return (
                  <Link key={r.id} to={`/result/${r.id}`} className="card p-5 flex items-center gap-4 hover:border-gray-700 transition-all group block">
                    {/* Score circle */}
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="12" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#7c3aed" strokeWidth="12"
                          strokeDasharray={`${2.51 * ring} ${251 - 2.51 * ring}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black text-white">{pct}%</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate group-hover:text-violet-400 transition-colors">
                        {r.testTitle}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{r.courseTitle} • {date}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-emerald-400">✓ {r.correct}</span>
                        <span className="text-xs text-red-400">✗ {r.wrong}</span>
                        <span className="text-xs text-gray-600">— {r.skipped}</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className={`text-lg font-black ${grade.color}`}>{r.score}/{r.maxScore}</div>
                      <div className={`text-xs font-semibold ${grade.color}`}>{grade.label}</div>
                    </div>

                    <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
