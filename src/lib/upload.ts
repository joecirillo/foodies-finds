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
