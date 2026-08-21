import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';
import { SearchInput } from './SearchInput';
import { EmptyState } from './EmptyState';
import { Button } from './Button';
import { ChevronRight, ChevronLeft, ChevronLeft as ArrowLeft } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: keyof T;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  renderMobileCard?: (row: T, idx: number) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'جستجو...',
  onRowClick,
  actions,
  pageSize = 5,
  emptyTitle = 'داده‌ای یافت نشد',
  emptyDescription = 'هیچ موردی برای نمایش وجود ندارد.',
  renderMobileCard,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchKey) return data || [];
    return (data || []).filter((item) => {
      const val = item[searchKey];
      return String(val ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, searchKey]);

  const safeColumns = columns || [];
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {(searchKey || actions) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {searchKey ? (
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : (
            <div />
          )}
          {actions && <div className="flex items-center gap-2 w-full sm:w-auto justify-end">{actions}</div>}
        </div>
      )}

      {filteredData.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {safeColumns.map((col) => (
                    <TableHead key={col.key} style={{ width: col.width }}>
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, idx) => (
                  <TableRow
                    key={idx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={onRowClick ? 'cursor-pointer' : ''}
                  >
                    {safeColumns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(row) : row[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-3">
            {paginatedData.map((row, idx) => {
              if (renderMobileCard) {
                return (
                  <div key={idx} onClick={() => onRowClick && onRowClick(row)}>
                    {renderMobileCard(row, idx)}
                  </div>
                );
              }

              // Default Mobile Card Auto-Generator
              const firstCol = safeColumns[0];
              const secondCol = safeColumns[1];
              const restCols = safeColumns.slice(2);

              return (
                <div
                  key={idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all ${
                    onRowClick ? 'cursor-pointer active:scale-98' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">{firstCol?.header}:</span>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">
                        {firstCol?.render ? firstCol.render(row) : row[firstCol?.key]}
                      </div>
                    </div>

                    {secondCol && (
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 font-bold block">{secondCol?.header}:</span>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {secondCol?.render ? secondCol.render(row) : row[secondCol?.key]}
                        </div>
                      </div>
                    )}
                  </div>

                  {restCols.length > 0 && (
                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                      {restCols.map((col) => (
                        <div key={col.key} className="flex flex-col">
                          <span className="text-[10px] text-slate-400">{col.header}:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {col.render ? col.render(row) : row[col.key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {onRowClick && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-[11px] font-bold text-indigo-600 dark:text-indigo-400 gap-1">
                      <span>مشاهده جزئیات</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-500">
              <span>
                نمایش {(currentPage - 1) * pageSize + 1} تا {Math.min(currentPage * pageSize, filteredData.length)} از {filteredData.length} مورد
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="h-8 px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                  {currentPage} از {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
