import { formatQuantityInput } from "@/lib/parse-quantity"
import type {
  EntityOption,
  IngredientRow,
  RecipeFormValues,
  RecipeImportPreview,
  RecipeIngredientInput,
  RecipeStepInput,
  StepRow,
} from "@/types/recipe"

const toInputText = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value)

const emptyIngredientRow = (key: number): IngredientRow => ({
  key,
  name: "",
  unitId: null,
  quantityText: "",
  notes: "",
  searchResults: [],
  dropdownOpen: false,
})

const emptyStepRow = (key: number): StepRow => ({ key, description: "", tip: "" })

const toIngredientRow = (ingredient: RecipeIngredientInput, key: number): IngredientRow => ({
  ...emptyIngredientRow(key),
  name: ingredient.name,
  unitId: ingredient.unitId,
  quantityText: formatQuantityInput(ingredient.quantity),
  notes: ingredient.notes ?? "",
})

const toStepRow = (step: RecipeStepInput, key: number): StepRow => ({
  key,
  description: step.description,
  tip: step.tip ?? "",
})

const byStepNumber = (a: RecipeStepInput, b: RecipeStepInput) => a.stepNumber - b.stepNumber

export const emptyRecipeFormValues = (): RecipeFormValues => ({
  name: "",
  description: "",
  author: "",
  preparationTime: "",
  cookingTime: "",
  servings: "",
  calories: "",
  cuisine: null,
  tags: [],
  ingredients: [emptyIngredientRow(0)],
  steps: [emptyStepRow(0)],
  imageUrl: null,
  sourceUrl: null,
})

export const previewToRecipeFormValues = ({
  recipe,
  source,
}: RecipeImportPreview): RecipeFormValues => {
  const ingredients = recipe.ingredients ?? []
  const steps = [...(recipe.steps ?? [])].sort(byStepNumber)

  return {
    name: recipe.name ?? "",
    description: recipe.description ?? "",
    author: recipe.author ?? source.originalAuthor ?? "",
    preparationTime: toInputText(recipe.preparationTime),
    cookingTime: toInputText(recipe.cookingTime),
    servings: toInputText(recipe.servings),
    calories: "",
    cuisine: recipe.cuisine ?? null,
    tags: recipe.tags ?? [],
    ingredients: ingredients.length ? ingredients.map(toIngredientRow) : [emptyIngredientRow(0)],
    steps: steps.length ? steps.map(toStepRow) : [emptyStepRow(0)],
    imageUrl: recipe.imageUrl ?? null,
    sourceUrl: source.sourceUrl,
  }
}

const comparableEntity = (entity: EntityOption) => [entity.id, entity.name]

const comparableValues = (values: RecipeFormValues) => [
  values.name,
  values.description,
  values.author,
  values.preparationTime,
  values.cookingTime,
  values.servings,
  values.calories,
  values.cuisine && comparableEntity(values.cuisine),
  values.tags.map(comparableEntity),
  values.ingredients.map((row) => [row.name, row.unitId, row.quantityText, row.notes]),
  values.steps.map((row) => [row.description, row.tip]),
  values.imageUrl,
  values.sourceUrl,
]

export const formValuesDiffer = (a: RecipeFormValues, b: RecipeFormValues) =>
  JSON.stringify(comparableValues(a)) !== JSON.stringify(comparableValues(b))
