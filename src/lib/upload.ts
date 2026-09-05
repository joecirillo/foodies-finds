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

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

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

export const IMAGE_CONVERSION_ERROR = "Couldn't process that photo — please try a different one."

export const IMAGE_TOO_LARGE_ERROR =
  "That photo is too large even after compression — please try a different one."

export type PreparedImage = { file: File } | { error: string }

// Long edge cap for uploaded recipe photos — never displayed larger than this,
// so anything wider gets downscaled before it's re-encoded.
const MAX_IMAGE_DIMENSION_PX = 1920
const COMPRESSED_IMAGE_QUALITY = 0.8

// recipe-api rejects uploads over 5MB. Whether that's meant as 5,242,880 bytes (5 MiB)
// or a decimal 5,000,000 isn't visible from here, so the stricter (smaller) reading is
// used as the hard ceiling — otherwise a file in that ~4% gap would pass this check and
// still get rejected server-side. Compression targets comfortably under that so the
// library has room to iterate on quality/dimensions; the hard check below then catches
// the rare image that's still too detailed to fit even after that pass, surfacing it
// here instead of failing later at the presign step.
const MAX_UPLOAD_BYTES = 5_000_000
const COMPRESSION_TARGET_MB = 4.3

// HEIC/HEIF isn't renderable in an <img> by any non-Safari browser, so a photo straight
// off an iPhone needs to become JPEG before it's uploaded. heic-to decodes via WASM
// rather than relying on the browser's own codec support, so this works the same in
// Chrome/Firefox/etc. as it does in Safari. It's dynamic-imported (~1MB) so pages that
// never call prepareImageFile never pay for it.
const convertHeicToJpeg = async (file: File): Promise<File> => {
  const { isHeic, heicTo } = await import("heic-to")

  if (!(await isHeic(file))) {
    return file
  }

  const converted = await heicTo({ blob: file, type: "image/jpeg", quality: 0.8 })
  const name = file.name.replace(/\.\w+$/, "") + ".jpg"
  return new File([converted], name, { type: "image/jpeg" })
}

// Canvas WebP *encoding* isn't universal (older Safari/iOS in particular can't do it,
// despite happily displaying WebP), and browser-image-compression's size-targeting loop
// re-requests the same fileType on every iteration. If that request silently falls back
// to PNG, the loop is stuck: PNG is lossless, so its quality knob does nothing, leaving
// only 5%-per-iteration dimension shrinking to hit the target — which a detailed photo
// can blow through in all 10 iterations, well before the target. JPEG's canvas encoding
// has no such compatibility gap and gives the loop a real quality lever, so it's the
// fallback here rather than letting the browser choose PNG for us.
const canvasSupportsWebpEncoding = (): boolean => {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  return canvas.toDataURL("image/webp").startsWith("data:image/webp")
}

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
}

// Resizes + re-encodes off the main thread (browser-image-compression runs the canvas
// work in a Web Worker). This also strips EXIF — including GPS coordinates phone
// cameras embed by default — as a side effect of the re-encode.
const compressImage = async (file: File): Promise<File> => {
  const imageCompression = (await import("browser-image-compression")).default

  const compressed = await imageCompression(file, {
    maxWidthOrHeight: MAX_IMAGE_DIMENSION_PX,
    initialQuality: COMPRESSED_IMAGE_QUALITY,
    maxSizeMB: COMPRESSION_TARGET_MB,
    fileType: canvasSupportsWebpEncoding() ? "image/webp" : "image/jpeg",
    useWebWorker: true,
  })

  // Even the chosen fileType isn't a hard guarantee (the browser could still fall back
  // further), so the actual encoded type — which the browser reports correctly on the
  // blob — is trusted here rather than assuming the request was honored. Mislabeling
  // the bytes would break rendering wherever they're served with the wrong Content-Type.
  const extension = EXTENSION_BY_MIME_TYPE[compressed.type] ?? "jpg"
  const name = file.name.replace(/\.\w+$/, "") + "." + extension
  return new File([compressed], name, { type: compressed.type })
}

export const prepareImageFile = async (file: File): Promise<PreparedImage> => {
  let workingFile: File

  try {
    workingFile = await convertHeicToJpeg(file)
  } catch (err) {
    console.error("HEIC conversion failed:", err)
    return { error: IMAGE_CONVERSION_ERROR }
  }

  if (!ALLOWED_IMAGE_TYPES.has(workingFile.type)) {
    return { error: IMAGE_TYPE_ERROR }
  }

  // A canvas-based re-encode would flatten an animated GIF to its first frame,
  // so GIFs are uploaded as-is rather than run through compression.
  if (workingFile.type !== "image/gif") {
    try {
      workingFile = await compressImage(workingFile)
    } catch (err) {
      console.error("Image compression failed:", err)
      return { error: IMAGE_CONVERSION_ERROR }
    }
  }

  if (workingFile.size > MAX_UPLOAD_BYTES) {
    return { error: IMAGE_TOO_LARGE_ERROR }
  }

  return { file: workingFile }
}
