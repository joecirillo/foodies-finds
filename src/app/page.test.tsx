// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import type { Recipe } from "@/types/recipe"

vi.mock("@/lib/api", () => ({ getRandomRecipe: vi.fn() }))
vi.mock("@/components/FeaturedRecipe", () => ({
  RecipeOfTheDay: ({ initialRecipe }: { initialRecipe: Recipe }) => <p>{initialRecipe.name}</p>,
}))
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import { getRandomRecipe } from "@/lib/api"
import HomePage from "./page"

const mockGetRandomRecipe = vi.mocked(getRandomRecipe)

const recipe: Recipe = {
  id: 5,
  name: "Steak",
  description: null,
  calories: null,
  servings: 2,
  cookingTime: 20,
  preparationTime: 10,
  cuisine: null,
  tags: [],
  author: null,
  ingredients: [],
  steps: [],
  imageUrl: null,
  sourceUrl: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
}

const renderHomePage = async () => render(await HomePage())

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("HomePage", () => {
  it("features the recipe picked by the backend", async () => {
    mockGetRandomRecipe.mockResolvedValueOnce(recipe)

    await renderHomePage()

    expect(screen.getByRole("heading", { name: "Featured Recipe" })).toBeInTheDocument()
    expect(screen.getByText("Steak")).toBeInTheDocument()
  })

  it("hides the Featured Recipe section when there are no recipes", async () => {
    mockGetRandomRecipe.mockResolvedValueOnce(null)

    await renderHomePage()

    expect(screen.queryByRole("heading", { name: "Featured Recipe" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Browse Recipes" })).toBeInTheDocument()
  })

  it("still renders the page and logs the error when the backend call fails", async () => {
    const error = new Error("Network error")
    mockGetRandomRecipe.mockRejectedValueOnce(error)

    await renderHomePage()

    expect(console.error).toHaveBeenCalledWith("Failed to load featured recipe:", error)

    expect(screen.queryByRole("heading", { name: "Featured Recipe" })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Foodies Finds" })).toBeInTheDocument()
  })
})
