"use client"

import { useRef, useState } from "react"
import { importRecipeFromUrlAction } from "@/app/actions/recipe"
import type { RecipeImportPreview } from "@/types/recipe"

type ImportStatus = "idle" | "loading" | "error"

type UseRecipeImportArgs = {
  onPreview: (preview: RecipeImportPreview) => void
}

const UNEXPECTED_IMPORT_ERROR = "We couldn't import that recipe right now. Please try again."

export const useRecipeImport = ({ onPreview }: UseRecipeImportArgs) => {
  const [status, setStatus] = useState<ImportStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const latestRequestId = useRef(0)

  const importFromUrl = async (url: string) => {
    const requestId = ++latestRequestId.current
    const isSupersededResponse = () => requestId !== latestRequestId.current
    setStatus("loading")
    setError(null)

    const result = await importRecipeFromUrlAction(url).catch((err: unknown) => {
      console.error("Recipe import request failed:", err)
      return { ok: false as const, error: UNEXPECTED_IMPORT_ERROR }
    })
    if (isSupersededResponse()) return

    if (!result.ok) {
      setStatus("error")
      setError(result.error)
      return
    }
    setStatus("idle")
    onPreview(result.preview)
  }

  return { status, error, importFromUrl }
}
