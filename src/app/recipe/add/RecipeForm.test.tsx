// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RecipeForm } from "./RecipeForm"

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("@/app/actions/recipe", () => ({
  addRecipeAction: vi.fn(),
  presignRecipeImageUploadAction: vi.fn(),
  attachRecipeImageAction: vi.fn(),
  deleteRecipeImageAction: vi.fn(),
}))

vi.mock("heic-to", () => ({
  isHeic: vi.fn(),
  heicTo: vi.fn(),
}))

vi.mock("browser-image-compression", () => ({
  default: vi.fn(),
}))

import { useRouter } from "next/navigation"
import {
  addRecipeAction,
  presignRecipeImageUploadAction,
  attachRecipeImageAction,
  deleteRecipeImageAction,
} from "@/app/actions/recipe"
import { isHeic, heicTo } from "heic-to"
import imageCompression from "browser-image-compression"

const mockUseRouter = vi.mocked(useRouter)
const mockAddRecipeAction = vi.mocked(addRecipeAction)
const mockPresignRecipeImageUploadAction = vi.mocked(presignRecipeImageUploadAction)
const mockAttachRecipeImageAction = vi.mocked(attachRecipeImageAction)
const mockDeleteRecipeImageAction = vi.mocked(deleteRecipeImageAction)
const mockIsHeic = vi.mocked(isHeic)
const mockHeicTo = vi.mocked(heicTo)
const mockImageCompression = vi.mocked(imageCompression)

window.HTMLElement.prototype.scrollIntoView = vi.fn()

let mockPush: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockPush = vi.fn()
  mockUseRouter.mockReturnValue({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  } as ReturnType<typeof useRouter>)
  mockAddRecipeAction.mockReset()
  mockPresignRecipeImageUploadAction.mockReset()
  mockAttachRecipeImageAction.mockReset()
  mockDeleteRecipeImageAction.mockReset()
  mockIsHeic.mockReset().mockResolvedValue(false)
  mockHeicTo.mockReset()
  mockImageCompression
    .mockReset()
    .mockImplementation(async (file) => new Blob([file], { type: "image/webp" }))

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }),
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function selectUnit(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name: "—" }))
  await user.click(await screen.findByRole("option", { name }))
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  const spinbuttons = screen.getAllByRole("spinbutton")
  await user.type(screen.getByPlaceholderText("e.g. Grandma's Lasagna"), "Test Recipe")
  await user.type(spinbuttons[0], "10") // prep time
  await user.type(spinbuttons[2], "2") // servings

  await user.type(screen.getByPlaceholderText("Search cuisines…"), "Italian")
  await user.keyboard("{Enter}")

  await user.type(screen.getByPlaceholderText("Ingredient name"), "flour")
  await selectUnit(user, "gram (g)")

  await user.type(screen.getByPlaceholderText("Describe this step…"), "Mix the ingredients")
}

