"use client"

import { useCallback, useEffect, useRef } from "react"

const SCROLL_DELAY_MS = 50

export const useScrollToField = () => {
  const pendingScroll = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelPendingScroll = useCallback(() => {
    if (pendingScroll.current) clearTimeout(pendingScroll.current)
    pendingScroll.current = null
  }, [])

  useEffect(() => cancelPendingScroll, [cancelPendingScroll])

  return useCallback(
    (fieldKey: string) => {
      cancelPendingScroll()
      pendingScroll.current = setTimeout(() => {
        pendingScroll.current = null
        document
          .getElementById(`field-${fieldKey}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, SCROLL_DELAY_MS)
    },
    [cancelPendingScroll],
  )
}
