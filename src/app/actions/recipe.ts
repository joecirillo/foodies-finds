"use server"

import { revalidatePath } from "next/cache"
import {
  addRecipe,
  updateRecipe,
  updateRecipeImage,
  presignRecipeImageUpload,
  deleteRecipeImage,
} from "@/lib/api"
import { ALLOWED_IMAGE_TYPES, IMAGE_TYPE_ERROR } from "@/lib/upload"
import type { SaveRecipeRequest, EditRecipeRequest, PresignedImageUpload } from "@/types/recipe"

type ActionResult = { ok: true; id: number } | { ok: false; error: string }
type PresignResult = ({ ok: true } & PresignedImageUpload) | { ok: false; error: string }

export const presignRecipeImageUploadAction = async (
  contentType: string,
  contentLength: number,
): Promise<PresignResult> => {
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    return { ok: false, error: IMAGE_TYPE_ERROR }
  }
  console.log("Requesting presigned upload URL:", "type:", contentType, "size:", contentLength)

  try {
    const presigned = await presignRecipeImageUpload(contentType, contentLength)
    console.log("Presigned upload URL created:", presigned.key)
    return { ok: true, ...presigned }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to prepare image upload. Please try again."
    console.error("Failed to presign image upload:", message)
    return { ok: false, error: message }
  }
}

// Best-effort: the recipe already exists by the time this runs (create flow), so a failure
// here shouldn't be treated as fatal by the caller — the recipe is saved either way.
export const attachRecipeImageAction = async (
  id: number,
  imageUrl: string,
): Promise<{ ok: boolean }> => {
  try {
    await updateRecipeImage(id, imageUrl)
    console.log("Image attached to recipe:", id, imageUrl)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to attach image"
    console.error("Failed to attach image to recipe:", id, message)
    return { ok: false }
  }
}

export const deleteRecipeImageAction = async (imageUrlOrKey: string): Promise<void> => {
  console.log("Deleting image:", imageUrlOrKey)
  await deleteRecipeImage(imageUrlOrKey)
    .then(() => console.log("Image deleted successfully:", imageUrlOrKey))
    .catch((err) => {
      const message = err instanceof Error ? err.message : "Failed to delete image"
      console.error("Failed to delete image:", imageUrlOrKey, message)
    })
}

export const addRecipeAction = async (payload: SaveRecipeRequest): Promise<ActionResult> => {
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
  payload: EditRecipeRequest,
): Promise<ActionResult> => {
  const changedFields = Object.keys(payload)
  console.log("Updating recipe:", id, "fields:", changedFields)
  try {
    const result = await updateRecipe(id, payload)
    const resultId = result?.id
    if (!resultId) {
      console.error("Recipe update returned no ID:", id, "fields:", changedFields)
      return { ok: false, error: "Recipe was updated but no ID was returned" }
    }
    console.log("Recipe updated:", resultId, "fields:", changedFields)
    revalidatePath(`/recipe/${resultId}`)
    return { ok: true, id: resultId }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    const message = err instanceof Error ? err.message : "Failed to update recipe"
    console.error("Failed to update recipe:", id, "fields:", changedFields, "code:", code, message)
    if (code === "500") {
      return { ok: false, error: "Something went wrong on our end. Please try again." }
    }
    return { ok: false, error: message }
  }
}
