import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BUCKET = 'media'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Upload a File object to the Supabase `media` bucket.
 *
 * @param file     - The File to upload (from an <input> or drag-drop event)
 * @param userId   - The authenticated user's UID (used as path prefix)
 * @param type     - Media category: avatar | image | video | voice | file | story | wallpaper
 * @returns        Public URL string of the uploaded asset
 */
export async function uploadMedia(
  file: File,
  userId: string,
  type:
    | 'avatar'
    | 'image'
    | 'video'
    | 'voice'
    | 'file'
    | 'story'
    | 'wallpaper',
): Promise<string> {
  const path = `${userId}/${type}/${Date.now()}-${file.name}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Convert a base64 data URL to a Blob and upload it to the media bucket.
 * Used for AI-generated images, canvas snapshots, etc.
 *
 * @param base64   - Full data URL (e.g. "data:image/png;base64,...")
 * @param userId   - The authenticated user's UID
 * @param filename - Suggested filename including extension
 * @returns        Public URL string of the uploaded asset
 */
export async function uploadBase64Media(
  base64: string,
  userId: string,
  filename: string,
): Promise<string> {
  // Parse the data URL
  const [header, data] = base64.split(',')
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream'

  // Decode base64 to binary
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })

  const path = `${userId}/image/${Date.now()}-${filename}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: mimeType,
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(`Base64 upload failed: ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return urlData.publicUrl
}

/**
 * Delete a previously uploaded file from the media bucket.
 * Extracts the storage path from the full public URL.
 *
 * @param publicUrl - The public URL previously returned by uploadMedia/uploadBase64Media
 */
export async function deleteMedia(publicUrl: string): Promise<void> {
  // Public URLs are in the form:
  //   https://<project>.supabase.co/storage/v1/object/public/media/<path>
  const marker = `/object/public/${BUCKET}/`
  const markerIdx = publicUrl.indexOf(marker)
  if (markerIdx === -1) {
    throw new Error(`Cannot extract storage path from URL: ${publicUrl}`)
  }

  const path = decodeURIComponent(publicUrl.slice(markerIdx + marker.length))

  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}
