import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleGradeRequest } from './server/gradeEssay.js'
import { seoPlugin } from './server/seo.js'

// Serves POST /api/grade-essay during `npm run dev` and `npm run preview`.
// The Groq key stays in Node; only VITE_* variables ever reach the browser.
function essayGraderApi(env) {
  const mount = (server) => {
    server.middlewares.use('/api/grade-essay', (req, res) => handleGradeRequest(req, res, env))
  }
  return {
    name: 'essay-grader-api',
    configureServer: mount,
    configurePreviewServer: mount,
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), essayGraderApi(env), seoPlugin(env)],
  }
})
