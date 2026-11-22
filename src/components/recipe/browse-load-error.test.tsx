// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const refresh = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }))

import { BrowseLoadError } from "./browse-load-error"

const pendingRefresh = () => {
  let finish!: () => void
  const request = new Promise<void>((resolve) => (finish = resolve))
  refresh.mockReturnValueOnce(request)
  return {
    finish: () =>
      act(async () => {
        finish()
        await request
      }),
  }
}

beforeEach(() => {
  refresh.mockReset()
})

describe("BrowseLoadError", () => {
  it("announces a friendly error", () => {
    render(<BrowseLoadError />)

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load recipes")
    expect(screen.getByRole("alert")).toHaveTextContent("Check your connection and try again.")
  })

  it("refreshes the route when the user retries", async () => {
    render(<BrowseLoadError />)

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(refresh).toHaveBeenCalledOnce()
  })

  it("disables the button while the retry is in flight", async () => {
    const request = pendingRefresh()
    render(<BrowseLoadError />)

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(screen.getByRole("button", { name: "Retrying…" })).toBeDisabled()
    await request.finish()
  })

  it("announces a new message when the retry fails again", async () => {
    const request = pendingRefresh()
    render(<BrowseLoadError />)
    const firstAlert = screen.getByRole("alert")

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    await request.finish()

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Still no luck. Give it a moment, then try again.")
    expect(alert).not.toBe(firstAlert)
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled()
  })

  it("announces again after each further failed retry", async () => {
    const first = pendingRefresh()
    render(<BrowseLoadError />)
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    await first.finish()
    const afterFirstFailure = screen.getByRole("alert")

    const second = pendingRefresh()
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    await second.finish()

    expect(screen.getByRole("alert")).not.toBe(afterFirstFailure)
  })
})
