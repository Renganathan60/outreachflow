import React from 'react';
import { Menu, Sparkles, Shield, User, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar({ onToggleSidebar, pageTitle = 'Dashboard' }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">{pageTitle}</h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            Decide which leads deserve sales attention.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-700">Campaign Guard</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-700">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
