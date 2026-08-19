import { getModel } from './client'

interface ConversationMessage {
  sender: string
  content: string
}

/**
 * Summarises a conversation into 2–3 concise bullet points.
 * Runs server-side only (requires GEMINI_API_KEY).
 *
 * @param messages - Array of messages with sender name and content
 * @returns        Markdown-style bullet point summary string
 */
export async function summarizeConversation(
  messages: ConversationMessage[],
): Promise<string> {
  const model = getModel('summarize')

  const conversation = messages
    .map((m) => `${m.sender}: ${m.content}`)
    .join('\n')

  const prompt = `Summarize this conversation in 2-3 bullet points. Be concise and factual.

Conversation:
${conversation}`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
