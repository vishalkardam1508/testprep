// Vercel serverless function: POST /api/gs  (AI practice: exam analysis, research, question batches)
// Set GROQ_GS_KEY (and optionally GROQ_GS_FALLBACK_KEY, GEMINI_GS_KEY, GROQ_GS_MODEL, GROQ_GS_SEARCH_MODEL) in Vercel → Project → Settings → Environment Variables.
import { handleGsRequest } from '../server/gsGenerator.js'

export const config = { maxDuration: 60 }

export default function handler(req, res) {
  return handleGsRequest(req, res, process.env)
}
