import { useCallback, useEffect, useState } from 'react'

import yaml from 'js-yaml'
import { AlertCircle, FileJson, FileText, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ScoringPolicyCategory, ScoringPolicyCreate } from '@/types'

type DetectedFormat = 'json' | 'unknown' | 'yaml'

interface ImportScoringPolicyDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiError?: any
  isLoading?: boolean
  isOpen: boolean
  onClose: () => void
  onImport: (policy: ScoringPolicyCreate) => void
}

const COMMON_REQUIRED = ['name', 'slug', 'weight'] as const

const VALID_CATEGORIES: ScoringPolicyCategory[] = [
  'attribute',
  'presence',
  'link_presence',
  'age',
]

const CATEGORY_LABELS: Record<ScoringPolicyCategory, string> = {
  age: 'Age',
  attribute: 'Attribute',
  link_presence: 'Link Presence',
  presence: 'Presence',
}

export function ImportScoringPolicyDialog({
  apiError,
  isLoading = false,
  isOpen,
  onClose,
  onImport,
}: ImportScoringPolicyDialogProps) {
  const [rawInput, setRawInput] = useState('')
  const [error, setError] = useState<null | string>(null)
  const [parsedPreview, setParsedPreview] =
    useState<null | ScoringPolicyCreate>(null)
  const [detectedFormat, setDetectedFormat] =
    useState<DetectedFormat>('unknown')
  const [showApiError, setShowApiError] = useState(false)

  const reset = useCallback(() => {
    setRawInput('')
    setError(null)
    setParsedPreview(null)
    setDetectedFormat('unknown')
    setShowApiError(false)
  }, [])

  useEffect(() => {
    if (isOpen) reset()
  }, [isOpen, reset])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const handleInputChange = useCallback((value: string) => {
    setRawInput(value)
    setError(null)
    setShowApiError(false)
    setParsedPreview(null)

    if (!value.trim()) {
      setDetectedFormat('unknown')
      return
    }

    const fmt = detectFormat(value)
    setDetectedFormat(fmt)

    try {
      let parsed: unknown
      let jsonFailed = false
      if (fmt === 'json' || fmt === 'unknown') {
        try {
          parsed = JSON.parse(value)
        } catch {
          jsonFailed = true
        }
      }
      if (jsonFailed || fmt === 'yaml') {
        try {
          parsed = yaml.load(value)
        } catch {
          return
        }
      }

      const result = validatePolicyShape(parsed)
      if (result.valid) {
        setParsedPreview(result.policy)
        setError(null)
      }
    } catch {
      // ignore parse errors while typing
    }
  }, [])

  const handleValidateAndImport = useCallback(() => {
    const trimmed = rawInput.trim()
    if (!trimmed) {
      setError('Please paste a JSON or YAML scoring policy definition.')
      return
    }

    let parsed: unknown
    const fmt = detectFormat(trimmed)
    let jsonParseError: Error | null = null

    if (fmt === 'json' || fmt === 'unknown') {
      try {
        parsed = JSON.parse(trimmed)
      } catch (e) {
        jsonParseError = e instanceof Error ? e : new Error('parse error')
      }
    }

    if (jsonParseError !== null || fmt === 'yaml') {
      try {
        parsed = yaml.load(trimmed)
      } catch (yamlErr) {
        if (jsonParseError !== null) {
          setError(
            `Could not parse as JSON or YAML: ${yamlErr instanceof Error ? yamlErr.message : 'parse error'}`,
          )
        } else {
          setError(
            `Invalid YAML: ${yamlErr instanceof Error ? yamlErr.message : 'parse error'}`,
          )
        }
        return
      }
    }

    const result = validatePolicyShape(parsed)
    if (!result.valid) {
      setError(result.error)
      return
    }

    setShowApiError(true)
    onImport(result.policy)
  }, [rawInput, onImport])

  const formatIcon =
    detectedFormat === 'json' ? (
      <FileJson className="h-3.5 w-3.5" />
    ) : detectedFormat === 'yaml' ? (
      <FileText className="h-3.5 w-3.5" />
    ) : null

  return (
    <Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Scoring Policy</DialogTitle>
          <DialogDescription>
            Paste a JSON or YAML scoring policy definition below. Required
            fields:{' '}
            {COMMON_REQUIRED.map((f, i) => (
              <span key={f}>
                <code className="rounded bg-secondary px-1 py-0.5 text-xs">
                  {f}
                </code>
                {i < COMMON_REQUIRED.length - 1 ? ', ' : ''}
              </span>
            ))}
            . Optional{' '}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              category
            </code>{' '}
            defaults to{' '}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              attribute
            </code>
            ; other supported values are{' '}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              presence
            </code>
            ,{' '}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              link_presence
            </code>
            , and{' '}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              age
            </code>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {detectedFormat !== 'unknown' && rawInput.trim() && (
            <div className="flex items-center gap-1.5">
              {formatIcon}
              <span className="text-xs text-tertiary">
                Detected format: {detectedFormat.toUpperCase()}
              </span>
              {parsedPreview && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                  Valid
                </span>
              )}
            </div>
          )}

          <textarea
            className={`w-full resize-y rounded-md border border-input bg-secondary px-4 py-3 font-mono text-sm leading-relaxed text-primary placeholder:text-muted-foreground ${error ? 'border-danger' : ''}`}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={`{
  "name": "Test Coverage",
  "slug": "test-coverage",
  "attribute_name": "test_coverage",
  "weight": 50,
  "priority": 0,
  "enabled": true,
  "targets": [],
  "value_score_map": {
    "passing": 100,
    "failing": 0
  }
}`}
            rows={14}
            spellCheck={false}
            value={rawInput}
          />

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-danger bg-danger px-3 py-2.5 text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {apiError && showApiError && !error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-danger bg-danger px-3 py-2.5 text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium">
                  Failed to import scoring policy
                </div>
                <div className="mt-1">
                  {apiError?.response?.data?.detail ||
                    apiError?.response?.data?.message ||
                    apiError?.message ||
                    `Server error (${apiError?.response?.status || 'unknown'})`}
                </div>
              </div>
            </div>
          )}

          {parsedPreview && (
            <div className="rounded-lg border border-input bg-secondary px-3 py-2.5">
              <div className="mb-1.5 text-xs font-medium text-tertiary">
                Preview
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-tertiary">Name: </span>
                  <span className="text-primary">{parsedPreview.name}</span>
                </div>
                <div>
                  <span className="text-tertiary">Slug: </span>
                  <span className="font-mono text-primary">
                    {parsedPreview.slug}
                  </span>
                </div>
                <div>
                  <span className="text-tertiary">Category: </span>
                  <span className="text-primary">
                    {CATEGORY_LABELS[parsedPreview.category]}
                  </span>
                </div>
                <div>
                  <span className="text-tertiary">
                    {parsedPreview.category === 'link_presence'
                      ? 'Link slug: '
                      : 'Attribute: '}
                  </span>
                  <code className="rounded bg-card px-1 py-0.5 text-xs text-primary">
                    {policySubjectKey(parsedPreview)}
                  </code>
                </div>
                <div>
                  <span className="text-tertiary">Weight: </span>
                  <span className="text-primary">{parsedPreview.weight}</span>
                </div>
                {(parsedPreview.targets ?? []).length > 0 && (
                  <div className="col-span-2">
                    <span className="text-tertiary">Targets: </span>
                    <span className="text-primary">
                      {parsedPreview.targets.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button disabled={isLoading} onClick={handleClose} variant="outline">
            Cancel
          </Button>
          <Button
            className="bg-action text-action-foreground hover:bg-action-hover"
            disabled={isLoading || !rawInput.trim()}
            onClick={handleValidateAndImport}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isLoading ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function detectFormat(input: string): DetectedFormat {
  const trimmed = input.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
  if (
    trimmed.includes(': ') ||
    trimmed.includes(':\n') ||
    trimmed.startsWith('---')
  )
    return 'yaml'
  return 'unknown'
}

function isNonEmptyNumberMap(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length === 0) return false
  return entries.every(([, v]) => typeof v === 'number' && Number.isFinite(v))
}

function optionalScore(
  value: unknown,
  field: string,
): { error: string; ok: false } | { ok: true; value: null | number } {
  if (value === undefined || value === null) return { ok: true, value: null }
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    return {
      error: `"${field}" must be a number between 0 and 100.`,
      ok: false,
    }
  }
  return { ok: true, value }
}

function policySubjectKey(policy: ScoringPolicyCreate): string {
  return policy.category === 'link_presence'
    ? policy.link_slug
    : policy.attribute_name
}

function requireString(
  obj: Record<string, unknown>,
  field: string,
): { error: string; ok: false } | { ok: true; value: string } {
  const value = obj[field]
  if (typeof value !== 'string' || !value.trim()) {
    return { error: `"${field}" must be a non-empty string.`, ok: false }
  }
  return { ok: true, value: value.trim() }
}

function validatePolicyShape(
  data: unknown,
):
  | { error: string; valid: false }
  | { policy: ScoringPolicyCreate; valid: true } {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { error: 'Input must be a JSON/YAML object.', valid: false }
  }

  const obj = data as Record<string, unknown>

  for (const field of COMMON_REQUIRED) {
    if (obj[field] === undefined || obj[field] === null) {
      return { error: `Missing required field: "${field}".`, valid: false }
    }
  }

  if (typeof obj.name !== 'string' || !obj.name.trim()) {
    return { error: '"name" must be a non-empty string.', valid: false }
  }
  if (typeof obj.slug !== 'string' || !/^[a-z0-9_-]+$/.test(obj.slug)) {
    return {
      error:
        '"slug" must be lowercase letters, numbers, hyphens, or underscores.',
      valid: false,
    }
  }

  if (
    typeof obj.weight !== 'number' ||
    !Number.isFinite(obj.weight) ||
    obj.weight < 0 ||
    obj.weight > 100
  ) {
    return {
      error: '"weight" must be a number between 0 and 100.',
      valid: false,
    }
  }
  const weight = obj.weight

  if (
    obj.targets !== undefined &&
    obj.targets !== null &&
    (!Array.isArray(obj.targets) ||
      !(obj.targets as unknown[]).every((v) => typeof v === 'string'))
  ) {
    return { error: '"targets" must be an array of strings.', valid: false }
  }

  if (obj.enabled !== undefined && typeof obj.enabled !== 'boolean') {
    return { error: '"enabled" must be a boolean.', valid: false }
  }

  if (
    obj.priority !== undefined &&
    (typeof obj.priority !== 'number' || !Number.isFinite(obj.priority))
  ) {
    return { error: '"priority" must be a number.', valid: false }
  }

  const rawCategory = obj.category ?? 'attribute'
  if (
    typeof rawCategory !== 'string' ||
    !VALID_CATEGORIES.includes(rawCategory as ScoringPolicyCategory)
  ) {
    return {
      error: `"category" must be one of: ${VALID_CATEGORIES.join(', ')}.`,
      valid: false,
    }
  }
  const category = rawCategory as ScoringPolicyCategory

  const base = {
    description:
      typeof obj.description === 'string'
        ? obj.description.trim() || null
        : null,
    enabled: obj.enabled === undefined ? true : (obj.enabled as boolean),
    name: (obj.name as string).trim(),
    priority: obj.priority === undefined ? 0 : (obj.priority as number),
    slug: obj.slug as string,
    targets: Array.isArray(obj.targets) ? (obj.targets as string[]) : [],
    weight,
  }

  if (category === 'attribute') {
    const attrCheck = requireString(obj, 'attribute_name')
    if (!attrCheck.ok) return { error: attrCheck.error, valid: false }
    const hasValueMap = isNonEmptyNumberMap(obj.value_score_map)
    const hasRangeMap = isNonEmptyNumberMap(obj.range_score_map)
    if (!hasValueMap && !hasRangeMap) {
      return {
        error:
          'At least one of "value_score_map" or "range_score_map" must have entries.',
        valid: false,
      }
    }
    if (
      obj.value_score_map !== undefined &&
      obj.value_score_map !== null &&
      !hasValueMap
    ) {
      return {
        error: '"value_score_map" values must be numbers.',
        valid: false,
      }
    }
    if (
      obj.range_score_map !== undefined &&
      obj.range_score_map !== null &&
      !hasRangeMap
    ) {
      return {
        error: '"range_score_map" values must be numbers.',
        valid: false,
      }
    }
    return {
      policy: {
        ...base,
        attribute_name: attrCheck.value,
        category: 'attribute',
        range_score_map: hasRangeMap
          ? (obj.range_score_map as Record<string, number>)
          : null,
        value_score_map: hasValueMap
          ? (obj.value_score_map as Record<string, number>)
          : null,
      },
      valid: true,
    }
  }

  if (category === 'presence') {
    const attrCheck = requireString(obj, 'attribute_name')
    if (!attrCheck.ok) return { error: attrCheck.error, valid: false }
    const present = optionalScore(obj.present_score, 'present_score')
    if (!present.ok) return { error: present.error, valid: false }
    const missing = optionalScore(obj.missing_score, 'missing_score')
    if (!missing.ok) return { error: missing.error, valid: false }
    return {
      policy: {
        ...base,
        attribute_name: attrCheck.value,
        category: 'presence',
        missing_score: missing.value ?? null,
        present_score: present.value ?? null,
      },
      valid: true,
    }
  }

  if (category === 'link_presence') {
    const linkCheck = requireString(obj, 'link_slug')
    if (!linkCheck.ok) return { error: linkCheck.error, valid: false }
    const present = optionalScore(obj.present_score, 'present_score')
    if (!present.ok) return { error: present.error, valid: false }
    const missing = optionalScore(obj.missing_score, 'missing_score')
    if (!missing.ok) return { error: missing.error, valid: false }
    return {
      policy: {
        ...base,
        category: 'link_presence',
        link_slug: linkCheck.value,
        missing_score: missing.value ?? null,
        present_score: present.value ?? null,
      },
      valid: true,
    }
  }

  // age
  const attrCheck = requireString(obj, 'attribute_name')
  if (!attrCheck.ok) return { error: attrCheck.error, valid: false }
  if (!isNonEmptyNumberMap(obj.age_score_map)) {
    return {
      error:
        '"age_score_map" must be a non-empty object whose values are numbers.',
      valid: false,
    }
  }
  for (const key of Object.keys(obj.age_score_map as object)) {
    if (!/^(>=|>|<=|<|==)\s*\d+(?:\.\d+)?\s*[smhdw]$/.test(key)) {
      return {
        error: `"age_score_map" key ${JSON.stringify(key)} is not a valid threshold (e.g. ">30d", "<=7d").`,
        valid: false,
      }
    }
  }
  return {
    policy: {
      ...base,
      age_score_map: obj.age_score_map as Record<string, number>,
      attribute_name: attrCheck.value,
      category: 'age',
    },
    valid: true,
  }
}
