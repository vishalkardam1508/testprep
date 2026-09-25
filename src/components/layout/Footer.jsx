import { Link } from 'react-router-dom'
import SafeImage from '../common/SafeImage'
import { useMaster } from '../../hooks/useMaster'

const Icon = {
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  mail:  'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  globe: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9',
}

function ContactRow({ href, icon, children, external }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex items-center gap-2.5 text-gray-400 hover:text-white text-sm transition-colors break-all"
    >
      <svg className="w-4 h-4 flex-shrink-0 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={Icon[icon]} />
      </svg>
      {children}
    </a>
  )
}

export default function Footer() {
  const { master } = useMaster()
  const app     = master?.app || {}
  const founder = app.founder
  const courses = master?.courses?.filter(c => c.active) || []
  const year    = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-base">T</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Test<span className="text-violet-400">Prep</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm leading-relaxed">
            {app.tagline || 'Free exam preparation platform'}. Free mock tests with detailed solutions — no charges, ever.
          </p>
        </div>

        {/* Exams */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Exams</h4>
          <ul className="space-y-2.5">
            {courses.map(c => (
              <li key={c.id}>
                <Link to={`/course/${c.id}`} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/"        className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/summary" className="text-gray-400 hover:text-white transition-colors">My Results</Link></li>
            <li><a href="/#courses" className="text-gray-400 hover:text-white transition-colors">All Tests</a></li>
            <li><a href="/#vision"  className="text-gray-400 hover:text-white transition-colors">Our Vision</a></li>
          </ul>
        </div>

        {/* Contact */}
        {founder && (
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <div className="flex items-center gap-3 mb-4">
              <SafeImage
                src={founder.avatar || founder.photo}
                alt={founder.name}
                className="w-11 h-11 rounded-full object-cover border border-gray-700"
              />
              <div>
                <p className="text-white text-sm font-semibold">{founder.name}</p>
                <p className="text-gray-500 text-xs">Founder</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {founder.phone && (
                <ContactRow href={`tel:${founder.phone.replace(/\s/g, '')}`} icon="phone">{founder.phone}</ContactRow>
              )}
              {founder.email && (
                <ContactRow href={`mailto:${founder.email}`} icon="mail">{founder.email}</ContactRow>
              )}
              {founder.portfolio && (
                <ContactRow href={founder.portfolio} icon="globe" external>
                  {founder.portfolio.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </ContactRow>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p>© {year} {app.name || 'TestPrep'}. All rights reserved.</p>
          <p>
            Free education for every student · Founded by{' '}
            {founder?.portfolio
              ? <a href={founder.portfolio} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">{founder.name}</a>
              : <span className="text-gray-400">{founder?.name || 'TestPrep'}</span>}
          </p>
        </div>
      </div>
    </footer>
  )
}
