import { getModel } from './client'

/**
 * Generates an image from a text prompt using the Gemini image model.
 * Runs server-side only (requires GEMINI_API_KEY).
 *
 * @param prompt - Text description of the image to generate
 * @returns      Base64 data URL string: `data:{mimeType};base64,{data}`
 */
export async function generateImage(prompt: string): Promise<string> {
  const model = getModel('imagine')

  const result = await model.generateContent(prompt)
  const candidates = result.response.candidates

  if (!candidates || candidates.length === 0) {
    throw new Error('Gemini returned no candidates for image generation')
  }

  const parts = candidates[0].content.parts

  // Find the inline image data part
  const imagePart = parts.find(
    (part) =>
      'inlineData' in part &&
      part.inlineData != null,
  )

  if (!imagePart || !('inlineData' in imagePart) || !imagePart.inlineData) {
    throw new Error(
      'Gemini response did not contain inline image data. ' +
        'Ensure the model and prompt support image generation.',
    )
  }

  const { mimeType, data } = imagePart.inlineData
  return `data:${mimeType};base64,${data}`
}
