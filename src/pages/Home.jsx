import Navbar from '../components/layout/Navbar'
import { useSeo } from '../hooks/useSeo'
import HeroBanner from '../components/home/HeroBanner'
import CourseCard from '../components/home/CourseCard'
import FounderVision from '../components/home/FounderVision'
import Footer from '../components/layout/Footer'
import { useMaster } from '../hooks/useMaster'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function Home() {
  const { master, loading, error } = useMaster()
  const { hash } = useLocation()
  useSeo({})   // defaults from index.html

  // Sections render after data loads, so scroll to #courses / #vision once they exist
  useEffect(() => {
    if (!loading && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [loading, hash])

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* Hero */}
      <HeroBanner appInfo={master?.app} courseCount={master?.courses?.filter(c => c.active).length} />

      {/* Courses Section */}
      <section id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-violet-400 tracking-[0.2em] uppercase mb-3 block">
            All Exams
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Choose Your Exam
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Comprehensive test series with detailed solutions and performance analysis
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-2 bg-gray-800 rounded mb-4" />
                <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
                <div className="h-16 bg-gray-800 rounded mb-4" />
                <div className="h-10 bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 text-lg mb-2">Failed to load courses</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {/* Courses grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {master?.courses?.filter(c => c.active).map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Founder — Thought & Vision */}
      <FounderVision founder={master?.app?.founder} />

      {/* Bottom CTA */}
      <section className="border-t border-gray-800 py-20">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
            Ready to start practicing?
          </h3>
          <p className="text-gray-400 mb-8">
            Free mock tests available. No registration required. Start now.
          </p>
          <a href="#courses" className="btn-primary inline-block px-10 py-4 rounded-2xl text-base">
            Browse Tests →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
