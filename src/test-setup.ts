import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// jsdom doesn't implement ResizeObserver, scrollIntoView, or canvas rendering (without
// the native `canvas` package). ResizeObserver/scrollIntoView are relied on by cmdk (used
// by the shadcn Command component); toDataURL is used by upload.ts's canvas-webp-support
// check, and without this stub it returns null and throws in any test that exercises
// image upload without mocking it directly. Some test files run in the node environment,
// where window/HTMLElement don't exist at all.
if (typeof window !== "undefined") {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.HTMLElement.prototype.scrollIntoView = () => {}
  window.HTMLCanvasElement.prototype.toDataURL = () => "data:image/webp;base64,"
}

afterEach(() => {
  cleanup()
})
