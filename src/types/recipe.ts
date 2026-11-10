export type RecipeSearchResult = {
  id: number
  name: string
  imageUrl?: string
}

export type PresignedImageUpload = {
  uploadUrl: string
  key: string
  imageUrl: string
}

export type ApiResponse<T> = {
  timestamp: string
  status: string
  message: string
  data: T
}

export type Cuisine = {
  id: number
  name: string
}

export type Tag = {
  id: number
  name: string
}

export type EntityOption = {
  id: number | null
  name: string
}

export type Ingredient = {
  id: number
  name: string
  quantity: number | null
  notes: string | null
  unitId: number | null
  unitName: string | null
  abbreviation: string | null
}

export type Step = {
  stepId: number
  stepNumber: number
  description: string
  tip: string | null
}

export type Unit = {
  id: number
  name: string
  abbreviation: string
}

export type RecipeIngredientInput = {
  id: null
  name: string
  unitId: number | null
  quantity: number | null
  notes: string | null
}

export type RecipeStepInput = {
  stepNumber: number
  description: string
  tip: string | null
}

export type IngredientRow = {
  key: number
  name: string
  unitId: number | null
  quantityText: string
  notes: string
  searchResults: { id: number; name: string }[]
  dropdownOpen: boolean
}

export type StepRow = {
  key: number
  description: string
  tip: string
}

// Sent on create (POST /recipes) — every field is required by the form, since a new
// recipe has no prior state to fall back on.
export type SaveRecipeRequest = {
  name: string
  description: string | null
  calories: number
  servings: number | null
  cookingTime: number
  preparationTime: number
  cuisine: { id: number | null; name: string } | null
  tags: { id: number | null; name: string }[]
  author: string | null
  ingredients: RecipeIngredientInput[]
  steps: RecipeStepInput[]
  imageUrl: string | null
  sourceUrl?: string | null
}

// Sent on update (PATCH /recipes/:id) — only fields that actually changed are included;
// omitted keys are left untouched by the API, per its partial-update semantics.
export type EditRecipeRequest = Partial<SaveRecipeRequest>

export type Recipe = {
  id: number | null
  name: string
  description: string | null
  calories: number | null
  servings: number | null
  cookingTime: number
  preparationTime: number
  cuisine: Cuisine | null
  tags: Tag[]
  author: string | null
  ingredients: Ingredient[]
  steps: Step[]
  imageUrl: string | null
  sourceUrl: string | null
  createdAt: string
  updatedAt: string
}

export type ImportErrorCode =
  | "INVALID_URL"
  | "SOURCE_NOT_ALLOWED"
  | "FETCH_FAILED"
  | "SOURCE_HTTP_ERROR"
  | "FETCH_TIMEOUT"
  | "SOURCE_BLOCKED"
  | "RESPONSE_TOO_LARGE"
  | "UNSUPPORTED_CONTENT_TYPE"
  | "NO_RECIPE_FOUND"

export type RecipeImportWarning = {
  code:
    | "INVALID_FIELD"
    | "INVALID_DURATION"
    | "AMBIGUOUS_YIELD"
    | "UNSUPPORTED_YIELD"
    | "INVALID_IMAGE_URL"
    | "MULTIPLE_RECIPES"
    | "SAVE_LIMIT_EXCEEDED"
    | "BELOW_SAVE_MINIMUM"
  field?: string
  message: string
}

export type RecipeImportPreview = {
  recipe: {
    name?: string
    description?: string
    cookingTime?: number | null
    preparationTime?: number | null
    servings?: number
    cuisine?: { id: null; name: string }
    tags?: { id: null; name: string }[]
    author?: string
    imageUrl?: string
    ingredients?: RecipeIngredientInput[]
    steps?: RecipeStepInput[]
  }
  source: {
    sourceUrl: string
    originalAuthor: string | null
    originalIngredientLines: string[]
    originalYield: string | null
    recipeCount: number
  }
  warnings: RecipeImportWarning[]
}

export type RecipeImportContext = Pick<RecipeImportPreview, "source" | "warnings">

export type RecipeFormValues = {
  name: string
  description: string
  author: string
  preparationTime: string
  cookingTime: string
  servings: string
  calories: string
  cuisine: EntityOption | null
  tags: EntityOption[]
  ingredients: IngredientRow[]
  steps: StepRow[]
  imageUrl: string | null
  sourceUrl: string | null
}
