"use server"

import { addRecipe } from "@/lib/api"
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
    const message = err instanceof Error ? err.message : "Failed to save recipe"
    return { ok: false, error: message }
  }
}
