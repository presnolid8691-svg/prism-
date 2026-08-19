import { GoogleGenerativeAI } from '@google/generative-ai'

export const GEMINI_MODELS = {
  smartReply: 'gemini-3.7-flash',
  summarize: 'gemini-3.1-pro',
  metadata: 'gemini-3.5-flash-lite',
  imagine: 'gemini-3.1-flash-image',
} as const

/**
 * Lazily constructs a GoogleGenerativeAI instance.
 * Throws early if the API key is missing so errors surface at
 * call time rather than at module load (which matters for SSR).
 */
function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')
  return new GoogleGenerativeAI(apiKey)
}

/**
 * Returns a configured GenerativeModel for the given route key.
 * All Gemini calls should go through this function so model names
 * remain in one place.
 */
export function getModel(modelKey: keyof typeof GEMINI_MODELS) {
  return getGenAI().getGenerativeModel({ model: GEMINI_MODELS[modelKey] })
}
