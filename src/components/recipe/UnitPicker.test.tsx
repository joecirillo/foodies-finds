// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { UnitPicker } from "./UnitPicker"
import type { Unit } from "@/types/recipe"

const units: Unit[] = [
  { id: 1, name: "teaspoon", abbreviation: "tsp" },
  { id: 2, name: "gram", abbreviation: "g" },
  { id: 3, name: "cup", abbreviation: "cup" },
]

describe("UnitPicker", () => {
  it("shows '—' when no unit is selected", () => {
    render(<UnitPicker units={units} value={null} onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: "—" })).toBeInTheDocument()
  })

  it("shows the selected unit's name and abbreviation", () => {
    render(<UnitPicker units={units} value={2} onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: "gram (g)" })).toBeInTheDocument()
  })

  it("lists units alphabetically by name", async () => {
    const user = userEvent.setup()
    render(<UnitPicker units={units} value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "—" }))

    const options = screen.getAllByRole("option").map((el) => el.textContent)
    expect(options).toEqual(["—", "cup (cup)", "gram (g)", "teaspoon (tsp)"])
  })

  it("filters the list as the user types", async () => {
    const user = userEvent.setup()
    render(<UnitPicker units={units} value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "—" }))
    await user.type(screen.getByPlaceholderText("Search units…"), "tsp")

    expect(screen.getByRole("option", { name: "teaspoon (tsp)" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "gram (g)" })).not.toBeInTheDocument()
  })

  it("calls onChange with the unit's id when selected", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<UnitPicker units={units} value={null} onChange={onChange} />)

    await user.click(screen.getByRole("button", { name: "—" }))
    await user.click(screen.getByRole("option", { name: "cup (cup)" }))

    expect(onChange).toHaveBeenCalledWith(3)
  })

  it("calls onChange with null when '—' is selected", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<UnitPicker units={units} value={2} onChange={onChange} />)

    await user.click(screen.getByRole("button", { name: "gram (g)" }))
    await user.click(screen.getByRole("option", { name: "—" }))

    expect(onChange).toHaveBeenCalledWith(null)
  })
})
