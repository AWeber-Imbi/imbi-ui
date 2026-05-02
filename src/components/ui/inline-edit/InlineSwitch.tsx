import { useEffect, useRef, useState } from 'react'

import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'

import { InlineDisplay } from './InlineDisplay'

export interface InlineSwitchProps {
  onCommit: (next: boolean) => Promise<void> | void
  pending?: boolean
  readOnly?: boolean
  value: boolean | null
}

export function InlineSwitch({
  onCommit,
  pending = false,
  readOnly = false,
  value,
}: InlineSwitchProps) {
  const [isEditing, setIsEditing] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!isEditing) return
    const handlePointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setIsEditing(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isEditing])

  if (!isEditing) {
    return (
      <InlineDisplay
        hasValue={value != null}
        onClick={() => setIsEditing(true)}
        pending={pending}
        readOnly={readOnly}
      >
        {value ? 'True' : value === false ? 'False' : null}
      </InlineDisplay>
    )
  }

  return (
    <span
      onKeyDown={(e) => {
        if (e.key === 'Escape') setIsEditing(false)
      }}
      ref={wrapperRef}
    >
      <Switch
        checked={!!value}
        disabled={pending}
        onCheckedChange={async (next) => {
          try {
            await onCommit(next)
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Save failed')
          } finally {
            setIsEditing(false)
          }
        }}
      />
    </span>
  )
}
