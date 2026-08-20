import { getModel } from './client'

interface ConversationMessage {
  role: string
  content: string
}

/**
 * Generates 3 smart quick-reply suggestions based on recent conversation history.
 * Runs server-side only (requires GEMINI_API_KEY).
 *
 * @param messages - Array of recent messages (last ~10 recommended)
 * @returns        Array of exactly 3 short reply strings
 */
export async function generateSmartReplies(
  messages: ConversationMessage[],
): Promise<string[]> {
  try {
    const model = getModel('smartReply')

    // Use the last 10 messages to keep the prompt concise
    const recent = messages.slice(-10)
    const conversation = recent
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    const prompt = `Based on this conversation, generate exactly 3 short, natural quick-reply suggestions. Return only a JSON array of 3 strings. No explanation.

Conversation:
${conversation}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Extract JSON array from the response (handle markdown code fences)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }

    const replies = JSON.parse(jsonMatch[0]) as unknown[]

    if (!Array.isArray(replies) || replies.length === 0) {
      throw new Error('Invalid reply format')
    }

    // Ensure we always return exactly 3 strings
    const casted = replies.slice(0, 3).map((r) => String(r))
    while (casted.length < 3) {
      casted.push('👍')
    }

    return casted
  } catch {
    // Graceful fallback so the UI never breaks
    return ['👍', '😊', 'Sure!']
  }
}
