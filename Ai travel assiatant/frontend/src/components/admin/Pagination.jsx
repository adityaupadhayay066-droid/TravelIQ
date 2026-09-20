import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
    currentPage,
    totalPages,
    totalRecords,
    pageSize,
    onPageChange,
    onPageSizeChange
}) {
    if (!totalPages || totalPages <= 1) {
        if (totalRecords > 0) {
            return (
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] py-3 px-1">
                    <span>Showing all <strong>{totalRecords}</strong> records</span>
                </div>
            );
        }
        return null;
    }

    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalRecords);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2">
                <span>
                    Showing <strong className="text-[var(--color-text)]">{startIdx}</strong> to{' '}
                    <strong className="text-[var(--color-text)]">{endIdx}</strong> of{' '}
                    <strong className="text-[var(--color-text)]">{totalRecords}</strong> entries
                </span>
                {onPageSizeChange && (
                    <div className="hidden md:flex items-center gap-1.5 ml-4">
                        <span>Per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2 py-0.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    aria-label="First page"
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-3 py-1 font-semibold text-[var(--color-text)] bg-[var(--color-soft)] rounded-lg text-xs">
                    {currentPage} / {totalPages}
                </span>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    aria-label="Last page"
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    <ChevronsRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
