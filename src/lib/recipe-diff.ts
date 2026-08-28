import type { EditRecipeRequest, Recipe, SaveRecipeRequest } from "@/types/recipe"

function toComparablePayload(recipe: Recipe): SaveRecipeRequest {
  return {
    name: recipe.name,
    description: recipe.description,
    calories: recipe.calories ?? 0,
    servings: recipe.servings,
    cookingTime: recipe.cookingTime,
    preparationTime: recipe.preparationTime,
    cuisine: recipe.cuisine ? { id: recipe.cuisine.id, name: recipe.cuisine.name } : null,
    tags: recipe.tags.map((tag) => ({ id: tag.id, name: tag.name })),
    author: recipe.author,
    ingredients: recipe.ingredients.map((ingredient) => ({
      id: null,
      name: ingredient.name,
      unitId: ingredient.unitId,
      quantity: ingredient.quantity,
      notes: ingredient.notes,
    })),
    steps: [...recipe.steps]
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((step, index) => ({
        stepNumber: index + 1,
        description: step.description,
        tip: step.tip,
      })),
    imageUrl: recipe.imageUrl,
  }
}

function setIfChanged<K extends keyof SaveRecipeRequest>(
  diff: EditRecipeRequest,
  key: K,
  before: SaveRecipeRequest,
  next: SaveRecipeRequest,
) {
  if (JSON.stringify(before[key]) !== JSON.stringify(next[key])) {
    diff[key] = next[key]
  }
}

const RECIPE_KEYS: (keyof SaveRecipeRequest)[] = [
  "name",
  "description",
  "calories",
  "servings",
  "cookingTime",
  "preparationTime",
  "cuisine",
  "tags",
  "author",
  "ingredients",
  "steps",
  "imageUrl",
]

// PATCH /recipes/:id treats an omitted field as "unchanged" and an included field as a full
// replacement (arrays are clear+replace, not merged) — so this only includes keys whose value
// actually differs from the recipe as loaded, rather than always sending the full form state.
export function diffRecipeForUpdate(original: Recipe, next: SaveRecipeRequest): EditRecipeRequest {
  const before = toComparablePayload(original)
  const diff: EditRecipeRequest = {}
  RECIPE_KEYS.forEach((key) => setIfChanged(diff, key, before, next))
  return diff
}
