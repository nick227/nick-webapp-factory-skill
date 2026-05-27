import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export type DataColumn<T> = {
  key: keyof T | string
  header: string
  className?: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  rows: T[]
  columns: DataColumn<T>[]
  getRowId: (row: T) => string
  search?: string
  onSearchChange?: (value: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  empty?: React.ReactNode
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  getRowId,
  search,
  onSearchChange,
  onLoadMore,
  hasMore,
  isLoadingMore,
  empty,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('space-y-3', className)}>
      {onSearchChange && (
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ''}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
            placeholder="Search..."
          />
        </div>
      )}

      <div className="overflow-x-auto rounded border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-muted/60 text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className={cn('px-3 py-2 text-left font-medium', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-muted-foreground">
                  {empty ?? 'No results'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={getRowId(row)} className="border-b last:border-b-0">
                  {columns.map((column) => (
                    <td key={String(column.key)} className={cn('px-3 py-2 align-middle', column.className)}>
                      {column.render ? column.render(row) : String(row[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <Button variant="outline" className="w-full" onClick={onLoadMore} loading={isLoadingMore}>
          Load more
        </Button>
      )}
    </div>
  )
}
