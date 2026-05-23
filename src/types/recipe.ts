export type ApiResponse<T> = {
  timeStamp: string
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
  quantity: number
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

export type CreateIngredientInput = {
  id: null
  name: string
  unitId: number | null
  quantity: number
  notes: string | null
}

export type CreateStepInput = {
  stepNumber: number
  description: string
  tip: string | null
}

export type CreateRecipePayload = {
  name: string
  description: string | null
  calories: number | null
  servings: number | null
  cookingTime: number
  preparationTime: number
  cuisine: { id: number; name: string } | null
  tags: { id: number | null; name: string }[]
  author: string | null
  ingredients: CreateIngredientInput[]
  steps: CreateStepInput[]
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
