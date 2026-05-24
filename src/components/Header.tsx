import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CookBookIcon, Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-sm">
      {/* Mobile layout (< lg) */}
      <div className="lg:hidden">
        <div className="flex h-12 items-center justify-between px-4">
          <Link href="/" className="shrink-0 font-heading text-base font-semibold tracking-tight">
            Foodies Finds
          </Link>
          <div className="flex items-center gap-3">
            <Button
              render={<Link href="/recipe" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <HugeiconsIcon icon={CookBookIcon} className="size-8" strokeWidth={2} />
            </Button>
            <Button
              render={<Link href="/recipe/add" />}
              nativeButton={false}
              size="icon-sm"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <HugeiconsIcon icon={Add01Icon} size={18} />
            </Button>
          </div>
        </div>
        <div className="px-4 pb-2">
          <Input
            placeholder="Search for recipes..."
            className="h-9 w-full bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/30"
          />
        </div>
      </div>

      {/* Desktop layout (lg+) */}
      <div className="hidden lg:flex mx-auto h-16 max-w-screen-xl items-center justify-between px-8">
        <Link href="/" className="shrink-0 font-heading text-lg font-semibold tracking-tight">
          Foodies Finds
        </Link>
        <div className="flex flex-1 max-w-sm mx-8">
          <Input placeholder="Search for recipes..." className="h-9 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/30" />
        </div>
        <div className="flex items-center gap-3">
          <Button
            render={<Link href="/recipe" />}
            nativeButton={false}
            variant="ghost"
            size="lg"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            View Recipes
          </Button>
          <Button
            render={<Link href="/recipe/add" />}
            nativeButton={false}
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            + Add Recipe
          </Button>
        </div>
      </div>
    </header>
  );
}
