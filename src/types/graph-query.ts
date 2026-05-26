/**
 * Types for the admin graph query workbench. Matches the backend contract:
 *   POST /admin/graph/query
 *   GET  /admin/graph/schema
 */

export interface GraphQueryCard {
  collapsed: boolean
  elapsedMs?: number
  error?: GraphQueryError
  id: string
  query: string
  result?: GraphQueryResult
  startedAt: number
  status: 'error' | 'success'
  tab: GraphQueryCardTab
}

export type GraphQueryCardTab = 'graph' | 'raw' | 'table'

export type GraphQueryCell =
  | boolean
  | GraphQueryCellEdge
  | GraphQueryCellNode
  | null
  | number
  | Record<string, unknown>
  | string
  | unknown[]

export interface GraphQueryCellEdge {
  _kind: 'edge'
  id: string
  properties: Record<string, unknown>
  type: string
}

/**
 * Cell discriminators returned inside `rows` when a cell is itself a node or
 * edge.  Anything else is left as-is and rendered as JSON.
 */
export interface GraphQueryCellNode {
  _kind: 'node'
  id: string
  labels: string[]
  properties: Record<string, unknown>
}

export interface GraphQueryEdge {
  end: string
  id: string
  properties: Record<string, unknown>
  start: string
  type: string
}

export interface GraphQueryError {
  code?: string
  column?: number
  hint?: string
  line?: number
  message: string
}

export interface GraphQueryErrorEnvelope {
  error: GraphQueryError
}

export interface GraphQueryHistoryEntry {
  executedAt: number
  query: string
}

export interface GraphQueryNode {
  id: string
  labels: string[]
  properties: Record<string, unknown>
}

export interface GraphQueryResult {
  columns: string[]
  edges: GraphQueryEdge[]
  elapsed_ms: number
  nodes: GraphQueryNode[]
  rows: Array<Record<string, GraphQueryCell>>
}

export interface GraphSchema {
  edge_types: Array<{ count: number; type: string }>
  node_labels: Array<{ count: number; label: string }>
  property_keys: string[]
}
