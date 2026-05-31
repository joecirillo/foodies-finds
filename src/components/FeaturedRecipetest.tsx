// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RecipeOfTheDay } from "./FeaturedRecipe"
import type { Recipe } from "@/types/recipe"

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

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
  author: null,
  ingredients: [],
  steps: [],
  imageUrl: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
}

describe("RecipeOfTheDay", () => {
  it("renders the recipe name", () => {
    render(<RecipeOfTheDay initialRecipe={baseRecipe} />)
    expect(screen.getByText("Spaghetti Bolognese")).toBeInTheDocument()
  })

  it("renders the description", () => {
    render(<RecipeOfTheDay initialRecipe={baseRecipe} />)
    expect(screen.getByText("A hearty Italian classic")).toBeInTheDocument()
  })

  it("renders cuisine and tag badges", () => {
    render(<RecipeOfTheDay initialRecipe={baseRecipe} />)
    expect(screen.getByText("Italian")).toBeInTheDocument()
    expect(screen.getByText("Pasta")).toBeInTheDocument()
  })

  it("falls back to /no-image.jpeg when imageUrl is null", () => {
    render(<RecipeOfTheDay initialRecipe={baseRecipe} />)
    expect(screen.getByRole("img")).toHaveAttribute("src", "/no-image.jpeg")
  })

  it("uses imageUrl when provided", () => {
    render(<RecipeOfTheDay initialRecipe={{ ...baseRecipe, imageUrl: "/custom.jpg" }} />)
    expect(screen.getByRole("img")).toHaveAttribute("src", "/custom.jpg")
  })

  it("View Recipe links to the correct recipe URL", () => {
    render(<RecipeOfTheDay initialRecipe={baseRecipe} />)
    expect(screen.getByRole("link", { name: "View Recipe" })).toHaveAttribute("href", "/recipe/1")
  })

  it("replaces recipe after clicking Try Another", async () => {
    const nextRecipe: Recipe = { ...baseRecipe, id: 2, name: "Fish Tacos" }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(nextRecipe),
    })

    render(<RecipeOfTheDay initialRecipe={baseRecipe} />)
    await userEvent.click(screen.getByRole("button", { name: "Try Another" }))

    await waitFor(() => {
      expect(screen.getByText("Fish Tacos")).toBeInTheDocument()
    })
    expect(mockFetch).toHaveBeenCalledWith("/api/recipes/random")
  })

  it("shows spinner while Try Another is loading", async () => {
    let resolve: (v: unknown) => void
    mockFetch.mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      }),
    )

    render(<RecipeOfTheDay initialRecipe={baseRecipe} />)
    await userEvent.click(screen.getByRole("button", { name: "Try Another" }))

    expect(screen.queryByRole("button", { name: "Try Another" })).not.toBeInTheDocument()

    resolve!({ ok: true, json: () => Promise.resolve({ ...baseRecipe, id: 3, name: "Tacos" }) })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try Another" })).toBeInTheDocument()
    })
  })

  it("keeps current recipe when Try Another fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    render(<RecipeOfTheDay initialRecipe={baseRecipe} />)
    await userEvent.click(screen.getByRole("button", { name: "Try Another" }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try Another" })).toBeInTheDocument()
    })
    expect(screen.getByText("Spaghetti Bolognese")).toBeInTheDocument()
  })

  it("renders total time when prep and cook are set", () => {
    render(<RecipeOfTheDay initialRecipe={baseRecipe} />)
    expect(screen.getByText("45m")).toBeInTheDocument()
  })

  it("renders servings when set", () => {
    render(<RecipeOfTheDay initialRecipe={baseRecipe} />)
    expect(screen.getByText("4 servings")).toBeInTheDocument()
  })
})
