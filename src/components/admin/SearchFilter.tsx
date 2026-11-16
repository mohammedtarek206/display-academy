"use client";

import { Search, Filter, X } from "lucide-react";

interface SearchFilterProps {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  filters?: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (v: string) => void;
  }[];
  children?: React.ReactNode; // extra action buttons (export, import, add)
}

export default function SearchFilter({
  search,
  onSearchChange,
  placeholder = "بحث...",
  filters = [],
  children,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        {/* Filter Dropdowns */}
        {filters.map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option value="">{f.label}: الكل</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}

        {/* Extra Buttons (Add, Export, Import) */}
        {children}
      </div>
    </div>
  );
}
