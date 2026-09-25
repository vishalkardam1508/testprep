export const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिंदी' },
]

export const detectLang = (text = '') => /[ऀ-ॿ]/.test(text) ? 'hi' : 'en'

export const isBilingual = (questions = []) =>
  questions.some(q => q.i18n?.hi && q.i18n?.en)

// Returns the question with text/options/explanation in the chosen language.
// Answer indexes are unchanged because options keep the same order.
export function localize(q, lang) {
  const t = q?.i18n?.[lang]
  if (!t) return q
  return {
    ...q,
    question:    t.question    ?? q.question,
    options:     t.options     ?? q.options,
    explanation: t.explanation ?? q.explanation,
  }
}
