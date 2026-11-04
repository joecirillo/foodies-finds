import type { IngredientRow } from "@/types/recipe"

export const validateIngredients = (
  ingredients: Pick<IngredientRow, "name" | "quantity" | "unitId">[],
): Record<string, string> => {
  const errors: Record<string, string> = {}
  if (!ingredients.some((ingredient) => ingredient.name.trim())) {
    errors.ingredients = "At least one named ingredient is required"
  }
  ingredients.forEach((ingredient, index) => {
    if (!ingredient.name.trim()) return
    if (
      ingredient.quantity !== null &&
      (!Number.isFinite(ingredient.quantity) || ingredient.quantity <= 0)
    ) {
      errors[`ingredient-${index}-quantity`] = "Quantity must be greater than zero"
    }
    if (
      ingredient.unitId !== null &&
      (!Number.isSafeInteger(ingredient.unitId) || ingredient.unitId <= 0)
    ) {
      errors[`ingredient-${index}-unit`] = "Select a valid unit or leave it blank"
    }
  })
  return errors
}
