import { useState } from 'react'
import { Check } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Command, CommandGroup, CommandInput, CommandItem } from 'cmdk'
import { InlineDisplay } from './InlineDisplay'
import { toast } from 'sonner'

export interface InlineMultiSelectOption {
  value: string
  label: string
}

export interface InlineMultiSelectProps {
  values: string[]
  options: InlineMultiSelectOption[]
  onCommit: (next: string[]) => Promise<void> | void
  readOnly?: boolean
  pending?: boolean
  placeholder?: string
}

export function InlineMultiSelect({
  values,
  options,
  onCommit,
  readOnly = false,
  pending = false,
  placeholder = 'Select…',
}: InlineMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(values)

  const toggle = (v: string) => {
    setDraft((cur) =>
      cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
    )
  }

  const sameSet = (a: string[], b: string[]) =>
    a.length === b.length && a.every((x) => b.includes(x))

  const close = async () => {
    setOpen(false)
    if (sameSet(draft, values)) return
    try {
      await onCommit(draft)
    } catch (e) {
      setDraft(values)
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const currentLabels = options
    .filter((o) => values.includes(o.value))
    .map((o) => o.label)
    .join(', ')

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(values)
          setOpen(true)
        } else {
          void close()
        }
      }}
    >
      <PopoverTrigger asChild>
        <span>
          <InlineDisplay
            hasValue={values.length > 0}
            readOnly={readOnly}
            pending={pending}
            onClick={() => setOpen(true)}
            placeholder={placeholder}
          >
            {currentLabels}
          </InlineDisplay>
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Filter…" />
          <CommandGroup>
            {options.map((o) => {
              const checked = draft.includes(o.value)
              return (
                <CommandItem
                  key={o.value}
                  role="option"
                  aria-selected={checked}
                  onSelect={() => toggle(o.value)}
                >
                  <Check
                    className={
                      'mr-2 h-4 w-4 ' + (checked ? 'opacity-100' : 'opacity-0')
                    }
                  />
                  {o.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
