import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

const NotFound = () => (
  <div className="mx-auto max-w-screen-sm px-4 py-20 text-center">
    <p className="text-6xl font-bold text-primary">404</p>
    <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">Page not found</h1>
    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
      We couldn't find what you were looking for. It may have been moved or deleted.
    </p>
    <Button
      render={<Link href="/" />}
      nativeButton={false}
      size="lg"
      className="mt-8 gap-2"
    >
      <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
      Back to Home
    </Button>
  </div>
)

export default NotFound
