import { useState } from 'react'

import { AlertTriangle, Check, Lock, Pencil, Plus, Trash2 } from 'lucide-react'

import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  BUILTIN_FORMATS,
  builtinForPattern,
  fullMatch,
  isValidPattern,
} from '@/lib/versionFormats'
import type { TagFormat } from '@/types'

interface FormatRow {
  builtin: boolean
  description: string
  enabled: boolean
  example: string
  id: string
  label: string
  pattern: string
}

interface FormatTableRowProps {
  disabled: boolean
  onDelete: () => void
  onEdit: () => void
  onToggle: () => void
  row: FormatRow
}

interface VersionFormatsEditorProps {
  disabled?: boolean
  inherited: TagFormat[]
  onChange: (next: TagFormat[]) => void
  projectTypeName: string
  value: TagFormat[]
}

let rowSeq = 0
const nextRowId = () => `vf-${(rowSeq += 1)}`

// Build the editor's working rows from a persisted `TagFormat[]`: every
// built-in preset appears (toggled on when its pattern is present), and any
// persisted pattern that isn't a built-in is appended as an enabled custom row.
function buildRows(formats: TagFormat[]): FormatRow[] {
  const enabled = new Set(formats.map((f) => f.pattern))
  const rows: FormatRow[] = BUILTIN_FORMATS.map((b) => ({
    builtin: true,
    description: b.description,
    enabled: enabled.has(b.pattern),
    example: b.example,
    id: nextRowId(),
    label: b.label,
    pattern: b.pattern,
  }))
  for (const f of formats) {
    if (!builtinForPattern(f.pattern)) {
      rows.push({
        builtin: false,
        description: 'Custom version format.',
        enabled: true,
        example: '',
        id: nextRowId(),
        label: f.label,
        pattern: f.pattern,
      })
    }
  }
  return rows
}

const toFormats = (rows: FormatRow[]): TagFormat[] =>
  rows
    .filter((r) => r.enabled)
    .map(({ label, pattern }) => ({ label, pattern }))

const toggleAriaLabel = (row: FormatRow): string =>
  row.enabled ? `Disable ${row.label}` : `Enable ${row.label}`

