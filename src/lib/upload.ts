// HEIC/HEIF (the default iPhone camera format) isn't renderable in an <img> by
// any non-Safari browser, so it's excluded even though R2 would happily store it.
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export const ACCEPTED_IMAGE_TYPES = Array.from(ALLOWED_IMAGE_TYPES).join(",")

export const IMAGE_TYPE_ERROR =
  "File must be jpeg, png, webp, or gif. HEIC photos aren't supported — please choose a different format."

// Runs in the browser: uploads the file bytes directly to R2 using a presigned URL,
// bypassing the Next.js server entirely (the whole point of presigned uploads).
export async function putToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })

  if (!res.ok) {
    throw new Error(`Image upload failed (${res.status})`)
  }
}
