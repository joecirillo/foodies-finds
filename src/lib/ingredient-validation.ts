import { parseQuantity } from "@/lib/parse-quantity"
import type { IngredientRow } from "@/types/recipe"

const quantityError = (quantityText: string) => {
  const quantity = parseQuantity(quantityText)
  if (quantity === null) return null
  if (Number.isNaN(quantity)) return "Enter a number like 2, 0.5 or 1 1/2"
  if (quantity <= 0) return "Quantity must be greater than zero"
  return null
}

export const validateIngredients = (
  ingredients: Pick<IngredientRow, "name" | "quantityText" | "unitId">[],
): Record<string, string> => {
  const errors: Record<string, string> = {}
  if (!ingredients.some((ingredient) => ingredient.name.trim())) {
    errors.ingredients = "At least one named ingredient is required"
  }
  ingredients.forEach((ingredient, index) => {
    if (!ingredient.name.trim()) return
    const quantityMessage = quantityError(ingredient.quantityText)
    if (quantityMessage) {
      errors[`ingredient-${index}-quantity`] = quantityMessage
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
