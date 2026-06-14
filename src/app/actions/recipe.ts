"use server"

import { revalidatePath } from "next/cache"
import { addRecipe, updateRecipe } from "@/lib/api"
import type { AddRecipePayload } from "@/types/recipe"

type ActionResult = { ok: true; id: number } | { ok: false; error: string }

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
