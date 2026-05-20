export default function RecipeLoading() {
  return (
    <div className="min-h-screen bg-background pb-10 animate-pulse">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/90 px-4 py-3 backdrop-blur-sm border-b border-border">
        <div className="size-8 rounded-lg bg-muted" />
        <div className="h-8 w-16 rounded-lg bg-muted" />
      </div>

      <div className="mx-auto max-w-screen-sm px-4 pt-5">
        <div className="mb-3 flex gap-2">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-5 w-12 rounded-full bg-muted" />
        </div>

        <div className="h-7 w-3/4 rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-1/3 rounded-lg bg-muted" />

        <div className="mt-3 space-y-2">
          <div className="h-3.5 w-full rounded bg-muted" />
          <div className="h-3.5 w-5/6 rounded bg-muted" />
        </div>

        <div className="mt-4 flex gap-4">
          <div className="h-5 w-20 rounded bg-muted" />
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="h-5 w-16 rounded bg-muted" />
        </div>

        <div className="mt-7">
          <div className="mb-3 h-5 w-28 rounded bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted" />
            ))}
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-3 h-5 w-14 rounded bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="size-6 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-full rounded bg-muted" />
                  <div className="h-3.5 w-4/5 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
