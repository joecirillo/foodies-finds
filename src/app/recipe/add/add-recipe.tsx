"use client"

import { ImportReviewNotice } from "@/components/recipe/import-review-notice"
import { RecipeImportPanel } from "@/components/recipe/recipe-import-panel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRecipeImport } from "@/hooks/use-recipe-import"
import { previewToRecipeFormValues } from "@/lib/recipe-import/recipe-form-values"
import type { RecipeFormValues, RecipeImportContext, RecipeImportPreview } from "@/types/recipe"
import { useCallback, useRef, useState } from "react"
import { RecipeForm } from "./recipe-form"

type ImportedDraft = {
  values: RecipeFormValues
  context: RecipeImportContext
}

export const AddRecipe = () => {
  const [url, setUrl] = useState("")
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

  const { status, error, importFromUrl } = useRecipeImport({
    onPreview: (preview) => {
      if (isDirtyRef.current) setPendingPreview(preview)
      else remountFormWithPreview(preview)
    },
  })

  return (
    <>
      <RecipeForm
        key={formMountKey}
        initialValues={draft?.values}
        showInitialErrors={!!draft}
        onDirtyChange={handleDirtyChange}
        beforeFields={
          <div className="space-y-4">
            <RecipeImportPanel
              url={url}
              onUrlChange={setUrl}
              onImport={() => importFromUrl(url)}
              isLoading={status === "loading"}
              error={error}
            />
            {draft && <ImportReviewNotice {...draft.context} />}
          </div>
        }
      />
      <Dialog
        open={!!pendingPreview}
        onOpenChange={(open) => {
          if (!open) setPendingPreview(null)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Replace your current draft?</DialogTitle>
            <DialogDescription>
              The imported recipe will replace everything you have entered so far.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingPreview(null)}>
              Keep editing
            </Button>
            <Button onClick={() => pendingPreview && remountFormWithPreview(pendingPreview)}>
              Replace draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
