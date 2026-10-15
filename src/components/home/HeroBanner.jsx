import { Link } from 'react-router-dom'

export default function HeroBanner({ appInfo, courseCount }) {
  const stats = appInfo?.stats || {}

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-24 pb-12 sm:pt-16 sm:pb-0">

      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-violet-950/10 to-gray-950" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}
      />

      {/* Content */}
      <div className="relative text-center px-4 max-w-5xl mx-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
          2026 EXAM PREPARATION
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.95] tracking-tight">
          Prepare Smart.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400">
            Score High.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          {appInfo?.tagline || 'The smartest way to prepare for competitive exams. Practice with real exam pattern questions.'}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
          <a href="#courses" className="btn-primary text-base px-8 py-4 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all">
            Start Practicing →
          </a>
          <Link to="/ai-practice" className="text-base font-semibold px-8 py-4 rounded-2xl border border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 hover:-translate-y-0.5 transition-all">
            ✨ AI Practice
          </Link>
          <Link to="/summary" className="btn-secondary text-base px-8 py-4 rounded-2xl hover:-translate-y-0.5 transition-all">
            My Results
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-8 md:gap-16">
          {[
            { value: courseCount || stats.courses || '—', label: 'Exams Covered' },
            { value: `${stats.questions ? (stats.questions/1000).toFixed(0)+'K+' : '2K+'}`, label: 'Questions' },
            { value: `${stats.students ? Math.floor(stats.students/1000)+'K+' : '50K+'}`,   label: 'Students' },
            { value: 'Free',                          label: 'Mock Tests' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</div>
              <div className="text-gray-500 text-sm font-medium tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-gray-600">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-gray-600 to-transparent" />
      </div>
    </div>
  )
}
