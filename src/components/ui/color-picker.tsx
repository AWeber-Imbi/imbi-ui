import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Check } from 'lucide-react'

interface Swatch {
  name: string
  hex: string
}

const SWATCHES: Swatch[] = [
  { name: 'Clay', hex: '#C86B5E' },
  { name: 'Ember', hex: '#D98847' },
  { name: 'Honey', hex: '#C9A227' },
  { name: 'Moss', hex: '#6B9A3F' },
  { name: 'Dusk', hex: '#5A89C9' },
  { name: 'Lilac', hex: '#8C82D4' },
  { name: 'Rose', hex: '#C96B97' },
  { name: 'Stone', hex: '#7A7873' },
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  /** What kind of object this color labels (e.g. "environment", "project type"). */
  objectType: string
  /** The label/name value previewed in the chip. Mirrors the name field above. */
  labelValue: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function darken(hex: string, amt: number): string | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const r = Math.round(rgb.r * (1 - amt))
  const g = Math.round(rgb.g * (1 - amt))
  const b = Math.round(rgb.b * (1 - amt))
  return `rgb(${r},${g},${b})`
}

function relativeLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith('#')) return hexToRgb(color)
  const m = color.match(/\d+/g)
  if (!m || m.length < 3) return null
  return { r: +m[0], g: +m[1], b: +m[2] }
}

function contrastRatio(fg: string, bg: string): number | null {
  const f = parseRgb(fg)
  const b = parseRgb(bg)
  if (!f || !b) return null
  const L1 = relativeLuminance(f.r, f.g, f.b)
  const L2 = relativeLuminance(b.r, b.g, b.b)
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
}

function deriveChipColors(
  hex: string,
): { bg: string; fg: string; border: string } | null {
  const rgb = hexToRgb(hex)
  const fg = darken(hex, 0.35)
  if (!rgb || !fg) return null
  return {
    bg: `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`,
    fg,
    border: `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`,
  }
}

