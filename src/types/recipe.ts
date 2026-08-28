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
  quantity: number | null
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
  createdAt: string
  updatedAt: string
}
