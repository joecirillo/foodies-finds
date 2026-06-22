"use server"

import { revalidatePath } from "next/cache"
import { addRecipe, updateRecipe } from "@/lib/api"
import type { AddRecipePayload } from "@/types/recipe"

type ActionResult = { ok: true; id: number } | { ok: false; error: string }
type UploadResult = { ok: true; imageUrl: string } | { ok: false; error: string }

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export const uploadRecipeImageAction = async (formData: FormData): Promise<UploadResult> => {
  const file = formData.get("file")
  if (!file || !(file instanceof Blob)) {
    return { ok: false, error: "No file provided" }
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: "File must be jpeg, png, webp, or gif" }
  }
  console.log("Uploading image file:", file.name, "type:", file.type, "size:", file.size)

  const upstream = new FormData()
  upstream.append("file", file)

  try {
    const res = await fetch(`${process.env.API_URL}/recipe/image`, {
      method: "POST",
      headers: { "x-api-key": process.env.API_KEY ?? "" },
      body: upstream,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      console.error("Failed to upload image:", body?.message ?? "Unknown error")
      return { ok: false, error: body?.message ?? "Failed to upload image. Please try again." }
    }
    const body = await res.json()
    return { ok: true, imageUrl: body.data ?? body.imageUrl }
  } catch {
    console.error("Failed to upload image due to network error")
    return { ok: false, error: "Failed to upload image. Please try again." }
  }
}

export const deleteRecipeImageAction = async (imageUrl: string): Promise<void> => {
  await fetch(`${process.env.API_URL}/recipe/image`, {
    method: "DELETE",
    headers: {
      "x-api-key": process.env.API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  }).catch(() => {})
}

export const addRecipeAction = async (payload: AddRecipePayload): Promise<ActionResult> => {
  try {
    const result = await addRecipe(payload)
    console.log("Recipe added with ID:", result)
    const id = result?.id
    if (!id) {
      return { ok: false, error: "Recipe was saved but no ID was returned" }
    }
    return { ok: true, id }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === "500") {
      return { ok: false, error: "Something went wrong on our end. Please try again." }
    }
    const message = err instanceof Error ? err.message : "Failed to save recipe"
    return { ok: false, error: message }
  }
}

export const updateRecipeAction = async (
  id: number,
  payload: AddRecipePayload,
): Promise<ActionResult> => {
  try {
    const result = await updateRecipe(id, payload)
    console.log("Recipe updated with ID:", result)
    const resultId = result?.id
    if (!resultId) {
      return { ok: false, error: "Recipe was updated but no ID was returned" }
    }
    revalidatePath(`/recipe/${resultId}`)
    return { ok: true, id: resultId }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === "500") {
      return { ok: false, error: "Something went wrong on our end. Please try again." }
    }
    const message = err instanceof Error ? err.message : "Failed to update recipe"
    return { ok: false, error: message }
  }
}
