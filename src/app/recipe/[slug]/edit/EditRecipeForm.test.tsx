// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
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
  presignRecipeImageUploadAction: vi.fn(),
  deleteRecipeImageAction: vi.fn(),
}))

import { useRouter } from "next/navigation"
import {
  updateRecipeAction,
  presignRecipeImageUploadAction,
  deleteRecipeImageAction,
} from "@/app/actions/recipe"

const mockUseRouter = vi.mocked(useRouter)
const mockUpdateRecipeAction = vi.mocked(updateRecipeAction)
const mockPresignRecipeImageUploadAction = vi.mocked(presignRecipeImageUploadAction)
const mockDeleteRecipeImageAction = vi.mocked(deleteRecipeImageAction)

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
      name: "Spaghetti",
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
  mockPresignRecipeImageUploadAction.mockReset()
  mockDeleteRecipeImageAction.mockReset()

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }),
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
      expect(screen.getByDisplayValue("Spaghetti")).toBeInTheDocument()
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
        screen.getByText("Preparation time must be at least 1 minute", { selector: "li" }),
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
        screen.getByText("Preparation time must be at least 1 minute", { selector: "li" }),
      ).toBeInTheDocument()
    })

    it("shows error when no valid ingredients exist", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={{ ...baseRecipe, ingredients: [] }} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      expect(
        screen.getByText("At least one ingredient with a name and quantity is required", {
          selector: "li",
        }),
      ).toBeInTheDocument()
    })

    it("shows error when no valid steps exist", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={{ ...baseRecipe, steps: [] }} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      expect(
        screen.getByText("At least one step with a description is required", { selector: "li" }),
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
    it("sends an empty diff when nothing was changed", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockUpdateRecipeAction).toHaveBeenCalledWith(1, {})
      })
    })

    it("sends only the name field when only the name is changed", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      const nameInput = screen.getByDisplayValue("Spaghetti Bolognese")
      await user.clear(nameInput)
      await user.type(nameInput, "Spaghetti Carbonara")
      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockUpdateRecipeAction).toHaveBeenCalledWith(1, { name: "Spaghetti Carbonara" })
      })
    })

    it("omits ingredients and steps from the diff when only an unrelated field changed", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      const nameInput = screen.getByDisplayValue("Spaghetti Bolognese")
      await user.clear(nameInput)
      await user.type(nameInput, "Spaghetti Carbonara")
      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => expect(mockUpdateRecipeAction).toHaveBeenCalled())
      const [, payload] = mockUpdateRecipeAction.mock.calls[0]
      expect(payload).not.toHaveProperty("ingredients")
      expect(payload).not.toHaveProperty("steps")
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
        expect(screen.getByText("Something went wrong on the server")).toBeInTheDocument()
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

    it("title-cases ingredient names in the submitted payload", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      const recipe: Recipe = {
        ...baseRecipe,
        ingredients: [
          {
            id: 1,
            name: "extra-virgin olive oil",
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
            ingredients: [expect.objectContaining({ name: "Extra-Virgin Olive Oil" })],
          }),
        )
      })
    })

    it("sends 0 for calories when the field is cleared", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.clear(screen.getByDisplayValue("600"))
      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockUpdateRecipeAction).toHaveBeenCalledWith(1, { calories: 0 })
      })
    })

    it("applies sentence case to step descriptions in the submitted payload", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      const recipe: Recipe = {
        ...baseRecipe,
        steps: [{ stepId: 1, stepNumber: 1, description: "boil the pasta", tip: null }],
      }
      render(<EditRecipeForm recipe={recipe} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockUpdateRecipeAction).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            steps: [expect.objectContaining({ description: "Boil the pasta" })],
          }),
        )
      })
    })
  })

  describe("image upload", () => {
    const PRESIGNED = {
      ok: true as const,
      uploadUrl: "https://account.r2.cloudflarestorage.com/signed",
      key: "recipes/new-456.jpg",
      imageUrl: "https://cdn.foodiesfinds.com/recipes/new-456.jpg",
    }

    function stubFetch(putOk: boolean) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string, init?: RequestInit) => {
          if (url === PRESIGNED.uploadUrl && init?.method === "PUT") {
            return Promise.resolve({ ok: putOk, status: putOk ? 200 : 500 })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        }),
      )
    }

    async function selectImageFile(user: ReturnType<typeof userEvent.setup>) {
      const file = new File(["fake-image"], "photo.jpg", { type: "image/jpeg" })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(input, file)
    }

    it("shows a current-photo label without leaking the CDN url", () => {
      const imageUrl = "https://cdn.foodiesfinds.com/recipes/existing-123.jpg"
      render(<EditRecipeForm recipe={{ ...baseRecipe, imageUrl }} />)

      expect(screen.getByText("Current photo attached")).toBeInTheDocument()
      expect(screen.queryByText(imageUrl)).not.toBeInTheDocument()
      expect(document.body.textContent).not.toContain(imageUrl)
    })

    it("presigns and uploads to R2 before submitting the new image key", async () => {
      stubFetch(true)
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce(PRESIGNED)
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await selectImageFile(user)
      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockPresignRecipeImageUploadAction).toHaveBeenCalledWith(
          "image/jpeg",
          expect.any(Number),
        )
      })
      await waitFor(() => {
        expect(mockUpdateRecipeAction).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ imageUrl: PRESIGNED.key }),
        )
      })
    })

    it("deletes the old image once the recipe is updated with a new one", async () => {
      stubFetch(true)
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce(PRESIGNED)
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      const recipe = { ...baseRecipe, imageUrl: "https://cdn.foodiesfinds.com/recipes/old-123.jpg" }
      render(<EditRecipeForm recipe={recipe} />)

      await selectImageFile(user)
      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockDeleteRecipeImageAction).toHaveBeenCalledWith(
          "https://cdn.foodiesfinds.com/recipes/old-123.jpg",
        )
      })
    })

    it("does not delete anything when there was no previous image", async () => {
      stubFetch(true)
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce(PRESIGNED)
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await selectImageFile(user)
      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => expect(mockUpdateRecipeAction).toHaveBeenCalled())
      expect(mockDeleteRecipeImageAction).not.toHaveBeenCalled()
    })

    it("shows an error and does not submit when presigning fails", async () => {
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce({ ok: false, error: "boom" })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await selectImageFile(user)
      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(screen.getByText("boom", { selector: "p" })).toBeInTheDocument()
      })
      expect(mockUpdateRecipeAction).not.toHaveBeenCalled()
    })

    it("shows an error and rolls back the upload when the PUT to R2 fails", async () => {
      stubFetch(false)
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce(PRESIGNED)
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await selectImageFile(user)
      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(screen.getByText("Image upload failed (500)", { selector: "p" })).toBeInTheDocument()
      })
      expect(mockUpdateRecipeAction).not.toHaveBeenCalled()
    })

    it("rolls back the new upload when the recipe update fails", async () => {
      stubFetch(true)
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce(PRESIGNED)
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: false, error: "Error" })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await selectImageFile(user)
      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => {
        expect(mockDeleteRecipeImageAction).toHaveBeenCalledWith(PRESIGNED.key)
      })
      expect(mockPush).not.toHaveBeenCalled()
    })

    it("does not call the presign action when no new image is selected", async () => {
      mockUpdateRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.click(screen.getAllByText("Save Changes")[0])

      await waitFor(() => expect(mockUpdateRecipeAction).toHaveBeenCalled())
      expect(mockPresignRecipeImageUploadAction).not.toHaveBeenCalled()
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

  describe("step drag reordering", () => {
    it("reorders steps when dragged from first to second position", () => {
      const recipe: Recipe = {
        ...baseRecipe,
        steps: [
          { stepId: 1, stepNumber: 1, description: "Boil the pasta", tip: null },
          { stepId: 2, stepNumber: 2, description: "Add the sauce", tip: null },
        ],
      }
      render(<EditRecipeForm recipe={recipe} />)

      const stepRows = screen
        .getAllByPlaceholderText("Describe this step…")
        .map((el) => el.closest("[draggable]")) as HTMLElement[]

      fireEvent.dragStart(stepRows[0])
      fireEvent.dragOver(stepRows[1])
      fireEvent.drop(stepRows[1])

      const textareas = screen.getAllByPlaceholderText(
        "Describe this step…",
      ) as HTMLTextAreaElement[]
      expect(textareas[0].value).toBe("Add the sauce")
      expect(textareas[1].value).toBe("Boil the pasta")
    })

    it("reorders steps via touch drag on mobile", () => {
      const recipe: Recipe = {
        ...baseRecipe,
        steps: [
          { stepId: 1, stepNumber: 1, description: "Boil the pasta", tip: null },
          { stepId: 2, stepNumber: 2, description: "Add the sauce", tip: null },
        ],
      }
      render(<EditRecipeForm recipe={recipe} />)

      const stepRows = document.querySelectorAll("[data-step-index]")
      Object.defineProperty(document, "elementFromPoint", {
        value: vi.fn().mockReturnValue(stepRows[1]),
        configurable: true,
        writable: true,
      })

      const handle = screen.getAllByLabelText("Drag to reorder step")[0]
      fireEvent(handle, new TouchEvent("touchstart", { bubbles: true }))
      fireEvent(
        handle,
        new TouchEvent("touchmove", {
          bubbles: true,
          touches: [{ clientX: 0, clientY: 100 } as Touch],
        }),
      )
      fireEvent(handle, new TouchEvent("touchend", { bubbles: true }))

      Object.defineProperty(document, "elementFromPoint", { value: undefined, configurable: true })

      const textareas = screen.getAllByPlaceholderText(
        "Describe this step…",
      ) as HTMLTextAreaElement[]
      expect(textareas[0].value).toBe("Add the sauce")
      expect(textareas[1].value).toBe("Boil the pasta")
    })

    it("does not change order when dropped on the same step", () => {
      const recipe: Recipe = {
        ...baseRecipe,
        steps: [
          { stepId: 1, stepNumber: 1, description: "Boil the pasta", tip: null },
          { stepId: 2, stepNumber: 2, description: "Add the sauce", tip: null },
        ],
      }
      render(<EditRecipeForm recipe={recipe} />)

      const stepRows = screen
        .getAllByPlaceholderText("Describe this step…")
        .map((el) => el.closest("[draggable]")) as HTMLElement[]

      fireEvent.dragStart(stepRows[0])
      fireEvent.dragOver(stepRows[0])
      fireEvent.drop(stepRows[0])

      const textareas = screen.getAllByPlaceholderText(
        "Describe this step…",
      ) as HTMLTextAreaElement[]
      expect(textareas[0].value).toBe("Boil the pasta")
      expect(textareas[1].value).toBe("Add the sauce")
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

    it("sets a custom cuisine as a chip when Enter is pressed in the cuisine input", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={{ ...baseRecipe, cuisine: null }} />)

      await user.type(screen.getByPlaceholderText("Search cuisines…"), "Guyanese")
      await user.keyboard("{Enter}")

      expect(screen.getByText("Guyanese")).toBeInTheDocument()
      expect(screen.queryByPlaceholderText("Search cuisines…")).not.toBeInTheDocument()
    })

    it("shows error when cuisine is removed and the form is submitted", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.click(screen.getByLabelText("Remove cuisine"))
      await user.click(screen.getAllByText("Save Changes")[0])

      expect(screen.getByText("Cuisine is required", { selector: "li" })).toBeInTheDocument()
      expect(mockUpdateRecipeAction).not.toHaveBeenCalled()
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

    it("adds a custom tag chip when Enter is pressed in the tag input", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.type(screen.getByPlaceholderText("Search tags…"), "weeknight")
      await user.keyboard("{Enter}")

      expect(screen.getByText("weeknight")).toBeInTheDocument()
    })

    it("does not add a duplicate custom tag", async () => {
      const user = userEvent.setup()
      render(<EditRecipeForm recipe={baseRecipe} />)

      await user.type(screen.getByPlaceholderText("Search tags…"), "pasta")
      await user.keyboard("{Enter}")

      expect(screen.getAllByText("pasta")).toHaveLength(1)
    })
  })
})
