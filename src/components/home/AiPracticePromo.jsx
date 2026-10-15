import { Link } from 'react-router-dom'

const STEPS = [
  { icon: '📝', title: 'Tell us your exam', text: 'Enter the exam or job title and paste the notification. Pick year, months, fields — Economy, Polity, Global, Sports — and English or Hindi.' },
  { icon: '🧠', title: 'Vedha Tutor studies the pattern', text: 'Your AI tutor reads the last 5 years of papers, works out the sections, difficulty, timing and marking of your exam, and searches the web for verified current affairs.' },
  { icon: '🎯', title: 'Practise 25–100 questions', text: 'Start after the first 5 questions — Vedha Tutor writes the rest while you practise. Take a timed exam with a full result, or use Learn mode to see answers and explanations instantly.' },
]

const FIELDS = ['Economy', 'Polity', 'International', 'Science & Tech', 'Sports', 'Awards', 'Schemes', 'History', 'Geography']

export default function AiPracticePromo() {
  return (
    <section id="ai-practice" className="border-t border-gray-800 py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full mb-4">
            ✨ New · Meet Vedha Tutor
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            GS & Current Affairs, <span className="gradient-text">made for your exam</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Month-wise and field-wise practice tests built around your exam's real pattern — not a generic question dump.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card p-6 relative">
              <span className="absolute top-5 right-5 text-xs font-mono text-gray-600">0{i + 1}</span>
              <div className="text-3xl mb-4">{s.icon}</div>
              <h3 className="text-white font-bold mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {FIELDS.map(f => (
            <span key={f} className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">{f}</span>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/ai-practice"
            className="btn-primary inline-block text-base px-10 py-4 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
          >
            Create my AI test →
          </Link>
          <p className="text-xs text-gray-500 mt-3">Free · No registration · Ready in about a minute</p>
        </div>

        {/* Own questions → Add Test */}
        <Link
          to="/add-test"
          className="mt-10 max-w-2xl mx-auto card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-gray-700 transition-all group"
        >
          <div className="text-3xl">📄</div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold">Have your own questions?</p>
            <p className="text-gray-400 text-sm">Copy our ChatGPT prompt, paste the JSON reply or upload a file — and practise it as a timed test. No limits, no AI needed.</p>
          </div>
          <span className="text-violet-400 text-sm font-semibold whitespace-nowrap group-hover:translate-x-0.5 transition-transform">Add Test →</span>
        </Link>
      </div>
    </section>
  )
}
