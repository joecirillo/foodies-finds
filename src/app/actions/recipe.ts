"use server"

import { revalidatePath } from "next/cache"
import { addRecipe, updateRecipe, uploadRecipeImage, deleteRecipeImage } from "@/lib/api"
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
    return { ok: false, error: "File must be jpeg, png, heic, webp, or gif" }
  }
  console.log("Uploading image file:", file.name, "type:", file.type, "size:", file.size)

  try {
    const imageUrl = await uploadRecipeImage(file)
    console.log("Image uploaded successfully:", imageUrl)
    return { ok: true, imageUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image. Please try again."
    console.error("Failed to upload image:", file.name, message)
    return { ok: false, error: message }
  }
}

export const deleteRecipeImageAction = async (imageUrl: string): Promise<void> => {
  console.log("Deleting image:", imageUrl)
  await deleteRecipeImage(imageUrl)
    .then(() => console.log("Image deleted successfully:", imageUrl))
    .catch((err) => {
      const message = err instanceof Error ? err.message : "Failed to delete image"
      console.error("Failed to delete image:", imageUrl, message)
    })
}

export const addRecipeAction = async (payload: AddRecipePayload): Promise<ActionResult> => {
  console.log("Saving new recipe:", payload.name)
  try {
    const result = await addRecipe(payload)
    const id = result?.id
    if (!id) {
      console.error("Recipe save returned no ID:", payload.name)
      return { ok: false, error: "Recipe was saved but no ID was returned" }
    }
    console.log("Recipe saved:", id, payload.name)
    return { ok: true, id }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    const message = err instanceof Error ? err.message : "Failed to save recipe"
    console.error("Failed to save recipe:", payload.name, "code:", code, message)
    if (code === "500") {
      return { ok: false, error: "Something went wrong on our end. Please try again." }
    }
    return { ok: false, error: message }
  }
}

export const updateRecipeAction = async (
  id: number,
  payload: AddRecipePayload,
): Promise<ActionResult> => {
  console.log("Updating recipe:", id, payload.name)
  try {
    const result = await updateRecipe(id, payload)
    const resultId = result?.id
    if (!resultId) {
      console.error("Recipe update returned no ID:", id, payload.name)
      return { ok: false, error: "Recipe was updated but no ID was returned" }
    }
    console.log("Recipe updated:", resultId, payload.name)
    revalidatePath(`/recipe/${resultId}`)
    return { ok: true, id: resultId }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    const message = err instanceof Error ? err.message : "Failed to update recipe"
    console.error("Failed to update recipe:", id, payload.name, "code:", code, message)
    if (code === "500") {
      return { ok: false, error: "Something went wrong on our end. Please try again." }
    }
    return { ok: false, error: message }
  }
}