// fallow-ignore-next-line complexity
export function VersionFormatsEditor({
  disabled = false,
  inherited,
  onChange,
  projectTypeName,
  value,
}: VersionFormatsEditorProps) {
  const [override, setOverride] = useState(value.length > 0)
  const [rows, setRows] = useState<FormatRow[]>(() => buildRows(value))

  // Inline add/edit editor state.
  const [editorOpen, setEditorOpen] = useState(false)
  const [editId, setEditId] = useState<null | string>(null)
  const [fName, setFName] = useState('')
  const [fPattern, setFPattern] = useState('')
  const [fTest, setFTest] = useState('')

  const ptName = projectTypeName.trim() || 'these'

  // The persisted output is empty when inheriting (the backend then falls back
  // to the organization defaults) and the enabled rows when overriding.
  const commit = (nextOverride: boolean, nextRows: FormatRow[]) => {
    setOverride(nextOverride)
    setRows(nextRows)
    onChange(nextOverride ? toFormats(nextRows) : [])
  }

  const handleOverrideToggle = (checked: boolean) => {
    if (checked && toFormats(rows).length === 0) {
      // Seed the editable set from the inherited defaults so overriding starts
      // from the current behaviour rather than an empty (and meaningless) set.
      commit(true, buildRows(inherited))
    } else {
      commit(checked, rows)
    }
  }

  const toggleRow = (id: string) => {
    commit(
      override,
      rows.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    )
  }

  const removeRow = (id: string) => {
    commit(
      override,
      rows.filter((r) => r.id !== id),
    )
  }

  const openAdd = () => {
    setEditId(null)
    setFName('')
    setFPattern('')
    setFTest('')
    setEditorOpen(true)
  }

  const openEdit = (row: FormatRow) => {
    setEditId(row.id)
    setFName(row.label)
    setFPattern(row.pattern)
    setFTest(row.example)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditId(null)
    setFName('')
    setFPattern('')
    setFTest('')
  }

  const patternValid = !fPattern || isValidPattern(fPattern)
  const canSave = !!fName.trim() && !!fPattern.trim() && patternValid
  const testMatch =
    fTest && fPattern && patternValid && fullMatch(fPattern, fTest)
  const testNo =
    fTest && fPattern && patternValid && !fullMatch(fPattern, fTest)

  const saveFormat = () => {
    if (!canSave) return
    const label = fName.trim()
    const pattern = fPattern.trim()
    const example = fTest.trim()
    let next: FormatRow[]
    if (editId) {
      next = rows.map((r) =>
        r.id === editId ? { ...r, example, label, pattern } : r,
      )
    } else {
      next = [
        ...rows,
        {
          builtin: false,
          description: 'Custom version format.',
          enabled: true,
          example,
          id: nextRowId(),
          label,
          pattern,
        },
      ]
    }
    commit(override, next)
    closeEditor()
  }

  return (
    <div className="border-input border-t pt-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">
              Version formats
            </span>
            {override ? (
              <Badge variant="warning">Overriding defaults</Badge>
            ) : (
              <Badge variant="neutral">Using defaults</Badge>
            )}
          </div>
          <p className="text-tertiary mt-1 max-w-2xl text-xs leading-relaxed">
            By default, {ptName} projects inherit the organization&apos;s
            supported version formats. Override to validate releases against a
            set specific to this project type.
          </p>
        </div>
        <Switch
          aria-label="Override organization version formats"
          checked={override}
          disabled={disabled}
          onCheckedChange={handleOverrideToggle}
        />
      </div>

      {!override && <InheritedFormats inherited={inherited} />}

      {override && (
        <div className="mt-4 space-y-4">
          <Alert variant="warning">
            These formats <strong>replace</strong> the organization defaults.{' '}
            {ptName} releases will be validated only against the enabled formats
            below — the inherited defaults will not apply.
          </Alert>

          <div className="flex items-center justify-between gap-3">
            <span className="text-tertiary text-xs font-semibold tracking-wide uppercase">
              Project type formats
            </span>
            <Button
              disabled={disabled}
              onClick={openAdd}
              size="sm"
              variant="outline"
            >
              <Plus className="mr-1.5 size-3.5" />
              Add custom format
            </Button>
          </div>

          {editorOpen && (
            <div className="border-input rounded-lg border p-4">
              <div className="text-tertiary mb-3 text-xs font-semibold tracking-wide uppercase">
                {editId ? 'Edit custom format' : 'Add custom format'}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.5fr]">
                <div>
                  <Label className="text-secondary mb-1.5 block text-xs">
                    Name
                  </Label>
                  <Input
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="e.g. Build number"
                    value={fName}
                  />
                </div>
                <div>
                  <Label className="text-secondary mb-1.5 block text-xs">
                    Pattern · regular expression
                  </Label>
                  <Input
                    className="font-mono text-xs"
                    onChange={(e) => setFPattern(e.target.value)}
                    placeholder="^build-\d+$"
                    value={fPattern}
                  />
                  {!patternValid && (
                    <div className="text-danger mt-1.5 flex items-center gap-1 text-xs">
                      <AlertTriangle className="size-3" />
                      Not a valid regular expression.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-tertiary text-xs">Try it</span>
                <Input
                  className="max-w-65 font-mono text-xs"
                  onChange={(e) => setFTest(e.target.value)}
                  placeholder="Test a version"
                  value={fTest}
                />
                {testMatch && <Badge variant="success">Match</Badge>}
                {testNo && <Badge variant="danger">No match</Badge>}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={closeEditor} size="sm" variant="ghost">
                  Cancel
                </Button>
                <Button
                  className="bg-action text-action-foreground hover:bg-action-hover"
                  disabled={!canSave}
                  onClick={saveFormat}
                  size="sm"
                >
                  Save format
                </Button>
              </div>
            </div>
          )}

          <div className="divide-input border-input divide-y rounded-lg border">
            <div className="bg-secondary text-tertiary grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_auto_auto] items-center gap-4 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase">
              <span>Format</span>
              <span>Pattern</span>
              <span className="text-center">On</span>
              <span className="w-14" />
            </div>
            {rows.map((row) => (
              <FormatTableRow
                disabled={disabled}
                key={row.id}
                onDelete={() => removeRow(row.id)}
                onEdit={() => openEdit(row)}
                onToggle={() => toggleRow(row.id)}
                row={row}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FormatTableRow({
  disabled,
  onDelete,
  onEdit,
  onToggle,
  row,
}: FormatTableRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_auto_auto] items-start gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-primary text-sm font-medium">{row.label}</span>
          {row.builtin ? (
            <Badge variant="neutral">Built-in</Badge>
          ) : (
            <Badge variant="accent">Custom</Badge>
          )}
        </div>
        <div className="text-tertiary mt-0.5 text-xs leading-snug">
          {row.description}
        </div>
      </div>
      <div className="min-w-0">
        <code className="bg-secondary text-secondary block rounded px-2 py-1.5 font-mono text-xs break-all">
          {row.pattern}
        </code>
        {row.example && (
          <div className="text-tertiary mt-1 text-xs">
            Matches{' '}
            <span className="text-secondary font-mono">{row.example}</span>
          </div>
        )}
      </div>
      <div className="flex justify-center pt-0.5">
        <Switch
          aria-label={toggleAriaLabel(row)}
          checked={row.enabled}
          disabled={disabled}
          onCheckedChange={onToggle}
        />
      </div>
      <div className="flex w-14 justify-end gap-0.5">
        {!row.builtin && (
          <>
            <Button
              aria-label="Edit format"
              disabled={disabled}
              onClick={onEdit}
              size="icon"
              variant="ghost"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              aria-label="Delete format"
              disabled={disabled}
              onClick={onDelete}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function InheritedFormats({ inherited }: { inherited: TagFormat[] }) {
  return (
    <div className="border-input bg-secondary mt-4 rounded-lg border p-4">
      <div className="text-tertiary mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <Lock className="size-3" />
        Inherited from organization defaults
      </div>
      {inherited.length === 0 ? (
        <p className="text-tertiary text-xs leading-relaxed">
          The organization defines no version formats, so any non-empty version
          is accepted. Set defaults in the organization&apos;s settings, or
          override here.
        </p>
      ) : (
        <div className="space-y-2">
          {inherited.map((f) => (
            <div
              className="border-input bg-background grid grid-cols-1 items-center gap-2 rounded-lg border px-3 py-2.5 sm:grid-cols-[190px_minmax(0,1fr)]"
              key={f.pattern}
            >
              <span className="text-secondary flex items-center gap-1.5 text-sm font-medium">
                <Check className="text-success size-3.5 shrink-0" />
                {f.label}
              </span>
              <span className="text-tertiary font-mono text-xs break-all">
                {f.pattern}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="text-tertiary mt-3 text-xs leading-relaxed">
        Managed in the organization&apos;s default settings. These apply to
        every project type that doesn&apos;t define its own.
      </p>
    </div>
  )
}
