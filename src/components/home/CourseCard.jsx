import { Link } from 'react-router-dom'
import CardBanner from '../common/CardBanner'
import { courseMarkingLabel } from '../../utils/marking'

export default function CourseCard({ course }) {
  const freeTests = course.testSeries?.filter(t => t.isFree).length || 0
  const totalTests = course.testSeries?.length || 0

  return (
    <Link to={`/course/${course.id}`} className="group block h-full">
      <div className="card p-0 overflow-hidden h-full flex flex-col hover:border-violet-500/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer">

        {/* Image banner */}
        <CardBanner src={course.img} alt={course.title} color={course.color}>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-950/70 backdrop-blur text-white">
            {course.language}
          </span>
          {course.active && (
            <span className="text-xs text-emerald-300 bg-gray-950/70 backdrop-blur px-2.5 py-1 rounded-full font-medium">Active</span>
          )}
        </CardBanner>

        <div className="p-6 flex flex-col flex-1">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors leading-tight line-clamp-1">
              {course.title}
            </h3>
            <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{course.subtitle}</p>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-2">
            {course.description}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {totalTests} Tests
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {freeTests} Free
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {courseMarkingLabel(course)}
            </div>
          </div>

          {/* CTA — pinned to the bottom so all cards in a row line up */}
          <div className="mt-auto pt-4 border-t border-gray-800">
            <span className="text-violet-400 text-sm font-semibold group-hover:text-violet-300 transition-colors flex items-center gap-1">
              View Tests
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
