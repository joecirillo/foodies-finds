import { describe, it, expect } from "vitest"
import type { RecipeImportPreview } from "@/types/recipe"
import {
  emptyRecipeFormValues,
  formValuesDiffer,
  previewToRecipeFormValues,
} from "./recipe-form-values"

const source: RecipeImportPreview["source"] = {
  sourceUrl: "https://www.seriouseats.com/tomato-soup",
  originalAuthor: "Kenji",
  originalIngredientLines: ["2 cups stock", "1 onion"],
  originalYield: "4 servings",
  recipeCount: 1,
}

describe("previewToRecipeFormValues", () => {
  it("maps every supported field into form-safe values", () => {
    const values = previewToRecipeFormValues({
      recipe: {
        name: "Tomato Soup",
        description: "Rich and simple",
        cookingTime: 30,
        preparationTime: 10,
        servings: 4,
        cuisine: { id: null, name: "Italian" },
        tags: [{ id: null, name: "soup" }],
        author: "Kenji",
        imageUrl: "https://images.example.com/soup.jpg",
        ingredients: [
          { id: null, name: "2 cups stock", quantity: null, unitId: null, notes: null },
          { id: null, name: "Onion", quantity: 1.5, unitId: 3, notes: "diced" },
        ],
        steps: [
          { stepNumber: 2, description: "Simmer", tip: null },
          { stepNumber: 1, description: "Chop", tip: "Use a sharp knife" },
        ],
      },
      source,
      warnings: [],
    })

    expect(values).toMatchObject({
      name: "Tomato Soup",
      description: "Rich and simple",
      author: "Kenji",
      preparationTime: "10",
      cookingTime: "30",
      servings: "4",
      calories: "",
      cuisine: { id: null, name: "Italian" },
      tags: [{ id: null, name: "soup" }],
      imageUrl: "https://images.example.com/soup.jpg",
      sourceUrl: "https://www.seriouseats.com/tomato-soup",
    })
    expect(
      values.ingredients.map(({ name, quantityText, unitId, notes }) => ({
        name,
        quantityText,
        unitId,
        notes,
      })),
    ).toEqual([
      { name: "2 cups stock", quantityText: "", unitId: null, notes: "" },
      { name: "Onion", quantityText: "1.5", unitId: 3, notes: "diced" },
    ])
    expect(values.steps.map(({ description, tip }) => ({ description, tip }))).toEqual([
      { description: "Chop", tip: "Use a sharp knife" },
      { description: "Simmer", tip: "" },
    ])
  })

  it("gives every row a unique key", () => {
    const values = previewToRecipeFormValues({
      recipe: {
        ingredients: [
          { id: null, name: "a", quantity: null, unitId: null, notes: null },
          { id: null, name: "b", quantity: null, unitId: null, notes: null },
        ],
      },
      source,
      warnings: [],
    })

    expect(new Set(values.ingredients.map((row) => row.key)).size).toBe(2)
  })

  it("leaves missing required fields empty instead of inventing them", () => {
    const values = previewToRecipeFormValues({
      recipe: { cookingTime: null, preparationTime: null },
      source: { ...source, originalAuthor: null },
      warnings: [],
    })
    const empty = emptyRecipeFormValues()

    expect(values).toEqual({ ...empty, sourceUrl: source.sourceUrl })
  })

  it("falls back to the original author when the recipe author is missing", () => {
    const values = previewToRecipeFormValues({ recipe: {}, source, warnings: [] })

    expect(values.author).toBe("Kenji")
  })
})

describe("formValuesDiffer", () => {
  it("ignores row keys and search dropdown state", () => {
    const a = emptyRecipeFormValues()
    const b = emptyRecipeFormValues()
    b.ingredients = [
      { ...b.ingredients[0], key: 9, dropdownOpen: true, searchResults: [{ id: 1, name: "Salt" }] },
    ]
    b.steps = [{ ...b.steps[0], key: 4 }]

    expect(formValuesDiffer(a, b)).toBe(false)
  })

  it.each([
    ["a field", { name: "Soup" }],
    ["the image", { imageUrl: "https://images.example.com/a.jpg" }],
    ["a tag", { tags: [{ id: null, name: "quick" }] }],
  ])("detects a change to %s", (_, change) => {
    expect(
      formValuesDiffer(emptyRecipeFormValues(), { ...emptyRecipeFormValues(), ...change }),
    ).toBe(true)
  })

  it("detects an edited ingredient row", () => {
    const edited = emptyRecipeFormValues()
    edited.ingredients = [{ ...edited.ingredients[0], quantityText: "2" }]

    expect(formValuesDiffer(emptyRecipeFormValues(), edited)).toBe(true)
  })
})
