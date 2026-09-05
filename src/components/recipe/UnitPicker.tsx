"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { Unit } from "@/types/recipe"

type UnitPickerProps = {
  units: Unit[]
  value: number | null
  onChange: (unitId: number | null) => void
  ariaInvalid?: boolean
}

export const UnitPicker = ({ units, value, onChange, ariaInvalid }: UnitPickerProps) => {
  const [open, setOpen] = useState(false)
  const sortedUnits = [...units].sort((a, b) => a.name.localeCompare(b.name))
  const selected = units.find((u) => u.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-invalid={ariaInvalid}
        className={cn(
          "flex h-9 w-full items-center rounded-4xl border border-input bg-input/30 px-3 text-left text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="min-w-0 truncate block">
          {selected ? `${selected.name} (${selected.abbreviation})` : "—"}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search units…" />
          <CommandList>
            <CommandEmpty>No units found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="—"
                data-checked={value === null}
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                —
              </CommandItem>
              {sortedUnits.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`${u.name} ${u.abbreviation}`}
                  data-checked={value === u.id}
                  onSelect={() => {
                    onChange(u.id)
                    setOpen(false)
                  }}
                >
                  {u.name} ({u.abbreviation})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
