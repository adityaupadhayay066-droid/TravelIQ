import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown, Search, Filter } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

export default function DataTable({
    columns = [],
    data = [],
    keyField = 'id',
    loading = false,
    emptyMessage = 'No records found.',
    emptyTitle = 'No entries yet',
    emptyAction = null,
    // Sorting
    sortBy = '',
    sortOrder = 'asc',
    onSort = null,
    // Pagination
    page = 1,
    totalPages = 1,
    totalRecords = 0,
    pageSize = 10,
    onPageChange = null,
    onPageSizeChange = null,
    // Selection
    selectable = false,
    selectedRows = [],
    onSelectRows = null,
    bulkActions = null,
    // Header controls
    searchPlaceholder = 'Search...',
    searchValue = '',
    onSearchChange = null,
    filters = null,
    headerActions = null,
    className = ''
}) {
    const handleSelectAll = (e) => {
        if (!onSelectRows) return;
        if (e.target.checked) {
            onSelectRows(data.map(item => item[keyField]));
        } else {
            onSelectRows([]);
        }
    };

    const handleSelectRow = (id) => {
        if (!onSelectRows) return;
        if (selectedRows.includes(id)) {
            onSelectRows(selectedRows.filter(i => i !== id));
        } else {
            onSelectRows([...selectedRows, id]);
        }
    };

    const allSelected = data.length > 0 && selectedRows.length === data.length;
    const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

    return (
        <div className={`travel-card rounded-2xl overflow-hidden flex flex-col ${className}`}>
            {/* Top Toolbar */}
            {(onSearchChange || filters || headerActions) && (
                <div className="p-4 md:p-5 border-b border-[var(--color-border)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[var(--color-surface)]">
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                        {onSearchChange && (
                            <div className="relative flex-1 min-w-[220px] max-w-md">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="travel-input !h-10 !pl-10 !pr-4 !text-xs !rounded-xl"
                                />
                            </div>
                        )}
                        {filters}
                    </div>

                    {headerActions && (
                        <div className="flex items-center gap-2 shrink-0">
                            {headerActions}
                        </div>
                    )}
                </div>
            )}

            {/* Bulk Selection Notification Bar */}
            {selectable && selectedRows.length > 0 && (
                <div className="px-5 py-2.5 bg-sky-500/10 border-b border-sky-500/20 text-xs font-semibold text-sky-400 flex items-center justify-between">
                    <span>{selectedRows.length} item(s) selected</span>
                    {bulkActions && (
                        <div className="flex items-center gap-2">
                            {bulkActions}
                        </div>
                    )}
                </div>
            )}

            {/* Table Responsive Wrapper */}
            <div className="travel-table-responsive flex-1">
                <table className="travel-table">
                    <thead>
                        <tr>
                            {selectable && (
                                <th className="w-10 px-4">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={el => { if (el) el.indeterminate = someSelected; }}
                                        onChange={handleSelectAll}
                                        className="rounded border-[var(--color-border)] text-sky-500 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable && onSort && onSort(col.key)}
                                    className={`${col.className || ''} ${col.sortable ? 'cursor-pointer select-none hover:text-[var(--color-text)]' : ''}`}
                                >
                                    <div className="inline-flex items-center gap-1.5">
                                        <span>{col.label}</span>
                                        {col.sortable && (
                                            <span className="text-[var(--color-text-muted)]">
                                                {sortBy === col.key ? (
                                                    sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-sky-500" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-500" />
                                                ) : (
                                                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="p-0">
                                    <LoadingSkeleton rows={pageSize > 10 ? 8 : pageSize} cols={columns.length} />
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-12">
                                    <EmptyState title={emptyTitle} description={emptyMessage} action={emptyAction} />
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIdx) => {
                                const rowId = row[keyField] || rowIdx;
                                const isSelected = selectedRows.includes(rowId);
                                return (
                                    <tr
                                        key={rowId}
                                        className={isSelected ? 'bg-sky-500/5' : ''}
                                    >
                                        {selectable && (
                                            <td className="w-10 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(rowId)}
                                                    className="rounded border-[var(--color-border)] text-sky-500 focus:ring-sky-500 cursor-pointer"
                                                />
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td key={col.key} className={col.className || ''}>
                                                {col.render ? col.render(row[col.key], row, rowIdx) : (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {onPageChange && (
                <div className="px-4 bg-[var(--color-surface)]">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalRecords={totalRecords}
                        pageSize={pageSize}
                        onPageChange={onPageChange}
                        onPageSizeChange={onPageSizeChange}
                    />
                </div>
            )}
        </div>
    );
}
