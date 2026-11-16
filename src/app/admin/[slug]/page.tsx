import { LayoutDashboard } from "lucide-react";

export default async function AdminModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const titleMap: Record<string, string> = {
    students: "إدارة الطلاب",
    trainers: "إدارة المدربين",
    rooms: "إدارة القاعات",
    media: "إدارة الصور والوسائط",
    announcements: "إدارة الإعلانات",
    settings: "الإعدادات العامة",
  };

  const title = titleMap[slug] || "صفحة غير معروفة";

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
      <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
        <LayoutDashboard className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{title}</h1>
      <p className="text-slate-500 text-lg max-w-md">
        هذه الصفحة مخصصة لـ ({title}) وسيتم بناء الجداول والنماذج الخاصة بها (CRUD) في المرحلة القادمة وربطها بقاعدة البيانات Supabase.
      </p>
    </div>
  );
}
