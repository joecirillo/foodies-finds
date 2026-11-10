// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { RecipeImportPreview } from "@/types/recipe"

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
  importRecipeFromUrlAction: vi.fn(),
  presignRecipeImageUploadAction: vi.fn(),
  attachRecipeImageAction: vi.fn(),
  deleteRecipeImageAction: vi.fn(),
}))

vi.mock("heic-to", () => ({ isHeic: vi.fn().mockResolvedValue(false), heicTo: vi.fn() }))
vi.mock("browser-image-compression", () => ({
  default: vi.fn(async (file: File) => new File([file], "photo.webp", { type: "image/webp" })),
}))

import { useRouter } from "next/navigation"
import { addRecipeAction, importRecipeFromUrlAction } from "@/app/actions/recipe"
import { AddRecipe } from "./add-recipe"

const mockUseRouter = vi.mocked(useRouter)
const mockAddRecipeAction = vi.mocked(addRecipeAction)
const mockImport = vi.mocked(importRecipeFromUrlAction)

window.HTMLElement.prototype.scrollIntoView = vi.fn()

const SOURCE_URL = "https://www.seriouseats.com/tomato-soup"
const IMAGE_URL = "https://images.seriouseats.com/soup.jpg"

const completePreview = (
  overrides: Partial<RecipeImportPreview["recipe"]> = {},
): RecipeImportPreview => ({
  recipe: {
    name: "Tomato Soup",
    description: "Bright and simple",
    cookingTime: 30,
    preparationTime: 10,
    servings: 4,
    cuisine: { id: null, name: "Italian" },
    tags: [{ id: null, name: "soup" }],
    author: "Kenji",
    imageUrl: IMAGE_URL,
    ingredients: [
      { id: null, name: "2 cups chicken stock", quantity: null, unitId: null, notes: null },
      { id: null, name: "1 onion, diced", quantity: null, unitId: null, notes: null },
    ],
    steps: [
      { stepNumber: 1, description: "Dice the onion.", tip: null },
      { stepNumber: 2, description: "Simmer with stock.", tip: "Stir often" },
    ],
    ...overrides,
  },
  source: {
    sourceUrl: SOURCE_URL,
    originalAuthor: "Kenji",
    originalIngredientLines: ["2 cups chicken stock", "1 onion, diced"],
    originalYield: "4 to 6 servings",
    recipeCount: 1,
  },
  warnings: [
    {
      code: "AMBIGUOUS_YIELD",
      field: "recipeYield",
      message: "Servings were a range; the lower value was used. Review servings.",
    },
  ],
})

const sparsePreview = (): RecipeImportPreview => ({
  recipe: {
    name: "Mystery Stew",
    cookingTime: null,
    preparationTime: null,
    ingredients: [{ id: null, name: "1 lb beef", quantity: null, unitId: null, notes: null }],
    steps: [{ stepNumber: 1, description: "Cook it.", tip: null }],
  },
  source: {
    sourceUrl: "https://www.allrecipes.com/stew",
    originalAuthor: null,
    originalIngredientLines: ["1 lb beef"],
    originalYield: null,
    recipeCount: 1,
  },
  warnings: [],
})

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
  mockImport.mockReset()
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const nameInput = () => screen.getByPlaceholderText("e.g. Grandma's Lasagna")

const importUrl = async (user: ReturnType<typeof userEvent.setup>, url = SOURCE_URL) => {
  const input = screen.getByLabelText("Import from a link")
  await user.clear(input)
  await user.type(input, url)
  await user.click(screen.getByRole("button", { name: "Import" }))
}

