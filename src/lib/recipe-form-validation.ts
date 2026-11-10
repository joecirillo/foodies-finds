import { validateIngredients } from "@/lib/ingredient-validation"
import type { RecipeFormValues } from "@/types/recipe"

type ValidatedRecipeFields = Pick<
  RecipeFormValues,
  "name" | "preparationTime" | "cookingTime" | "servings" | "cuisine" | "ingredients" | "steps"
>

export const validateRecipeForm = (values: ValidatedRecipeFields): Record<string, string> => {
  const errors: Record<string, string> = {}

  if (!values.name.trim()) errors.name = "Recipe name is required"

  const prepTime = parseInt(values.preparationTime)
  if (!values.preparationTime || isNaN(prepTime) || prepTime < 1)
    errors.preparationTime = "Preparation time must be at least 1 minute"

  const cookTime = parseInt(values.cookingTime)
  if (values.cookingTime !== "" && (isNaN(cookTime) || cookTime < 0))
    errors.cookingTime = "Cooking time must be 0 or more"

  const servings = parseInt(values.servings)
  if (!values.servings || isNaN(servings) || servings < 1) errors.servings = "Servings is required"

  if (!values.cuisine) errors.cuisine = "Cuisine is required"

  Object.assign(errors, validateIngredients(values.ingredients))

  if (!values.steps.some((step) => step.description.trim()))
    errors.steps = "At least one step with a description is required"

  return errors
}
