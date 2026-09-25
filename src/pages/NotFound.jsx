import { Link } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'

export default function NotFound() {
  useSeo({ title: 'Page not found', noindex: true })
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="text-8xl font-black text-gray-800">404</div>
      <h1 className="text-2xl font-bold text-white">Page not found</h1>
      <p className="text-gray-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary px-8 py-3 rounded-xl">← Back to Home</Link>
    </div>
  )
}
