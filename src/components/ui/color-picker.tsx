import { useEffect, useRef, useState } from 'react'

const PRESET_COLORS = [
  '#EF4444',
  '#F59E0B',
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#A855F7',
  '#EC4899',
  '#6B7280',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hexInput, setHexInput] = useState(value)

  useEffect(() => {
    setHexInput(value)
  }, [value])

  const handleSwatchClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <label className={'block text-sm text-secondary'}>Label Color</label>

      {/* Preset swatches */}
      <div className="grid max-w-xs grid-cols-4 gap-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`h-12 w-12 rounded-lg transition-all ${
              value && value.toUpperCase() === color.toUpperCase()
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : 'hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Selected color + hex input */}
      <div className="flex max-w-xs items-center gap-3">
        <button
          type="button"
          onClick={handleSwatchClick}
          aria-label={value ? 'Change label color' : 'Pick label color'}
          className={`h-10 w-10 flex-shrink-0 cursor-pointer rounded-lg border ${
            !value ? 'border-input bg-secondary' : ''
          }`}
          style={value ? { backgroundColor: value } : undefined}
          title={value ? 'Click to change color' : 'Click to pick a color'}
        />
        <input
          ref={inputRef}
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="sr-only"
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => {
            const v = e.target.value.toUpperCase()
            if (!/^$|^#[0-9A-F]{0,6}$/.test(v)) return
            setHexInput(v)
            if (v === '' || /^#[0-9A-F]{6}$/.test(v)) {
              onChange(v)
            }
          }}
          placeholder="#3B82F6"
          maxLength={7}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${'border-input bg-background text-foreground placeholder:text-muted-foreground'}`}
        />
      </div>

      <p className={'text-xs text-tertiary'}>
        This color will be used for labels whenever this environment is
        displayed
      </p>
    </div>
  )
}
