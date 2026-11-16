"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCheck, Presentation, Image as ImageIcon,
  MessageSquare, Settings, LogOut, BookOpen, Monitor, MessageCircle,
  BarChart3, CalendarDays, ChevronLeft
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { name: "الرئيسية",       href: "/admin",                icon: LayoutDashboard },
  { name: "الطلاب",         href: "/admin/students",       icon: Users },
  { name: "المدربون",       href: "/admin/trainers",       icon: UserCheck },
  { name: "القاعات",        href: "/admin/rooms",          icon: Presentation },
  { name: "المواد",         href: "/admin/courses",        icon: BookOpen },
  { name: "الجداول",        href: "/admin/schedules",      icon: CalendarDays },
  { name: "الوسائط",        href: "/admin/media",          icon: ImageIcon },
  { name: "الإعلانات",      href: "/admin/announcements",  icon: MessageSquare },
  { name: "رسائل الترحيب", href: "/admin/messages",       icon: MessageCircle },
  { name: "شاشة العرض",    href: "/admin/display-control",icon: Monitor },
  { name: "التقارير",       href: "/admin/reports",        icon: BarChart3 },
  { name: "الإعدادات",      href: "/admin/settings",       icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-16" : "w-64"} bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-xl z-10 transition-all duration-300 shrink-0`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          {!collapsed && <h1 className="text-xl font-black text-primary truncate">لوحة الإدارة</h1>}
          <button onClick={() => setCollapsed(p => !p)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-primary"}`} />
                {!collapsed && <span className="font-semibold text-sm truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-slate-200 dark:border-slate-800">
          <button className={`flex items-center gap-3 px-3 py-2.5 w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors font-semibold text-sm`}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="font-bold text-lg">
            {NAV.find(n => n.href === pathname || (n.href !== "/admin" && pathname.startsWith(n.href)))?.name ?? "لوحة الإدارة"}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">متصل</span>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">AD</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
