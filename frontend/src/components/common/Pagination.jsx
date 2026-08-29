import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button.jsx';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 15,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-slate-600">
      <div>
        Showing <span className="font-bold text-slate-900">{start}</span> to{' '}
        <span className="font-bold text-slate-900">{end}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems}</span> leads
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          icon={ChevronLeft}
        >
          Previous
        </Button>

        <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
          Page {currentPage} of {totalPages}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next <ChevronRight className="w-4 h-4 ml-1 inline" />
        </Button>
      </div>
    </div>
  );
}
