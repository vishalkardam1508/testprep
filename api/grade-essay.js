// Vercel serverless function: POST /api/grade-essay
// Set GROQ_API_KEY (and optionally GROQ_MODEL) in Vercel → Project → Settings → Environment Variables.
import { handleGradeRequest } from '../server/gradeEssay.js'

export default function handler(req, res) {
  return handleGradeRequest(req, res, process.env)
}
