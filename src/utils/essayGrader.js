// Calls our own server endpoint — the Groq key never touches the browser.
export async function requestEssayGrades(items) {
  const r = await fetch('/api/grade-essay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || `AI grading failed (HTTP ${r.status})`)
  return data.results || []
}
