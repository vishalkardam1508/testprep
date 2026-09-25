import SafeImage from '../common/SafeImage'

export default function FounderVision({ founder }) {
  if (!founder) return null

  return (
    <section id="vision" className="border-t border-gray-800 py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-violet-400 tracking-[0.2em] uppercase mb-3 block">
            Our Thought &amp; Vision
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Education should be <span className="gradient-text">free for everyone</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-5 gap-10 items-center">

          {/* Photo */}
          <div className="md:col-span-2 flex justify-center">
            <div className="relative w-full max-w-xs">
              <div className="absolute -inset-3 bg-gradient-to-br from-violet-600/30 to-cyan-500/20 rounded-3xl blur-xl" />
              <div className="relative card overflow-hidden p-0">
                <SafeImage
                  src={founder.photo}
                  alt={founder.name}
                  className="w-full aspect-[4/5] object-cover"
                  fallback={
                    <div className="w-full aspect-[4/5] bg-gray-800 flex items-center justify-center text-6xl font-black text-gray-600">
                      {founder.name?.[0]}
                    </div>
                  }
                />
                <div className="p-4 text-center border-t border-gray-800">
                  <p className="text-white font-bold">{founder.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{founder.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thought + Vision */}
          <div className="md:col-span-3 space-y-6">
            {founder.thought && (
              <blockquote className="relative pl-6 border-l-2 border-violet-500">
                <span className="absolute -top-4 -left-1 text-6xl text-violet-500/30 font-serif leading-none">“</span>
                <p className="text-xl md:text-2xl text-white font-medium leading-relaxed italic">
                  {founder.thought}
                </p>
                <footer className="mt-3 text-sm text-violet-400 font-semibold">— {founder.name}</footer>
              </blockquote>
            )}

            {founder.vision && (
              <div>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Our Vision</h3>
                <p className="text-gray-400 leading-relaxed">{founder.vision}</p>
              </div>
            )}

            {founder.promises?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {founder.promises.map(p => (
                  <div key={p.title} className="card p-4 flex gap-3">
                    <span className="text-2xl flex-shrink-0">{p.icon}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{p.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{p.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {founder.portfolio && (
              <a
                href={founder.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-2 text-sm"
              >
                Know more about {founder.name?.split(' ')[0]}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
