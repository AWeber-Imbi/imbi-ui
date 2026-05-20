import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PluginOptionDef } from '@/types'

export interface OptionRowProps {
  description: null | string
  label: string
  name: string
  onChange: (next: unknown) => void
  opt: PluginOptionDef
  placeholder?: string
  value: unknown
}

export function OptionRow({
  description,
  label,
  name,
  onChange,
  opt,
  placeholder,
  value,
}: OptionRowProps) {
  const id = `option-${name}`
  let control: React.ReactNode

  if (opt.choices && opt.choices.length > 0) {
    control = (
      <Select
        onValueChange={(v) => onChange(v)}
        value={typeof value === 'string' ? value : ''}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder ?? 'Select…'} />
        </SelectTrigger>
        <SelectContent>
          {opt.choices.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  } else if (opt.type === 'boolean') {
    control = (
      <input
        checked={Boolean(value)}
        id={id}
        onChange={(e) => onChange(e.target.checked)}
        type="checkbox"
      />
    )
  } else if (opt.type === 'integer') {
    control = (
      <Input
        id={id}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') {
            onChange(null)
            return
          }
          const n = Number.parseInt(raw, 10)
          if (!Number.isNaN(n)) onChange(n)
        }}
        placeholder={placeholder}
        type="number"
        value={
          typeof value === 'number' ? String(value) : (value as string) || ''
        }
      />
    )
  } else {
    control = (
      <Input
        id={id}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={opt.type === 'secret' ? 'password' : 'text'}
        value={(value as string) ?? ''}
      />
    )
  }

  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-3">
      <Label className="truncate text-xs" htmlFor={id} title={label}>
        {label}
        {opt.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="space-y-1">
        {control}
        {description && <p className="text-secondary text-xs">{description}</p>}
      </div>
    </div>
  )
}