export function ColorPicker({
  value,
  onChange,
  objectType,
  labelValue,
}: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value)
  const swatchRefs = useRef<Array<HTMLButtonElement | null>>([])
  const nativeColorRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHexInput(value)
  }, [value])

  const normalized = value?.toUpperCase() ?? ''
  const selectedIdx = SWATCHES.findIndex(
    (s) => s.hex.toUpperCase() === normalized,
  )

  const commit = (hex: string) => {
    const upper = hex.toUpperCase()
    setHexInput(upper)
    onChange(upper)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const currentIdx = selectedIdx >= 0 ? selectedIdx : 0
    let nextIdx = currentIdx
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (currentIdx + 1) % SWATCHES.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (currentIdx - 1 + SWATCHES.length) % SWATCHES.length
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      commit(SWATCHES[currentIdx].hex)
      return
    } else {
      return
    }
    e.preventDefault()
    commit(SWATCHES[nextIdx].hex)
    swatchRefs.current[nextIdx]?.focus()
  }

  const derived = deriveChipColors(value)
  const contrast =
    derived && hexToRgb(value)
      ? contrastRatio(
          derived.fg,
          `rgb(${hexToRgb(value)!.r},${hexToRgb(value)!.g},${hexToRgb(value)!.b})`,
        )
      : null
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(value)
  // Contrast check compares derived fg against the raw hex (the chip's saturated core),
  // matching the design prototype's contrastRatio(fg, bg) call.
  const hasLowContrast = isValidHex && contrast !== null && contrast < 3.0

  const previewText = labelValue.trim() || 'Label'

  const pipBackground = isValidHex ? value : 'transparent'

  const statusLabel = !isValidHex
    ? null
    : hasLowContrast
      ? 'Low contrast'
      : 'Valid'

  return (
    <div className="space-y-3">
      <label
        htmlFor="color-picker-swatches"
        className="block text-sm font-medium text-primary"
      >
        Label color
        <span className="ml-1 text-xs font-normal text-tertiary">
          · used on chips wherever this {objectType} appears
        </span>
      </label>

      <div className="max-w-md rounded-md bg-tertiary p-3.5">
        {/* Swatch radio group */}
        <div
          id="color-picker-swatches"
          role="radiogroup"
          aria-label="Label color"
          onKeyDown={handleKeyDown}
          className="grid grid-cols-8 gap-2"
        >
          {SWATCHES.map((s, i) => {
            const checked = selectedIdx === i
            return (
              <button
                key={s.hex}
                ref={(el) => {
                  swatchRefs.current[i] = el
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={`${s.name} · ${s.hex}`}
                title={`${s.name} · ${s.hex}`}
                tabIndex={checked || (selectedIdx < 0 && i === 0) ? 0 : -1}
                onClick={() => commit(s.hex)}
                style={{ backgroundColor: s.hex }}
                className={`relative flex aspect-square items-center justify-center rounded-[10px] border-2 transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 ${
                  checked ? 'border-primary' : 'border-transparent'
                }`}
              >
                {checked && (
                  <Check
                    className="h-3.5 w-3.5 text-white"
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                    aria-hidden
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Swatch names */}
        <div className="mt-1.5 grid grid-cols-8 gap-2">
          {SWATCHES.map((s) => (
            <span
              key={s.hex}
              className="text-center font-mono text-[10.5px] text-tertiary"
            >
              {s.name}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="my-4 flex items-center gap-2.5 text-[11.5px] font-medium uppercase tracking-wider text-tertiary">
          <span aria-hidden className="h-px flex-1 bg-tertiary" />
          or custom hex
          <span aria-hidden className="h-px flex-1 bg-tertiary" />
        </div>

        {/* Hex input group */}
        <div className="flex items-center gap-1 rounded-md border border-tertiary bg-primary p-1 transition-colors focus-within:border-secondary">
          <label
            className="relative h-7 w-7 flex-shrink-0 cursor-pointer rounded-md border border-tertiary"
            style={{ backgroundColor: pipBackground }}
            aria-label="Open OS color picker"
          >
            <input
              ref={nativeColorRef}
              type="color"
              value={isValidHex ? value : '#000000'}
              onChange={(e) => commit(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <input
            type="text"
            value={hexInput}
            spellCheck={false}
            maxLength={7}
            aria-label="Hex color"
            onChange={(e) => {
              const raw = e.target.value.toUpperCase()
              if (!/^$|^#[0-9A-F]{0,6}$/.test(raw)) return
              setHexInput(raw)
              if (raw === '' || /^#[0-9A-F]{6}$/.test(raw)) {
                onChange(raw)
              }
            }}
            placeholder="#C9A227"
            className="flex-1 border-0 bg-transparent px-2 font-mono text-[13px] text-primary outline-none placeholder:text-tertiary"
          />
          {statusLabel && (
            <span
              className={`mr-1 rounded px-2 py-1 text-[11px] font-medium ${
                hasLowContrast
                  ? 'bg-warning text-warning'
                  : 'bg-success text-success'
              }`}
              role="status"
            >
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      {/* Preview */}
      {derived && (
        <div className="border-t border-dashed border-tertiary pt-4">
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
            Preview · this label
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="inline-flex items-center rounded-[5px] px-2 text-[11.5px] font-medium"
              style={{
                backgroundColor: derived.bg,
                color: derived.fg,
                height: 22,
                letterSpacing: '0.02em',
              }}
            >
              {previewText}
            </span>
            <span
              className="inline-flex items-center rounded-[5px] px-2.5 text-[13px] font-medium"
              style={{
                backgroundColor: derived.bg,
                color: derived.fg,
                height: 26,
              }}
            >
              {previewText}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-secondary">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: value }}
              />
              {previewText}
            </span>
          </div>
          <p className="mt-2 text-xs text-tertiary">
            Shows this label at the three sizes it appears across the product.
          </p>
        </div>
      )}
    </div>
  )
}
