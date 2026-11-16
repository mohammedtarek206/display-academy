"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Inbox } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
}

type SortDir = "asc" | "desc" | null;

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  emptyMessage = "لا توجد بيانات",
  rowActions,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = (a as Record<string, unknown>)[sortKey];
    const bVal = (b as Record<string, unknown>)[sortKey];
    const cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""), "ar");
    return sortDir === "asc" ? cmp : -cmp;
  });

  const getValue = (row: T, key: string): unknown => {
    return (row as Record<string, unknown>)[key];
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3.5 text-right font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap ${col.width ?? ""} ${col.sortable ? "cursor-pointer hover:text-primary select-none" : ""}`}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1.5 justify-end">
                    {col.label}
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && (
                <th className="px-4 py-3.5 text-right font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">الإجراءات</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Inbox className="w-12 h-12 opacity-40" />
                    <p className="font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {sorted.map((row, idx) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors ${onRowClick ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/50"}`}
                  >
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                        {col.render
                          ? col.render(getValue(row, String(col.key)), row)
                          : String(getValue(row, String(col.key)) ?? "—")}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 justify-end">
                          {rowActions(row)}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      {!loading && sorted.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-400">
          إجمالي: <strong className="text-slate-600 dark:text-slate-300">{sorted.length}</strong> سجل
        </div>
      )}
    </div>
  );
}
