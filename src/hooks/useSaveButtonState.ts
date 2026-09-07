"use client"

type UseSaveButtonStateArgs = {
  isSubmitting: boolean
  isProcessingImage: boolean
  idleLabel: string
}

export const useSaveButtonState = ({
  isSubmitting,
  isProcessingImage,
  idleLabel,
}: UseSaveButtonStateArgs) => {
  const isBusy = isSubmitting || isProcessingImage
  const label = isSubmitting ? "Saving…" : isProcessingImage ? "Processing photo…" : idleLabel

  return { isBusy, label }
}
