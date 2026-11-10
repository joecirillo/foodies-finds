import { describe, it, expect } from "vitest"
import { emptyRecipeFormValues } from "@/lib/recipe-import/recipe-form-values"
import { validateRecipeForm } from "./recipe-form-validation"

const validValues = () => ({
  ...emptyRecipeFormValues(),
  name: "Soup",
  preparationTime: "10",
  servings: "4",
  cuisine: { id: 1, name: "Italian" },
  ingredients: [{ ...emptyRecipeFormValues().ingredients[0], name: "Stock" }],
  steps: [{ key: 0, description: "Simmer", tip: "" }],
})

describe("validateRecipeForm", () => {
  it("accepts a complete recipe", () => {
    expect(validateRecipeForm(validValues())).toEqual({})
  })

  it("flags every missing required field on an empty form", () => {
    expect(Object.keys(validateRecipeForm(emptyRecipeFormValues()))).toEqual([
      "name",
      "preparationTime",
      "servings",
      "cuisine",
      "ingredients",
      "steps",
    ])
  })

  it.each([
    ["preparationTime", "0"],
    ["servings", "0"],
    ["cookingTime", "-1"],
  ])("rejects %s of %j", (field, value) => {
    expect(validateRecipeForm({ ...validValues(), [field]: value })).toHaveProperty(field)
  })

  it("includes row-level ingredient errors", () => {
    const values = validValues()
    values.ingredients.push({ ...values.ingredients[0], key: 1, name: "", notes: "diced" })

    expect(validateRecipeForm(values)).toEqual({
      "ingredient-1-name": "Name this ingredient or remove the row",
    })
  })
})
