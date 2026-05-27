// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SearchBar } from "./SearchBar"

vi.mock("@/hooks/useRecipeSearch", () => ({
  useRecipeSearch: vi.fn(),
}))

import { useRecipeSearch } from "@/hooks/useRecipeSearch"
const mockUseRecipeSearch = vi.mocked(useRecipeSearch)

const defaultState = {
  query: "",
  setQuery: vi.fn(),
  results: [],
  loading: false,
  error: null,
}

beforeEach(() => {
  mockUseRecipeSearch.mockReturnValue({ ...defaultState, setQuery: vi.fn() })
})

describe("SearchBar", () => {
  it("renders an input", () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText("Search for recipes...")).toBeInTheDocument()
  })

  it("shows dropdown with results after typing 2+ chars", async () => {
    const setQuery = vi.fn()
    mockUseRecipeSearch.mockReturnValue({
      query: "pa",
      setQuery,
      results: [{ id: 1, name: "Pasta" }, { id: 2, name: "Pancakes" }],
      loading: false,
      error: null,
    })

    render(<SearchBar />)

    expect(screen.getByText("Pasta")).toBeInTheDocument()
    expect(screen.getByText("Pancakes")).toBeInTheDocument()
  })

  it("each result renders a link to /recipe/{id}", () => {
    mockUseRecipeSearch.mockReturnValue({
      query: "pa",
      setQuery: vi.fn(),
      results: [{ id: 42, name: "Pasta" }],
      loading: false,
      error: null,
    })

    render(<SearchBar />)

    const link = screen.getByRole("link", { name: "Pasta" })
    expect(link).toHaveAttribute("href", "/recipe/42")
  })

  it("hides dropdown when query is empty", () => {
    mockUseRecipeSearch.mockReturnValue({ ...defaultState, query: "", results: [] })

    render(<SearchBar />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("closes dropdown on outside click", async () => {
    const setQuery = vi.fn()
    mockUseRecipeSearch.mockReturnValue({
      query: "pa",
      setQuery,
      results: [{ id: 1, name: "Pasta" }],
      loading: false,
      error: null,
    })

    render(
      <div>
        <SearchBar />
        <button>Outside</button>
      </div>
    )

    fireEvent.mouseDown(screen.getByText("Outside"))
    expect(setQuery).toHaveBeenCalledWith("")
  })
})
