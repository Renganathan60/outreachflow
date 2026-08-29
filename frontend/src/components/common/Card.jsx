import React from 'react';

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = '',
  hoverEffect = false,
  ...props
}) {
  return (
    <div
      className={`glass-panel rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 bg-white ${
        hoverEffect ? 'glass-panel-hover' : ''
      } ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className={`px-6 py-4.5 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
