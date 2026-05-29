import { useEffect, useRef, useState } from 'react'

import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { render, screen } from '@/test/utils'

async function assertBadgeHidesOnFocus(inputTestId: string) {
  const user = userEvent.setup()
  render(<SearchShortcutHarness />)
  expect(screen.getByTestId('badge')).toBeInTheDocument()
  await user.click(screen.getByTestId(inputTestId))
  expect(screen.queryByTestId('badge')).not.toBeInTheDocument()
}

async function assertBadgeHidesOnValue(
  harness: React.ReactElement,
  inputTestId: string,
) {
  const user = userEvent.setup()
  render(harness)
  await user.click(screen.getByTestId(inputTestId))
  await user.keyboard('foo')
  await user.tab()
  expect(screen.queryByTestId('badge')).not.toBeInTheDocument()
}

// Minimal harness replicating the Cmd+Shift+A shortcut from CommandBar
function AssistantShortcutHarness() {
  const [expanded, setExpanded] = useState(false)
  const { focused, ref, setFocused, setValue, value } = useShortcutInput()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'A' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (!expanded) setExpanded(true)
        ref.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [expanded, ref])

  return (
    <div>
      <span data-testid="expanded">{expanded ? 'open' : 'closed'}</span>
      <ShortcutInput
        focused={focused}
        inputRef={ref}
        label="assistant"
        onBlur={() => setFocused(false)}
        onChange={setValue}
        onFocus={() => setFocused(true)}
        value={value}
      />
    </div>
  )
}

// Minimal harness replicating the "/" shortcut from ProjectsView
function SearchShortcutHarness({ disabled = false }: { disabled?: boolean }) {
  const { focused, ref, setFocused, setValue, value } = useShortcutInput()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/') return
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
        return
      if (ref.current?.disabled) return
      e.preventDefault()
      ref.current?.focus()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [ref])

  return (
    <div>
      <input aria-label="other" data-testid="other-input" type="text" />
      <ShortcutInput
        disabled={disabled}
        focused={focused}
        inputRef={ref}
        label="search"
        onBlur={() => setFocused(false)}
        onChange={setValue}
        onFocus={() => setFocused(true)}
        value={value}
      />
    </div>
  )
}

function ShortcutInput({
  disabled,
  focused,
  inputRef,
  label,
  onBlur,
  onChange,
  onFocus,
  value,
}: {
  disabled?: boolean
  focused: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  label: string
  onBlur: () => void
  onChange: (v: string) => void
  onFocus: () => void
  value: string
}) {
  return (
    <>
      <input
        aria-label={label}
        data-testid={`${label}-input`}
        disabled={disabled}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        ref={inputRef}
        type="text"
        value={value}
      />
      {!value && !focused && <span data-testid="badge">{label}</span>}
    </>
  )
}

function useShortcutInput() {
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  return { focused, ref, setFocused, setValue, value }
}

describe('/ shortcut (project search)', () => {
  it('focuses the search input when / is pressed', async () => {
    const user = userEvent.setup()
    render(<SearchShortcutHarness />)
    await user.keyboard('/')
    expect(screen.getByTestId('search-input')).toHaveFocus()
  })

  it('does not focus when already typing in another input', async () => {
    const user = userEvent.setup()
    render(<SearchShortcutHarness />)
    const other = screen.getByTestId('other-input')
    await user.click(other)
    await user.keyboard('/')
    expect(screen.getByTestId('search-input')).not.toHaveFocus()
    expect(other).toHaveFocus()
  })

  it('does not focus when the search input is disabled', async () => {
    const user = userEvent.setup()
    render(<SearchShortcutHarness disabled />)
    await user.keyboard('/')
    expect(screen.getByTestId('search-input')).not.toHaveFocus()
  })

  it('hides the badge when the input is focused', async () => {
    await assertBadgeHidesOnFocus('search-input')
  })

  it('hides the badge when the input has a value', async () => {
    await assertBadgeHidesOnValue(<SearchShortcutHarness />, 'search-input')
  })
})

describe('Cmd+Shift+A shortcut (assistant bar)', () => {
  it('focuses the assistant input when Ctrl+Shift+A is pressed', async () => {
    const user = userEvent.setup()
    render(<AssistantShortcutHarness />)
    await user.keyboard('{Control>}{Shift>}A{/Shift}{/Control}')
    expect(screen.getByTestId('assistant-input')).toHaveFocus()
  })

  it('expands the bar if it is collapsed', async () => {
    const user = userEvent.setup()
    render(<AssistantShortcutHarness />)
    expect(screen.getByTestId('expanded')).toHaveTextContent('closed')
    await user.keyboard('{Control>}{Shift>}A{/Shift}{/Control}')
    expect(screen.getByTestId('expanded')).toHaveTextContent('open')
  })

  it('hides the badge when the input is focused', async () => {
    const user = userEvent.setup()
    render(<AssistantShortcutHarness />)
    expect(screen.getByTestId('badge')).toBeInTheDocument()
    await user.click(screen.getByTestId('assistant-input'))
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument()
  })

  it('hides the badge when the input has a value', async () => {
    await assertBadgeHidesOnValue(
      <AssistantShortcutHarness />,
      'assistant-input',
    )
  })
})
