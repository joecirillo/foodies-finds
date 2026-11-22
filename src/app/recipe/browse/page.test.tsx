// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/lib/api", () => ({ listRecipes: vi.fn(), filterRecipes: vi.fn() }))
vi.mock("@/components/BrowseFilters", () => ({ BrowseFilters: () => null }))
vi.mock("@/components/recipe/recipe-grid", () => ({
  RecipeGrid: ({ initialRecipes }: { initialRecipes: { name: string }[] }) => (
    <ul>
      {initialRecipes.map((recipe) => (
        <li key={recipe.name}>{recipe.name}</li>
      ))}
    </ul>
  ),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { filterRecipes, listRecipes } from "@/lib/api"
import BrowsePage from "./page"

const mockListRecipes = vi.mocked(listRecipes)
const mockFilterRecipes = vi.mocked(filterRecipes)

const renderPage = async (params: Record<string, string> = {}) =>
  render(await BrowsePage({ searchParams: Promise.resolve(params) }))

const EMPTY_COPY = "No recipes found. Add one now!"
const RAW_BACKEND_MESSAGE = "connect ECONNREFUSED 10.0.0.1:5432"

beforeEach(() => {
  mockListRecipes.mockReset()
  mockFilterRecipes.mockReset()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("BrowsePage", () => {
  it("shows recipes from the first page", async () => {
    mockListRecipes.mockResolvedValueOnce({
      recipes: [{ id: 1, name: "Pasta" }],
      nextCursor: null,
    })

    await renderPage()

    expect(screen.getByText("Pasta")).toBeInTheDocument()
  })

  it("shows the empty state when there are no recipes", async () => {
    mockListRecipes.mockResolvedValueOnce({ recipes: [], nextCursor: null })

    await renderPage()

    expect(screen.getByText(EMPTY_COPY)).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("shows the empty state when filters match nothing", async () => {
    mockFilterRecipes.mockResolvedValueOnce([])

    await renderPage({ cuisineId: "3" })

    expect(mockFilterRecipes).toHaveBeenCalledWith({
      cuisineId: 3,
      tagId: undefined,
      ingredientId: undefined,
    })
    expect(screen.getByText(EMPTY_COPY)).toBeInTheDocument()
  })

  it("shows a retryable error instead of the empty state when listing fails", async () => {
    mockListRecipes.mockRejectedValueOnce(new Error(RAW_BACKEND_MESSAGE))

    await renderPage()

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load recipes")
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_COPY)).not.toBeInTheDocument()
    expect(screen.queryByText(RAW_BACKEND_MESSAGE)).not.toBeInTheDocument()
  })

  it("shows a retryable error when filtering fails", async () => {
    mockFilterRecipes.mockRejectedValueOnce(new Error(RAW_BACKEND_MESSAGE))

    await renderPage({ tagId: "2" })

    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_COPY)).not.toBeInTheDocument()
    expect(screen.queryByText(RAW_BACKEND_MESSAGE)).not.toBeInTheDocument()
  })

  it("resets the retry message when the filters change", async () => {
    mockFilterRecipes.mockRejectedValue(new Error(RAW_BACKEND_MESSAGE))
    const { rerender } = await renderPage({ tagId: "2" })
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(screen.getByRole("alert")).toHaveTextContent("Still no luck")

    rerender(await BrowsePage({ searchParams: Promise.resolve({ tagId: "5" }) }))

    expect(screen.getByRole("alert")).toHaveTextContent("Check your connection and try again.")
  })
})