describe("AddRecipe import", () => {
  it("fills the already-mounted blank form with the imported recipe", async () => {
    const user = userEvent.setup()
    mockImport.mockResolvedValueOnce({ ok: true, preview: completePreview() })
    render(<AddRecipe />)
    expect(nameInput()).toHaveValue("")

    await importUrl(user)

    await waitFor(() => expect(nameInput()).toHaveValue("Tomato Soup"))
    expect(mockImport).toHaveBeenCalledWith(SOURCE_URL)
    expect(screen.getByPlaceholderText("e.g. Nana")).toHaveValue("Kenji")
    expect(
      screen.getAllByRole("spinbutton").map((input) => (input as HTMLInputElement).value),
    ).toEqual(["10", "30", "4", ""])
    expect(screen.getByLabelText("Ingredient 1 name")).toHaveValue("2 cups chicken stock")
    expect(screen.getByLabelText("Ingredient 2 name")).toHaveValue("1 onion, diced")
    expect(screen.getByDisplayValue("Simmer with stock.")).toBeInTheDocument()
    expect(screen.getByText("Italian")).toBeInTheDocument()
    expect(mockAddRecipeAction).not.toHaveBeenCalled()
  })

  it("shows the source, warnings, ambiguous yield, and original ingredient lines", async () => {
    const user = userEvent.setup()
    mockImport.mockResolvedValueOnce({ ok: true, preview: completePreview() })
    render(<AddRecipe />)

    await importUrl(user)

    expect(
      await screen.findByText("Imported from seriouseats.com — review before saving"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Servings were a range; the lower value was used. Review servings."),
    ).toBeInTheDocument()
    expect(screen.getByText("4 to 6 servings")).toBeInTheDocument()
    expect(screen.getByText("Original ingredient lines (2)")).toBeInTheDocument()
  })

  it("marks missing required fields without inventing values", async () => {
    const user = userEvent.setup()
    mockImport.mockResolvedValueOnce({ ok: true, preview: sparsePreview() })
    render(<AddRecipe />)

    await importUrl(user, "https://www.allrecipes.com/stew")

    await waitFor(() => expect(nameInput()).toHaveValue("Mystery Stew"))
    expect(screen.getAllByText("Cuisine is required").length).toBeGreaterThan(0)
    expect(
      screen.getAllByText("Preparation time must be at least 1 minute").length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText("Servings is required").length).toBeGreaterThan(0)
    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(null)
  })

  it("shows an inline error and keeps the draft when the import fails", async () => {
    const user = userEvent.setup()
    mockImport.mockResolvedValueOnce({
      ok: false,
      error: "No recipe data was found on that page.",
      code: "NO_RECIPE_FOUND",
    })
    render(<AddRecipe />)
    await user.type(nameInput(), "My Draft")

    await importUrl(user, "https://www.seriouseats.com/about")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No recipe data was found on that page.",
    )
    expect(nameInput()).toHaveValue("My Draft")
  })

  it("asks before replacing a dirty draft and keeps edits when cancelled", async () => {
    const user = userEvent.setup()
    mockImport.mockResolvedValueOnce({ ok: true, preview: completePreview() })
    render(<AddRecipe />)
    await user.type(nameInput(), "My Draft")

    await importUrl(user)
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Replace your current draft?")).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Keep editing" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(nameInput()).toHaveValue("My Draft")
    expect(screen.queryByText(/Imported from/)).not.toBeInTheDocument()
  })

  it("replaces a dirty draft once the user confirms", async () => {
    const user = userEvent.setup()
    mockImport.mockResolvedValueOnce({ ok: true, preview: completePreview() })
    render(<AddRecipe />)
    await user.type(nameInput(), "My Draft")

    await importUrl(user)
    await user.click(await screen.findByRole("button", { name: "Replace draft" }))

    await waitFor(() => expect(nameInput()).toHaveValue("Tomato Soup"))
  })

  it("supports a second import and asks first once the imported draft is edited", async () => {
    const user = userEvent.setup()
    mockImport
      .mockResolvedValueOnce({ ok: true, preview: completePreview() })
      .mockResolvedValueOnce({ ok: true, preview: sparsePreview() })
    render(<AddRecipe />)

    await importUrl(user)
    await waitFor(() => expect(nameInput()).toHaveValue("Tomato Soup"))
    await user.type(nameInput(), "!")

    await importUrl(user, "https://www.allrecipes.com/stew")
    await user.click(await screen.findByRole("button", { name: "Replace draft" }))

    await waitFor(() => expect(nameInput()).toHaveValue("Mystery Stew"))
    expect(
      screen.getByText("Imported from allrecipes.com — review before saving"),
    ).toBeInTheDocument()
  })

  it("replaces an untouched imported draft without asking", async () => {
    const user = userEvent.setup()
    mockImport
      .mockResolvedValueOnce({ ok: true, preview: completePreview() })
      .mockResolvedValueOnce({ ok: true, preview: sparsePreview() })
    render(<AddRecipe />)

    await importUrl(user)
    await waitFor(() => expect(nameInput()).toHaveValue("Tomato Soup"))
    await importUrl(user, "https://www.allrecipes.com/stew")

    await waitFor(() => expect(nameInput()).toHaveValue("Mystery Stew"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("keeps manual entry working when nothing is imported", async () => {
    const user = userEvent.setup()
    mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 7 })
    render(<AddRecipe />)

    await user.type(nameInput(), "Toast")
    const spinbuttons = screen.getAllByRole("spinbutton")
    await user.type(spinbuttons[0], "2")
    await user.type(spinbuttons[2], "1")
    await user.type(screen.getByPlaceholderText("Search cuisines…"), "American")
    await user.keyboard("{Enter}")
    await user.type(screen.getByLabelText("Ingredient 1 name"), "bread")
    await user.type(screen.getByPlaceholderText("Describe this step…"), "Toast the bread")
    await user.click(screen.getAllByText("Save Recipe")[0])

    await waitFor(() => expect(mockAddRecipeAction).toHaveBeenCalledTimes(1))
    const payload = mockAddRecipeAction.mock.calls[0][0]
    expect(payload.imageUrl).toBeNull()
    expect(payload).not.toHaveProperty("sourceUrl")
    expect(mockPush).toHaveBeenCalledWith("/recipe/7")
  })

  it("saves an edited import with its rows, steps, image, author, and source", async () => {
    const user = userEvent.setup()
    mockImport.mockResolvedValueOnce({ ok: true, preview: completePreview() })
    mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 42 })
    render(<AddRecipe />)

    await importUrl(user)
    await waitFor(() => expect(nameInput()).toHaveValue("Tomato Soup"))
    await user.clear(nameInput())
    await user.type(nameInput(), "Weeknight Tomato Soup")
    await user.type(screen.getByLabelText("Ingredient 2 quantity"), "1")
    await user.click(screen.getAllByText("Save Recipe")[0])

    await waitFor(() => expect(mockAddRecipeAction).toHaveBeenCalledTimes(1))
    expect(mockAddRecipeAction).toHaveBeenCalledWith({
      name: "Weeknight Tomato Soup",
      description: "Bright and simple",
      calories: 0,
      servings: 4,
      cookingTime: 30,
      preparationTime: 10,
      cuisine: { id: null, name: "Italian" },
      tags: [{ id: null, name: "soup" }],
      author: "Kenji",
      ingredients: [
        { id: null, name: "2 Cups Chicken Stock", unitId: null, quantity: null, notes: null },
        { id: null, name: "1 Onion, Diced", unitId: null, quantity: 1, notes: null },
      ],
      steps: [
        { stepNumber: 1, description: "Dice the onion.", tip: null },
        { stepNumber: 2, description: "Simmer with stock.", tip: "stir often" },
      ],
      imageUrl: IMAGE_URL,
      sourceUrl: SOURCE_URL,
    })
    expect(mockPush).toHaveBeenCalledWith("/recipe/42")
  })

  it("does not save an imported row whose name was cleared but still has details", async () => {
    const user = userEvent.setup()
    mockImport.mockResolvedValueOnce({ ok: true, preview: completePreview() })
    render(<AddRecipe />)

    await importUrl(user)
    await waitFor(() => expect(nameInput()).toHaveValue("Tomato Soup"))
    await user.type(screen.getByLabelText("Ingredient 2 quantity"), "1")
    await user.clear(screen.getByLabelText("Ingredient 2 name"))
    await user.click(screen.getAllByText("Save Recipe")[0])

    expect(screen.getAllByText("Name this ingredient or remove the row").length).toBeGreaterThan(0)
    expect(mockAddRecipeAction).not.toHaveBeenCalled()
  })

  it("submits no image after the imported photo is removed", async () => {
    const user = userEvent.setup()
    mockImport.mockResolvedValueOnce({ ok: true, preview: completePreview() })
    mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 42 })
    render(<AddRecipe />)

    await importUrl(user)
    await user.click(await screen.findByRole("button", { name: "Remove imported photo" }))
    await user.click(screen.getAllByText("Save Recipe")[0])

    await waitFor(() => expect(mockAddRecipeAction).toHaveBeenCalledTimes(1))
    expect(mockAddRecipeAction.mock.calls[0][0].imageUrl).toBeNull()
  })

  it.each([
    [
      "removing the imported photo",
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.click(await screen.findByRole("button", { name: "Remove imported photo" })),
    ],
    [
      "choosing a replacement photo",
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.upload(
          document.querySelector('input[type="file"]') as HTMLInputElement,
          new File(["fake-image"], "photo.jpg", { type: "image/jpeg" }),
        ),
    ],
  ])("treats %s as an edit that needs confirmation", async (_, changePhoto) => {
    const user = userEvent.setup()
    mockImport
      .mockResolvedValueOnce({ ok: true, preview: completePreview() })
      .mockResolvedValueOnce({ ok: true, preview: sparsePreview() })
    render(<AddRecipe />)

    await importUrl(user)
    await waitFor(() => expect(nameInput()).toHaveValue("Tomato Soup"))
    await changePhoto(user)
    await importUrl(user, "https://www.allrecipes.com/stew")

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })
})
