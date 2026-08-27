import { describe, it, expect } from "vitest"
import { diffRecipeForUpdate } from "./recipe-diff"
import type { Recipe, SaveRecipeRequest } from "@/types/recipe"

const baseRecipe: Recipe = {
  id: 1,
  name: "Spaghetti Bolognese",
  description: "A hearty Italian classic",
  calories: 600,
  servings: 4,
  cookingTime: 30,
  preparationTime: 15,
  cuisine: { id: 1, name: "Italian" },
  tags: [{ id: 1, name: "pasta" }],
  author: "Chef Joe",
  ingredients: [
    {
      id: 1,
      name: "spaghetti",
      quantity: 200,
      notes: null,
      unitId: null,
      unitName: null,
      abbreviation: null,
    },
  ],
  steps: [{ stepId: 1, stepNumber: 1, description: "Boil the pasta", tip: null }],
  imageUrl: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
}

const unchangedPayload: SaveRecipeRequest = {
  name: "Spaghetti Bolognese",
  description: "A hearty Italian classic",
  calories: 600,
  servings: 4,
  cookingTime: 30,
  preparationTime: 15,
  cuisine: { id: 1, name: "Italian" },
  tags: [{ id: 1, name: "pasta" }],
  author: "Chef Joe",
  ingredients: [{ id: null, name: "spaghetti", unitId: null, quantity: 200, notes: null }],
  steps: [{ stepNumber: 1, description: "Boil the pasta", tip: null }],
  imageUrl: null,
}

describe("diffRecipeForUpdate", () => {
  it("returns an empty object when nothing changed", () => {
    expect(diffRecipeForUpdate(baseRecipe, unchangedPayload)).toEqual({})
  })

  it("includes only the name when just the name changed", () => {
    const next = { ...unchangedPayload, name: "Spaghetti Carbonara" }
    expect(diffRecipeForUpdate(baseRecipe, next)).toEqual({ name: "Spaghetti Carbonara" })
  })

  it("nullifies a scalar field that was cleared", () => {
    const next = { ...unchangedPayload, description: null }
    expect(diffRecipeForUpdate(baseRecipe, next)).toEqual({ description: null })
  })

  it("includes cuisine when it changed", () => {
    const next = { ...unchangedPayload, cuisine: { id: null, name: "Mexican" } }
    expect(diffRecipeForUpdate(baseRecipe, next)).toEqual({
      cuisine: { id: null, name: "Mexican" },
    })
  })

  it("includes tags when the set changed", () => {
    const next = {
      ...unchangedPayload,
      tags: [
        { id: 1, name: "pasta" },
        { id: null, name: "quick" },
      ],
    }
    expect(diffRecipeForUpdate(baseRecipe, next)).toEqual({ tags: next.tags })
  })

  it("includes ingredients as a whole array when any ingredient value changed", () => {
    const next = {
      ...unchangedPayload,
      ingredients: [{ id: null, name: "spaghetti", unitId: null, quantity: 250, notes: null }],
    }
    expect(diffRecipeForUpdate(baseRecipe, next)).toEqual({ ingredients: next.ingredients })
  })

  it("includes steps when reordered even if content is the same set", () => {
    const recipe: Recipe = {
      ...baseRecipe,
      steps: [
        { stepId: 1, stepNumber: 1, description: "Boil the pasta", tip: null },
        { stepId: 2, stepNumber: 2, description: "Add the sauce", tip: null },
      ],
    }
    const payload: SaveRecipeRequest = {
      ...unchangedPayload,
      steps: [
        { stepNumber: 1, description: "Boil the pasta", tip: null },
        { stepNumber: 2, description: "Add the sauce", tip: null },
      ],
    }
    const reordered = {
      ...payload,
      steps: [
        { stepNumber: 1, description: "Add the sauce", tip: null },
        { stepNumber: 2, description: "Boil the pasta", tip: null },
      ],
    }
    expect(diffRecipeForUpdate(recipe, reordered)).toEqual({ steps: reordered.steps })
  })

  it("includes multiple changed fields together", () => {
    const next = { ...unchangedPayload, name: "New Name", servings: 6 }
    expect(diffRecipeForUpdate(baseRecipe, next)).toEqual({ name: "New Name", servings: 6 })
  })
})
