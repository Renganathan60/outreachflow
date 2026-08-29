import React from 'react';
import { Loader2, Inbox, AlertOctagon } from 'lucide-react';
import Button from './Button.jsx';

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-700">{message}</p>
    </div>
  );
}

export function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your filters or create a new entry.',
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-300">
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Failed to load content. Please try again.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-rose-50/50 rounded-2xl border border-rose-200">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-600 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
