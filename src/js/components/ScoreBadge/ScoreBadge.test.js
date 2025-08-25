import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { ScoreBadge } from './ScoreBadge' // Corrected import name
import { Badge } from '../' // Import Badge to mock it

// --- Mock the Badge Component ---
// We mock the entire module '../' which exports Badge
// The mock function receives the props Badge would normally receive
// It renders a simple span allowing us to inspect props via attributes or text content
jest.mock('../', () => ({
  // Use jest.fn() to allow spying on calls
  Badge: jest.fn(({ color, className, children }) => (
    <span data-testid="mock-badge" data-color={color} className={className}>
      {children}
    </span>
  ))
}))

// --- Test Suite ---
describe('ScoreBadge', () => {
  // Clear mock call history before each test
  beforeEach(() => {
    // Clears statistics like number of calls, arguments, etc.
    Badge.mockClear()
    // If Badge constructor was mocked: Badge.mockClear();
  })

  // Test case for default rendering (value 0 or undefined/null/invalid)
  test('should render with gray color and "0" for default or zero value', () => {
    // Test with explicit 0
    const { rerender } = render(<ScoreBadge value={0} />)
    // Check props passed to the mock Badge
    expect(Badge).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'gray',
        className: 'text-sm',
        children: '0'
      }),
      {} // Second argument for context (usually empty object)
    )

    // Test with undefined (should default to 0)
    rerender(<ScoreBadge value={undefined} />)
    expect(Badge).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'gray',
        className: 'text-sm',
        children: '0'
      }),
      {}
    )

    // Test with null (should default to 0)
    rerender(<ScoreBadge value={null} />)
    expect(Badge).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'gray',
        className: 'text-sm',
        children: '0'
      }),
      {}
    )

    // Test with non-numeric (should default to 0)
    rerender(<ScoreBadge value="abc" />) // PropType warning expected here
    expect(Badge).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'gray',
        className: 'text-sm',
        children: '0'
      }),
      {}
    )
  })

  // Test cases for RED color range (1-69 and negatives)
  test.each([
    { value: 1, expectedText: '1' },
    { value: 50, expectedText: '50' },
    { value: 69, expectedText: '69' },
    { value: -10, expectedText: '-10' } // Also test negative numbers
  ])(
    'should render with red color for value $value',
    ({ value, expectedText }) => {
      render(<ScoreBadge value={value} />)
      expect(Badge).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'red',
          className: 'text-sm',
          children: expectedText
        }),
        {}
      )
    }
  )

  // Test cases for YELLOW color range (70-89)
  test.each([
    { value: 70, expectedText: '70' },
    { value: 80, expectedText: '80' },
    { value: 89, expectedText: '89' }
  ])(
    'should render with yellow color for value $value',
    ({ value, expectedText }) => {
      render(<ScoreBadge value={value} />)
      expect(Badge).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'yellow',
          className: 'text-sm',
          children: expectedText
        }),
        {}
      )
    }
  )

  // Test cases for GREEN color range (90+)
  test.each([
    { value: 90, expectedText: '90' },
    { value: 100, expectedText: '100' },
    { value: 1000, expectedText: '1,000' } // Test formatting
  ])(
    'should render with green color for value $value',
    ({ value, expectedText }) => {
      render(<ScoreBadge value={value} />)
      expect(Badge).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'green',
          className: 'text-sm',
          children: expectedText
        }),
        {}
      )
    }
  )

  // Test formatting specifically for large numbers
  test('should format large numbers with locale-specific separators', () => {
    render(<ScoreBadge value={1234567} />)
    expect(Badge).toHaveBeenCalledWith(
      expect.objectContaining({
        children: '1,234,567' // Assumes en-US locale for testing environment
      }),
      {}
    )
  })

  // Optional: Test the rendered output of the mock if needed (less direct than checking props)
  test('should render the correct text content via the mock', () => {
    render(<ScoreBadge value={95} />)
    const mockBadgeElement = screen.getByTestId('mock-badge')
    expect(mockBadgeElement).toHaveTextContent('95')
    expect(mockBadgeElement).toHaveAttribute('data-color', 'green')
    expect(mockBadgeElement).toHaveClass('text-sm')
  })
})
