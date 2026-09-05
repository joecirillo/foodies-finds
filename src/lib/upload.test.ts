import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("heic-to", () => ({
  isHeic: vi.fn(),
  heicTo: vi.fn(),
}))

vi.mock("browser-image-compression", () => ({
  default: vi.fn(),
}))

import { isHeic, heicTo } from "heic-to"
import imageCompression from "browser-image-compression"
import {
  prepareImageFile,
  IMAGE_TYPE_ERROR,
  IMAGE_CONVERSION_ERROR,
  IMAGE_TOO_LARGE_ERROR,
} from "./upload"

const mockIsHeic = vi.mocked(isHeic)
const mockHeicTo = vi.mocked(heicTo)
const mockImageCompression = vi.mocked(imageCompression)

beforeEach(() => {
  mockIsHeic.mockReset().mockResolvedValue(false)
  mockHeicTo.mockReset()
  mockImageCompression
    .mockReset()
    .mockImplementation(async (file) => new Blob([file], { type: "image/webp" }))
})

describe("prepareImageFile", () => {
  it("resizes, compresses, and re-encodes a jpeg as webp", async () => {
    const file = new File(["fake-image"], "photo.jpg", { type: "image/jpeg" })

    const result = await prepareImageFile(file)

    expect(mockImageCompression).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        maxWidthOrHeight: 1920,
        initialQuality: 0.8,
        maxSizeMB: 4.3,
        fileType: "image/webp",
        useWebWorker: true,
      }),
    )
    expect(result).toEqual({ file: expect.any(File) })
    if ("file" in result) {
      expect(result.file.name).toBe("photo.webp")
      expect(result.file.type).toBe("image/webp")
    }
  })

  it("converts HEIC to JPEG before compressing it to webp", async () => {
    mockIsHeic.mockResolvedValueOnce(true)
    const convertedBlob = new Blob(["converted-jpeg"], { type: "image/jpeg" })
    mockHeicTo.mockResolvedValueOnce(convertedBlob)
    const file = new File(["fake-heic"], "photo.heic", { type: "image/heic" })

    const result = await prepareImageFile(file)

    expect(mockImageCompression).toHaveBeenCalledWith(
      expect.objectContaining({ name: "photo.jpg", type: "image/jpeg" }),
      expect.anything(),
    )
    expect(result).toEqual({ file: expect.any(File) })
    if ("file" in result) {
      expect(result.file.name).toBe("photo.webp")
      expect(result.file.type).toBe("image/webp")
    }
  })

  it("skips compression for GIFs so animation isn't flattened", async () => {
    const file = new File(["fake-gif"], "photo.gif", { type: "image/gif" })

    const result = await prepareImageFile(file)

    expect(mockImageCompression).not.toHaveBeenCalled()
    expect(result).toEqual({ file })
  })

  it("rejects unsupported file types without attempting compression", async () => {
    const file = new File(["fake-pdf"], "recipe.pdf", { type: "application/pdf" })

    const result = await prepareImageFile(file)

    expect(result).toEqual({ error: IMAGE_TYPE_ERROR })
    expect(mockImageCompression).not.toHaveBeenCalled()
  })

  it("returns a conversion error when HEIC decoding fails", async () => {
    mockIsHeic.mockResolvedValueOnce(true)
    mockHeicTo.mockRejectedValueOnce(new Error("decode failed"))
    const file = new File(["fake-heic"], "photo.heic", { type: "image/heic" })

    const result = await prepareImageFile(file)

    expect(result).toEqual({ error: IMAGE_CONVERSION_ERROR })
    expect(mockImageCompression).not.toHaveBeenCalled()
  })

  it("returns a conversion error when compression fails", async () => {
    mockImageCompression.mockRejectedValueOnce(new Error("compression failed"))
    const file = new File(["fake-image"], "photo.jpg", { type: "image/jpeg" })

    const result = await prepareImageFile(file)

    expect(result).toEqual({ error: IMAGE_CONVERSION_ERROR })
  })

  it("returns a too-large error when a compressed image still exceeds 5MB", async () => {
    const oversized = new Uint8Array(6 * 1024 * 1024)
    mockImageCompression.mockResolvedValueOnce(new Blob([oversized], { type: "image/webp" }))
    const file = new File(["fake-image"], "photo.jpg", { type: "image/jpeg" })

    const result = await prepareImageFile(file)

    expect(result).toEqual({ error: IMAGE_TOO_LARGE_ERROR })
  })

  it("returns a too-large error for a GIF over 5MB since GIFs skip compression", async () => {
    const oversized = new Uint8Array(6 * 1024 * 1024)
    const file = new File([oversized], "photo.gif", { type: "image/gif" })

    const result = await prepareImageFile(file)

    expect(mockImageCompression).not.toHaveBeenCalled()
    expect(result).toEqual({ error: IMAGE_TOO_LARGE_ERROR })
  })
})
