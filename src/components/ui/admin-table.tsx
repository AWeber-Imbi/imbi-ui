import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Card, CardContent } from './card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'

export interface AdminTableColumn<T> {
  key: string
  header: string
  headerAlign?: 'left' | 'center' | 'right'
  cellAlign?: 'left' | 'center' | 'right'
  render: (row: T) => React.ReactNode
}

export interface CanDeleteResult {
  allowed: boolean
  reason?: string
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  getRowLabel?: (row: T) => string
  getDeleteLabel: (row: T) => string
  onRowClick?: (row: T) => void
  onDelete: (row: T) => void
  canDelete?: (row: T) => CanDeleteResult
  isDeleting?: boolean
  actions?: (row: T) => React.ReactNode
  emptyMessage?: string
}

const HEADER_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const CELL_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function AdminTable<T>({
  columns,
  rows,
  getRowKey,
  getRowLabel,
  getDeleteLabel,
  onRowClick,
  onDelete,
  canDelete,
  isDeleting = false,
  actions,
  emptyMessage = 'No items found.',
}: AdminTableProps<T>) {
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)

  const handleDeleteClick = (row: T, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteTarget(row)
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{deleteTarget ? getDeleteLabel(deleteTarget) : ''}
              &quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={HEADER_ALIGN[col.headerAlign ?? 'left']}
                  >
                    {col.header}
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const key = getRowKey(row)
                  const label = getRowLabel
                    ? getRowLabel(row)
                    : getDeleteLabel(row)
                  const deleteCheck = canDelete
                    ? canDelete(row)
                    : { allowed: true }
                  const canDeleteRow = deleteCheck.allowed
                  const deleteReason = deleteCheck.reason

                  return (
                    <TableRow
                      key={key}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={
                        onRowClick
                          ? (e) => {
                              if (e.currentTarget !== e.target) return
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                onRowClick(row)
                              }
                            }
                          : undefined
                      }
                      tabIndex={onRowClick ? 0 : undefined}
                      aria-label={onRowClick ? `Edit ${label}` : undefined}
                      className={cn(onRowClick && 'cursor-pointer')}
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={CELL_ALIGN[col.cellAlign ?? 'left']}
                        >
                          {col.render(row)}
                        </TableCell>
                      ))}
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {actions && actions(row)}
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Delete ${label}`}
                                    onClick={(e) => handleDeleteClick(row, e)}
                                    disabled={isDeleting || !canDeleteRow}
                                    className={cn(
                                      'text-destructive hover:bg-destructive/10 hover:text-destructive',
                                      (!canDeleteRow || isDeleting) &&
                                        'pointer-events-none opacity-30',
                                    )}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {deleteReason && (
                                <TooltipContent>
                                  <p>{deleteReason}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
