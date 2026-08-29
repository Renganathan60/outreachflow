import React from 'react';

export default function Select({
  label,
  options = [],
  error,
  helperText,
  className = '',
  id,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-white border text-slate-900 text-sm rounded-xl px-3.5 py-2.5 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 ${
          error
            ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500'
            : 'border-slate-300 hover:border-slate-400'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val} className="bg-white text-slate-900 py-1">
              {lbl}
            </option>
          );
        })}
      </select>
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}
