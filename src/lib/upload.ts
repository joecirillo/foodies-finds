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

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

// iPhones (the primary platform) default to HEIC/HEIF, so the picker must allow
// selecting it even though it isn't in ALLOWED_IMAGE_TYPES — prepareImageFile
// converts it to JPEG before it ever reaches that check.
export const ACCEPTED_IMAGE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "image/heic",
  "image/heif",
  ".heic",
  ".heif",
].join(",")

export const IMAGE_TYPE_ERROR = "File must be a jpeg, png, webp, or gif photo."

export const IMAGE_CONVERSION_ERROR =
  "Couldn't process that photo — please try a different one."

export type PreparedImage = { file: File } | { error: string }

// HEIC/HEIF isn't renderable in an <img> by any non-Safari browser, so a photo straight
// off an iPhone needs to become JPEG before it's uploaded. heic-to decodes via WASM
// rather than relying on the browser's own codec support, so this works the same in
// Chrome/Firefox/etc. as it does in Safari. It's dynamic-imported (~1MB) so non-HEIC
// uploads, the common case on desktop, never pay for it.
export const prepareImageFile = async (file: File): Promise<PreparedImage> => {
  try {
    const { isHeic, heicTo } = await import("heic-to")

    if (await isHeic(file)) {
      const converted = await heicTo({ blob: file, type: "image/jpeg", quality: 0.8 })
      const name = file.name.replace(/\.\w+$/, "") + ".jpg"
      return { file: new File([converted], name, { type: "image/jpeg" }) }
    }
  } catch (err) {
    console.error("HEIC conversion failed:", err)
    return { error: IMAGE_CONVERSION_ERROR }
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { error: IMAGE_TYPE_ERROR }
  }

  return { file }
}
