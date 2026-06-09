'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSiniestros } from '../../hooks/use-siniestros'
import { StatusBadge } from '../atoms/status-badge'
import type { Siniestro } from '../../types'

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ChevronUp className="h-3.5 w-3.5" />
  if (sorted === 'desc') return <ChevronDown className="h-3.5 w-3.5" />
  return <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
}

const PAGE_SIZES = [10, 20, 50]

export function SiniestrosTable() {
  const { data: siniestros = [], isLoading } = useSiniestros()
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Siniestro>[]>(() => [
    {
      accessorKey: 'id',
      header: 'N° Trámite',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    { accessorKey: 'fecha',     header: 'Fecha',    size: 100 },
    { accessorKey: 'provincia', header: 'Provincia' },
    { accessorKey: 'canton',    header: 'Cantón' },
    { accessorKey: 'cultivo',   header: 'Cultivo' },
    {
      accessorKey: 'hectareasAfectadas',
      header: 'Ha. Afectadas',
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<number>().toLocaleString('es-EC')}</span>
      ),
      size: 110,
    },
    { accessorKey: 'tipoEvento', header: 'Causa', size: 150 },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      size: 120,
    },
  ], [])

  const table = useReactTable({
    data: siniestros,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Detalle de siniestros registrados</CardTitle>
        <p className="text-sm text-muted-foreground">{siniestros.length} registros encontrados</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-y border-border">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ width: header.getSize() }}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon sorted={header.column.getIsSorted()} />
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {columns.map((_, j) => (
                      <td key={j} className="px-3 py-2.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2.5 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filas por página:</span>
            <select
              className="border border-border rounded-md px-2 py-1 text-sm bg-background"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
