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

export type AddIngredientInput = {
  id: null
  name: string
  unitId: number | null
  quantity: number | null
  notes: string | null
}

export type AddStepInput = {
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

export type AddRecipePayload = {
  name: string
  description: string | null
  calories: number | null
  servings: number | null
  cookingTime: number
  preparationTime: number
  cuisine: { id: number | null; name: string } | null
  tags: { id: number | null; name: string }[]
  author: string | null
  ingredients: AddIngredientInput[]
  steps: AddStepInput[]
  imageUrl: string | null
}

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
