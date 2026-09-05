"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { StepRow } from "@/types/recipe"

type UseStepRowsArgs = {
  initialSteps: StepRow[]
}

export const useStepRows = ({ initialSteps }: UseStepRowsArgs) => {
  const [steps, setSteps] = useState<StepRow[]>(initialSteps)
  const keyCounter = useRef(initialSteps.length)
  const dragIndex = useRef<number | null>(null)
  const stepsListRef = useRef<HTMLDivElement>(null)

  const addStep = () => {
    setSteps((prev) => [...prev, { key: ++keyCounter.current, description: "", tip: "" }])
  }

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, updates: Partial<StepRow>) => {
    setSteps((prev) => prev.map((row, i) => (i === index ? { ...row, ...updates } : row)))
  }

  const reorderStep = useCallback((fromIndex: number, toIndex: number) => {
    setSteps((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const dragHandlersFor = (index: number) => ({
    onDragStart: () => {
      dragIndex.current = index
    },
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: () => {
      if (dragIndex.current !== null && dragIndex.current !== index) {
        reorderStep(dragIndex.current, index)
      }
      dragIndex.current = null
    },
  })

  // Native HTML5 drag-and-drop (used above) has no touch equivalent, so mobile
  // reordering is handled manually via touch events on the same list container.
  useEffect(() => {
    const container = stepsListRef.current
    if (!container) return

    let fromIndex: number | null = null
    let toIndex: number | null = null

    const onTouchStart = (e: TouchEvent) => {
      const handle = (e.target as HTMLElement).closest("[data-drag-handle]")
      if (!handle) return
      const row = handle.closest("[data-step-index]") as HTMLElement | null
      if (row?.dataset.stepIndex !== undefined) {
        fromIndex = parseInt(row.dataset.stepIndex)
        toIndex = fromIndex
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (fromIndex === null) return
      e.preventDefault()
      const touch = e.touches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const row = el?.closest("[data-step-index]") as HTMLElement | null
      if (row?.dataset.stepIndex !== undefined) {
        toIndex = parseInt(row.dataset.stepIndex)
      }
    }

    const onTouchEnd = () => {
      if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
        reorderStep(fromIndex, toIndex)
      }
      fromIndex = null
      toIndex = null
    }

    container.addEventListener("touchstart", onTouchStart, { passive: true })
    container.addEventListener("touchmove", onTouchMove, { passive: false })
    container.addEventListener("touchend", onTouchEnd, { passive: true })

    return () => {
      container.removeEventListener("touchstart", onTouchStart)
      container.removeEventListener("touchmove", onTouchMove)
      container.removeEventListener("touchend", onTouchEnd)
    }
  }, [reorderStep])

  return { steps, stepsListRef, addStep, removeStep, updateStep, dragHandlersFor }
}
