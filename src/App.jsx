import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Course from './pages/Course'
import Quiz from './pages/Quiz'
import Result from './pages/Result'
import Summary from './pages/Summary'
import AiPractice from './pages/AiPractice'
import AiTest from './pages/AiTest'
import AiLearn from './pages/AiLearn'
import AddTest from './pages/AddTest'
import NotFound from './pages/NotFound'

// Every new page starts at the top. Links with a #hash (e.g. /#courses) scroll to that section instead —
// the page handles that itself once its content has loaded.
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/"                 element={<Home />} />
        <Route path="/course/:courseId" element={<Course />} />
        <Route path="/quiz/:testId"     element={<Quiz />} />
        <Route path="/result/:resultId" element={<Result />} />
        <Route path="/summary"          element={<Summary />} />
        <Route path="/ai-practice"              element={<AiPractice />} />
        <Route path="/ai-practice/:id"          element={<AiTest />} />
        <Route path="/ai-practice/:id/learn"    element={<AiLearn />} />
        <Route path="/add-test"                 element={<AddTest />} />
        <Route path="*"                 element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
