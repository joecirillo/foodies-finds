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
import { useImportedDraft } from "@/hooks/use-imported-draft"
import { useRecipeImport } from "@/hooks/use-recipe-import"
import { useState } from "react"
import { RecipeForm } from "./recipe-form"

export const AddRecipe = () => {
  const [url, setUrl] = useState("")
  const {
    draft,
    formMountKey,
    isAwaitingReplaceConfirmation,
    handleDirtyChange,
    receivePreview,
    acceptReplacement,
    cancelReplacement,
  } = useImportedDraft()
  const { status, error, importFromUrl } = useRecipeImport({ onPreview: receivePreview })

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
        open={isAwaitingReplaceConfirmation}
        onOpenChange={(open) => {
          if (!open) cancelReplacement()
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
            <Button variant="outline" onClick={cancelReplacement}>
              Keep editing
            </Button>
            <Button onClick={acceptReplacement}>Replace draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
