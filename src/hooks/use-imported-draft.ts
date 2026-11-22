"use client"

import { useCallback, useRef, useState } from "react"
import { previewToRecipeFormValues } from "@/lib/recipe-import/recipe-form-values"
import type { RecipeFormValues, RecipeImportContext, RecipeImportPreview } from "@/types/recipe"

type ImportedDraft = {
  values: RecipeFormValues
  context: RecipeImportContext
}

export const useImportedDraft = () => {
  const [draft, setDraft] = useState<ImportedDraft | null>(null)
  const [formMountKey, setFormMountKey] = useState(0)
  const [pendingPreview, setPendingPreview] = useState<RecipeImportPreview | null>(null)
  const isDirtyRef = useRef(false)

  const handleDirtyChange = useCallback((isDirty: boolean) => {
    isDirtyRef.current = isDirty
  }, [])

  const remountFormWithPreview = (preview: RecipeImportPreview) => {
    setDraft({
      values: previewToRecipeFormValues(preview),
      context: { source: preview.source, warnings: preview.warnings },
    })
    setFormMountKey((key) => key + 1)
    setPendingPreview(null)
  }

  const receivePreview = (preview: RecipeImportPreview) => {
    if (isDirtyRef.current) setPendingPreview(preview)
    else remountFormWithPreview(preview)
  }

  const acceptReplacement = () => {
    if (pendingPreview) remountFormWithPreview(pendingPreview)
  }

  const cancelReplacement = () => setPendingPreview(null)

  return {
    draft,
    formMountKey,
    isAwaitingReplaceConfirmation: pendingPreview !== null,
    handleDirtyChange,
    receivePreview,
    acceptReplacement,
    cancelReplacement,
  }
}
