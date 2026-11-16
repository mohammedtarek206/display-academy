"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
  variant?: "danger" | "warning";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  const colors = variant === "danger"
    ? { bg: "bg-rose-50 dark:bg-rose-500/10", icon: "text-rose-500", btn: "bg-rose-500 hover:bg-rose-600" }
    : { bg: "bg-amber-50 dark:bg-amber-500/10", icon: "text-amber-500", btn: "bg-amber-500 hover:bg-amber-600" };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={!loading ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center"
          >
            <div className={`w-16 h-16 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
              <AlertTriangle className={`w-8 h-8 ${colors.icon}`} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-6 py-2.5 rounded-xl text-white font-semibold transition-colors flex items-center gap-2 ${colors.btn} disabled:opacity-70`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                تأكيد
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
