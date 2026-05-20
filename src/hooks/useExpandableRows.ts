import { useCallback, useState } from 'react'

// Tiny shared state for table rows that toggle an inline detail
// panel. Returns a Set of expanded indexes plus a stable toggle.
// Extracted out of the project-type / project plugin override tables
// so they can both use the same expand-on-click pattern without
// duplicating the boilerplate.
export function useExpandableRows(): {
  expanded: Set<number>
  setExpanded: React.Dispatch<React.SetStateAction<Set<number>>>
  toggleExpanded: (idx: number) => void
} {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const toggleExpanded = useCallback((idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])
  return { expanded, setExpanded, toggleExpanded }
}
