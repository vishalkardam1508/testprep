import { Link, useLocation } from 'react-router-dom'
import SafeImage from '../common/SafeImage'
import { useMaster } from '../../hooks/useMaster'

export default function Navbar() {
  const { master } = useMaster()
  const loc = useLocation()
  const isHome = loc.pathname === '/'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <SafeImage
              src={master?.app?.logo}
              alt={master?.app?.name || 'Logo'}
              className="w-9 h-9 rounded-xl object-cover"
              fallback={
                <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                  <span className="text-white font-black text-base">T</span>
                </div>
              }
            />
            <span className="text-white font-bold text-xl tracking-tight">
              Test<span className="text-violet-400">Prep</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            {!isHome && (
              <Link to="/" className="hidden sm:block text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-all">
                Home
              </Link>
            )}
            <Link
              to="/add-test"
              className="hidden md:block text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-all whitespace-nowrap"
            >
              📄 Add Test
            </Link>
            <Link
              to="/ai-practice"
              className="text-gray-400 hover:text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-800 transition-all whitespace-nowrap"
            >
              ✨ AI<span className="hidden sm:inline"> Practice</span>
            </Link>
            <Link
              to="/summary"
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium px-3 sm:px-4 py-2 whitespace-nowrap rounded-lg hover:bg-gray-800 transition-all"
            >
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              My Results
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
