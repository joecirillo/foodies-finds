// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useStepRows } from "./useStepRows"

const initialSteps = [{ key: 0, description: "Boil the pasta", tip: "" }]

describe("useStepRows", () => {
  it("starts with the given initial steps", () => {
    const { result } = renderHook(() => useStepRows({ initialSteps }))
    expect(result.current.steps).toEqual(initialSteps)
  })

  it("adds a new step with a key above any initial key", () => {
    const { result } = renderHook(() => useStepRows({ initialSteps }))

    act(() => result.current.addStep())

    expect(result.current.steps).toHaveLength(2)
    expect(result.current.steps[1].key).toBeGreaterThan(initialSteps[0].key)
    expect(result.current.steps[1]).toMatchObject({ description: "", tip: "" })
  })

  it("assigns unique, increasing keys across multiple additions", () => {
    const { result } = renderHook(() => useStepRows({ initialSteps }))

    act(() => result.current.addStep())
    act(() => result.current.addStep())

    const keys = result.current.steps.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("removes a step at the given index", () => {
    const { result } = renderHook(() =>
      useStepRows({
        initialSteps: [
          { key: 0, description: "Boil the pasta", tip: "" },
          { key: 1, description: "Add the sauce", tip: "" },
        ],
      }),
    )

    act(() => result.current.removeStep(0))

    expect(result.current.steps).toEqual([{ key: 1, description: "Add the sauce", tip: "" }])
  })

  it("updates a step's fields at the given index", () => {
    const { result } = renderHook(() => useStepRows({ initialSteps }))

    act(() => result.current.updateStep(0, { description: "Simmer for 10 minutes" }))

    expect(result.current.steps[0].description).toBe("Simmer for 10 minutes")
  })

  it("reorders steps when dragging from one index to another", () => {
    const { result } = renderHook(() =>
      useStepRows({
        initialSteps: [
          { key: 0, description: "Boil the pasta", tip: "" },
          { key: 1, description: "Add the sauce", tip: "" },
        ],
      }),
    )

    act(() => {
      result.current.dragHandlersFor(0).onDragStart()
      result.current.dragHandlersFor(1).onDrop()
    })

    expect(result.current.steps.map((s) => s.description)).toEqual([
      "Add the sauce",
      "Boil the pasta",
    ])
  })

  it("does not reorder when dropped on the same index", () => {
    const { result } = renderHook(() =>
      useStepRows({
        initialSteps: [
          { key: 0, description: "Boil the pasta", tip: "" },
          { key: 1, description: "Add the sauce", tip: "" },
        ],
      }),
    )

    act(() => {
      result.current.dragHandlersFor(0).onDragStart()
      result.current.dragHandlersFor(0).onDrop()
    })

    expect(result.current.steps.map((s) => s.description)).toEqual([
      "Boil the pasta",
      "Add the sauce",
    ])
  })
})
