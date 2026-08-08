'use client';

import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type Column<T> = {
  /** Stable id used for the sort toggle. */
  id: string;
  /** Resolved (already-translated) header label. */
  header: string;
  /** Renders the cell contents for a row. */
  cell: (row: T) => ReactNode;
  /** When provided, the column header becomes a sort toggle. */
  sortValue?: (row: T) => string | number;
  className?: string;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  /** When provided, renders a search box filtering on the returned text. */
  searchAccessor?: (row: T) => string;
  pageSize?: number;
};

type SortState = { id: string; dir: 'asc' | 'desc' } | null;

/**
 * Generic, reusable admin table with client-side search, sort, and pagination
 * (BUILD-SPEC §11 Phase 5). Data is passed in fully from a Server Component;
 * this component owns only presentation state.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  searchAccessor,
  pageSize = 10,
}: DataTableProps<T>) {
  const t = useTranslations('admin.table');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!searchAccessor || query.trim() === '') return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((row) => searchAccessor(row).toLowerCase().includes(q));
  }, [rows, query, searchAccessor]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((c) => c.id === sort.id);
    if (!column?.sortValue) return filtered;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return 0;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  function toggleSort(id: string) {
    setPage(0);
    setSort((prev) => {
      if (prev?.id !== id) return { id, dir: 'asc' };
      if (prev.dir === 'asc') return { id, dir: 'desc' };
      return null;
    });
  }

  function onSearch(value: string) {
    setQuery(value);
    setPage(0);
  }

  const from = sorted.length === 0 ? 0 : currentPage * pageSize + 1;
  const to = Math.min(sorted.length, currentPage * pageSize + pageSize);

  return (
    <div className="space-y-4">
      {searchAccessor ? (
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t('search')}
            className="pl-8"
            aria-label={t('search')}
          />
        </div>
      ) : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className={column.className}>
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.id)}
                      className="-ml-2 inline-flex items-center gap-1 rounded px-2 py-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {column.header}
                      {sort?.id === column.id ? (
                        sort.dir === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-50" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t('empty')}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={getRowId(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className={cn(column.className)}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t('showing', { from, to, total: sorted.length })}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('page', { page: currentPage + 1, pages: pageCount })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            {t('previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
          >
            {t('next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
