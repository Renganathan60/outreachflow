import React from 'react';
import Card from './Card.jsx';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  color = 'indigo',
}) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <Card hoverEffect className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
            {value}
          </h4>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    trendPositive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {trend}
                </span>
              )}
              {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`p-3 rounded-2xl border shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-xs ${
              colorMap[color] || colorMap.indigo
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
}
