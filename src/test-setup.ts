import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// jsdom doesn't implement ResizeObserver or scrollIntoView, both of which
// cmdk (used by the shadcn Command component) relies on. Some test files run
// in the node environment, where window/HTMLElement don't exist at all.
if (typeof window !== "undefined") {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.HTMLElement.prototype.scrollIntoView = () => {}
}

afterEach(() => {
  cleanup()
})
