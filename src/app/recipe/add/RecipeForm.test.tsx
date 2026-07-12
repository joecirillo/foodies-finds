// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RecipeForm } from "./RecipeForm"

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("@/app/actions/recipe", () => ({
  addRecipeAction: vi.fn(),
}))

import { useRouter } from "next/navigation"
import { addRecipeAction } from "@/app/actions/recipe"

const mockUseRouter = vi.mocked(useRouter)
const mockAddRecipeAction = vi.mocked(addRecipeAction)

window.HTMLElement.prototype.scrollIntoView = vi.fn()

let mockPush: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockPush = vi.fn()
  mockUseRouter.mockReturnValue({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  } as ReturnType<typeof useRouter>)
  mockAddRecipeAction.mockReset()

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }),
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("RecipeForm", () => {
  describe("validation", () => {
    it("shows error when servings is empty", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.click(screen.getAllByText("Save Recipe")[0])

      expect(screen.getByText("Servings is required", { selector: "li" })).toBeInTheDocument()
    })

    it("shows error when cuisine is not selected", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.click(screen.getAllByText("Save Recipe")[0])

      expect(screen.getByText("Cuisine is required", { selector: "li" })).toBeInTheDocument()
    })

    it("shows an inline unit error when an ingredient has a name but no unit selected", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Ingredient name"), "flour")
      await user.click(screen.getAllByText("Save Recipe")[0])

      expect(
        screen.getByText("Unit is required for flour", { selector: "p" }),
      ).toBeInTheDocument()
    })

    it("does not call addRecipeAction when validation fails", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.click(screen.getAllByText("Save Recipe")[0])

      expect(mockAddRecipeAction).not.toHaveBeenCalled()
    })
  })

  describe("author default", () => {
    it("submits 'Anonymous' as author when the author field is left empty", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url === "/api/units") {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([{ id: 1, name: "gram", abbreviation: "g" }]),
            })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        }),
      )

      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      const { container } = render(<RecipeForm />)

      await waitFor(() => screen.getByRole("option", { name: "gram (g)" }))

      const spinbuttons = screen.getAllByRole("spinbutton")
      await user.type(screen.getByPlaceholderText("e.g. Grandma's Lasagna"), "Test Recipe")
      await user.type(spinbuttons[0], "10") // prep time
      await user.type(spinbuttons[2], "2") // servings

      await user.type(screen.getByPlaceholderText("Search cuisines…"), "Italian")
      await user.keyboard("{Enter}")

      await user.type(screen.getByPlaceholderText("Ingredient name"), "flour")
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await user.selectOptions(container.querySelector("select")!, "1")

      await user.type(screen.getByPlaceholderText("Describe this step…"), "Mix the ingredients")

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockAddRecipeAction).toHaveBeenCalledWith(
          expect.objectContaining({ author: "Anonymous" }),
        )
      })
    })
  })

  describe("custom cuisine", () => {
    it("sets a custom cuisine as a chip when Enter is pressed in the cuisine input", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Search cuisines…"), "Guyanese")
      await user.keyboard("{Enter}")

      expect(screen.getByText("Guyanese")).toBeInTheDocument()
      expect(screen.queryByPlaceholderText("Search cuisines…")).not.toBeInTheDocument()
    })

  })

  describe("step drag reordering", () => {
    it("reorders steps when dragged", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Describe this step…"), "Step one")
      await user.click(screen.getByText("Add Step"))
      await user.type(screen.getAllByPlaceholderText("Describe this step…")[1], "Step two")

      const stepRows = screen
        .getAllByPlaceholderText("Describe this step…")
        .map((el) => el.closest("[draggable]")) as HTMLElement[]

      fireEvent.dragStart(stepRows[0])
      fireEvent.dragOver(stepRows[1])
      fireEvent.drop(stepRows[1])

      const textareas = screen.getAllByPlaceholderText("Describe this step…") as HTMLTextAreaElement[]
      expect(textareas[0].value).toBe("Step two")
      expect(textareas[1].value).toBe("Step one")
    })

    it("reorders steps via touch drag on mobile", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Describe this step…"), "Step one")
      await user.click(screen.getByText("Add Step"))
      await user.type(screen.getAllByPlaceholderText("Describe this step…")[1], "Step two")

      const stepRows = document.querySelectorAll("[data-step-index]")
      Object.defineProperty(document, "elementFromPoint", {
        value: vi.fn().mockReturnValue(stepRows[1]),
        configurable: true,
        writable: true,
      })

      const handle = screen.getAllByLabelText("Drag to reorder step")[0]
      fireEvent(handle, new TouchEvent("touchstart", { bubbles: true }))
      fireEvent(handle, new TouchEvent("touchmove", { bubbles: true, touches: [{ clientX: 0, clientY: 100 } as Touch] }))
      fireEvent(handle, new TouchEvent("touchend", { bubbles: true }))

      Object.defineProperty(document, "elementFromPoint", { value: undefined, configurable: true })

      const textareas = screen.getAllByPlaceholderText("Describe this step…") as HTMLTextAreaElement[]
      expect(textareas[0].value).toBe("Step two")
      expect(textareas[1].value).toBe("Step one")
    })

    it("does not change order when dropped on the same step", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Describe this step…"), "Step one")
      await user.click(screen.getByText("Add Step"))

      const stepRows = screen
        .getAllByPlaceholderText("Describe this step…")
        .map((el) => el.closest("[draggable]")) as HTMLElement[]

      fireEvent.dragStart(stepRows[0])
      fireEvent.dragOver(stepRows[0])
      fireEvent.drop(stepRows[0])

      const textareas = screen.getAllByPlaceholderText("Describe this step…") as HTMLTextAreaElement[]
      expect(textareas[0].value).toBe("Step one")
    })
  })

  describe("custom tags", () => {
    it("adds a custom tag chip when Enter is pressed in the tag input", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Search tags…"), "weeknight")
      await user.keyboard("{Enter}")

      expect(screen.getByText("weeknight")).toBeInTheDocument()
    })

    it("does not add a duplicate custom tag", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Search tags…"), "weeknight")
      await user.keyboard("{Enter}")
      await user.type(screen.getByPlaceholderText("Search tags…"), "weeknight")
      await user.keyboard("{Enter}")

      expect(screen.getAllByText("weeknight")).toHaveLength(1)
    })

  })
})
