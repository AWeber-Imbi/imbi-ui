import { apiClient } from './client'

export type ConfidenceLabel = 'Close' | 'Related' | 'Strong'

export interface SearchResult {
  attribute: string
  chunk_text: string
  distance: number
  node_id: string
  node_label: string
}

/** Convert cosine distance (0=identical, 2=opposite) to a confidence label. */
export function getConfidenceLabel(distance: number): ConfidenceLabel | null {
  const similarity = 1 - distance
  if (similarity >= 0.7) return 'Strong'
  if (similarity >= 0.45) return 'Close'
  if (similarity >= 0.25) return 'Related'
  return null
}

export const searchOrg = (
  orgSlug: string,
  q: string,
  params?: {
    limit?: number
    node_label?: string
    threshold?: number
  },
  signal?: AbortSignal,
) =>
  apiClient.get<SearchResult[]>(
    `/organizations/${encodeURIComponent(orgSlug)}/search`,
    { limit: 20, threshold: 0.75, ...params, q },
    signal,
  )