describe("RecipeForm", () => {
  describe("validation", () => {
    it("shows error when servings is empty", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.click(screen.getAllByText("Save Recipe")[0])

      expect(screen.getByText("Servings is required", { selector: "li" })).toBeInTheDocument()
    })

    it("shows error when cuisine is not selected", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.click(screen.getAllByText("Save Recipe")[0])

      expect(screen.getByText("Cuisine is required", { selector: "li" })).toBeInTheDocument()
    })

    it("shows an inline unit error when an ingredient has a name but no unit selected", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Ingredient name"), "flour")
      await user.click(screen.getAllByText("Save Recipe")[0])

      expect(screen.getByText("Unit is required for flour", { selector: "p" })).toBeInTheDocument()
    })

    it("does not call addRecipeAction when validation fails", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.click(screen.getAllByText("Save Recipe")[0])

      expect(mockAddRecipeAction).not.toHaveBeenCalled()
    })
  })

  describe("author default", () => {
    it("submits 'Anonymous' as author when the author field is left empty", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url === "/api/units") {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([{ id: 1, name: "gram", abbreviation: "g" }]),
            })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        }),
      )

      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      const { container } = render(<RecipeForm />)

      await fillRequiredFields(user, container)

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockAddRecipeAction).toHaveBeenCalledWith(
          expect.objectContaining({ author: "Anonymous" }),
        )
      })
    })
  })

  describe("calories default", () => {
    it("submits 0 as calories when the calories field is left empty", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url === "/api/units") {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([{ id: 1, name: "gram", abbreviation: "g" }]),
            })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        }),
      )

      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      const { container } = render(<RecipeForm />)

      await fillRequiredFields(user, container)

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockAddRecipeAction).toHaveBeenCalledWith(expect.objectContaining({ calories: 0 }))
      })
    })
  })

  describe("text normalization", () => {
    it("title-cases the recipe name and ingredient names in the submitted payload", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url === "/api/units") {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([{ id: 1, name: "gram", abbreviation: "g" }]),
            })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        }),
      )

      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      const user = userEvent.setup()
      render(<RecipeForm />)

      const spinbuttons = screen.getAllByRole("spinbutton")
      await user.type(screen.getByPlaceholderText("e.g. Grandma's Lasagna"), "spaghetti bolognese")
      await user.type(spinbuttons[0], "10")
      await user.type(spinbuttons[2], "2")
      await user.type(screen.getByPlaceholderText("Search cuisines…"), "Italian")
      await user.keyboard("{Enter}")
      await user.type(screen.getByPlaceholderText("Ingredient name"), "extra-virgin olive oil")
      await selectUnit(user, "gram (g)")
      await user.type(screen.getByPlaceholderText("Describe this step…"), "Mix the ingredients")

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockAddRecipeAction).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Spaghetti Bolognese",
            ingredients: [expect.objectContaining({ name: "Extra-Virgin Olive Oil" })],
          }),
        )
      })
    })
  })

  describe("image upload", () => {
    const PRESIGNED = {
      ok: true as const,
      uploadUrl: "https://account.r2.cloudflarestorage.com/signed",
      key: "recipes/abc-123.jpg",
      imageUrl: "https://cdn.foodiesfinds.com/recipes/abc-123.jpg",
    }

    function stubFetch(putOk: boolean) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string, init?: RequestInit) => {
          if (url === "/api/units") {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([{ id: 1, name: "gram", abbreviation: "g" }]),
            })
          }
          if (url === PRESIGNED.uploadUrl && init?.method === "PUT") {
            return Promise.resolve({ ok: putOk, status: putOk ? 200 : 500 })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        }),
      )
    }

    async function selectImageFile(user: ReturnType<typeof userEvent.setup>) {
      const file = new File(["fake-image"], "photo.jpg", { type: "image/jpeg" })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(input, file)
    }

    it("presigns, uploads to R2, and attaches the image after the recipe is created", async () => {
      stubFetch(true)
      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce(PRESIGNED)
      mockAttachRecipeImageAction.mockResolvedValueOnce({ ok: true })

      const user = userEvent.setup()
      render(<RecipeForm />)
      await fillRequiredFields(user)
      await selectImageFile(user)

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockAddRecipeAction).toHaveBeenCalledWith(
          expect.objectContaining({ imageUrl: null }),
        )
      })
      await waitFor(() => {
        expect(mockPresignRecipeImageUploadAction).toHaveBeenCalledWith(
          "image/webp",
          expect.any(Number),
        )
      })
      await waitFor(() => {
        expect(mockAttachRecipeImageAction).toHaveBeenCalledWith(1, PRESIGNED.key)
      })
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/recipe/1")
      })
      expect(mockDeleteRecipeImageAction).not.toHaveBeenCalled()
    })

    it("still navigates when the recipe was created but presigning fails", async () => {
      stubFetch(true)
      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce({ ok: false, error: "boom" })

      const user = userEvent.setup()
      render(<RecipeForm />)
      await fillRequiredFields(user)
      await selectImageFile(user)

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/recipe/1")
      })
      expect(mockAttachRecipeImageAction).not.toHaveBeenCalled()
    })

    it("deletes the orphaned upload when attaching the image fails", async () => {
      stubFetch(true)
      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce(PRESIGNED)
      mockAttachRecipeImageAction.mockResolvedValueOnce({ ok: false })

      const user = userEvent.setup()
      render(<RecipeForm />)
      await fillRequiredFields(user)
      await selectImageFile(user)

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockDeleteRecipeImageAction).toHaveBeenCalledWith(PRESIGNED.key)
      })
      expect(mockPush).toHaveBeenCalledWith("/recipe/1")
    })

    it("deletes the orphaned upload when the PUT to R2 fails", async () => {
      stubFetch(false)
      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce(PRESIGNED)

      const user = userEvent.setup()
      render(<RecipeForm />)
      await fillRequiredFields(user)
      await selectImageFile(user)

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockDeleteRecipeImageAction).toHaveBeenCalledWith(PRESIGNED.key)
      })
      expect(mockAttachRecipeImageAction).not.toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith("/recipe/1")
    })

    it("does not call the presign action when no image was selected", async () => {
      stubFetch(true)
      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })

      const user = userEvent.setup()
      render(<RecipeForm />)
      await fillRequiredFields(user)

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/recipe/1")
      })
      expect(mockPresignRecipeImageUploadAction).not.toHaveBeenCalled()
    })

    it("converts a HEIC photo to JPEG at selection and uploads the converted file", async () => {
      stubFetch(true)
      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      mockPresignRecipeImageUploadAction.mockResolvedValueOnce(PRESIGNED)
      mockAttachRecipeImageAction.mockResolvedValueOnce({ ok: true })
      mockIsHeic.mockResolvedValueOnce(true)
      const convertedBlob = new Blob(["converted-jpeg"], { type: "image/jpeg" })
      mockHeicTo.mockResolvedValueOnce(convertedBlob)

      const user = userEvent.setup()
      render(<RecipeForm />)
      await fillRequiredFields(user)

      // userEvent.upload enforces the input's accept filter like a real OS picker would;
      // fireEvent bypasses that so the test isn't coupled to that filtering.
      const file = new File(["fake-heic"], "photo.heic", { type: "image/heic" })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText("photo.webp")).toBeInTheDocument()
      })

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/recipe/1")
      })
      expect(mockPresignRecipeImageUploadAction).toHaveBeenCalledWith(
        "image/webp",
        convertedBlob.size,
      )
    })

    it("shows an error and never presigns when HEIC conversion fails", async () => {
      stubFetch(true)
      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })
      mockIsHeic.mockResolvedValueOnce(true)
      mockHeicTo.mockRejectedValueOnce(new Error("decode failed"))

      const user = userEvent.setup()
      render(<RecipeForm />)
      await fillRequiredFields(user)

      const file = new File(["fake-heic"], "photo.heic", { type: "image/heic" })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })

      expect(
        await screen.findByText("Couldn't process that photo — please try a different one.", {
          selector: "p",
        }),
      ).toBeInTheDocument()

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/recipe/1")
      })
      expect(mockPresignRecipeImageUploadAction).not.toHaveBeenCalled()
    })

    it("rejects an unsupported file type at selection and never presigns it", async () => {
      stubFetch(true)
      mockAddRecipeAction.mockResolvedValueOnce({ ok: true, id: 1 })

      const user = userEvent.setup()
      render(<RecipeForm />)
      await fillRequiredFields(user)

      const file = new File(["fake-pdf"], "recipe.pdf", { type: "application/pdf" })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })

      expect(
        await screen.findByText("File must be a jpeg, png, webp, or gif photo.", { selector: "p" }),
      ).toBeInTheDocument()

      await user.click(screen.getAllByText("Save Recipe")[0])

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/recipe/1")
      })
      expect(mockPresignRecipeImageUploadAction).not.toHaveBeenCalled()
    })
  })

  describe("custom cuisine", () => {
    it("sets a custom cuisine as a chip when Enter is pressed in the cuisine input", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Search cuisines…"), "Guyanese")
      await user.keyboard("{Enter}")

      expect(screen.getByText("Guyanese")).toBeInTheDocument()
      expect(screen.queryByPlaceholderText("Search cuisines…")).not.toBeInTheDocument()
    })

    it("title-cases a custom cuisine name", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Search cuisines…"), "tex-mex fusion")
      await user.keyboard("{Enter}")

      expect(screen.getByText("Tex-Mex Fusion")).toBeInTheDocument()
    })
  })

  describe("step drag reordering", () => {
    it("reorders steps when dragged", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Describe this step…"), "Step one")
      await user.click(screen.getByText("Add Step"))
      await user.type(screen.getAllByPlaceholderText("Describe this step…")[1], "Step two")

      const stepRows = screen
        .getAllByPlaceholderText("Describe this step…")
        .map((el) => el.closest("[draggable]")) as HTMLElement[]

      fireEvent.dragStart(stepRows[0])
      fireEvent.dragOver(stepRows[1])
      fireEvent.drop(stepRows[1])

      const textareas = screen.getAllByPlaceholderText(
        "Describe this step…",
      ) as HTMLTextAreaElement[]
      expect(textareas[0].value).toBe("Step two")
      expect(textareas[1].value).toBe("Step one")
    })

    it("reorders steps via touch drag on mobile", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Describe this step…"), "Step one")
      await user.click(screen.getByText("Add Step"))
      await user.type(screen.getAllByPlaceholderText("Describe this step…")[1], "Step two")

      const stepRows = document.querySelectorAll("[data-step-index]")
      Object.defineProperty(document, "elementFromPoint", {
        value: vi.fn().mockReturnValue(stepRows[1]),
        configurable: true,
        writable: true,
      })

      const handle = screen.getAllByLabelText("Drag to reorder step")[0]
      fireEvent(handle, new TouchEvent("touchstart", { bubbles: true }))
      fireEvent(
        handle,
        new TouchEvent("touchmove", {
          bubbles: true,
          touches: [{ clientX: 0, clientY: 100 } as Touch],
        }),
      )
      fireEvent(handle, new TouchEvent("touchend", { bubbles: true }))

      Object.defineProperty(document, "elementFromPoint", { value: undefined, configurable: true })

      const textareas = screen.getAllByPlaceholderText(
        "Describe this step…",
      ) as HTMLTextAreaElement[]
      expect(textareas[0].value).toBe("Step two")
      expect(textareas[1].value).toBe("Step one")
    })

    it("does not change order when dropped on the same step", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Describe this step…"), "Step one")
      await user.click(screen.getByText("Add Step"))

      const stepRows = screen
        .getAllByPlaceholderText("Describe this step…")
        .map((el) => el.closest("[draggable]")) as HTMLElement[]

      fireEvent.dragStart(stepRows[0])
      fireEvent.dragOver(stepRows[0])
      fireEvent.drop(stepRows[0])

      const textareas = screen.getAllByPlaceholderText(
        "Describe this step…",
      ) as HTMLTextAreaElement[]
      expect(textareas[0].value).toBe("Step one")
    })
  })

  describe("custom tags", () => {
    it("adds a custom tag chip when Enter is pressed in the tag input", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Search tags…"), "weeknight")
      await user.keyboard("{Enter}")

      expect(screen.getByText("weeknight")).toBeInTheDocument()
    })

    it("does not add a duplicate custom tag", async () => {
      const user = userEvent.setup()
      render(<RecipeForm />)

      await user.type(screen.getByPlaceholderText("Search tags…"), "weeknight")
      await user.keyboard("{Enter}")
      await user.type(screen.getByPlaceholderText("Search tags…"), "weeknight")
      await user.keyboard("{Enter}")

      expect(screen.getAllByText("weeknight")).toHaveLength(1)
    })
  })

  describe("save button loading state", () => {
    it("shows a spinner and disables the button while the recipe is saving", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url === "/api/units") {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([{ id: 1, name: "gram", abbreviation: "g" }]),
            })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        }),
      )

      let resolveAddRecipe: (value: { ok: true; id: number }) => void = () => {}
      mockAddRecipeAction.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveAddRecipe = resolve
        }),
      )

      const user = userEvent.setup()
      render(<RecipeForm />)
      await fillRequiredFields(user)

      await user.click(screen.getAllByText("Save Recipe")[0])

      const savingButtons = screen.getAllByRole("button", { name: /Saving…/ })
      expect(savingButtons).toHaveLength(2)
      for (const button of savingButtons) {
        expect(button).toBeDisabled()
        expect(button.querySelector(".animate-spin")).toBeInTheDocument()
      }

      resolveAddRecipe({ ok: true, id: 1 })
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/recipe/1")
      })
    })

    it("shows a spinner and 'Processing photo…' on the save button while a HEIC photo is processing", async () => {
      mockIsHeic.mockResolvedValueOnce(true)
      let resolveHeicTo: (value: Blob) => void = () => {}
      mockHeicTo.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveHeicTo = resolve
        }),
      )

      render(<RecipeForm />)

      const file = new File(["fake-heic"], "photo.heic", { type: "image/heic" })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })

      const convertingButtons = await screen.findAllByRole("button", {
        name: /Processing photo…/,
      })
      expect(convertingButtons).toHaveLength(2)
      for (const button of convertingButtons) {
        expect(button).toBeDisabled()
        expect(button.querySelector(".animate-spin")).toBeInTheDocument()
      }

      resolveHeicTo(new Blob(["converted-jpeg"], { type: "image/jpeg" }))
      await waitFor(() => {
        expect(screen.getByText("photo.webp")).toBeInTheDocument()
      })
    })
  })
})
