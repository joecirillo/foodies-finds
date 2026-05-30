// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditRecipeForm } from "./EditRecipeForm"
import type { Recipe } from "@/types/recipe"

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("@/app/actions/recipe", () => ({
  updateRecipeAction: vi.fn(),
}))

import { useRouter } from "next/navigation"
import { updateRecipeAction } from "@/app/actions/recipe"

const mockUseRouter = vi.mocked(useRouter)
const mockUpdateRecipeAction = vi.mocked(updateRecipeAction)

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

window.HTMLElement.prototype.scrollIntoView = vi.fn()

let mockPush: ReturnType<typeof vi.fn>
let mockRefresh: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockPush = vi.fn()
  mockRefresh = vi.fn()
  mockUseRouter.mockReturnValue({
    push: mockPush,
    refresh: mockRefresh,
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  } as ReturnType<typeof useRouter>)
  mockUpdateRecipeAction.mockReset()

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("EditRecipeForm", () => {
  describe("initial render", () => {
    it("pre-populates the name field", () => {
      render(<EditRecipeForm recipe={baseRecipe} />)
      expect(screen.getByDisplayValue("Spaghetti Bolognese")).toBeInTheDocument()
    })

    it("pre-populates numeric fields", () => {
      render(<EditRecipeForm recipe={baseRecipe} />)
      expect(screen.getByDisplayValue("15")).toBeInTheDocument() // prep time
      expect(screen.getByDisplayValue("30")).toBeInTheDocument() // cook time
    })

    it("renders the existing cuisine as a chip", () => {
      render(<EditRecipeForm recipe={baseRecipe} />)
      expect(screen.getByText("Italian")).toBeInTheDocument()
    })

    it("renders existing tags as chips", () => {
      render(<EditRecipeForm recipe={baseRecipe} />)
      expect(screen.getByText("pasta")).toBeInTheDocument()
    })

    it("renders pre-populated ingredient rows", () => {
      render(<EditRecipeForm recipe={baseRecipe} />)
      expect(screen.getByText("Ingredient 1")).toBeInTheDocument()
      expect(screen.getByDisplayValue("spaghetti")).toBeInTheDocument()
    })

    it("renders pre-populated step rows", () => {
      render(<EditRecipeForm recipe={baseRecipe} />)
      expect(screen.getByDisplayValue("Boil the pasta")).toBeInTheDocument()
    })
  })

  describe("validation", () => {
    it("shows error when name is empty", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.clear(screen.getByDisplayValue("Spaghetti Bolognese"))
      await user.click(screen.getAllByText("Save Changes")[0])

      expect(screen.getByText("Recipe name is required", { selector: "li" })).toBeInTheDocument()
    })

    it("shows error when prep time is empty", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.clear(screen.getByDisplayValue("15"))
      await user.click(screen.getAllByText("Save Changes")[0])

      expect(
        screen.getByText("Preparation time must be at least 1 minute", { selector: "li" })
      ).toBeInTheDocument()
    })

    it("shows error when prep time is less than 1", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      const prepInput = screen.getByDisplayValue("15")
      await user.clear(prepInput)
      await user.type(prepInput, "0")
      await user.click(screen.getAllByText("Save Changes")[0])

      expect(
        screen.getByText("Preparation time must be at least 1 minute", { selector: "li" })
      ).toBeInTheDocument()
    })

    it("shows error when no valid ingredients exist", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={{ ...baseRecipe, ingredients: [] }} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      expect(
        screen.getByText("At least one ingredient with a name and quantity is required", {
          selector: "li",
        })
      ).toBeInTheDocument()
    })

    it("shows error when no valid steps exist", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={{ ...baseRecipe, steps: [] }} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      expect(
        screen.getByText("At least one step with a description is required", { selector: "li" })
      ).toBeInTheDocument()
    })

    it("does not call updateRecipeAction when validation fails", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.clear(screen.getByDisplayValue("Spaghetti Bolognese"))
      await user.click(screen.getAllByText("Save Changes")[0])

      expect(mockUpdateRecipeAction).not.toHaveBeenCalled()
    })
  })

  describe("submission", () => {
    it("calls updateRecipeAction with the recipe id and transformed payload", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockUpdateRecipeAction).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: "Spaghetti Bolognese",
            preparationTime: 15,
            cookingTime: 30,
            ingredients: [
              expect.objectContaining({ name: "spaghetti", quantity: 200 }),
            ],
            steps: [
              expect.objectContaining({
                stepNumber: 1,
                description: "Boil the pasta",
              }),
            ],
          })
        )
      })
    })

    it("redirects to the recipe page on success", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/recipe/1")
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it("shows the error message returned by the action on failure", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({
        ok: false,
        error: "Something went wrong on the server",
      })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(
          screen.getByText("Something went wrong on the server")
        ).toBeInTheDocument()
      })
    })

    it("does not redirect when the action fails", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({
        ok: false,
        error: "Error",
      })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => expect(mockUpdateRecipeAction).toHaveBeenCalled())
      expect(mockPush).not.toHaveBeenCalled()
    })

    it("lowercases ingredient names in the submitted payload", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      const recipe: Recipe = {
        ...baseRecipe,
        ingredients: [
          {
            id: 1,
            name: "Spaghetti",
            quantity: 200,
            notes: null,
            unitId: null,
            unitName: null,
            abbreviation: null,
          },
        ],
      }
      render(<EditRecipeForm recipe={recipe} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockUpdateRecipeAction).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            ingredients: [expect.objectContaining({ name: "spaghetti" })],
          })
        )
      })
    })

    it("applies sentence case to step descriptions in the submitted payload", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      const recipe: Recipe = {
        ...baseRecipe,
        steps: [
          { stepId: 1, stepNumber: 1, description: "boil the pasta", tip: null },
        ],
      }
      render(<EditRecipeForm recipe={recipe} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockUpdateRecipeAction).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            steps: [expect.objectContaining({ description: "Boil the pasta" })],
          })
        )
      })
    })
  })

  describe("ingredients", () => {
    it("adds a new ingredient row when 'Add Ingredient' is clicked", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      expect(screen.getByText("Ingredient 1")).toBeInTheDocument()
      expect(screen.queryByText("Ingredient 2")).not.toBeInTheDocument()

      await user.click(screen.getByText("Add Ingredient"))

      expect(screen.getByText("Ingredient 2")).toBeInTheDocument()
    })

    it("removes an ingredient row when the remove button is clicked", async () => {
      const user = userEvent.setup()
      const recipe: Recipe = {
        ...baseRecipe,
        ingredients: [
          ...baseRecipe.ingredients,
          {
            id: 2,
            name: "salt",
            quantity: 1,
            notes: null,
            unitId: null,
            unitName: null,
            abbreviation: null,
          },
        ],
      }
      render(<EditRecipeForm recipe={recipe} />)

      expect(screen.getByText("Ingredient 2")).toBeInTheDocument()

      const removeButtons = screen.getAllByLabelText("Remove ingredient")
      await user.click(removeButtons[0])

      expect(screen.queryByText("Ingredient 2")).not.toBeInTheDocument()
    })

    it("does not show remove button when only one ingredient exists", () => {
      render(<EditRecipeForm recipe={baseRecipe} />)
      expect(screen.queryByLabelText("Remove ingredient")).not.toBeInTheDocument()
    })
  })

  describe("steps", () => {
    it("adds a new step when 'Add Step' is clicked", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      expect(screen.getAllByPlaceholderText("Describe this step…")).toHaveLength(1)

      await user.click(screen.getByText("Add Step"))

      expect(screen.getAllByPlaceholderText("Describe this step…")).toHaveLength(2)
    })

    it("removes a step when the remove button is clicked", async () => {
      const user = userEvent.setup()
      const recipe: Recipe = {
        ...baseRecipe,
        steps: [
          ...baseRecipe.steps,
          { stepId: 2, stepNumber: 2, description: "Add the sauce", tip: null },
        ],
      }
      render(<EditRecipeForm recipe={recipe} />)

      expect(screen.getAllByPlaceholderText("Describe this step…")).toHaveLength(2)

      const removeButtons = screen.getAllByLabelText("Remove step")
      await user.click(removeButtons[0])

      expect(screen.getAllByPlaceholderText("Describe this step…")).toHaveLength(1)
    })

    it("does not show remove button when only one step exists", () => {
      render(<EditRecipeForm recipe={baseRecipe} />)
      expect(screen.queryByLabelText("Remove step")).not.toBeInTheDocument()
    })
  })

  describe("cuisine", () => {
    it("shows cuisine search input when no cuisine is selected", () => {
      render(<EditRecipeForm recipe={{ ...baseRecipe, cuisine: null }} />)
      expect(screen.getByPlaceholderText("Search cuisines…")).toBeInTheDocument()
    })

    it("removes selected cuisine and shows search input when remove is clicked", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      expect(screen.getByText("Italian")).toBeInTheDocument()

      await user.click(screen.getByLabelText("Remove cuisine"))

      expect(screen.queryByText("Italian")).not.toBeInTheDocument()
      expect(screen.getByPlaceholderText("Search cuisines…")).toBeInTheDocument()
    })
  })

  describe("tags", () => {
    it("removes a tag when its remove button is clicked", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      expect(screen.getByText("pasta")).toBeInTheDocument()

      await user.click(screen.getByLabelText("Remove tag pasta"))

      expect(screen.queryByText("pasta")).not.toBeInTheDocument()
    })
  })
})
