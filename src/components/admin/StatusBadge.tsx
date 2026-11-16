"use client";

import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type Status = "active" | "inactive" | "suspended" | "available" | "occupied" | "maintenance" | "present" | "absent" | "late" | boolean;

const statusConfig: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
  active:       { label: "نشط",       className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  inactive:     { label: "غير نشط",   className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  suspended:    { label: "موقوف",     className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  available:    { label: "متاحة",     className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  occupied:     { label: "مشغولة",    className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
  maintenance:  { label: "صيانة",     className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  present:      { label: "حاضر",      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  absent:       { label: "غائب",      className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
  late:         { label: "متأخر",     className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  true:         { label: "مفعّل",     className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  false:        { label: "معطّل",     className: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const key = String(status);
  const config = statusConfig[key] ?? { label: key, className: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${config.className}`}>
      {key === "active" || key === "available" || key === "present" || key === "true"
        ? <CheckCircle className="w-3.5 h-3.5" />
        : key === "inactive" || key === "absent" || key === "false"
        ? <XCircle className="w-3.5 h-3.5" />
        : <AlertCircle className="w-3.5 h-3.5" />
      }
      {config.label}
    </span>
  );
}
