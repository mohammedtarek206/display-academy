"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Monitor, LayoutDashboard, CalendarDays, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-xl tracking-tight">
            Display <span className="text-primary">Academy</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            نظام الإدارة والعرض  المتكامل ل اكاديميه ارقام 
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PortalCard
            title="الشاشة الرئيسية"
            description="شاشة الاستقبال لعرض الإعلانات والوقت والطقس"
            icon={<Monitor className="w-10 h-10" />}
            href="/display/main"
            delay={0.1}
          />
          <PortalCard
            title="شاشة القاعات"
            description="عرض حالة القاعات والمحاضرات الحالية"
            icon={<CalendarDays className="w-10 h-10" />}
            href="/display/rooms"
            delay={0.2}
          />
          <PortalCard
            title="شاشة الأنشطة"
            description="عرض صور وفيديوهات الأنشطة والفعاليات"
            icon={<Users className="w-10 h-10" />}
            href="/display/activities"
            delay={0.3}
          />
          <PortalCard
            title="لوحة الإدارة"
            description="إدارة النظام والطلاب والمدربين والإعدادات"
            icon={<LayoutDashboard className="w-10 h-10" />}
            href="/admin"
            delay={0.4}
            variant="primary"
          />
        </div>
      </div>
    </main>
  );
}

function PortalCard({ title, description, icon, href, delay, variant = "default" }: { title: string, description: string, icon: React.ReactNode, href: string, delay: number, variant?: "default" | "primary" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="h-full"
    >
      <Link href={href} className={`block h-full glass-card p-8 transition-all duration-300 border-2 ${variant === 'primary' ? 'border-primary/50 hover:border-primary bg-primary/10' : 'border-transparent hover:border-white/20'}`}>
        <div className={`mb-6 p-4 inline-block rounded-2xl ${variant === 'primary' ? 'bg-primary text-white' : 'bg-white/10 text-white'}`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-400 font-medium leading-relaxed">{description}</p>
      </Link>
    </motion.div>
  );
}

