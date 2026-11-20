// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  loadMoreRecipes: vi.fn(),
}))

import { loadMoreRecipes } from "@/lib/api"
import { RecipeGrid } from "./recipe-grid"

const mockLoadMore = vi.mocked(loadMoreRecipes)

beforeEach(() => {
  mockLoadMore.mockReset()
})

describe("RecipeGrid", () => {
  it("adds the next recipes below the first page and hides the button at the end", async () => {
    mockLoadMore.mockResolvedValueOnce({ recipes: [{ id: 1, name: "Pasta" }], nextCursor: null })
    render(<RecipeGrid initialRecipes={[{ id: 2, name: "Tacos" }]} initialCursor="c2" />)

    await userEvent.click(screen.getByRole("button", { name: "Load more recipes" }))

    const links = await screen.findAllByRole("link")
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/recipe/2", "/recipe/1"])
    expect(screen.queryByRole("button", { name: "Load more recipes" })).not.toBeInTheDocument()
  })

  it("shows no button when everything fits on the first page", () => {
    render(<RecipeGrid initialRecipes={[{ id: 1, name: "Pasta" }]} initialCursor={null} />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("shows an error and keeps the button for a retry", async () => {
    mockLoadMore.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    render(<RecipeGrid initialRecipes={[{ id: 2, name: "Tacos" }]} initialCursor="c2" />)

    await userEvent.click(screen.getByRole("button", { name: "Load more recipes" }))

    expect(
      await screen.findByText("Couldn't load more recipes. Please try again."),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Load more recipes" })).toBeEnabled()
  })
})
