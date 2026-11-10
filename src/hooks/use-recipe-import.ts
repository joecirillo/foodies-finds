"use client"

import { useRef, useState } from "react"
import { importRecipeFromUrlAction } from "@/app/actions/recipe"
import { UNEXPECTED_IMPORT_MESSAGE } from "@/lib/recipe-import/import-messages"
import type { RecipeImportPreview } from "@/types/recipe"

type ImportStatus = "idle" | "loading" | "error"

type UseRecipeImportArgs = {
  onPreview: (preview: RecipeImportPreview) => void
}

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
      return { ok: false as const, error: UNEXPECTED_IMPORT_MESSAGE }
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
