import { questionMarks, resolveScheme } from './marking.js'

export const round2 = (n) => Math.round(n * 100) / 100

export function isAnswered(ua) {
  return !(
    ua === undefined || ua === null ||
    (Array.isArray(ua) && ua.length === 0) ||
    (typeof ua === 'string' && ua.trim() === '')
  )
}

// markingScheme: the already-resolved scheme for this test (see utils/marking.js)
export function calculateScore(questions, answers, markingScheme) {
  const scheme = resolveScheme(markingScheme)
  let correct = 0, wrong = 0, skipped = 0, partial = 0, essayCount = 0
  let totalScore = 0, maxScore = 0, essayMarks = 0
  const details = []

  questions.forEach(q => {
    const ua   = answers[q.id]
    const type = q.type || 'single_choice'
    const { correct: qMarks, negative: qNeg, partial: qPartial } = questionMarks(q, scheme)

    // Essays are graded manually, so they are kept out of the auto-scored max
    if (type === 'essay') essayMarks += qMarks
    else maxScore += qMarks

    let status = 'skipped', qScore = 0

    if (!isAnswered(ua)) {
      skipped++

    } else if (type === 'essay') {
      essayCount++
      status = 'essay'

    } else if (type === 'single_choice' || type === 'mcq') {
      if (ua === q.answer) {
        correct++; status = 'correct'; qScore = qMarks
      } else {
        wrong++; status = 'wrong'; qScore = -qNeg
      }

    } else if (type === 'multiple_choice') {
      const correctSet = q.answers || []
      const userSet    = Array.isArray(ua) ? ua : [ua]
      const hasWrong   = userSet.some(a => !correctSet.includes(a))
      const allRight   = !hasWrong && userSet.length === correctSet.length

      if (allRight) {
        correct++; status = 'correct'; qScore = qMarks
      } else if (hasWrong) {
        wrong++; status = 'wrong'; qScore = -qNeg
      } else {
        partial++; status = 'partial'
        qScore = qPartial
      }
    }

    totalScore += qScore
    details.push({
      id: q.id, type, status,
      section: q.section,
      score: round2(qScore),
      userAnswer: ua,
      marks: qMarks,
    })
  })

  const score = round2(totalScore)

  return {
    correct, wrong, skipped, partial, essayCount,
    attempted: questions.length - skipped,
    total: questions.length,
    score,
    maxScore: round2(maxScore),
    essayMarks: round2(essayMarks),
    percentage: maxScore > 0 ? (score / maxScore * 100).toFixed(1) : '0.0',
    details,
  }
}

// Merge AI essay grades into a saved result. grades: [{ id, score, feedback, ... }]
export function applyEssayGrades(result, grades) {
  const byId = new Map(grades.map(g => [g.id, g]))
  let essayScore = 0

  const details = result.details.map(d => {
    if (d.type !== 'essay') return d
    const g = byId.get(d.id)
    if (!g) return d
    essayScore += g.score
    return {
      ...d,
      score: round2(g.score),
      aiGrade: {
        feedback: g.feedback,
        strengths: g.strengths || [],
        improvements: g.improvements || [],
      },
    }
  })

  const score    = round2(result.score + essayScore)
  const maxScore = round2(result.maxScore + (result.essayMarks || 0))

  return {
    details,
    score,
    maxScore,
    essayScore: round2(essayScore),
    essaysGraded: true,
    objectiveScore: result.score,
    objectiveMax: result.maxScore,
    percentage: maxScore > 0 ? (score / maxScore * 100).toFixed(1) : '0.0',
  }
}

export function getGrade(percentage) {
  const p = parseFloat(percentage)
  if (p >= 90) return { label: 'Outstanding', color: 'text-emerald-400' }
  if (p >= 75) return { label: 'Excellent',   color: 'text-cyan-400'    }
  if (p >= 60) return { label: 'Good',         color: 'text-blue-400'   }
  if (p >= 45) return { label: 'Average',      color: 'text-yellow-400' }
  return { label: 'Needs Improvement',         color: 'text-red-400'    }
}

export function formatDuration(totalSecs) {
  if (!totalSecs && totalSecs !== 0) return '—'
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m ${s}s`
  return `${s}s`
}
