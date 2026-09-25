import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Course from './pages/Course'
import Quiz from './pages/Quiz'
import Result from './pages/Result'
import Summary from './pages/Summary'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                 element={<Home />} />
        <Route path="/course/:courseId" element={<Course />} />
        <Route path="/quiz/:testId"     element={<Quiz />} />
        <Route path="/result/:resultId" element={<Result />} />
        <Route path="/summary"          element={<Summary />} />
        <Route path="*"                 element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
