// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const refresh = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }))

import { BrowseLoadError } from "./browse-load-error"

beforeEach(() => {
  refresh.mockReset()
})

describe("BrowseLoadError", () => {
  it("announces a friendly error", () => {
    render(<BrowseLoadError />)

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load recipes")
  })

  it("refreshes the route when the user retries", async () => {
    render(<BrowseLoadError />)

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(refresh).toHaveBeenCalledOnce()
  })
})
