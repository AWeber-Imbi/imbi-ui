import type { TagFormat } from '@/types'

// Built-in presets surfaced as toggleable rows in the version-format editor.
// Only `label`/`pattern` are persisted (as `TagFormat`); `description` and
// `example` are display-only metadata that lives here in the UI.
export interface BuiltinFormat extends TagFormat {
  description: string
  example: string
}

export const BUILTIN_FORMATS: BuiltinFormat[] = [
  {
    description:
      'MAJOR.MINOR.PATCH with optional pre-release and build metadata.',
    example: '2.11.5',
    label: 'Semantic versioning',
    pattern:
      '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-([0-9A-Za-z-.]+))?(?:\\+([0-9A-Za-z-.]+))?$',
  },
  {
    description: 'Year and month, with an optional patch segment.',
    example: '2026.06',
    label: 'Calendar versioning',
    pattern: '^\\d{4}\\.\\d{1,2}(?:\\.\\d{1,2})?$',
  },
  {
    description: '7 to 40 character hexadecimal commit hash.',
    example: '7d4f2a3b',
    label: 'Git short SHA',
    pattern: '^[0-9a-f]{7,40}$',
  },
  {
    description: 'Accepts any non-empty string. Use as a catch-all.',
    example: 'nightly-build',
    label: 'Any format',
    pattern: '^.+$',
  },
]

const BUILTIN_BY_PATTERN = new Map(BUILTIN_FORMATS.map((f) => [f.pattern, f]))

export function builtinForPattern(pattern: string): BuiltinFormat | undefined {
  return BUILTIN_BY_PATTERN.get(pattern)
}

/**
 * Whole-string match, mirroring the backend's `re.fullmatch` semantics so the
 * in-form tester agrees with server-side validation. Returns false for an
 * invalid pattern rather than throwing.
 */
export function fullMatch(pattern: string, value: string): boolean {
  try {
    const match = new RegExp(pattern).exec(value)
    return match !== null && match.index === 0 && match[0] === value
  } catch {
    return false
  }
}

/** Return whether `pattern` is a valid (compilable) regular expression. */
export function isValidPattern(pattern: string): boolean {
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}
