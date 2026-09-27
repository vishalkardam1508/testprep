import { useParams, Link } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import TestSeriesCard from '../components/course/TestSeriesCard'
import { useMaster } from '../hooks/useMaster'
import SafeImage from '../components/common/SafeImage'
import { courseMarkingLabel } from '../utils/marking'
import CourseDetails, { CourseHighlights } from '../components/course/CourseDetails'

export default function Course() {
  const { courseId } = useParams()
  const { getCourse, loading } = useMaster()
  const course = getCourse(courseId)

  const tests = course?.testSeries || []
  useSeo(loading ? { title: null } : course ? {
    title: `${course.title} Free Mock Test Series in Hindi & English`,
    description: `${tests.length} free ${course.title} mock tests (${course.subtitle}). ${course.description}`,
    image: course.img,
  } : { title: 'Course not found', noindex: true })

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500 animate-pulse text-lg">Loading...</div>
    </div>
  )

  if (!course) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-400 text-xl">Course not found</p>
      <Link to="/" className="btn-secondary">← Back Home</Link>
    </div>
  )

  const freeCount = course.testSeries?.filter(t => t.isFree).length || 0

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* Course header */}
      <div className="relative pt-16">
        <div className={`absolute inset-0 bg-gradient-to-br ${course.color || 'from-violet-900/20 to-gray-950'} opacity-30`} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 sm:mb-8 min-w-0">
            <Link to="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-300 truncate">{course.title}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 min-w-0">
              <SafeImage
                src={course.img}
                alt={course.title}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl object-cover flex-shrink-0 bg-gray-800 border border-gray-800"
              />
              <div className="min-w-0">
              <div className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${course.color} text-white mb-4`}>
                {course.language}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 leading-tight break-words">
                {course.title}
              </h1>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl">{course.description}</p>
              <CourseHighlights points={course.about} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full md:w-auto md:flex flex-shrink-0">
              {[
                { value: course.testSeries?.length || 0, label: 'Total Tests' },
                { value: freeCount, label: 'Free Tests' },
                { value: courseMarkingLabel(course), label: 'Marking' },
              ].map(s => (
                <div key={s.label} className="text-center bg-gray-900 border border-gray-800 rounded-2xl px-2 sm:px-5 py-3 sm:py-4 min-w-0">
                  <div className="text-lg sm:text-2xl font-black text-white whitespace-nowrap">{s.value}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Test Series */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h2 className="text-xl font-bold text-white mb-5 sm:mb-8">
          All Tests
          <span className="ml-3 text-sm font-normal text-gray-500">({course.testSeries?.length || 0})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {course.testSeries?.map(test => (
            <TestSeriesCard key={test.id} test={test} courseColor={course.color} courseScheme={course.markingScheme} />
          ))}
        </div>

        {(!course.testSeries || course.testSeries.length === 0) && (
          <div className="card text-center py-14 px-6">
            <div className="text-4xl mb-3">🚀</div>
            <p className="text-white font-semibold mb-1">Tests coming soon</p>
            <p className="text-gray-500 text-sm">Mock tests for this course are being prepared. Meanwhile, check the exam pattern and syllabus below.</p>
          </div>
        )}
      </div>

      {/* Exam pattern + syllabus */}
      <CourseDetails course={course} />

      <Footer />
    </div>
  )
}
