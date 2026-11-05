import { describe, it, expect } from "vitest"
import { isAnimatedGif } from "./is-animated-gif"

const HEADER = "474946383961"
const SCREEN_WITH_GLOBAL_TABLE = "01000100800000"
const SCREEN_WITHOUT_TABLE = "01000100000000"
const TWO_COLOR_TABLE = "000000ffffff"
const GRAPHIC_CONTROL_EXTENSION = "21f904000a000000"
const LOOP_EXTENSION = "21ff0b4e45545343415045322e300301000000"
const IMAGE_DATA = "02" + "024401" + "00"
const FRAME = "2c000000000100010000" + IMAGE_DATA
const FRAME_WITH_LOCAL_TABLE = "2c000000000100010080" + TWO_COLOR_TABLE + IMAGE_DATA
const TRAILER = "3b"

const gif = (...hexParts: string[]) =>
  new Blob([
    new Uint8Array((hexParts.join("").match(/../g) ?? []).map((byte) => parseInt(byte, 16))),
  ])

describe("isAnimatedGif", () => {
  it("reports a single-frame GIF as static", async () => {
    const file = gif(HEADER, SCREEN_WITH_GLOBAL_TABLE, TWO_COLOR_TABLE, FRAME, TRAILER)

    expect(await isAnimatedGif(file)).toBe(false)
  })

  it("reports a single frame with extensions and a local color table as static", async () => {
    const file = gif(
      HEADER,
      SCREEN_WITHOUT_TABLE,
      GRAPHIC_CONTROL_EXTENSION,
      FRAME_WITH_LOCAL_TABLE,
      TRAILER,
    )

    expect(await isAnimatedGif(file)).toBe(false)
  })

  it("reports a multi-frame GIF as animated", async () => {
    const file = gif(
      HEADER,
      SCREEN_WITH_GLOBAL_TABLE,
      TWO_COLOR_TABLE,
      LOOP_EXTENSION,
      GRAPHIC_CONTROL_EXTENSION,
      FRAME,
      GRAPHIC_CONTROL_EXTENSION,
      FRAME,
      TRAILER,
    )

    expect(await isAnimatedGif(file)).toBe(true)
  })

  it("treats bytes without a GIF signature as animated", async () => {
    expect(await isAnimatedGif(new Blob(["fake-gif"]))).toBe(true)
  })

  it("treats a truncated GIF as animated", async () => {
    const file = gif(HEADER, SCREEN_WITH_GLOBAL_TABLE, TWO_COLOR_TABLE, FRAME.slice(0, 12))

    expect(await isAnimatedGif(file)).toBe(true)
  })

  it("treats an unknown block type as animated", async () => {
    const file = gif(HEADER, SCREEN_WITHOUT_TABLE, "99", FRAME, TRAILER)

    expect(await isAnimatedGif(file)).toBe(true)
  })
})
